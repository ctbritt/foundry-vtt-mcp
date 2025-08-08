import { MODULE_ID, DEFAULT_CONFIG } from './constants.js';
import type { BridgeConfig } from './socket-bridge.js';
import { MCPConnectionSettingsForm } from './connection-settings-form.js';

export class ModuleSettings {
  private moduleId: string = MODULE_ID;

  /**
   * Register all module settings with Foundry
   */
  registerSettings(): void {
    // ============================================================================
    // SETTINGS MENU - Detailed Configuration Dialog
    // ============================================================================
    
    (game.settings as any).registerMenu(this.moduleId, 'connectionSettings', {
      name: 'Connection & Permissions',
      label: 'Configure MCP Bridge',
      hint: 'Open detailed configuration panel for Claude Desktop connection, permissions, and safety settings',
      icon: 'fas fa-cogs',
      type: MCPConnectionSettingsForm,
      restricted: true // GM only
    });

    // ============================================================================
    // SECTION 1: BASIC SETTINGS
    // ============================================================================
    
    game.settings.register(this.moduleId, 'enabled', {
      name: 'Enable Claude Desktop Bridge',
      hint: 'Master switch to enable/disable the MCP bridge connection',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this.onEnabledChange.bind(this),
    });

    game.settings.register(this.moduleId, 'serverHost', {
      name: 'Server Host',
      hint: 'IP address where the MCP server runs (usually localhost)',
      scope: 'world',
      config: true,
      type: String,
      default: DEFAULT_CONFIG.MCP_HOST,
      onChange: this.onConnectionChange.bind(this),
    });

    game.settings.register(this.moduleId, 'serverPort', {
      name: 'Server Port',
      hint: 'Port number for MCP server communication',
      scope: 'world',
      config: true,
      type: Number,
      default: DEFAULT_CONFIG.MCP_PORT,
      onChange: this.onConnectionChange.bind(this),
    });

    game.settings.register(this.moduleId, 'namespace', {
      name: 'Connection Namespace',
      hint: 'Socket.io namespace for MCP communication (advanced users only)',
      scope: 'world',
      config: true,
      type: String,
      default: '/foundry-mcp',
    });

    // ============================================================================
    // SECTION 2: PERMISSIONS - What Claude Can Access
    // ============================================================================
    game.settings.register(this.moduleId, 'allowCharacterAccess', {
      name: 'Allow Character Reading',
      hint: 'Let Claude read character sheets, stats, and abilities',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'allowCompendiumAccess', {
      name: 'Allow Compendium Search',
      hint: 'Let Claude search through compendium packs (spells, monsters, items)',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'allowSceneAccess', {
      name: 'Allow Scene Reading',
      hint: 'Let Claude read scene information (tokens, walls, lighting, etc.)',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    game.settings.register(this.moduleId, 'allowActorCreation', {
      name: 'Allow Creating Actors/NPCs',
      hint: 'Let Claude create new actors and NPCs from compendium entries',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'allowSceneModification', {
      name: 'Allow Scene Modifications',
      hint: 'Let Claude add tokens to scenes and modify scene contents',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    // ============================================================================
    // SECTION 3: SAFETY CONTROLS - Limits on Claude's Actions
    // ============================================================================

    game.settings.register(this.moduleId, 'maxActorsPerRequest', {
      name: 'Max Actors Per Request',
      hint: 'Maximum number of actors Claude can create in a single request',
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
      name: 'Require Bulk Operation Confirmation',
      hint: 'Ask for confirmation before creating multiple actors at once',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    game.settings.register(this.moduleId, 'enableWriteAuditLog', {
      name: 'Track Claude\'s Changes',
      hint: 'Log all changes Claude makes for transparency and debugging',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    // ============================================================================
    // SECTION 4: CONNECTION BEHAVIOR - How the Bridge Works
    // ============================================================================
    game.settings.register(this.moduleId, 'connectionMode', {
      name: 'Connection Behavior',
      hint: 'How the bridge connects to Claude Desktop',
      scope: 'world',
      config: true,
      type: String,
      choices: {
        'automatic': 'Connect automatically when Foundry starts',
        'manual': 'Connect manually using connection panel',
        'on-demand': 'Connect only when Claude tries to use a tool'
      },
      default: 'automatic',
      onChange: this.onConnectionChange.bind(this),
    });

    game.settings.register(this.moduleId, 'enableNotifications', {
      name: 'Show Connection Messages',
      hint: 'Display notifications when connecting/disconnecting from Claude Desktop',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'autoReconnectEnabled', {
      name: 'Auto-Reconnect on Disconnect',
      hint: 'Automatically try to reconnect if the connection to Claude Desktop is lost',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

    game.settings.register(this.moduleId, 'heartbeatInterval', {
      name: 'Connection Check Frequency',
      hint: 'How often to check if Claude Desktop is still connected (seconds)',
      scope: 'world',
      config: true,
      type: Number,
      default: 30,
      range: {
        min: 10,
        max: 120,
        step: 5,
      },
    });

    // Non-configurable settings for internal state
    game.settings.register(this.moduleId, 'lastConnectionState', {
      scope: 'world',
      config: false,
      type: String,
      default: 'disconnected',
    });

    game.settings.register(this.moduleId, 'lastActivity', {
      scope: 'world',
      config: false,
      type: String,
      default: '',
    });

    console.log(`[${this.moduleId}] Settings registered`);
  }

  /**
   * Update connection status display in settings
   */
  updateConnectionStatusDisplay(connected: boolean, toolCount: number): void {
    try {
      const statusText = connected 
        ? `✅ Connected - ${toolCount} tools available` 
        : `❌ Disconnected - Use connection panel to connect`;
      
      // Update the hint for the enabled setting to show status
      const enabledSetting = (game.settings as any).settings.get(`${this.moduleId}.enabled`);
      if (enabledSetting) {
        enabledSetting.hint = `${enabledSetting.hint.split(' |')[0]} | Status: ${statusText}`;
      }
      
      console.log(`[${this.moduleId}] Updated connection status: ${statusText}`);
    } catch (error) {
      console.warn(`[${this.moduleId}] Failed to update status display:`, error);
    }
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
      reconnectAttempts: DEFAULT_CONFIG.RECONNECT_ATTEMPTS, // Use sensible default
      reconnectDelay: DEFAULT_CONFIG.RECONNECT_DELAY, // Use sensible default
      connectionTimeout: DEFAULT_CONFIG.CONNECTION_TIMEOUT, // Use sensible default
      debugLogging: false, // Always false - use browser console for debugging
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
      // Basic Settings
      'enabled', 'serverHost', 'serverPort', 'namespace',
      // Permissions
      'allowCharacterAccess', 'allowCompendiumAccess', 'allowSceneAccess',
      'allowActorCreation', 'allowSceneModification', 
      // Safety Controls
      'maxActorsPerRequest', 'requireConfirmationForBulk', 'enableWriteAuditLog',
      // Connection Behavior
      'connectionMode', 'enableNotifications', 'autoReconnectEnabled', 'heartbeatInterval'
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

    const maxActors = this.getSetting('maxActorsPerRequest');
    if (!maxActors || typeof maxActors !== 'number' || maxActors < 1 || maxActors > 10) {
      errors.push('Max actors per request must be between 1 and 10');
    }

    const heartbeat = this.getSetting('heartbeatInterval');
    if (!heartbeat || typeof heartbeat !== 'number' || heartbeat < 10 || heartbeat > 120) {
      errors.push('Heartbeat interval must be between 10 and 120 seconds');
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
      // Basic Settings
      'enabled', 'serverHost', 'serverPort', 'namespace',
      // Permissions
      'allowCharacterAccess', 'allowCompendiumAccess', 'allowSceneAccess',
      'allowActorCreation', 'allowSceneModification', 
      // Safety Controls
      'maxActorsPerRequest', 'requireConfirmationForBulk', 'enableWriteAuditLog',
      // Connection Behavior
      'connectionMode', 'enableNotifications', 'autoReconnectEnabled', 'heartbeatInterval'
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