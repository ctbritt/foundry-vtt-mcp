import { MODULE_ID, DEFAULT_CONFIG } from './constants.js';
import type { BridgeConfig } from './socket-bridge.js';

export class ModuleSettings {
  private moduleId: string = MODULE_ID;

  /**
   * Register all module settings with Foundry
   */
  registerSettings(): void {
    // Connection Settings
    game.settings.register(this.moduleId, 'enabled', {
      name: 'foundry-mcp-bridge.settings.enabled.name',
      hint: 'foundry-mcp-bridge.settings.enabled.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this.onEnabledChange.bind(this),
    });

    game.settings.register(this.moduleId, 'serverHost', {
      name: 'foundry-mcp-bridge.settings.serverHost.name',
      hint: 'foundry-mcp-bridge.settings.serverHost.hint',
      scope: 'world',
      config: true,
      type: String,
      default: DEFAULT_CONFIG.MCP_HOST,
      onChange: this.onConnectionChange.bind(this),
    });

    game.settings.register(this.moduleId, 'serverPort', {
      name: 'foundry-mcp-bridge.settings.serverPort.name',
      hint: 'foundry-mcp-bridge.settings.serverPort.hint',
      scope: 'world',
      config: true,
      type: Number,
      default: DEFAULT_CONFIG.MCP_PORT,
      onChange: this.onConnectionChange.bind(this),
    });

    game.settings.register(this.moduleId, 'namespace', {
      name: 'foundry-mcp-bridge.settings.namespace.name',
      hint: 'foundry-mcp-bridge.settings.namespace.hint',
      scope: 'world',
      config: true,
      type: String,
      default: '/foundry-mcp',
    });

    // Advanced Connection Settings
    game.settings.register(this.moduleId, 'connectionTimeout', {
      name: 'foundry-mcp-bridge.settings.connectionTimeout.name',
      hint: 'foundry-mcp-bridge.settings.connectionTimeout.hint',
      scope: 'world',
      config: true,
      type: Number,
      default: DEFAULT_CONFIG.CONNECTION_TIMEOUT,
      range: {
        min: 5,
        max: 60,
        step: 1,
      },
    });

    game.settings.register(this.moduleId, 'reconnectAttempts', {
      name: 'foundry-mcp-bridge.settings.reconnectAttempts.name',
      hint: 'foundry-mcp-bridge.settings.reconnectAttempts.hint',
      scope: 'world',
      config: true,
      type: Number,
      default: DEFAULT_CONFIG.RECONNECT_ATTEMPTS,
      range: {
        min: 1,
        max: 10,
        step: 1,
      },
    });

    game.settings.register(this.moduleId, 'reconnectDelay', {
      name: 'foundry-mcp-bridge.settings.reconnectDelay.name',
      hint: 'foundry-mcp-bridge.settings.reconnectDelay.hint',
      scope: 'world',
      config: true,
      type: Number,
      default: DEFAULT_CONFIG.RECONNECT_DELAY,
      range: {
        min: 100,
        max: 10000,
        step: 100,
      },
    });

    // Data Access Permissions (Read Operations)
    game.settings.register(this.moduleId, 'allowCharacterAccess', {
      name: 'foundry-mcp-bridge.settings.allowCharacterAccess.name',
      hint: 'foundry-mcp-bridge.settings.allowCharacterAccess.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'allowCompendiumAccess', {
      name: 'foundry-mcp-bridge.settings.allowCompendiumAccess.name',
      hint: 'foundry-mcp-bridge.settings.allowCompendiumAccess.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'allowSceneAccess', {
      name: 'foundry-mcp-bridge.settings.allowSceneAccess.name',
      hint: 'foundry-mcp-bridge.settings.allowSceneAccess.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    // AI Assistant Safety Controls (Phase 2)
    game.settings.register(this.moduleId, 'allowActorCreation', {
      name: 'foundry-mcp-bridge.settings.allowActorCreation.name',
      hint: 'foundry-mcp-bridge.settings.allowActorCreation.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true, // Allow Claude to create actors from compendiums
    });

    game.settings.register(this.moduleId, 'allowSceneModification', {
      name: 'foundry-mcp-bridge.settings.allowSceneModification.name',
      hint: 'foundry-mcp-bridge.settings.allowSceneModification.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false, // Require explicit permission for scene changes
    });

    game.settings.register(this.moduleId, 'maxActorsPerRequest', {
      name: 'foundry-mcp-bridge.settings.maxActorsPerRequest.name',
      hint: 'foundry-mcp-bridge.settings.maxActorsPerRequest.hint',
      scope: 'world',
      config: true,
      type: Number,
      default: 5,
      range: {
        min: 1,
        max: 10,
        step: 1,
      },
    });

    game.settings.register(this.moduleId, 'requireConfirmationForBulk', {
      name: 'foundry-mcp-bridge.settings.requireConfirmationForBulk.name',
      hint: 'foundry-mcp-bridge.settings.requireConfirmationForBulk.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false, // Optional confirmation for bulk operations
    });

    game.settings.register(this.moduleId, 'enableWriteAuditLog', {
      name: 'foundry-mcp-bridge.settings.enableWriteAuditLog.name',
      hint: 'foundry-mcp-bridge.settings.enableWriteAuditLog.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true, // Track Claude's actions for transparency
    });

    // Debug and Logging
    game.settings.register(this.moduleId, 'debugLogging', {
      name: 'foundry-mcp-bridge.settings.debugLogging.name',
      hint: 'foundry-mcp-bridge.settings.debugLogging.hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    // Non-configurable settings for internal state
    game.settings.register(this.moduleId, 'lastConnectionState', {
      scope: 'world',
      config: false,
      type: String,
      default: 'disconnected',
    });

    console.log(`[${this.moduleId}] Settings registered`);
  }

  /**
   * Get current bridge configuration from settings
   */
  getBridgeConfig(): BridgeConfig {
    return {
      enabled: this.getSetting('enabled'),
      serverHost: this.getSetting('serverHost'),
      serverPort: this.getSetting('serverPort'),
      namespace: this.getSetting('namespace'),
      reconnectAttempts: this.getSetting('reconnectAttempts'),
      reconnectDelay: this.getSetting('reconnectDelay'),
      connectionTimeout: this.getSetting('connectionTimeout'),
      debugLogging: this.getSetting('debugLogging'),
    };
  }

  /**
   * Get a specific setting value
   */
  getSetting(key: string): any {
    return game.settings.get(this.moduleId, key);
  }

  /**
   * Set a specific setting value
   */
  async setSetting(key: string, value: any): Promise<any> {
    return game.settings.set(this.moduleId, key, value);
  }

  /**
   * Get all settings as an object
   */
  getAllSettings(): Record<string, any> {
    const settingKeys = [
      'enabled', 'serverHost', 'serverPort', 'namespace',
      'connectionTimeout', 'reconnectAttempts', 'reconnectDelay',
      'allowCharacterAccess', 'allowCompendiumAccess', 'allowSceneAccess',
      'allowActorCreation', 'allowSceneModification', 'maxActorsPerRequest',
      'requireConfirmationForBulk', 'enableWriteAuditLog',
      'debugLogging'
    ];

    const settings: Record<string, any> = {};
    for (const key of settingKeys) {
      settings[key] = this.getSetting(key);
    }

    return settings;
  }

  /**
   * Validate settings for consistency
   */
  validateSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const host = this.getSetting('serverHost');
    if (!host || typeof host !== 'string' || host.trim().length === 0) {
      errors.push('Server host cannot be empty');
    }

    const port = this.getSetting('serverPort');
    if (!port || typeof port !== 'number' || port < 1024 || port > 65535) {
      errors.push('Server port must be between 1024 and 65535');
    }

    const timeout = this.getSetting('connectionTimeout');
    if (!timeout || typeof timeout !== 'number' || timeout < 5 || timeout > 60) {
      errors.push('Connection timeout must be between 5 and 60 seconds');
    }

    const attempts = this.getSetting('reconnectAttempts');
    if (!attempts || typeof attempts !== 'number' || attempts < 1 || attempts > 10) {
      errors.push('Reconnect attempts must be between 1 and 10');
    }

    const delay = this.getSetting('reconnectDelay');
    if (!delay || typeof delay !== 'number' || delay < 100 || delay > 10000) {
      errors.push('Reconnect delay must be between 100 and 10000 milliseconds');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Handle enabled setting change
   */
  private onEnabledChange(enabled: boolean): void {
    console.log(`[${this.moduleId}] Bridge enabled: ${enabled}`);
    
    // Trigger bridge state change through global event
    if (window.foundryMCPBridge) {
      if (enabled) {
        window.foundryMCPBridge.start?.();
      } else {
        window.foundryMCPBridge.stop?.();
      }
    }
  }

  /**
   * Handle connection setting changes
   */
  private onConnectionChange(): void {
    console.log(`[${this.moduleId}] Connection settings changed`);
    
    // If bridge is running, restart it with new settings
    if (window.foundryMCPBridge && this.getSetting('enabled')) {
      window.foundryMCPBridge.restart?.();
    }
  }

  /**
   * Create settings migration for version updates
   */
  /**
   * Get write operation permissions
   */
  getWritePermissions(): {
    allowActorCreation: boolean;
    allowSceneModification: boolean;
    maxActorsPerRequest: number;
    requireConfirmationForBulk: boolean;
    enableWriteAuditLog: boolean;
  } {
    return {
      allowActorCreation: this.getSetting('allowActorCreation'),
      allowSceneModification: this.getSetting('allowSceneModification'),
      maxActorsPerRequest: this.getSetting('maxActorsPerRequest'),
      requireConfirmationForBulk: this.getSetting('requireConfirmationForBulk'),
      enableWriteAuditLog: this.getSetting('enableWriteAuditLog'),
    };
  }

  /**
   * Check if Claude AI assistant is allowed to perform write operations
   */
  isWriteOperationAllowed(operation: 'createActor' | 'modifyScene'): boolean {
    // Check safety settings configured by GM
    switch (operation) {
      case 'createActor':
        return this.getSetting('allowActorCreation');
      case 'modifyScene':
        return this.getSetting('allowSceneModification');
      default:
        return false;
    }
  }

  migrateSettings(fromVersion: string, toVersion: string): void {
    console.log(`[${this.moduleId}] Migrating settings from ${fromVersion} to ${toVersion}`);
    
    // Add migration logic here for future versions
    // For now, no migrations needed as this is initial version
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    const settingKeys = [
      'enabled', 'serverHost', 'serverPort', 'namespace',
      'connectionTimeout', 'reconnectAttempts', 'reconnectDelay',
      'allowCharacterAccess', 'allowCompendiumAccess', 'allowSceneAccess',
      'allowActorCreation', 'allowSceneModification', 'maxActorsPerRequest',
      'requireConfirmationForBulk', 'enableWriteAuditLog',
      'debugLogging'
    ];

    for (const key of settingKeys) {
      // Get the default value from the setting registration
      const setting = (game.settings as any).settings.get(`${this.moduleId}.${key}`);
      if (setting && 'default' in setting) {
        await this.setSetting(key, setting.default);
      }
    }

    console.log(`[${this.moduleId}] Settings reset to defaults`);
    ui.notifications.info('MCP Bridge settings have been reset to defaults');
  }
}