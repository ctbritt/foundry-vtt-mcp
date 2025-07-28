/**
 * MCP Bridge - Handles communication between Foundry and external MCP server
 */
export class MCPBridge {
  constructor(config, dataProvider) {
    this.config = config;
    this.dataProvider = dataProvider;
    this.isRunning = false;
    this.socketNamespace = 'mcp-bridge';
  }

  /**
   * Start the MCP bridge
   */
  async start() {
    if (this.isRunning) {
      console.warn('MCP Bridge is already running');
      return;
    }

    try {
      this.setupSocketHandlers();
      this.isRunning = true;
      
      if (this.config.getSetting('debugLogging')) {
        console.log('MCP Bridge | Started successfully');
      }
    } catch (error) {
      console.error('MCP Bridge | Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP bridge
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.removeSocketHandlers();
    this.isRunning = false;
    
    if (this.config.getSetting('debugLogging')) {
      console.log('MCP Bridge | Stopped');
    }
  }

  /**
   * Setup socket.io handlers for MCP communication
   */
  setupSocketHandlers() {
    // Handle MCP queries from external server
    game.socket.on('mcp-query', this.handleMCPQuery.bind(this));
    
    if (this.config.getSetting('debugLogging')) {
      console.log('MCP Bridge | Socket handlers registered');
    }
  }

  /**
   * Remove socket handlers
   */
  removeSocketHandlers() {
    game.socket.off('mcp-query');
    
    if (this.config.getSetting('debugLogging')) {
      console.log('MCP Bridge | Socket handlers removed');
    }
  }

  /**
   * Handle incoming MCP queries
   * @param {Object} data - Query data
   * @param {Function} callback - Response callback
   */
  async handleMCPQuery(data, callback) {
    if (!this.isRunning) {
      callback({ error: 'MCP Bridge is not running' });
      return;
    }

    const { method, data: queryData } = data;
    
    if (this.config.getSetting('debugLogging')) {
      console.log(`MCP Bridge | Handling query: ${method}`, queryData);
    }

    try {
      let result;

      switch (method) {
        case 'getCharacterInfo':
          if (!this.config.getSetting('allowCharacterAccess')) {
            throw new Error('Character access is disabled');
          }
          result = await this.dataProvider.getCharacterInfo(queryData.characterName);
          break;

        case 'searchCompendium':
          if (!this.config.getSetting('allowCompendiumAccess')) {
            throw new Error('Compendium access is disabled');
          }
          result = await this.dataProvider.searchCompendium(queryData.query, queryData.packType);
          break;

        case 'getSceneInfo':
          if (!this.config.getSetting('allowSceneAccess')) {
            throw new Error('Scene access is disabled');
          }
          result = await this.dataProvider.getSceneInfo(queryData.sceneId);
          break;

        case 'ping':
          result = { status: 'ok', timestamp: Date.now() };
          break;

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      callback(result);

      if (this.config.getSetting('debugLogging')) {
        console.log(`MCP Bridge | Query completed: ${method}`);
      }

    } catch (error) {
      console.error(`MCP Bridge | Query failed (${method}):`, error);
      callback({ error: error.message });
    }
  }

  /**
   * Send data to external MCP server
   * @param {string} event - Event name
   * @param {*} data - Data to send
   */
  emit(event, data) {
    if (!this.isRunning) {
      console.warn('Cannot emit - MCP Bridge is not running');
      return;
    }

    game.socket.emit(event, data);
    
    if (this.config.getSetting('debugLogging')) {
      console.log(`MCP Bridge | Emitted: ${event}`, data);
    }
  }

  /**
   * Get bridge status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config.getAllSettings(),
      timestamp: Date.now()
    };
  }
}