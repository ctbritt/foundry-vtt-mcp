import type { BridgeConfig } from './socket-bridge.js';
export declare class ModuleSettings {
    private moduleId;
    /**
     * Register all module settings with Foundry
     */
    registerSettings(): void;
    /**
     * Handle roll states setting changes - fires on all clients for world-scoped settings
     */
    private onRollStatesChanged;
    /**
     * Update connection status display in settings
     */
    updateConnectionStatusDisplay(connected: boolean, _toolCount: number): void;
    /**
     * Get current bridge configuration from settings
     */
    getBridgeConfig(): BridgeConfig;
    /**
     * Get a specific setting value
     */
    getSetting(key: string): any;
    /**
     * Set a specific setting value
     */
    setSetting(key: string, value: any): Promise<any>;
    /**
     * Get all settings as an object
     */
    getAllSettings(): Record<string, any>;
    /**
     * Validate settings for consistency
     */
    validateSettings(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Handle enabled setting change
     */
    private onEnabledChange;
    /**
     * Handle connection setting changes
     */
    private onConnectionChange;
    /**
     * Create settings migration for version updates
     */
    /**
     * Get write operation permissions
     */
    getWritePermissions(): {
        allowWriteOperations: boolean;
        maxActorsPerRequest: number;
        enableWriteAuditLog: boolean;
    };
    /**
     * Check if AI model is allowed to perform write operations
     */
    isWriteOperationAllowed(_operation?: string): boolean;
    migrateSettings(fromVersion: string, toVersion: string): void;
    /**
     * Reset all settings to defaults
     */
    resetToDefaults(): Promise<void>;
}
//# sourceMappingURL=settings.d.ts.map