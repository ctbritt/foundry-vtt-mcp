import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface CompendiumToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class CompendiumTools {
    private foundryClient;
    private logger;
    constructor({ foundryClient, logger }: CompendiumToolsOptions);
    /**
     * Tool definitions for compendium operations
     */
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                query: {
                    type: string;
                    description: string;
                };
                packType: {
                    type: string;
                    description: string;
                };
                filters: {
                    type: string;
                    description: string;
                    properties: {
                        challengeRating: {
                            oneOf: ({
                                type: string;
                                description: string;
                                properties?: never;
                            } | {
                                type: string;
                                properties: {
                                    min: {
                                        type: string;
                                        description: string;
                                    };
                                    max: {
                                        type: string;
                                        description: string;
                                    };
                                };
                                description?: never;
                            })[];
                        };
                        creatureType: {
                            type: string;
                            description: string;
                            enum: string[];
                        };
                        size: {
                            type: string;
                            description: string;
                            enum: string[];
                        };
                        alignment: {
                            type: string;
                            description: string;
                        };
                        hasLegendaryActions: {
                            type: string;
                            description: string;
                        };
                        spellcaster: {
                            type: string;
                            description: string;
                        };
                    };
                };
                limit: {
                    type: string;
                    description: string;
                    minimum: number;
                    maximum: number;
                    default?: never;
                };
                packId?: never;
                itemId?: never;
                compact?: never;
                challengeRating?: never;
                creatureType?: never;
                size?: never;
                hasSpells?: never;
                hasLegendaryActions?: never;
                type?: never;
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
                itemId: {
                    type: string;
                    description: string;
                };
                compact: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                query?: never;
                packType?: never;
                filters?: never;
                limit?: never;
                challengeRating?: never;
                creatureType?: never;
                size?: never;
                hasSpells?: never;
                hasLegendaryActions?: never;
                type?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                challengeRating: {
                    oneOf: ({
                        type: string;
                        description: string;
                        properties?: never;
                    } | {
                        type: string;
                        properties: {
                            min: {
                                type: string;
                                description: string;
                            };
                            max: {
                                type: string;
                                description: string;
                            };
                        };
                        description: string;
                    })[];
                    description: string;
                };
                creatureType: {
                    type: string;
                    description: string;
                    enum: string[];
                };
                size: {
                    type: string;
                    description: string;
                    enum: string[];
                };
                hasSpells: {
                    type: string;
                    description: string;
                };
                hasLegendaryActions: {
                    type: string;
                    description: string;
                };
                limit: {
                    type: string;
                    description: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                };
                query?: never;
                packType?: never;
                filters?: never;
                packId?: never;
                itemId?: never;
                compact?: never;
                type?: never;
            };
            required: never[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                type: {
                    type: string;
                    description: string;
                };
                query?: never;
                packType?: never;
                filters?: never;
                limit?: never;
                packId?: never;
                itemId?: never;
                compact?: never;
                challengeRating?: never;
                creatureType?: never;
                size?: never;
                hasSpells?: never;
                hasLegendaryActions?: never;
            };
            required?: never;
        };
    })[];
    handleSearchCompendium(args: any): Promise<any>;
    handleGetCompendiumItem(args: any): Promise<any>;
    handleListCreaturesByCriteria(args: any): Promise<any>;
    handleListCompendiumPacks(args: any): Promise<any>;
    private formatCompendiumItem;
    private formatDetailedCompendiumItem;
    private extractDescription;
    private extractFullDescription;
    private createItemSummary;
    private formatCreatureListItem;
    private extractCompactStats;
    private extractItemProperties;
    private sanitizeSystemData;
    private stripHtml;
    private truncateText;
}
