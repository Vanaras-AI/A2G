import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { Signer } from "@aeon/did-sdk";
import type { A2gIntent, A2gReport, G2aVerdict, A2gClientConfig } from "./types.js";

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;

// Signing is now handled by @aeon/did-sdk

export class A2gClient {
    private ws: WebSocket | null = null;
    private pendingRequests = new Map<string, {
        resolve: (verdict: G2aVerdict) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }>();
    private reconnectAttempt = 0;
    private isReconnecting = false;
    private intentIdMap = new WeakMap<object, string>();

    constructor(
        private url: string,
        private agentDid: string,
        private config: A2gClientConfig = {}
    ) {
        // Security: Warn if using unencrypted WebSocket in non-localhost
        if (url.startsWith("ws://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
            console.warn("⚠️  A2G Security Warning: Using unencrypted ws:// connection. Use wss:// in production.");
        }
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const headers: Record<string, string> = {};

            // Security: Add API key authentication if provided
            if (this.config.apiKey) {
                headers["Authorization"] = `Bearer ${this.config.apiKey}`;
            }

            // Security: Add DID signature authentication if signing key provided
            if (this.config.signingKey) {
                // Use DID SDK for signing
                const sig = Signer.sign(this.config.signingKey, this.agentDid);

                headers["X-Agent-DID"] = this.agentDid;
                headers["X-Timestamp"] = sig.timestamp;
                headers["X-Nonce"] = sig.nonce;
                headers["X-Signature"] = sig.hash;
            }

            this.ws = new WebSocket(this.url, { headers });

            const connectionTimeout = setTimeout(() => {
                this.ws?.close();
                reject(new Error("A2G connection timeout"));
            }, this.config.connectionTimeoutMs || 10000);

            this.ws.on("open", () => {
                clearTimeout(connectionTimeout);
                this.reconnectAttempt = 0;
                this.isReconnecting = false;
                console.log(`🛡️  A2G Connected to ${this.url}`);
                resolve();
            });

            this.ws.on("error", (err) => {
                clearTimeout(connectionTimeout);
                reject(err);
            });

            this.ws.on("message", (data) => {
                try {
                    const response = JSON.parse(data.toString()) as G2aVerdict;
                    const pending = this.pendingRequests.get(response.id);
                    if (pending) {
                        clearTimeout(pending.timeout);
                        pending.resolve(response);
                        this.pendingRequests.delete(response.id);
                    }
                } catch (err) {
                    console.error("❌ A2G Message Parse Error:", err);
                }
            });

            this.ws.on("close", (code) => {
                console.log(`❌ A2G Connection Closed (code: ${code})`);
                this.ws = null;

                // Reject all pending requests
                for (const [id, pending] of this.pendingRequests) {
                    clearTimeout(pending.timeout);
                    pending.reject(new Error("Connection closed"));
                    this.pendingRequests.delete(id);
                }

                // Auto-reconnect if not intentionally closed
                if (code !== 1000 && this.config.autoReconnect !== false) {
                    this.scheduleReconnect();
                }
            });
        });
    }

    private scheduleReconnect(): void {
        if (this.isReconnecting || this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
            console.error(`❌ A2G: Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempt++;

        // Exponential backoff with jitter
        const delay = Math.min(
            BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempt - 1),
            30000
        ) + Math.random() * 1000;

        console.log(`🔄 A2G: Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS})`);

        setTimeout(async () => {
            try {
                await this.connect();
            } catch (err) {
                console.error("❌ A2G: Reconnection failed:", err);
                this.isReconnecting = false;
                this.scheduleReconnect();
            }
        }, delay);
    }

    async requestIntent(
        tool: string,
        args: Record<string, unknown>,
        context?: object
    ): Promise<G2aVerdict> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            await this.connect();
        }

        const intentId = uuidv4();
        const requestId = uuidv4();

        // Store intentId for later reporting
        if (context) {
            this.intentIdMap.set(context, intentId);
        }

        const intent: A2gIntent = {
            jsonrpc: "2.0",
            method: "a2g/intent",
            params: {
                agent_did: this.agentDid,
                intent_id: intentId,
                tool,
                arguments: args,
            },
            id: requestId,
        };

        // Sign the intent payload if signing key is configured
        if (this.config.signingKey) {
            // Debug: Log exactly what we are signing to help identify mismatch
            console.log(`[A2G-SDK] Signing identity for tool '${tool}': "${this.agentDid}"`);

            // Use DID SDK for signing - Align with engine verification which currently uses agentDid
            const sig = Signer.sign(this.config.signingKey, this.agentDid);

            intent.params.context = {
                ...intent.params.context,
                signature: sig,
            };
        }

        const timeoutMs = this.config.requestTimeoutMs || DEFAULT_TIMEOUT_MS;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`A2G request timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });
            this.ws?.send(JSON.stringify(intent));
        });
    }

    getIntentId(context: object): string | undefined {
        return this.intentIdMap.get(context);
    }

    async reportOutcome(
        intentId: string,
        status: "SUCCESS" | "FAILURE" | "TIMEOUT" | "ABORTED",
        result?: unknown,
        error?: string,
        durationMs?: number
    ): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const report: A2gReport = {
            jsonrpc: "2.0",
            method: "a2g/report",
            params: {
                agent_did: this.agentDid,
                intent_id: intentId,
                status,
                result,
                error,
                metrics: {
                    duration_ms: durationMs || 0,
                },
            },
            id: uuidv4(),
        };

        this.ws.send(JSON.stringify(report));
    }

    disconnect(): void {
        // Clear all pending requests
        for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error("Client disconnected"));
        }
        this.pendingRequests.clear();

        // Close with normal closure code to prevent auto-reconnect
        this.ws?.close(1000);
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
