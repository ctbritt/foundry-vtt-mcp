/**
 * Settings for Foundry MCP Bridge v2
 * Simple WebSocket connection + RunPod map generation
 */

import { MODULE_ID } from './constants.js';

export class ModuleSettingsV2 {
  registerSettings(): void {
    // ============================================================================
    // MAP GENERATION SETTINGS MENU
    // ============================================================================
    
    (game.settings as any).registerMenu(MODULE_ID, 'mapGenerationSettings', {
      name: 'Map Generation Service',
      label: 'Configure Map Generation',
      hint: 'Configure RunPod serverless for AI-powered battlemap creation.',
      icon: 'fas fa-map',
      type: class extends FormApplication {
        static get defaultOptions() {
          return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Map Generation Settings",
            template: `modules/${MODULE_ID}/templates/comfyui-settings.html`,
            width: 500,
            height: 'auto',
            resizable: false,
            closeOnSubmit: false
          } as any);
        }

        getData(): any {
          return {
            serviceType: game.settings.get(MODULE_ID, 'mapGenServiceType') || 'runpod',
            mapGenQuality: game.settings.get(MODULE_ID, 'mapGenQuality') || 'low',
            runpodApiKey: game.settings.get(MODULE_ID, 'runpodApiKey') || '',
            runpodEndpoint: game.settings.get(MODULE_ID, 'runpodEndpoint') || '',
            connectionStatus: 'unknown',
            connectionStatusText: 'RunPod serverless - no local service needed'
          };
        }

        activateListeners(html: JQuery) {
          super.activateListeners(html);

          // Service type change handler
          html.find('#serviceType').change((event: any) => {
            const serviceType = event.target.value;
            const localSection = html.find('#local-service-section');
            const runpodSection = html.find('#runpod-config-section');
            const autoStartCheck = html.find('#auto-start-check');

            if (serviceType === 'runpod') {
              localSection.hide();
              runpodSection.show();
              autoStartCheck.hide();
            } else {
              localSection.show();
              runpodSection.hide();
              autoStartCheck.show();
            }
          });
        }

        async _updateObject(_event: Event, formData: any) {
          await game.settings.set(MODULE_ID, 'mapGenServiceType', formData.serviceType);
          await game.settings.set(MODULE_ID, 'mapGenQuality', formData.mapGenQuality);
          await game.settings.set(MODULE_ID, 'runpodApiKey', formData.runpodApiKey);
          await game.settings.set(MODULE_ID, 'runpodEndpoint', formData.runpodEndpoint);
          ui.notifications?.info('Map generation settings saved');
        }
      },
      restricted: true
    });

    // ============================================================================
    // BASIC SETTINGS
    // ============================================================================

    // Enable/disable bridge
    game.settings.register(MODULE_ID, 'enabled', {
      name: 'Enable MCP Bridge',
      hint: 'Master switch to enable/disable the MCP bridge connection',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: () => {
        ui.notifications?.info('MCP Bridge setting changed. Reload to apply.');
      }
    });

    // Server URL (WebSocket)
    game.settings.register(MODULE_ID, 'serverUrl', {
      name: 'MCP Server WebSocket URL',
      hint: 'WebSocket URL of the MCP server (default: ws://localhost:31417 via SSH tunnel)',
      scope: 'world',
      config: true,
      type: String,
      default: 'ws://localhost:31417',
      onChange: () => {
        ui.notifications?.info('Server URL changed. Reload to reconnect.');
      }
    });

    // Allow write operations
    game.settings.register(MODULE_ID, 'allowWriteOperations', {
      name: 'Allow Write Operations',
      hint: 'If disabled, MCP will only have read access to world data',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Show connection messages
    game.settings.register(MODULE_ID, 'enableNotifications', {
      name: 'Show Connection Messages',
      hint: 'Display notifications when connecting/disconnecting from MCP server',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // ============================================================================
    // MAP GENERATION SETTINGS (hidden, accessed via submenu)
    // ============================================================================

    game.settings.register(MODULE_ID, 'mapGenServiceType', {
      name: 'Map Generation Backend',
      scope: 'world',
      config: false,
      type: String,
      default: 'runpod',
    });

    game.settings.register(MODULE_ID, 'mapGenQuality', {
      name: 'Generation Quality',
      scope: 'world',
      config: false,
      type: String,
      default: 'low',
    });

    game.settings.register(MODULE_ID, 'runpodApiKey', {
      name: 'RunPod API Key',
      scope: 'world',
      config: false,
      type: String,
      default: '',
    });

    game.settings.register(MODULE_ID, 'runpodEndpoint', {
      name: 'RunPod Endpoint ID',
      scope: 'world',
      config: false,
      type: String,
      default: '',
    });

    game.settings.register(MODULE_ID, 'useTwoStageWorkflow', {
      name: 'Use Two-Stage Workflow',
      hint: 'Generate at lower resolution then upscale. Better quality, slower.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    // ============================================================================
    // ENHANCED CREATURE INDEX (for compendium searches)
    // ============================================================================

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
}
