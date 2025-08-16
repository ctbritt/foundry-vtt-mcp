export interface BridgeConfig {
    enabled: boolean;
    serverHost: string;
    serverPort: number;
    namespace: string;
    reconnectAttempts: number;
    reconnectDelay: number;
    connectionTimeout: number;
    debugLogging: boolean;
}
/**
 * Browser-compatible socket bridge that uses native WebSocket and fetch
 * instead of socket.io-client which doesn't work in Foundry VTT
 */
export declare class SocketBridge {
    private config;
    private ws;
    private connectionState;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimer;
    constructor(config: BridgeConfig);
    connect(): Promise<void>;
    disconnect(): void;
    private setupEventHandlers;
    private handleMessage;
    private handleMCPQuery;
    private scheduleReconnect;
    private sendMessage;
    emitToServer(event: string, data?: any): void;
    isConnected(): boolean;
    getConnectionState(): string;
    getConnectionInfo(): any;
    private log;
}
//# sourceMappingURL=socket-bridge.d.ts.map