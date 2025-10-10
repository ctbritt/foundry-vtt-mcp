import { Logger } from './logger.js';
/**
 * ComfyUI Client for local or direct HTTP access to ComfyUI instances
 *
 * For RunPod serverless endpoints, use RunPodClient instead.
 * For direct RunPod pod instances, this client can be used with remoteUrl config.
 */
export interface ComfyUIWorkflowInput {
    prompt: string;
    width: number;
    height: number;
    seed?: number;
}
export interface ComfyUIJobResponse {
    prompt_id: string;
    number: number;
    node_errors?: any;
}
export interface ComfyUIConfig {
    installPath?: string | undefined;
    host: string;
    port: number;
    pythonCommand: string;
    autoStart: boolean;
}
export interface ComfyUIHealthInfo {
    available: boolean;
    responseTime?: number;
    systemInfo?: any;
    gpuInfo?: string | undefined;
}
export declare class ComfyUIClient {
    private config;
    private logger;
    private process?;
    private baseUrl;
    private clientId;
    constructor(options: {
        logger: Logger;
        config?: Partial<ComfyUIConfig>;
    });
    private getDefaultInstallPath;
    checkInstallation(): Promise<boolean>;
    checkHealth(): Promise<ComfyUIHealthInfo>;
    private extractGPUInfo;
    startService(): Promise<void>;
    stopService(): Promise<void>;
    private waitForServiceReady;
    submitJob(input: ComfyUIWorkflowInput): Promise<ComfyUIJobResponse>;
    getJobStatus(promptId: string): Promise<'queued' | 'running' | 'complete' | 'failed'>;
    getJobImages(promptId: string): Promise<string[]>;
    downloadImage(filename: string): Promise<Buffer>;
    cancelJob(promptId: string): Promise<boolean>;
    private buildWorkflow;
    getSizePixels(size: 'small' | 'medium' | 'large'): number;
    shutdown(): Promise<void>;
}
