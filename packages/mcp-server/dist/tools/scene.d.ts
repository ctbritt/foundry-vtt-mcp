import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface SceneToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class SceneTools {
    private foundryClient;
    private logger;
    constructor({ foundryClient, logger }: SceneToolsOptions);
    /**
     * Tool definitions for scene operations
     */
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                includeTokens: {
                    type: string;
                    description: string;
                    default: boolean;
                };
                includeHidden: {
                    type: string;
                    description: string;
                    default: boolean;
                };
            };
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                includeTokens?: never;
                includeHidden?: never;
            };
        };
    })[];
    handleGetCurrentScene(args: any): Promise<any>;
    handleGetWorldInfo(_args: any): Promise<any>;
    private formatSceneResponse;
    private formatTokens;
    private createTokenSummary;
    private formatWorldResponse;
    private getDispositionName;
    private truncateText;
}
