import { MODULE_ID } from './constants.js';
import { SocketBridge } from './socket-bridge.js';
import { QueryHandlers } from './queries.js';
import { ModuleSettings } from './settings.js';
// Connection control now handled through settings menu

/**
 * Main Foundry MCP Bridge Module Class
 */
class FoundryMCPBridge {
  private settings: ModuleSettings;
  private queryHandlers: QueryHandlers;
  private socketBridge: SocketBridge | null = null;
  private isInitialized = false;
  private heartbeatInterval: number | null = null;
  private lastActivity: Date = new Date();

  constructor() {
    this.settings = new ModuleSettings();
    this.queryHandlers = new QueryHandlers();
  }

  /**
   * Check if current user is a GM (silent check for security)
   */
  private isGMUser(): boolean {
    return game.user?.isGM || false;
  }

  /**
   * Initialize the module during Foundry's init hook
   */
  async initialize(): Promise<void> {
    try {
      console.log(`[${MODULE_ID}] Initializing Foundry MCP Bridge...`);

      // Register module settings
      this.settings.registerSettings();

      // Register query handlers
      this.queryHandlers.registerHandlers();

      // Expose data access globally for settings UI
      (window as any).foundryMCPBridge.dataAccess = this.queryHandlers.dataAccess;

      this.isInitialized = true;
      console.log(`[${MODULE_ID}] Module initialized successfully`);

    } catch (error) {
      console.error(`[${MODULE_ID}] Failed to initialize:`, error);
      ui.notifications.error('Failed to initialize Foundry MCP Bridge');
      throw error;
    }
  }

  /**
   * Start the module after Foundry is ready
   */
  async onReady(): Promise<void> {
    try {
      // SECURITY: Silent GM-only check - non-GM users get no access and no messages
      if (!this.isGMUser()) {
        console.log(`[${MODULE_ID}] Module ready (user access restricted)`);
        return;
      }

      console.log(`[${MODULE_ID}] Foundry ready, checking bridge status...`);

      // Connection control now handled through settings menu

      // Validate settings
      const validation = this.settings.validateSettings();
      if (!validation.valid) {
        console.warn(`[${MODULE_ID}] Invalid settings:`, validation.errors);
        ui.notifications.warn(`MCP Bridge settings validation failed: ${validation.errors.join(', ')}`);
      }

      // Auto-connect when enabled (always automatic)
      const enabled = this.settings.getSetting('enabled');
      
      if (enabled) {
        await this.start();
      }

      // Auto-build enhanced creature index if enabled and not exists
      await this.checkAndBuildEnhancedIndex();

      console.log(`[${MODULE_ID}] Module ready`);

    } catch (error) {
      console.error(`[${MODULE_ID}] Failed during ready:`, error);
    }
  }

  /**
   * Check if enhanced creature index exists and build if needed (better UX)
   */
  private async checkAndBuildEnhancedIndex(): Promise<void> {
    try {
      // Only for GM users
      if (!this.isGMUser()) return;

      // Check if enhanced index is enabled
      const enhancedIndexEnabled = this.settings.getSetting('enableEnhancedCreatureIndex');
      if (!enhancedIndexEnabled) return;

      // Check if index file exists
      const indexFilename = 'enhanced-creature-index.json';
      try {
        const browseResult = await FilePicker.browse('data', `worlds/${game.world.id}`);
        const indexExists = browseResult.files.some(f => f.endsWith(indexFilename));
        
        if (!indexExists) {
          console.log(`[${MODULE_ID}] Enhanced creature index not found, building automatically for better UX...`);
          ui.notifications?.info('Building enhanced creature index for faster searches...');
          
          // Trigger index build through data access
          if (this.queryHandlers?.dataAccess?.rebuildEnhancedCreatureIndex) {
            await this.queryHandlers.dataAccess.rebuildEnhancedCreatureIndex();
          }
        } else {
          console.log(`[${MODULE_ID}] Enhanced creature index exists, ready for instant searches`);
        }
      } catch (error) {
        // World directory might not exist yet, that's okay
        console.log(`[${MODULE_ID}] Could not check for enhanced index file (world directory may not exist yet)`);
      }
    } catch (error) {
      console.warn(`[${MODULE_ID}] Failed to auto-build enhanced index:`, error);
    }
  }

  /**
   * Start the MCP bridge connection
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized');
    }

    // SECURITY: Double-check GM access (safety measure)
    if (!this.isGMUser()) {
      console.warn(`[${MODULE_ID}] Attempted to start bridge without GM access`);
      return;
    }

    if (this.socketBridge?.isConnected()) {
      console.log(`[${MODULE_ID}] Bridge already running`);
      return;
    }

    try {
      console.log(`[${MODULE_ID}] Starting MCP bridge...`);

      const config = this.settings.getBridgeConfig();
      
      // Validate configuration
      const validation = this.settings.validateSettings();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Create and connect socket bridge
      this.socketBridge = new SocketBridge(config);
      await this.socketBridge.connect();

      await this.settings.setSetting('lastConnectionState', 'connected');
      await this.settings.setSetting('lastActivity', new Date().toISOString());
      this.updateLastActivity();
      
      // Update settings display with connection status
      this.settings.updateConnectionStatusDisplay(true, 17); // 17 MCP tools
      
      console.log(`[${MODULE_ID}] Bridge started successfully`);
      
      // Start heartbeat monitoring if enabled
      this.startHeartbeat();
      
      // Show connection notification based on user preference
      if (this.settings.getSetting('enableNotifications')) {
        ui.notifications.info('🔗 MCP Bridge connected successfully (GM only)');
      }
      console.log(`[${MODULE_ID}] GM connection established - Bridge active for user: ${game.user?.name}`);

    } catch (error) {
      console.error(`[${MODULE_ID}] Failed to start bridge:`, error);
      ui.notifications.error(`Failed to connect MCP Bridge: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      await this.settings.setSetting('lastConnectionState', 'error');
      throw error;
    }
  }

  /**
   * Stop the MCP bridge connection
   */
  async stop(): Promise<void> {
    if (!this.socketBridge) {
      console.log(`[${MODULE_ID}] Bridge not running`);
      return;
    }

    try {
      console.log(`[${MODULE_ID}] Stopping MCP bridge...`);

      // Stop heartbeat monitoring
      this.stopHeartbeat();

      this.socketBridge.disconnect();
      this.socketBridge = null;

      await this.settings.setSetting('lastConnectionState', 'disconnected');
      
      // Update settings display with disconnected status
      this.settings.updateConnectionStatusDisplay(false, 0);

      console.log(`[${MODULE_ID}] Bridge stopped`);
      
      // Show disconnection notification based on user preference
      if (this.settings.getSetting('enableNotifications')) {
        ui.notifications.info('MCP Bridge disconnected');
      }

    } catch (error) {
      console.error(`[${MODULE_ID}] Error stopping bridge:`, error);
    }
  }

  /**
   * Restart the bridge with current settings
   */
  async restart(): Promise<void> {
    console.log(`[${MODULE_ID}] Restarting bridge...`);
    
    await this.stop();
    
    // Small delay to ensure clean disconnect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (this.settings.getSetting('enabled')) {
      await this.start();
    }
  }

  /**
   * Get current bridge status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      enabled: this.settings.getSetting('enabled'),
      connected: this.socketBridge?.isConnected() ?? false,
      connectionState: this.socketBridge?.getConnectionState() ?? 'disconnected',
      connectionInfo: this.socketBridge?.getConnectionInfo(),
      settings: this.settings.getAllSettings(),
      registeredMethods: this.queryHandlers.getRegisteredMethods(),
      lastConnectionState: this.settings.getSetting('lastConnectionState'),
      lastActivity: this.lastActivity.toISOString(),
      heartbeatActive: this.heartbeatInterval !== null,
    };
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Ensure no duplicate intervals
    
    const interval = this.settings.getSetting('heartbeatInterval') * 1000; // Convert to milliseconds
    
    this.heartbeatInterval = window.setInterval(async () => {
      await this.performHeartbeat();
    }, interval);
    
    console.log(`[${MODULE_ID}] Heartbeat monitoring started (${interval}ms interval)`);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log(`[${MODULE_ID}] Heartbeat monitoring stopped`);
    }
  }

  /**
   * Perform heartbeat check
   */
  private async performHeartbeat(): Promise<void> {
    try {
      // Lightweight connection check - just verify socket state
      if (!this.socketBridge || !this.socketBridge.isConnected()) {
        // Only log once per disconnection to avoid spam
        if (this.lastActivity && new Date().getTime() - this.lastActivity.getTime() > 60000) {
          console.warn(`[${MODULE_ID}] Heartbeat: Connection lost`);
          
          // Attempt auto-reconnection if enabled (with backoff)
          if (this.settings.getSetting('autoReconnectEnabled')) {
            console.log(`[${MODULE_ID}] Attempting auto-reconnection...`);
            await this.restart();
          }
        }
        return;
      }

      // Just update activity timestamp - no actual network ping needed
      // The socket bridge already handles connection state monitoring
      this.updateLastActivity();
      
    } catch (error) {
      // Only attempt reconnect once per failure cycle
      if (this.settings.getSetting('autoReconnectEnabled')) {
        console.log(`[${MODULE_ID}] Heartbeat failure - attempting single reconnection...`);
        try {
          await this.restart();
        } catch (reconnectError) {
          console.error(`[${MODULE_ID}] Auto-reconnection failed:`, reconnectError);
          // Disable further attempts until manual intervention
          await this.settings.setSetting('autoReconnectEnabled', false);
          if (this.settings.getSetting('enableNotifications')) {
            ui.notifications.warn('⚠️ Lost connection to Claude Desktop - Auto-reconnect disabled');
          }
        }
      }
    }
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    this.lastActivity = new Date();
    this.settings.setSetting('lastActivity', this.lastActivity.toISOString());
  }

  /**
   * Connection control is now handled through the settings menu
   */

  /**
   * Cleanup when module is disabled or world is closed
   */
  async cleanup(): Promise<void> {
    console.log(`[${MODULE_ID}] Cleaning up...`);

    await this.stop();
    this.queryHandlers.unregisterHandlers();
    
    console.log(`[${MODULE_ID}] Cleanup complete`);
  }

}

// Create global instance
const foundryMCPBridge = new FoundryMCPBridge();

// Make it available globally for settings callbacks
(window as any).foundryMCPBridge = foundryMCPBridge;

// Foundry VTT Hooks
Hooks.once('init', async () => {
  try {
    await foundryMCPBridge.initialize();
  } catch (error) {
    console.error(`[${MODULE_ID}] Initialization failed:`, error);
  }
});

Hooks.once('ready', async () => {
  try {
    await foundryMCPBridge.onReady();
  } catch (error) {
    console.error(`[${MODULE_ID}] Ready failed:`, error);
  }
});

// Handle settings menu close to check for changes
Hooks.on('closeSettingsConfig', () => {
  try {
    const enabled = foundryMCPBridge.getStatus().enabled;
    const connected = foundryMCPBridge.getStatus().connected;
    
    if (enabled && !connected) {
      // Setting was enabled but not connected, try to start
      foundryMCPBridge.start().catch(error => {
        console.error(`[${MODULE_ID}] Failed to start after settings change:`, error);
      });
    } else if (!enabled && connected) {
      // Setting was disabled but still connected, stop
      foundryMCPBridge.stop().catch(error => {
        console.error(`[${MODULE_ID}] Failed to stop after settings change:`, error);
      });
    }
  } catch (error) {
    console.error(`[${MODULE_ID}] Error handling settings change:`, error);
  }
});

// Global hook to attach click handlers to all MCP roll buttons in chat
// Using renderChatMessageHTML for Foundry v13 compatibility (renderChatMessage is deprecated)
Hooks.on('renderChatMessageHTML', (_message: any, html: HTMLElement) => {
  try {
    // Convert HTMLElement to jQuery for compatibility with existing handler code
    const $html = $(html);
    
    // Only process if message contains MCP roll buttons
    if ($html.find('.mcp-roll-button').length > 0) {
      console.log(`[${MODULE_ID}] Attaching handlers to roll buttons for user ${game.user?.name}`);
      
      // Get the data access instance to attach handlers
      // We need to access through the query handlers to get the data access instance
      const queryHandlers = foundryMCPBridge['queryHandlers'] as any;
      if (queryHandlers && queryHandlers.dataAccess) {
        queryHandlers.dataAccess.attachRollButtonHandlers($html);
      }
    }
  } catch (error) {
    console.warn(`[${MODULE_ID}] Error attaching roll button handlers:`, error);
  }
});

// Handle world close/reload
Hooks.on('canvasReady', () => {
  // Canvas ready indicates the world is fully loaded
  // Good time to ensure bridge is in correct state
  try {
    const status = foundryMCPBridge.getStatus();
    if (status.enabled && !status.connected) {
      console.log(`[${MODULE_ID}] Canvas ready - attempting to reconnect bridge`);
      foundryMCPBridge.start().catch(error => {
        console.warn(`[${MODULE_ID}] Failed to reconnect on canvas ready:`, error);
      });
    }
  } catch (error) {
    console.error(`[${MODULE_ID}] Error on canvas ready:`, error);
  }
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  foundryMCPBridge.cleanup().catch(error => {
    console.error(`[${MODULE_ID}] Cleanup failed:`, error);
  });
});

// Development helpers (only in debug mode)
if (typeof window !== 'undefined') {
  (window as any).foundryMCPDebug = {
    bridge: foundryMCPBridge,
    getStatus: () => foundryMCPBridge.getStatus(),
    start: () => foundryMCPBridge.start(),
    stop: () => foundryMCPBridge.stop(),
    restart: () => foundryMCPBridge.restart(),
  };
}

export { foundryMCPBridge };