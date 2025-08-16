import { Logger } from './logger.js';
import { Config } from './config.js';
export interface FoundryConnectorOptions {
    config: Config['foundry'];
    logger: Logger;
}
export declare class FoundryConnector {
    private wss;
    private httpServer;
    private logger;
    private config;
    private isStarted;
    private foundrySocket;
    private pendingQueries;
    private queryIdCounter;
    constructor({ config, logger }: FoundryConnectorOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    private handleMessage;
    query(method: string, data?: any): Promise<any>;
    isConnected(): boolean;
    getConnectionInfo(): any;
}
