/**
 * Foundry MCP Bridge Module
 * 
 * This module creates a bridge between Foundry VTT and an external MCP server
 * that communicates with Claude Desktop. It handles socket communication and
 * provides game data access for AI-powered interactions.
 */

import { ModuleConfig } from './config.js';
import { MCPBridge } from './mcp-bridge.js';
import { FoundryDataProvider } from './data-provider.js';

class FoundryMCPBridge {
  constructor() {
    this.config = new ModuleConfig();
    this.dataProvider = new FoundryDataProvider();
    this.mcpBridge = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the module
   */
  async initialize() {
    console.log('Foundry MCP Bridge | Initializing...');
    
    try {
      // Register module settings
      this.config.registerSettings();
      
      // Initialize data provider
      await this.dataProvider.initialize();
      
      // Create MCP bridge
      this.mcpBridge = new MCPBridge(this.config, this.dataProvider);
      
      // Start the bridge if enabled
      if (this.config.getSetting('enabled')) {
        await this.startBridge();
      }
      
      this.isInitialized = true;
      console.log('Foundry MCP Bridge | Initialized successfully');
      
    } catch (error) {
      console.error('Foundry MCP Bridge | Initialization failed:', error);
      ui.notifications.error('Failed to initialize Foundry MCP Bridge');
    }
  }

  /**
   * Start the MCP bridge connection
   */
  async startBridge() {
    if (!this.mcpBridge) {
      throw new Error('MCP Bridge not initialized');
    }
    
    try {
      await this.mcpBridge.start();
      console.log('Foundry MCP Bridge | Bridge started');
      ui.notifications.info('MCP Bridge connected successfully');
    } catch (error) {
      console.error('Foundry MCP Bridge | Failed to start bridge:', error);
      ui.notifications.error('Failed to connect MCP Bridge');
    }
  }

  /**
   * Stop the MCP bridge connection
   */
  async stopBridge() {
    if (this.mcpBridge) {
      await this.mcpBridge.stop();
      console.log('Foundry MCP Bridge | Bridge stopped');
      ui.notifications.info('MCP Bridge disconnected');
    }
  }

  /**
   * Handle module ready event
   */
  onReady() {
    // Add any post-ready initialization here
    console.log('Foundry MCP Bridge | Ready');
  }

  /**
   * Handle module settings change
   */
  onSettingsChange(key, value) {
    console.log(`Foundry MCP Bridge | Setting changed: ${key} = ${value}`);
    
    if (key === 'enabled') {
      if (value && this.isInitialized) {
        this.startBridge();
      } else if (!value && this.mcpBridge) {
        this.stopBridge();
      }
    }
  }
}

// Global module instance
window.foundryMCPBridge = new FoundryMCPBridge();

// Foundry hooks
Hooks.once('init', () => {
  window.foundryMCPBridge.initialize();
});

Hooks.once('ready', () => {
  window.foundryMCPBridge.onReady();
});

// Handle setting changes
Hooks.on('closeSettingsConfig', () => {
  // Check if our settings have changed and restart if needed
  const enabled = game.settings.get('foundry-mcp-bridge', 'enabled');
  window.foundryMCPBridge.onSettingsChange('enabled', enabled);
});