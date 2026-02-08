export interface A2gSignatureContext {
    timestamp: string;
    nonce: string;
    hash: string;
}
export interface A2gIntent {
    jsonrpc: "2.0";
    method: "a2g/intent";
    params: {
        agent_did: string;
        intent_id: string;
        tool: string;
        arguments: Record<string, unknown>;
        context?: {
            session_id?: string;
            parent_intent?: string;
            reasoning?: string;
            signature?: A2gSignatureContext;
        };
    };
    id: string;
}
export interface G2aVerdict {
    jsonrpc: "2.0";
    id: string;
    result?: {
        verdict: "APPROVED" | "DENIED" | "ESCALATE" | "CONDITIONAL";
        intent_id: string;
        risk_assessment: {
            score: number;
            level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            threats: string[];
        };
        capability_manifest?: {
            max_memory_mb?: number;
            max_cpu_percent?: number;
            timeout_seconds?: number;
            network_allowed?: boolean;
            filesystem_scope?: string[];
        };
        conditions?: string[];
    };
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
export interface A2gReport {
    jsonrpc: "2.0";
    method: "a2g/report";
    params: {
        agent_did: string;
        intent_id: string;
        status: "SUCCESS" | "FAILURE" | "TIMEOUT" | "ABORTED";
        result?: unknown;
        error?: string;
        metrics?: {
            duration_ms: number;
        };
    };
    id: string;
}
/**
 * Configuration options for the A2G client.
 */
export interface A2gClientConfig {
    /**
     * API key for authenticating with the AEON Engine.
     * Required for production deployments.
     */
    apiKey?: string;
    /**
     * Signing key for HMAC-SHA256 DID authentication.
     * Used to cryptographically prove agent identity.
     *
     * Connection headers:
     * - X-Agent-DID: The agent's DID
     * - X-Timestamp: Unix timestamp in milliseconds
     * - X-Nonce: Unique request ID (UUIDv4)
     * - X-Signature: HMAC-SHA256 of "did:timestamp:nonce"
     *
     * Request signatures:
     * - Each intent includes a signature.hash in context
     * - Hash is HMAC-SHA256 of the intent params JSON
     *
     * Recommended: Use a 32-byte (256-bit) random key.
     * Generate with: crypto.randomBytes(32).toString('hex')
     */
    signingKey?: string;
    /**
     * Timeout for WebSocket connection in milliseconds.
     * @default 10000
     */
    connectionTimeoutMs?: number;
    /**
     * Timeout for individual intent requests in milliseconds.
     * @default 5000
     */
    requestTimeoutMs?: number;
    /**
     * Whether to automatically reconnect on connection loss.
     * @default true
     */
    autoReconnect?: boolean;
}
