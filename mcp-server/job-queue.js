import { createHash } from 'crypto';
const JOB_STAGES = {
    QUEUED: 'Queued for processing',
    VALIDATING: 'Validating parameters',
    SUBMITTING: 'Submitting to ComfyUI',
    GENERATING: 'Generating map image',
    PROCESSING: 'Processing generated image',
    DETECTING_WALLS: 'Detecting walls and structures',
    CREATING_SCENE: 'Creating Foundry scene data',
    COMPLETE: 'Generation complete',
    FAILED: 'Generation failed'
};
const SIZE_CONFIG = {
    small: {
        pixels: 512,
        estimated_time_ms: 30000, // 30 seconds
        priority_weight: 1,
        grid_squares: Math.floor(512 / 70)
    },
    medium: {
        pixels: 768,
        estimated_time_ms: 45000, // 45 seconds
        priority_weight: 2,
        grid_squares: Math.floor(768 / 70)
    },
    large: {
        pixels: 1024,
        estimated_time_ms: 60000, // 60 seconds
        priority_weight: 3,
        grid_squares: Math.floor(1024 / 70)
    }
};
export class JobQueue {
    jobs = new Map();
    jobHashes = new Map();
    logger;
    config;
    cleanupTimer;
    jobIdCounter = 0;
    onJobCompleted;
    constructor(options) {
        this.logger = options.logger.child({ component: 'JobQueue' });
        this.onJobCompleted = options.onJobCompleted;
        this.config = {
            ttl_minutes: 30,
            max_concurrent_jobs: 2,
            max_retry_attempts: 3,
            retry_backoff_ms: 2000
        };
        this.startCleanupTimer();
    }
    async createJob(params) {
        const promptHash = this.generatePromptHash(params.params);
        this.logger.debug('Creating job', { promptHash, params: params.params });
        // Check for existing job with same hash
        const existingJobId = this.jobHashes.get(promptHash);
        if (existingJobId) {
            const existingJob = this.jobs.get(existingJobId);
            if (existingJob && !['failed', 'expired'].includes(existingJob.status)) {
                this.logger.info('Returning existing job for identical request', {
                    jobId: existingJobId,
                    status: existingJob.status
                });
                return existingJob;
            }
        }
        // Create new job
        const jobId = this.generateJobId();
        const estimatedDuration = SIZE_CONFIG[params.params.size]?.estimated_time_ms || 45000;
        const job = {
            id: jobId,
            prompt_hash: promptHash,
            params: params.params,
            status: 'queued',
            created_at: Date.now(),
            progress_percent: 0,
            current_stage: JOB_STAGES.QUEUED,
            attempts: 0,
            max_attempts: this.config.max_retry_attempts,
            estimated_duration_ms: estimatedDuration
        };
        this.jobs.set(jobId, job);
        this.jobHashes.set(promptHash, jobId);
        this.logger.info('Job created', {
            jobId,
            prompt: params.params.prompt,
            size: params.params.size,
            estimatedDuration
        });
        return job;
    }
    async getJob(jobId) {
        return this.jobs.get(jobId);
    }
    async markJobStarted(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }
        job.status = 'generating';
        job.started_at = Date.now();
        job.current_stage = JOB_STAGES.SUBMITTING;
        job.progress_percent = 10;
        this.logger.info('Job started', { jobId, stage: job.current_stage });
    }
    async updateJobProgress(jobId, progress, stage) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }
        job.progress_percent = Math.min(100, Math.max(0, progress));
        job.current_stage = stage;
        this.logger.debug('Job progress updated', {
            jobId,
            progress: job.progress_percent,
            stage
        });
    }
    async markJobComplete(jobId, result) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }
        job.status = 'complete';
        job.completed_at = Date.now();
        job.progress_percent = 100;
        job.current_stage = JOB_STAGES.COMPLETE;
        job.result = result;
        const completionTime = job.completed_at - (job.started_at || job.created_at);
        this.logger.info('Job completed', {
            jobId,
            completionTime,
            wallsDetected: result.walls_detected
        });
        // Notify completion for scene creation
        if (this.onJobCompleted && result.image_url && job.params.prompt) {
            const notificationData = {
                prompt: job.params.prompt,
                imagePath: result.image_url,
                imageWidth: 1024, // Default, could be extracted from job params
                imageHeight: 1024, // Default, could be extracted from job params
                gridSize: job.params.grid_size || 100,
                walls: result.foundry_scene_payload?.walls || []
            };
            try {
                this.onJobCompleted(jobId, notificationData);
                this.logger.info('Job completion notification sent', { jobId });
            }
            catch (error) {
                this.logger.error('Failed to send job completion notification', { jobId, error });
            }
        }
    }
    async markJobFailed(jobId, error) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }
        job.attempts += 1;
        job.error = error;
        if (job.attempts >= job.max_attempts) {
            job.status = 'failed';
            job.current_stage = JOB_STAGES.FAILED;
            this.logger.error('Job failed permanently', {
                jobId,
                attempts: job.attempts,
                error
            });
        }
        else {
            job.status = 'queued';
            job.current_stage = JOB_STAGES.QUEUED;
            this.logger.warn('Job failed, will retry', {
                jobId,
                attempts: job.attempts,
                maxAttempts: job.max_attempts,
                error
            });
        }
    }
    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return false;
        }
        if (['complete', 'failed', 'expired'].includes(job.status)) {
            return false; // Cannot cancel already finished jobs
        }
        job.status = 'failed';
        job.error = 'Job cancelled by user';
        job.current_stage = 'Cancelled';
        this.logger.info('Job cancelled', { jobId });
        return true;
    }
    async getQueueMetrics() {
        const allJobs = Array.from(this.jobs.values());
        const completedJobs = allJobs.filter(j => j.status === 'complete');
        const avgCompletionTime = completedJobs.length > 0
            ? completedJobs.reduce((sum, job) => {
                const completionTime = (job.completed_at || 0) - (job.started_at || job.created_at);
                return sum + completionTime;
            }, 0) / completedJobs.length
            : 0;
        const startedJobs = allJobs.filter(j => j.started_at);
        const avgQueueTime = startedJobs.length > 0
            ? startedJobs.reduce((sum, job) => {
                const queueTime = (job.started_at || 0) - job.created_at;
                return sum + queueTime;
            }, 0) / startedJobs.length
            : 0;
        return {
            total_jobs: allJobs.length,
            queued_jobs: allJobs.filter(j => j.status === 'queued').length,
            active_jobs: allJobs.filter(j => ['generating', 'processing'].includes(j.status)).length,
            completed_jobs: completedJobs.length,
            failed_jobs: allJobs.filter(j => j.status === 'failed').length,
            avg_completion_time_ms: avgCompletionTime,
            avg_queue_time_ms: avgQueueTime
        };
    }
    generateJobId() {
        this.jobIdCounter++;
        const timestamp = Date.now().toString(36);
        const counter = this.jobIdCounter.toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `job_${timestamp}_${counter}_${random}`;
    }
    generatePromptHash(params) {
        const hashInput = JSON.stringify({
            prompt: params.prompt.trim().toLowerCase(),
            size: params.size,
            grid_size: params.grid_size
        });
        return createHash('sha256')
            .update(hashInput)
            .digest('hex')
            .substring(0, 16);
    }
    startCleanupTimer() {
        const cleanupInterval = 5 * 60 * 1000; // 5 minutes
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredJobs();
        }, cleanupInterval);
        this.logger.debug('Cleanup timer started', { intervalMs: cleanupInterval });
    }
    cleanupExpiredJobs() {
        const now = Date.now();
        const ttlMs = this.config.ttl_minutes * 60 * 1000;
        let expiredCount = 0;
        for (const [jobId, job] of this.jobs.entries()) {
            if (now - job.created_at > ttlMs) {
                job.status = 'expired';
                this.jobHashes.delete(job.prompt_hash);
                this.jobs.delete(jobId);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            this.logger.info('Cleaned up expired jobs', { expiredCount });
        }
    }
    async shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.logger.info('JobQueue shutdown complete');
    }
}
//# sourceMappingURL=job-queue.js.map