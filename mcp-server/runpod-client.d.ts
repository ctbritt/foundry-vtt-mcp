import { Logger } from './logger.js';
export interface RunPodWorkflowInput {
    prompt: string;
    negative_prompt?: string;
    width: number;
    height: number;
    seed?: number;
    steps?: number;
    cfg?: number;
    sampler_name?: string;
    scheduler?: string;
}
export interface RunPodJobResponse {
    id: string;
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';
}
export interface RunPodJobStatus {
    id: string;
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';
    delayTime?: number;
    executionTime?: number;
    output?: {
        images?: Array<{
            data: string;
            filename: string;
            type: string;
        }>;
        message?: string;
    };
    error?: string;
}
export interface RunPodConfig {
    apiKey: string;
    endpointId: string;
    apiUrl?: string;
}
/**
 * Client for RunPod Serverless ComfyUI API
 * Handles job submission, polling, and result retrieval
 */
export declare class RunPodClient {
    private config;
    private logger;
    private client;
    private baseUrl;
    constructor(options: {
        logger: Logger;
        config: RunPodConfig;
    });
    /**
     * Submit a job to RunPod serverless ComfyUI
     */
    submitJob(input: RunPodWorkflowInput): Promise<RunPodJobResponse>;
    /**
     * Get job status from RunPod
     */
    getJobStatus(jobId: string): Promise<RunPodJobStatus>;
    /**
     * Poll for job completion with exponential backoff
     */
    waitForCompletion(jobId: string, options?: {
        maxWaitTime?: number;
        pollInterval?: number;
    }): Promise<RunPodJobStatus>;
    /**
     * Get the S3 URL from a completed job
     */
    getImageUrl(jobStatus: RunPodJobStatus): string | null;
    /**
     * Build ComfyUI workflow from input parameters
     * Based on the workflow structure in runpod_info.md
     */
    private buildWorkflow;
    /**
     * Health check for RunPod endpoint
     */
    checkHealth(): Promise<boolean>;
}
