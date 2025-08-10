/**
 * Module configuration handler
 */
export class ModuleConfig {
  constructor() {
    this.moduleId = 'foundry-mcp-bridge';
  }

  /**
   * Register all module settings
   */
  registerSettings() {
    // Enable/disable the bridge
    game.settings.register(this.moduleId, 'enabled', {
      name: 'Enable MCP Bridge',
      hint: 'Enable or disable the MCP bridge connection to AI model',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: value => {
        console.log(`MCP Bridge enabled: ${value}`);
      }
    });

    // MCP Server Host
    game.settings.register(this.moduleId, 'mcpHost', {
      name: 'MCP Server Host',
      hint: 'Hostname or IP address of the MCP server',
      scope: 'world',
      config: true,
      type: String,
      default: 'localhost'
    });

    // MCP Server Port
    game.settings.register(this.moduleId, 'mcpPort', {
      name: 'MCP Server Port',
      hint: 'Port number for the MCP server connection',
      scope: 'world',
      config: true,
      type: Number,
      default: 30000,
      range: {
        min: 1024,
        max: 65535,
        step: 1
      }
    });

    // Connection timeout
    game.settings.register(this.moduleId, 'connectionTimeout', {
      name: 'Connection Timeout',
      hint: 'Timeout in seconds for MCP server connections',
      scope: 'world',
      config: true,
      type: Number,
      default: 10,
      range: {
        min: 5,
        max: 60,
        step: 1
      }
    });

    // Debug logging
    game.settings.register(this.moduleId, 'debugLogging', {
      name: 'Debug Logging',
      hint: 'Enable detailed debug logging for troubleshooting',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false
    });

    // Data access permissions
    game.settings.register(this.moduleId, 'allowCharacterAccess', {
      name: 'Allow Character Access',
      hint: 'Allow MCP server to access character/actor data',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    game.settings.register(this.moduleId, 'allowCompendiumAccess', {
      name: 'Allow Compendium Access',
      hint: 'Allow MCP server to search compendium data',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    game.settings.register(this.moduleId, 'allowSceneAccess', {
      name: 'Allow Scene Access',
      hint: 'Allow MCP server to access scene information',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false
    });
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  getSetting(key) {
    return game.settings.get(this.moduleId, key);
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  async setSetting(key, value) {
    return game.settings.set(this.moduleId, key, value);
  }

  /**
   * Get all current settings as an object
   * @returns {Object} All settings
   */
  getAllSettings() {
    return {
      enabled: this.getSetting('enabled'),
      mcpHost: this.getSetting('mcpHost'),
      mcpPort: this.getSetting('mcpPort'),
      connectionTimeout: this.getSetting('connectionTimeout'),
      debugLogging: this.getSetting('debugLogging'),
      allowCharacterAccess: this.getSetting('allowCharacterAccess'),
      allowCompendiumAccess: this.getSetting('allowCompendiumAccess'),
      allowSceneAccess: this.getSetting('allowSceneAccess')
    };
  }
}