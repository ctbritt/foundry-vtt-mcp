/**
 * WebSocket server for Foundry VTT MCP Bridge v2
 * Handles bidirectional communication with Foundry module
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface PendingQuery {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class FoundryWSServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private port: number;
  private clients: Set<WebSocket> = new Set();
  private pendingQueries: Map<string, PendingQuery> = new Map();
  private queryTimeout: number;

  constructor(port: number, queryTimeout: number = 30000) {
    super();
    this.port = port;
    this.queryTimeout = queryTimeout;
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port, host: '0.0.0.0' });

      this.wss.on('listening', () => {
        console.log(`[WS] Foundry MCP WebSocket server listening on 0.0.0.0:${this.port}`);
        resolve();
      });

      this.wss.on('error', (error) => {
        console.error('[WS] Server error:', error);
        reject(error);
      });

      this.wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        console.log(`[WS] Foundry client connected from ${clientIp}`);
        this.clients.add(ws);
        this.emit('clientConnected', ws);

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(ws, message);
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        });

        ws.on('close', () => {
          console.log(`[WS] Foundry client disconnected from ${clientIp}`);
          this.clients.delete(ws);
          this.emit('clientDisconnected', ws);
        });

        ws.on('error', (error) => {
          console.error('[WS] Client error:', error);
          this.clients.delete(ws);
        });

        // Send welcome message
        ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Foundry MCP Server v2' }));
      });
    });
  }

  /**
   * Handle incoming message from Foundry module
   */
  private handleMessage(ws: WebSocket, message: any): void {
    if (message.type === 'response' && message.id) {
      // This is a response to a query we sent
      const pending = this.pendingQueries.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingQueries.delete(message.id);
        
        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if (message.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    } else {
      this.emit('message', ws, message);
    }
  }

  /**
   * Send a query to Foundry and wait for response
   */
  async query(queryType: string, params: any = {}): Promise<any> {
    if (this.clients.size === 0) {
      throw new Error('Foundry VTT module not connected. Please ensure Foundry is running and the MCP Bridge module is enabled.');
    }

    // Use the first connected client (usually there's only one GM)
    const ws = this.clients.values().next().value;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('Foundry connection not ready');
    }

    const id = Math.random().toString(36).substring(2, 15);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingQueries.delete(id);
        reject(new Error(`Query timeout: ${queryType}`));
      }, this.queryTimeout);

      this.pendingQueries.set(id, { resolve, reject, timeout });

      ws.send(JSON.stringify({
        type: 'query',
        id,
        queryType,
        params
      }));
    });
  }

  /**
   * Check if any Foundry client is connected
   */
  isConnected(): boolean {
    return this.clients.size > 0;
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      // Clear pending queries
      for (const [id, pending] of this.pendingQueries) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Server shutting down'));
      }
      this.pendingQueries.clear();

      // Close all client connections
      for (const ws of this.clients) {
        ws.close();
      }
      this.clients.clear();

      if (this.wss) {
        this.wss.close(() => {
          console.log('[WS] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
