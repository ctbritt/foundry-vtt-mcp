/**
 * Module constants
 */
export declare const MODULE_ID = "foundry-mcp-bridge";
export declare const MODULE_TITLE = "Foundry MCP Bridge";
/**
 * Socket event names
 */
export declare const SOCKET_EVENTS: {
    readonly MCP_QUERY: "mcp-query";
    readonly MCP_RESPONSE: "mcp-response";
    readonly BRIDGE_STATUS: "bridge-status";
    readonly PING: "ping";
    readonly PONG: "pong";
};
/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: {
    readonly MCP_HOST: "localhost";
    readonly MCP_PORT: 31415;
    readonly CONNECTION_TIMEOUT: 10;
    readonly RECONNECT_ATTEMPTS: 5;
    readonly RECONNECT_DELAY: 1000;
    readonly LOG_LEVEL: "info";
};
/**
 * Connection states
 */
export declare const CONNECTION_STATES: {
    readonly DISCONNECTED: "disconnected";
    readonly CONNECTING: "connecting";
    readonly CONNECTED: "connected";
    readonly RECONNECTING: "reconnecting";
};
/**
 * Token dispositions
 */
export declare const TOKEN_DISPOSITIONS: {
    readonly HOSTILE: -1;
    readonly NEUTRAL: 0;
    readonly FRIENDLY: 1;
};
/**
 * Error messages
 */
export declare const ERROR_MESSAGES: {
    readonly NOT_INITIALIZED: "Data provider not initialized";
    readonly NOT_CONNECTED: "Not connected to Foundry VTT";
    readonly CHARACTER_NOT_FOUND: "Character not found";
    readonly SCENE_NOT_FOUND: "Scene not found";
    readonly ACCESS_DENIED: "Access denied - feature is disabled";
    readonly QUERY_TIMEOUT: "Query timeout";
    readonly UNKNOWN_METHOD: "Unknown method";
    readonly BRIDGE_NOT_RUNNING: "MCP Bridge is not running";
};
//# sourceMappingURL=constants.d.ts.map