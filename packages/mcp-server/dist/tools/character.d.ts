import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface CharacterToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class CharacterTools {
    private foundryClient;
    private logger;
    constructor({ foundryClient, logger }: CharacterToolsOptions);
    /**
     * Tool: get-character
     * Retrieve detailed information about a specific character
     */
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                identifier: {
                    type: string;
                    description: string;
                };
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
                type: {
                    type: string;
                    description: string;
                };
                identifier?: never;
            };
            required?: never;
        };
    })[];
    handleGetCharacter(args: any): Promise<any>;
    handleListCharacters(args: any): Promise<any>;
    private formatCharacterResponse;
    private extractBasicInfo;
    private extractStats;
    private formatItems;
    private formatEffects;
    private truncateText;
}
