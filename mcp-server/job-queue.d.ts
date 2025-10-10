import { Logger } from './logger.js';
export type JobStatus = 'queued' | 'generating' | 'processing' | 'complete' | 'failed' | 'expired';
export interface GenerateMapInput {
    prompt: string;
    size: 'small' | 'medium' | 'large';
    grid_size: number;
}
export interface CreateJobParams {
    params: GenerateMapInput;
}
export interface JobResult {
    foundry_scene_payload?: any;
    image_url?: string;
    walls_detected?: number;
    generation_time_ms?: number;
}
export interface JobData {
    id: string;
    prompt_hash: string;
    params: GenerateMapInput;
    status: JobStatus;
    created_at: number;
    started_at?: number;
    completed_at?: number;
    progress_percent: number;
    current_stage: string;
    attempts: number;
    max_attempts: number;
    result?: JobResult;
    error?: string;
    estimated_duration_ms: number;
    comfyui_job_id?: string;
}
export interface JobCompletionNotificationData {
    prompt: string;
    imagePath: string;
    imageWidth?: number;
    imageHeight?: number;
    gridSize?: number;
    walls?: any[];
}
export interface QueueMetrics {
    total_jobs: number;
    queued_jobs: number;
    active_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    avg_completion_time_ms: number;
    avg_queue_time_ms: number;
}
export declare class JobQueue {
    private jobs;
    private jobHashes;
    private logger;
    private config;
    private cleanupTimer?;
    private jobIdCounter;
    private onJobCompleted;
    constructor(options: {
        logger: Logger;
        onJobCompleted?: (jobId: string, data: JobCompletionNotificationData) => void;
    });
    createJob(params: CreateJobParams): Promise<JobData>;
    getJob(jobId: string): Promise<JobData | undefined>;
    markJobStarted(jobId: string): Promise<void>;
    updateJobProgress(jobId: string, progress: number, stage: string): Promise<void>;
    markJobComplete(jobId: string, result: JobResult): Promise<void>;
    markJobFailed(jobId: string, error: string): Promise<void>;
    cancelJob(jobId: string): Promise<boolean>;
    getQueueMetrics(): Promise<QueueMetrics>;
    private generateJobId;
    private generatePromptHash;
    private startCleanupTimer;
    private cleanupExpiredJobs;
    shutdown(): Promise<void>;
}
