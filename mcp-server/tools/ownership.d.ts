import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface OwnershipToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class OwnershipTools {
    private foundryClient;
    private logger;
    constructor({ foundryClient, logger }: OwnershipToolsOptions);
    /**
     * Get tool definitions for ownership management
     */
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                actorIdentifier: {
                    type: string;
                    description: string;
                };
                playerIdentifier: {
                    type: string;
                    description: string;
                };
                permissionLevel: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                confirmBulkOperation: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                confirmRemoval?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                actorIdentifier: {
                    type: string;
                    description: string;
                };
                playerIdentifier: {
                    type: string;
                    description: string;
                };
                confirmRemoval: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                permissionLevel?: never;
                confirmBulkOperation?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                actorIdentifier: {
                    type: string;
                    description: string;
                };
                playerIdentifier: {
                    type: string;
                    description: string;
                };
                permissionLevel?: never;
                confirmBulkOperation?: never;
                confirmRemoval?: never;
            };
            required?: never;
        };
    })[];
    /**
     * Handle tool execution
     */
    handleToolCall(name: string, args: any): Promise<{
        success: boolean;
        message: string;
        results: ({
            actor: string;
            player: string;
            permission: "NONE" | "LIMITED" | "OBSERVER" | "OWNER";
            success: any;
            message: any;
            error: any;
        } | {
            actor: string;
            player: string;
            permission: "NONE" | "LIMITED" | "OBSERVER" | "OWNER";
            success: boolean;
            error: string;
            message?: never;
        })[];
        error?: never;
        actorsFound?: never;
        playersFound?: never;
        totalChanges?: never;
    } | {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        ownership: any;
        error?: never;
    }>;
    /**
     * Assign actor ownership permissions
     */
    private assignActorOwnership;
    /**
     * Remove actor ownership (set to NONE)
     */
    private removeActorOwnership;
    /**
     * List actor ownership permissions
     */
    private listActorOwnership;
    /**
     * Resolve actors from identifier (supports bulk operations)
     */
    private resolveActors;
    /**
     * Resolve players from identifier (supports partial matching)
     */
    private resolvePlayers;
}
