import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
interface DiceRollToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class DiceRollTools {
    private foundryClient;
    private logger;
    constructor(options: DiceRollToolsOptions);
    getToolDefinitions(): {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                rollType: {
                    type: string;
                    description: string;
                    enum: string[];
                };
                rollTarget: {
                    type: string;
                    description: string;
                };
                targetPlayer: {
                    type: string;
                    description: string;
                };
                isPublic: {
                    type: string;
                    description: string;
                };
                userConfirmedVisibility: {
                    type: string;
                    const: boolean;
                    description: string;
                };
                rollModifier: {
                    type: string;
                    description: string;
                    default: string;
                };
                flavor: {
                    type: string;
                    description: string;
                    default: string;
                };
            };
            required: string[];
        };
    }[];
    handleRequestPlayerRolls(args: any): Promise<string>;
}
export {};
