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
                creatureType: {
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
                statBlockHint: {
                    type: string;
                    description: string;
                };
                addToScene: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                packId?: never;
                entryId?: never;
                checkScene?: never;
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
                creatureType?: never;
                names?: never;
                quantity?: never;
                statBlockHint?: never;
                addToScene?: never;
                checkScene?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                creatureType: {
                    type: string;
                    description: string;
                };
                quantity: {
                    type: string;
                    description: string;
                    minimum: number;
                    maximum: number;
                };
                checkScene: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                names?: never;
                statBlockHint?: never;
                addToScene?: never;
                packId?: never;
                entryId?: never;
            };
            required: string[];
        };
    })[];
    /**
     * Handle actor creation from compendium with natural language processing
     */
    handleCreateActorFromCompendium(args: any): Promise<any>;
    /**
     * Handle getting full compendium entry data
     */
    handleGetCompendiumEntryFull(args: any): Promise<any>;
    /**
     * Handle validation of actor creation requests
     */
    handleValidateActorCreation(args: any): Promise<any>;
    /**
     * Parse natural language creature request
     */
    private parseCreatureRequest;
    /**
     * Find best matching creature in compendiums
     */
    private findBestCreatureMatch;
    /**
     * Try enhanced search for descriptive creature terms
     */
    private tryEnhancedCreatureSearch;
    /**
     * Suggest alternative creatures when search fails
     */
    private suggestAlternatives;
    /**
     * Calculate name similarity score (0-1)
     */
    private calculateNameSimilarity;
    /**
     * Format actor creation response for Claude
     */
    private formatActorCreationResponse;
    /**
     * Format compendium entry response
     */
    private formatCompendiumEntryResponse;
}
