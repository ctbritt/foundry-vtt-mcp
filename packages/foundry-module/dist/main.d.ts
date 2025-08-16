/**
 * Main Foundry MCP Bridge Module Class
 */
declare class FoundryMCPBridge {
    private settings;
    private queryHandlers;
    private socketBridge;
    private isInitialized;
    private heartbeatInterval;
    private lastActivity;
    private isConnecting;
    constructor();
    /**
     * Check if current user is a GM (silent check for security)
     */
    private isGMUser;
    /**
     * Initialize the module during Foundry's init hook
     */
    initialize(): Promise<void>;
    /**
     * Start the module after Foundry is ready
     */
    onReady(): Promise<void>;
    /**
     * Check if enhanced creature index exists and build if needed (better UX)
     */
    private checkAndBuildEnhancedIndex;
    /**
     * Start the MCP bridge connection
     */
    start(): Promise<void>;
    /**
     * Stop the MCP bridge connection
     */
    stop(): Promise<void>;
    /**
     * Restart the bridge with current settings
     */
    restart(): Promise<void>;
    /**
     * Get current bridge status
     */
    getStatus(): any;
    /**
     * Start heartbeat monitoring
     */
    private startHeartbeat;
    /**
     * Stop heartbeat monitoring
     */
    private stopHeartbeat;
    /**
     * Perform heartbeat check
     */
    private performHeartbeat;
    /**
     * Update last activity timestamp
     */
    updateLastActivity(): void;
    /**
     * Connection control is now handled through the settings menu
     */
    /**
     * Cleanup when module is disabled or world is closed
     */
    cleanup(): Promise<void>;
}
declare const foundryMCPBridge: FoundryMCPBridge;
export { foundryMCPBridge };
//# sourceMappingURL=main.d.ts.map