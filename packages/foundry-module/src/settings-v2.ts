/**
 * Simplified settings for Foundry MCP Bridge v2
 */

import { MODULE_ID } from './constants.js';

export class ModuleSettingsV2 {
  registerSettings(): void {
    // Enable/disable bridge
    game.settings.register(MODULE_ID, 'enabled', {
      name: 'Enable MCP Bridge',
      hint: 'Master switch to enable/disable the MCP bridge connection',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: () => {
        ui.notifications.info('MCP Bridge setting changed. Reload to apply.');
      }
    });

    // Server URL (WebSocket)
    game.settings.register(MODULE_ID, 'serverUrl', {
      name: 'MCP Server WebSocket URL',
      hint: 'WebSocket URL of the MCP server (e.g., ws://mac-mini.minikin-chinstrap.ts.net:31417 or ws://localhost:31417 for testing)',
      scope: 'world',
      config: true,
      type: String,
      default: 'ws://localhost:31417',
      onChange: () => {
        ui.notifications.info('Server URL changed. Reload to reconnect.');
      }
    });

    // Allow write operations
    game.settings.register(MODULE_ID, 'allowWrite', {
      name: 'Allow Write Operations',
      hint: 'If disabled, MCP will only have read access to world data',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Alias for v1 compatibility (some code checks this name)
    game.settings.register(MODULE_ID, 'allowWriteOperations', {
      name: 'Allow Write Operations (Alias)',
      hint: 'Alias for allowWrite - keep in sync',
      scope: 'world',
      config: false, // Hidden from UI
      type: Boolean,
      default: true
    });

    // Show connection messages
    game.settings.register(MODULE_ID, 'showConnectionMessages', {
      name: 'Show Connection Messages',
      hint: 'Display notifications when connecting/disconnecting from MCP server',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Enhanced creature index
    game.settings.register(MODULE_ID, 'enableEnhancedCreatureIndex', {
      name: 'Enable Enhanced Creature Index',
      hint: 'Pre-compute creature metadata for faster searches',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });
  }

  getSetting(key: string): any {
    return game.settings.get(MODULE_ID, key);
  }

  async setSetting(key: string, value: any): Promise<void> {
    await game.settings.set(MODULE_ID, key, value);
  }

  validateSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const serverUrl = this.getSetting('serverUrl');
    if (!serverUrl || typeof serverUrl !== 'string') {
      errors.push('Server URL is required');
    } else {
      try {
        new URL(serverUrl);
      } catch {
        errors.push('Server URL is not a valid URL');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
