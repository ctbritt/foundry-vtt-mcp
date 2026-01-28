/**
 * Foundry MCP Bridge v2 - WebSocket-based version
 * Connects to MCP server via WebSocket, handles queries from Claude/mcporter
 */

import { MODULE_ID } from './constants.js';
import { FoundryWSClient } from './ws-client.js';
import { QueryHandlers } from './queries.js';
import { ModuleSettings } from './settings.js';
import { ComfyUIManager } from './comfyui-manager.js';

class FoundryMCPBridgeV2 {
  private wsClient: FoundryWSClient | null = null;
  private queryHandlers: QueryHandlers;
  private settings: ModuleSettings;
  public comfyuiManager: ComfyUIManager;
  private _isInitialized = false;
  private pingInterval: number | null = null;

  constructor() {
    this.queryHandlers = new QueryHandlers();
    this.settings = new ModuleSettings();
    this.comfyuiManager = new ComfyUIManager();
  }

  /**
   * Initialize during Foundry init hook
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[${MODULE_ID}] Initializing MCP Bridge v2...`);

      // Register settings
      this.settings.registerSettings();

      // Register query handlers
      this.queryHandlers.registerHandlers();

      this._isInitialized = true;
      console.log(`[${MODULE_ID}] Module initialized`);
      
      // Expose dataAccess for v1 compatibility
      (window as any).foundryMCPBridge.dataAccess = this.queryHandlers.dataAccess;

    } catch (error) {
      console.error(`[${MODULE_ID}] Initialization failed:`, error);
      ui.notifications.error('MCP Bridge initialization failed');
      throw error;
    }
  }

  /**
   * Start after Foundry ready
   */
  async onReady(): Promise<void> {
    // GM-only check
    if (!game.user?.isGM) {
      console.log(`[${MODULE_ID}] Non-GM user, bridge disabled`);
      return;
    }

    console.log(`[${MODULE_ID}] Foundry ready, starting bridge...`);

    // Get settings
    const enabled = this.settings.getSetting('enabled') ?? true;
    const serverUrl = this.settings.getSetting('serverUrl') ?? 'ws://localhost:31417';

    if (!enabled) {
      console.log(`[${MODULE_ID}] Bridge disabled in settings`);
      return;
    }

    // Initialize WebSocket client
    this.wsClient = new FoundryWSClient({
      serverUrl,
      reconnectDelay: 5000,
      maxReconnectAttempts: 20
    });

    // Set up query handler - routes queries to the appropriate handler
    this.wsClient.setQueryHandler(async (queryType: string, params: any) => {
      console.log(`[${MODULE_ID}] Handling query:`, queryType);
      
      // The query type is the full handler name like "foundry-mcp-bridge.getWorldInfo"
      const handler = (CONFIG as any).queries?.[queryType];
      
      if (!handler) {
        throw new Error(`Unknown query type: ${queryType}`);
      }

      return await handler(params);
    });

    // Connect to server
    try {
      await this.wsClient.connect();
      ui.notifications?.info('MCP Bridge connected');
      console.log(`[${MODULE_ID}] Connected to MCP server`);

      // Start ping interval to keep connection alive
      this.pingInterval = window.setInterval(() => {
        if (this.wsClient?.isConnected()) {
          this.wsClient.ping();
        }
      }, 30000);

    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${MODULE_ID}] Failed to connect:`, error);
      ui.notifications?.error(`MCP Bridge connection failed: ${message}`);
    }
  }

  /**
   * Get the WebSocket client
   */
  getClient(): FoundryWSClient | null {
    return this.wsClient;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
      console.log(`[${MODULE_ID}] Disconnected`);
    }
  }

  /**
   * Check if bridge is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }
}

// Global instance
const bridge = new FoundryMCPBridgeV2();

// Expose to window immediately so it's always available
(window as any).foundryMCPBridge = bridge;

// Foundry hooks
Hooks.once('init', async () => {
  await bridge.initialize();
});

Hooks.once('ready', async () => {
  await bridge.onReady();
});

// Canvas ready hook (for scene changes)
Hooks.on('canvasReady', () => {
  console.log(`[${MODULE_ID}] Canvas ready`);
});

export default bridge;
