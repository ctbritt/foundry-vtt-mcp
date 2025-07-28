import { MODULE_ID, CONNECTION_STATES } from './constants.js';

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
export class SocketBridge {
  private ws: WebSocket | null = null;
  private connectionState: string = CONNECTION_STATES.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: any = null;

  constructor(private config: BridgeConfig) {
    this.maxReconnectAttempts = config.reconnectAttempts;
  }

  async connect(): Promise<void> {
    if (this.connectionState === CONNECTION_STATES.CONNECTED || 
        this.connectionState === CONNECTION_STATES.CONNECTING) {
      return;
    }

    this.connectionState = CONNECTION_STATES.CONNECTING;
    this.log('Connecting to MCP server...');

    // Use WebSocket instead of socket.io
    const wsUrl = `ws://${this.config.serverHost}:${this.config.serverPort}${this.config.namespace}`;
    
    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        this.log('Connection timeout');
        this.connectionState = CONNECTION_STATES.DISCONNECTED;
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout * 1000);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          this.connectionState = CONNECTION_STATES.CONNECTED;
          this.reconnectAttempts = 0;
          this.log('Connected to MCP server');
          this.setupEventHandlers();
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          this.log(`Connection error: ${error}`);
          this.connectionState = CONNECTION_STATES.DISCONNECTED;
          this.scheduleReconnect();
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = (event) => {
          this.log(`Disconnected: ${event.reason || 'Connection closed'}`);
          this.connectionState = CONNECTION_STATES.DISCONNECTED;
          
          if (event.wasClean) {
            // Clean disconnect, don't reconnect
            return;
          }
          
          this.scheduleReconnect();
        };

      } catch (error) {
        clearTimeout(connectTimeout);
        this.log(`Failed to create WebSocket: ${error}`);
        this.connectionState = CONNECTION_STATES.DISCONNECTED;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.log('Disconnected from MCP server');
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.log(`Failed to parse message: ${error}`);
      }
    };
  }

  private async handleMessage(message: any): Promise<void> {
    try {
      if (message.type === 'mcp-query') {
        await this.handleMCPQuery(message.data, (response) => {
          this.sendMessage({
            type: 'mcp-response',
            id: message.id,
            data: response
          });
        });
      } else if (message.type === 'ping') {
        this.sendMessage({
          type: 'pong',
          id: message.id,
          data: { timestamp: Date.now(), status: 'ok' }
        });
      }
    } catch (error) {
      this.log(`Error handling message: ${error}`);
    }
  }

  private async handleMCPQuery(data: any, callback: (response: any) => void): Promise<void> {
    try {
      this.log(`Handling MCP query: ${data.method}`);

      // Check if the query handler exists in CONFIG.queries
      const queryKey = data.method; // Method already includes full path like 'foundry-mcp-bridge.listActors'
      const handler = CONFIG.queries[queryKey];

      if (!handler || typeof handler !== 'function') {
        throw new Error(`No handler found for query: ${data.method}`);
      }

      // Execute the query handler
      const result = await handler(data.data || {});
      
      this.log(`Query completed: ${data.method}`);
      callback({ success: true, data: result });

    } catch (error) {
      this.log(`Query failed: ${data.method} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log(`Max reconnection attempts reached (${this.maxReconnectAttempts})`);
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts++;

    this.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.connectionState = CONNECTION_STATES.RECONNECTING;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // Connection failed, scheduleReconnect will be called again from connect()
      }
    }, delay);
  }

  private sendMessage(message: any): void {
    if (!this.ws || this.connectionState !== CONNECTION_STATES.CONNECTED) {
      this.log(`Cannot send message - not connected`);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.log(`Sent message: ${message.type}`);
    } catch (error) {
      this.log(`Failed to send message: ${error}`);
    }
  }

  emitToServer(event: string, data?: any): void {
    this.sendMessage({
      type: event,
      data: data,
      timestamp: Date.now()
    });
  }

  isConnected(): boolean {
    return this.connectionState === CONNECTION_STATES.CONNECTED;
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  getConnectionInfo(): any {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      config: {
        host: this.config.serverHost,
        port: this.config.serverPort,
        namespace: this.config.namespace,
      },
    };
  }

  private log(message: string): void {
    if (this.config.debugLogging) {
      console.log(`[${MODULE_ID}] Socket Bridge: ${message}`);
    }
  }
}