/**
 * Foundry Client v2 - Uses WebSocket server for communication
 * Simplified replacement for the complex connector architecture
 */

import { Logger } from './logger.js';
import { FoundryWSServer } from './ws-server.js';

export class FoundryClientV2 {
  private logger: Logger;
  private wsServer: FoundryWSServer;

  constructor(wsServer: FoundryWSServer, logger: Logger) {
    this.wsServer = wsServer;
    this.logger = logger;
  }

  /**
   * Send a query to Foundry module and wait for response
   */
  async query(method: string, data?: any): Promise<any> {
    if (!this.wsServer.isConnected()) {
      throw new Error('Foundry VTT module not connected. Please ensure Foundry is running and the MCP Bridge module is enabled.');
    }

    this.logger.info('Sending query to Foundry', { method });

    try {
      const result = await this.wsServer.query(method, data);
      this.logger.info('Query successful', { method });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Query failed', { method, error: errorMessage });
      throw new Error(`Query ${method} failed: ${errorMessage}`);
    }
  }

  /**
   * Check if Foundry module is connected
   */
  isConnected(): boolean {
    return this.wsServer.isConnected();
  }

  /**
   * Check if ready to accept queries
   */
  isReady(): boolean {
    return this.wsServer.isConnected();
  }

  /**
   * Get connection state as string
   */
  getConnectionState(): string {
    return this.wsServer.isConnected() ? 'connected' : 'disconnected';
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): any {
    return {
      connected: this.wsServer.isConnected(),
      clientCount: this.wsServer.getClientCount(),
      connectionType: 'websocket-v2'
    };
  }
}
