import { MODULE_ID } from './constants.js';
import { SocketBridge } from './socket-bridge.js';
import { QueryHandlers } from './queries.js';
import { ModuleSettings } from './settings.js';

/**
 * Main Foundry MCP Bridge Module Class
 */
class FoundryMCPBridge {
  private settings: ModuleSettings;
  private queryHandlers: QueryHandlers;
  private socketBridge: SocketBridge | null = null;
  private isInitialized = false;

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

      // Validate settings
      const validation = this.settings.validateSettings();
      if (!validation.valid) {
        console.warn(`[${MODULE_ID}] Invalid settings:`, validation.errors);
        ui.notifications.warn(`MCP Bridge settings validation failed: ${validation.errors.join(', ')}`);
      }

      // Start bridge if enabled
      if (this.settings.getSetting('enabled')) {
        await this.start();
      }

      console.log(`[${MODULE_ID}] Module ready`);

    } catch (error) {
      console.error(`[${MODULE_ID}] Failed during ready:`, error);
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
      
      console.log(`[${MODULE_ID}] Bridge started successfully`);
      
      // Show GM-specific status banner
      ui.notifications.info('🔗 MCP Bridge connected successfully (GM only)');
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

      this.socketBridge.disconnect();
      this.socketBridge = null;

      await this.settings.setSetting('lastConnectionState', 'disconnected');

      console.log(`[${MODULE_ID}] Bridge stopped`);
      ui.notifications.info('MCP Bridge disconnected');

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
    };
  }

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