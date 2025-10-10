import { Logger } from './logger.js';
import { Config } from './config.js';
export interface FoundryQuery {
    method: string;
    data?: any;
}
export interface FoundryResponse {
    success: boolean;
    data?: any;
    error?: string;
}
export declare class FoundryClient {
    private logger;
    private config;
    private connector;
    constructor(config: Config['foundry'], logger: Logger);
    connect(): Promise<void>;
    disconnect(): void;
    getConnectionType(): 'websocket' | 'webrtc' | null;
    query(method: string, data?: any): Promise<any>;
    ping(): Promise<any>;
    getConnectionInfo(): any;
    getConnectionState(): string;
    isReady(): boolean;
    sendMessage(message: any): void;
    broadcastMessage(message: any): void;
    isConnected(): boolean;
}
