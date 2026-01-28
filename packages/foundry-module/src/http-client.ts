/**
 * Simple HTTP client for Foundry MCP Bridge v2
 * Replaces WebRTC/WebSocket complexity with straightforward HTTP fetch
 */

export interface HttpClientConfig {
  serverUrl: string; // e.g., "http://mac-mini.minikin-chinstrap.ts.net:31415"
  timeout?: number;
}

export class FoundryMCPHttpClient {
  private config: HttpClientConfig;
  private connected: boolean = false;

  constructor(config: HttpClientConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000 // 30 second default
    };
  }

  /**
   * Check if the server is reachable
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MCP HTTP] Connected to server', data);
      this.connected = true;
    } catch (error) {
      console.error('[MCP HTTP] Connection failed', error);
      this.connected = false;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to MCP server: ${message}`);
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/mcp/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args
        }),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Tool call failed');
      }

      return result.result;

    } catch (error) {
      console.error('[MCP HTTP] Tool call failed', { tool: toolName, error });
      throw error;
    }
  }

  /**
   * Disconnect (currently a no-op for HTTP, but maintains API compatibility)
   */
  disconnect(): void {
    this.connected = false;
    console.log('[MCP HTTP] Disconnected');
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }
}
