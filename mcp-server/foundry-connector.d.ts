import { Logger } from './logger.js';
import { Config } from './config.js';
export interface FoundryConnectorOptions {
    config: Config['foundry'];
    logger: Logger;
}
export declare class FoundryConnector {
    private wss;
    private httpServer;
    private webrtcSignalingServer;
    private logger;
    private config;
    private isStarted;
    private foundrySocket;
    private webrtcPeer;
    private activeConnectionType;
    private pendingQueries;
    private queryIdCounter;
    constructor({ config, logger }: FoundryConnectorOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    private handleMessage;
    private handleWebRTCOffer;
    private handleWebRTCOfferHTTP;
    query(method: string, data?: any): Promise<any>;
    sendToFoundry(message: any): void;
    isConnected(): boolean;
    getConnectionInfo(): any;
    getConnectionType(): 'websocket' | 'webrtc' | null;
    /**
     * Send a message to the connected Foundry module
     */
    sendMessage(message: any): void;
    /**
     * Broadcast a message to all connected Foundry clients (alias for sendMessage for single connection)
     */
    broadcastMessage(message: any): void;
}
