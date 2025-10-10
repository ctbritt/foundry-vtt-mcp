import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface ActorCreationToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class ActorCreationTools {
    private foundryClient;
    private logger;
    private errorHandler;
    constructor({ foundryClient, logger }: ActorCreationToolsOptions);
    /**
     * Tool definitions for actor creation operations
     */
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                packId: {
                    type: string;
                    description: string;
                };
                itemId: {
                    type: string;
                    description: string;
                };
                names: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                    minItems: number;
                };
                quantity: {
                    type: string;
                    description: string;
                    minimum: number;
                    maximum: number;
                };
                addToScene: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                placement: {
                    type: string;
                    description: string;
                    properties: {
                        type: {
                            type: string;
                            enum: string[];
                            description: string;
                            default: string;
                        };
                        coordinates: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    x: {
                                        type: string;
                                        description: string;
                                    };
                                    y: {
                                        type: string;
                                        description: string;
                                    };
                                };
                                required: string[];
                            };
                            description: string;
                        };
                    };
                    required: string[];
                };
                entryId?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                packId: {
                    type: string;
                    description: string;
                };
                entryId: {
                    type: string;
                    description: string;
                };
                itemId?: never;
                names?: never;
                quantity?: never;
                addToScene?: never;
                placement?: never;
            };
            required: string[];
        };
    })[];
    /**
     * Handle actor creation from specific compendium entry
     */
    handleCreateActorFromCompendium(args: any): Promise<any>;
    /**
     * Handle getting full compendium entry data
     */
    handleGetCompendiumEntryFull(args: any): Promise<any>;
    /**
     * Format compendium entry response
     */
    private formatCompendiumEntryResponse;
    /**
     * Format simplified actor creation response
     */
    private formatSimpleActorCreationResponse;
}
