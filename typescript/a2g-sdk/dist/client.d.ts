import type { G2aVerdict, A2gClientConfig } from "./types.js";
export declare class A2gClient {
    private url;
    private agentDid;
    private config;
    private ws;
    private pendingRequests;
    private reconnectAttempt;
    private isReconnecting;
    private intentIdMap;
    constructor(url: string, agentDid: string, config?: A2gClientConfig);
    connect(): Promise<void>;
    private scheduleReconnect;
    requestIntent(tool: string, args: Record<string, unknown>, context?: object): Promise<G2aVerdict>;
    getIntentId(context: object): string | undefined;
    reportOutcome(intentId: string, status: "SUCCESS" | "FAILURE" | "TIMEOUT" | "ABORTED", result?: unknown, error?: string, durationMs?: number): Promise<void>;
    disconnect(): void;
    get isConnected(): boolean;
}
