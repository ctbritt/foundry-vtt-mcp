/**
 * WebSocket client for Foundry MCP Bridge v2
 * Connects to MCP server and handles bidirectional queries
 */

import { MODULE_ID } from './constants.js';

export interface WSClientConfig {
  serverUrl: string; // e.g., "ws://mac-mini.minikin-chinstrap.ts.net:31417"
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

type QueryHandler = (queryType: string, params: any) => Promise<any>;

export class FoundryWSClient {
  private config: WSClientConfig;
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private queryHandler: QueryHandler | null = null;
  private reconnectTimeout: number | null = null;

  constructor(config: WSClientConfig) {
    this.config = {
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  /**
   * Set the handler for incoming queries
   */
  setQueryHandler(handler: QueryHandler): void {
    this.queryHandler = handler;
  }

  /**
   * Connect to the MCP server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[${MODULE_ID}] Connecting to WebSocket: ${this.config.serverUrl}`);
        this.ws = new WebSocket(this.config.serverUrl);

        this.ws.onopen = () => {
          console.log(`[${MODULE_ID}] WebSocket connected`);
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log(`[${MODULE_ID}] WebSocket closed:`, event.code, event.reason);
          this.connected = false;
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error(`[${MODULE_ID}] WebSocket error:`, error);
          if (!this.connected) {
            reject(new Error('WebSocket connection failed'));
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        console.error(`[${MODULE_ID}] Failed to create WebSocket:`, error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message from server
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      if (message.type === 'welcome') {
        console.log(`[${MODULE_ID}] Server welcome:`, message.message);
        return;
      }

      if (message.type === 'pong') {
        return;
      }

      if (message.type === 'query' && message.id) {
        // Server is asking us to execute a query
        await this.handleQuery(message.id, message.queryType, message.params);
        return;
      }

      console.log(`[${MODULE_ID}] Unknown message type:`, message.type);

    } catch (error) {
      console.error(`[${MODULE_ID}] Failed to parse message:`, error);
    }
  }

  /**
   * Handle a query from the server
   */
  private async handleQuery(id: string, queryType: string, params: any): Promise<void> {
    console.log(`[${MODULE_ID}] Processing query:`, queryType);

    try {
      if (!this.queryHandler) {
        throw new Error('No query handler registered');
      }

      const result = await this.queryHandler(queryType, params);

      this.send({
        type: 'response',
        id,
        result
      });

    } catch (error: any) {
      console.error(`[${MODULE_ID}] Query failed:`, queryType, error);
      
      this.send({
        type: 'response',
        id,
        error: error.message || 'Query failed'
      });
    }
  }

  /**
   * Send a message to the server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error(`[${MODULE_ID}] Cannot send - WebSocket not connected`);
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error(`[${MODULE_ID}] Max reconnection attempts reached`);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay || 5000;
    
    console.log(`[${MODULE_ID}] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect().catch(error => {
        console.error(`[${MODULE_ID}] Reconnect failed:`, error);
      });
    }, delay);
  }

  /**
   * Send a ping to keep connection alive
   */
  ping(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connected = false;
    console.log(`[${MODULE_ID}] Disconnected`);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}
