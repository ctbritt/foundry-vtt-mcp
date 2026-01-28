/**
 * HTTP REST server for Foundry VTT MCP Bridge
 * Provides HTTP interface to MCP tools, runs alongside stdio transport
 */

import http from 'http';
import { URL } from 'url';

interface MCPToolCall {
  tool: string;
  arguments: Record<string, any>;
}

interface MCPToolResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class FoundryMCPHttpServer {
  private server: http.Server;
  private port: number;
  private toolHandler: (tool: string, args: Record<string, any>) => Promise<any>;

  constructor(
    port: number,
    toolHandler: (tool: string, args: Record<string, any>) => Promise<any>
  ) {
    this.port = port;
    this.toolHandler = toolHandler;
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS headers for browser access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // Health check
    if (url.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // MCP tool call endpoint
    if (url.pathname === '/mcp/call' && req.method === 'POST') {
      await this.handleToolCall(req, res);
      return;
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  private async handleToolCall(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Read request body
      const body = await this.readBody(req);
      const call: MCPToolCall = JSON.parse(body);

      // Validate tool and arguments
      if (!call.tool || typeof call.tool !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing or invalid tool name' }));
        return;
      }

      // Call the tool
      console.log(`[HTTP] Tool call: ${call.tool}`, call.arguments);
      const result = await this.toolHandler(call.tool, call.arguments || {});

      // Return result
      const response: MCPToolResponse = {
        success: true,
        result
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));

    } catch (error: any) {
      console.error('[HTTP] Tool call error:', error);
      const response: MCPToolResponse = {
        success: false,
        error: error.message || 'Internal server error'
      };

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('error', reject);
      this.server.listen(this.port, '127.0.0.1', () => {
        console.log(`[HTTP] Foundry MCP HTTP server listening on 127.0.0.1:${this.port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('[HTTP] Server stopped');
        resolve();
      });
    });
  }
}
