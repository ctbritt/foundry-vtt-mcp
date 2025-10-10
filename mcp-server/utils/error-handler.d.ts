import { Logger } from '../logger.js';
export interface MCPError {
    type: 'user' | 'system' | 'permission' | 'validation' | 'connection';
    message: string;
    details?: any;
    suggestions?: string[];
    recoverable: boolean;
}
export declare class ErrorHandler {
    private logger;
    constructor(logger: Logger);
    /**
     * Map Foundry errors to user-friendly MCP errors
     */
    mapFoundryError(error: any, context: string): MCPError;
    /**
     * Format error for Claude response
     */
    formatErrorForClaude(mcpError: MCPError, toolName: string): string;
    /**
     * Log error with appropriate level
     */
    logError(mcpError: MCPError, toolName: string, originalError?: any): void;
    /**
     * Get emoji for error type
     */
    private getErrorEmoji;
    /**
     * Handle tool execution error with proper formatting
     */
    handleToolError(error: any, toolName: string, context?: string): never;
    /**
     * Create validation error for missing parameters
     */
    createValidationError(message: string, suggestions?: string[]): MCPError;
    /**
     * Create permission error with helpful context
     */
    createPermissionError(operation: string, setting?: string): MCPError;
}
