import { MODULE_ID } from './constants.js';

/**
 * Connection Settings Form Application
 * Provides a detailed settings dialog accessed from the main settings menu
 */
export class MCPConnectionSettingsForm extends FormApplication {
  private updateInterval: number | null = null;

  static get defaultOptions(): any {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "mcp-connection-settings-form",
      title: "Claude Desktop MCP Connection & Permissions",
      template: `modules/${MODULE_ID}/templates/connection-settings-form.html`,
      width: 600,
      height: 700,
      resizable: true,
      classes: ["mcp-settings-form"],
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".tab-content",
          initial: "connection"
        }
      ]
    });
  }

  getData(): any {
    const bridge = (globalThis as any).foundryMCPBridge;
    const status = bridge?.getStatus() || {};
    
    return {
      // Connection status data
      connected: status.connected || false,
      connectionState: status.connectionState || 'disconnected',
      toolCount: 17, // MCP tools count
      handlerCount: status.registeredMethods?.length || 0,
      lastActivity: status.lastActivity || 'Never',
      connectionInfo: status.connectionInfo || {},
      
      // Current settings values
      enabled: game.settings.get(MODULE_ID, 'enabled'),
      serverHost: game.settings.get(MODULE_ID, 'serverHost'),
      serverPort: game.settings.get(MODULE_ID, 'serverPort'),
      namespace: game.settings.get(MODULE_ID, 'namespace'),
      connectionMode: game.settings.get(MODULE_ID, 'connectionMode'),
      automaticSelected: game.settings.get(MODULE_ID, 'connectionMode') === 'automatic',
      manualSelected: game.settings.get(MODULE_ID, 'connectionMode') === 'manual',
      onDemandSelected: game.settings.get(MODULE_ID, 'connectionMode') === 'on-demand',
      enableNotifications: game.settings.get(MODULE_ID, 'enableNotifications'),
      autoReconnectEnabled: game.settings.get(MODULE_ID, 'autoReconnectEnabled'),
      heartbeatInterval: game.settings.get(MODULE_ID, 'heartbeatInterval'),
      
      // Permission settings
      allowCharacterAccess: game.settings.get(MODULE_ID, 'allowCharacterAccess'),
      allowCompendiumAccess: game.settings.get(MODULE_ID, 'allowCompendiumAccess'),
      allowSceneAccess: game.settings.get(MODULE_ID, 'allowSceneAccess'),
      allowActorCreation: game.settings.get(MODULE_ID, 'allowActorCreation'),
      allowSceneModification: game.settings.get(MODULE_ID, 'allowSceneModification'),
      
      // Safety controls
      maxActorsPerRequest: game.settings.get(MODULE_ID, 'maxActorsPerRequest'),
      requireConfirmationForBulk: game.settings.get(MODULE_ID, 'requireConfirmationForBulk'),
      enableWriteAuditLog: game.settings.get(MODULE_ID, 'enableWriteAuditLog'),
      
      // Status styling helpers
      statusClass: this.getStatusClass(status.connectionState),
      statusIcon: this.getStatusIcon(status.connectionState),
      statusText: this.getStatusText(status.connectionState),
      canConnect: !status.connected && game.settings.get(MODULE_ID, 'enabled'),
      canDisconnect: status.connected
    };
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Connection control buttons
    html.find('.connect-btn').on('click', this._onConnect.bind(this));
    html.find('.disconnect-btn').on('click', this._onDisconnect.bind(this));
    html.find('.refresh-btn').on('click', this._onRefresh.bind(this));
    
    // Settings management buttons
    html.find('.save-settings-btn').on('click', this._onSaveSettings.bind(this));
    html.find('.reset-defaults-btn').on('click', this._onResetDefaults.bind(this));
    html.find('.test-connection-btn').on('click', this._onTestConnection.bind(this));
    
    // Auto-refresh status every 5 seconds
    this.startAutoRefresh();
  }

  async _onConnect(event: Event): Promise<void> {
    event.preventDefault();
    const bridge = (globalThis as any).foundryMCPBridge;
    if (!bridge) {
      ui.notifications?.error('MCP Bridge not available');
      return;
    }

    try {
      ui.notifications?.info('Connecting to Claude Desktop...');
      await bridge.start();
      ui.notifications?.info('✅ Connected to Claude Desktop successfully');
      this.render();
    } catch (error) {
      console.error(`[${MODULE_ID}] Connection failed:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      ui.notifications?.error(`❌ Connection failed: ${errorMsg}`);
    }
  }

  async _onDisconnect(event: Event): Promise<void> {
    event.preventDefault();
    const bridge = (globalThis as any).foundryMCPBridge;
    if (!bridge) return;

    try {
      await bridge.stop();
      ui.notifications?.info('🔌 Disconnected from Claude Desktop');
      this.render();
    } catch (error) {
      console.error(`[${MODULE_ID}] Disconnect failed:`, error);
      ui.notifications?.error('Failed to disconnect cleanly');
    }
  }

  _onRefresh(event: Event): void {
    event.preventDefault();
    this.render();
  }

  async _onSaveSettings(event: Event): Promise<void> {
    event.preventDefault();
    const form = this.element.find('form')[0] as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      // Save each setting, converting form values appropriately
      const settings = {
        enabled: formData.has('enabled'),
        serverHost: (formData.get('serverHost') as string) || 'localhost',
        serverPort: parseInt((formData.get('serverPort') as string) || '31415'),
        namespace: (formData.get('namespace') as string) || '/foundry-mcp',
        connectionMode: (formData.get('connectionMode') as string) || 'automatic',
        enableNotifications: formData.has('enableNotifications'),
        autoReconnectEnabled: formData.has('autoReconnectEnabled'),
        heartbeatInterval: parseInt((formData.get('heartbeatInterval') as string) || '30'),
        allowCharacterAccess: formData.has('allowCharacterAccess'),
        allowCompendiumAccess: formData.has('allowCompendiumAccess'),
        allowSceneAccess: formData.has('allowSceneAccess'),
        allowActorCreation: formData.has('allowActorCreation'),
        allowSceneModification: formData.has('allowSceneModification'),
        maxActorsPerRequest: parseInt((formData.get('maxActorsPerRequest') as string) || '5'),
        requireConfirmationForBulk: formData.has('requireConfirmationForBulk'),
        enableWriteAuditLog: formData.has('enableWriteAuditLog')
      };

      // Validate settings
      const validation = this.validateSettings(settings);
      if (!validation.valid) {
        ui.notifications?.error(`Invalid settings: ${validation.errors.join(', ')}`);
        return;
      }

      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        await game.settings.set(MODULE_ID, key, value);
      }
      
      ui.notifications?.info('Settings saved successfully');
      this.render(); // Refresh the form
    } catch (error) {
      console.error(`[${MODULE_ID}] Failed to save settings:`, error);
      ui.notifications?.error('Failed to save settings');
    }
  }

  async _onResetDefaults(event: Event): Promise<void> {
    event.preventDefault();
    const confirm = await Dialog.confirm({
      title: "Reset to Defaults",
      content: "<p>Are you sure you want to reset all MCP settings to their default values?</p><p><strong>This cannot be undone.</strong></p>",
    });
    
    if (!confirm) return;

    try {
      const bridge = (globalThis as any).foundryMCPBridge;
      if (bridge?.settings?.resetToDefaults) {
        await bridge.settings.resetToDefaults();
      }
      
      ui.notifications?.info('Settings reset to defaults');
      this.render();
    } catch (error) {
      console.error(`[${MODULE_ID}] Failed to reset settings:`, error);
      ui.notifications?.error('Failed to reset settings');
    }
  }

  async _onTestConnection(event: Event): Promise<void> {
    event.preventDefault();
    
    try {
      ui.notifications?.info('Testing connection...');
      const bridge = (globalThis as any).foundryMCPBridge;
      
      if (!bridge) {
        throw new Error('MCP Bridge not available');
      }
      
      const status = bridge.getStatus();
      if (status.connected) {
        ui.notifications?.info('✅ Connection test successful - Bridge is connected and working');
      } else {
        ui.notifications?.warn('⚠️ Connection test failed - Bridge is not connected');
      }
    } catch (error) {
      console.error(`[${MODULE_ID}] Connection test failed:`, error);
      ui.notifications?.error(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateSettings(settings: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings.serverHost || settings.serverHost.trim().length === 0) {
      errors.push('Server host cannot be empty');
    }

    if (settings.serverPort < 1024 || settings.serverPort > 65535) {
      errors.push('Server port must be between 1024 and 65535');
    }

    if (settings.heartbeatInterval < 10 || settings.heartbeatInterval > 120) {
      errors.push('Heartbeat interval must be between 10 and 120 seconds');
    }

    if (settings.maxActorsPerRequest < 1 || settings.maxActorsPerRequest > 10) {
      errors.push('Max actors per request must be between 1 and 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private getStatusClass(state: string): string {
    switch (state) {
      case 'connected': return 'status-connected';
      case 'connecting': return 'status-connecting';
      case 'disconnecting': return 'status-disconnecting';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  }

  private getStatusIcon(state: string): string {
    switch (state) {
      case 'connected': return 'fas fa-link';
      case 'connecting': return 'fas fa-spinner fa-spin';
      case 'disconnecting': return 'fas fa-spinner fa-spin';
      case 'error': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-unlink';
    }
  }

  private getStatusText(state: string): string {
    switch (state) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnecting': return 'Disconnecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  }

  private startAutoRefresh(): void {
    this.updateInterval = window.setInterval(() => {
      if (this.rendered) {
        // Only refresh the status data, not the entire form
        const statusElement = this.element.find('.connection-status-display');
        if (statusElement.length) {
          this.render();
        }
      }
    }, 5000); // Refresh every 5 seconds
  }

  async _updateObject(_event: Event, _formData: any): Promise<void> {
    // This method is required by FormApplication but we handle updates manually
    // through our custom save method
    return Promise.resolve();
  }

  close(options?: any): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    return super.close(options);
  }
}