import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface MapGenerationToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
    backendComfyUIHandlers?: any;
}
export declare class MapGenerationTools {
    private foundryClient;
    private logger;
    private backendComfyUIHandlers;
    private jobs;
    private jobStartTimes;
    private lastStatusCheck;
    private jobIdCounter;
    constructor(options: MapGenerationToolsOptions);
    getToolDefinitions(): Tool[];
    listScenes(input: any): Promise<any>;
    switchScene(input: any): Promise<any>;
    generateMap(input: any): Promise<any>;
    checkMapStatus(input: any): Promise<any>;
    cancelMapJob(input: any): Promise<any>;
    private getSizePixels;
    private generateJobId;
    private submitComfyUIJob;
    private getComfyUIJobStatus;
    private buildWorkflow;
    shutdown(): Promise<void>;
}
