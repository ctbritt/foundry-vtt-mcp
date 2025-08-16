import { FoundryConnector } from './foundry-connector.js';
export class FoundryClient {
    logger;
    config;
    connector;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger.child({ component: 'FoundryClient' });
        // Initialize the socket connector
        this.connector = new FoundryConnector({
            config: this.config,
            logger: this.logger
        });
    }
    async connect() {
        this.logger.info('Starting Foundry connector socket.io server');
        try {
            // Start the socket.io server that Foundry will connect to
            await this.connector.start();
            this.logger.info('Foundry connector started, waiting for module connection...');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
            this.logger.error('Failed to start Foundry connector', { error: errorMessage });
            throw new Error(`Failed to start Foundry connector: ${errorMessage}`);
        }
    }
    disconnect() {
        this.logger.info('Stopping Foundry connector...');
        this.connector.stop().catch(error => {
            this.logger.error('Error stopping connector', error);
        });
    }
    async query(method, data) {
        if (!this.connector.isConnected()) {
            throw new Error('Foundry VTT module not connected. Please ensure Foundry is running and the MCP Bridge module is enabled.');
        }
        this.logger.debug('Sending query to Foundry module', { method, data });
        try {
            const result = await this.connector.query(method, data);
            this.logger.debug('Query successful', { method, hasResult: !!result });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown query error';
            this.logger.error('Query failed', { method, error: errorMessage });
            throw new Error(`Query ${method} failed: ${errorMessage}`);
        }
    }
    ping() {
        return this.query('foundry-mcp-bridge.ping');
    }
    getConnectionInfo() {
        return this.connector.getConnectionInfo();
    }
    getConnectionState() {
        return this.connector.isConnected() ? 'connected' : 'disconnected';
    }
    isReady() {
        return this.connector.isConnected();
    }
}
//# sourceMappingURL=foundry-client.js.map