import axios from 'axios';
/**
 * Client for RunPod Serverless ComfyUI API
 * Handles job submission, polling, and result retrieval
 */
export class RunPodClient {
    config;
    logger;
    client;
    baseUrl;
    constructor(options) {
        this.logger = options.logger.child({ component: 'RunPodClient' });
        this.config = options.config;
        // Use provided API URL or construct from endpoint ID
        this.baseUrl = options.config.apiUrl || `https://api.runpod.ai/v2/${options.config.endpointId}`;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout for API calls (not job execution)
        });
        this.logger.info('RunPod client initialized', {
            baseUrl: this.baseUrl,
            endpointId: this.config.endpointId
        });
    }
    /**
     * Submit a job to RunPod serverless ComfyUI
     */
    async submitJob(input) {
        try {
            const workflow = this.buildWorkflow(input);
            this.logger.info('Submitting job to RunPod', {
                prompt: input.prompt.substring(0, 50),
                size: `${input.width}x${input.height}`
            });
            const response = await this.client.post('/run', {
                input: { workflow }
            });
            const jobId = response.data.id;
            this.logger.info('RunPod job submitted', { jobId });
            return {
                id: jobId,
                status: 'IN_QUEUE'
            };
        }
        catch (error) {
            this.logger.error('Failed to submit RunPod job', {
                error: error.message,
                response: error.response?.data
            });
            throw new Error(`RunPod job submission failed: ${error.message}`);
        }
    }
    /**
     * Get job status from RunPod
     */
    async getJobStatus(jobId) {
        try {
            const response = await this.client.get(`/status/${jobId}`);
            const data = response.data;
            this.logger.debug('RunPod job status', {
                jobId,
                status: data.status,
                delayTime: data.delayTime,
                executionTime: data.executionTime
            });
            return {
                id: data.id,
                status: data.status,
                delayTime: data.delayTime,
                executionTime: data.executionTime,
                output: data.output,
                error: data.error
            };
        }
        catch (error) {
            this.logger.error('Failed to get RunPod job status', {
                jobId,
                error: error.message
            });
            throw new Error(`Failed to get RunPod job status: ${error.message}`);
        }
    }
    /**
     * Poll for job completion with exponential backoff
     */
    async waitForCompletion(jobId, options) {
        const maxWaitTime = options?.maxWaitTime || 600000; // 10 minutes default
        const initialPollInterval = options?.pollInterval || 2000; // 2 seconds initial
        const startTime = Date.now();
        let pollInterval = initialPollInterval;
        let pollCount = 0;
        this.logger.info('Polling RunPod job for completion', {
            jobId,
            maxWaitTime: `${maxWaitTime / 1000}s`
        });
        while (Date.now() - startTime < maxWaitTime) {
            const status = await this.getJobStatus(jobId);
            pollCount++;
            if (status.status === 'COMPLETED') {
                this.logger.info('RunPod job completed', {
                    jobId,
                    executionTime: status.executionTime,
                    totalPolls: pollCount
                });
                return status;
            }
            if (status.status === 'FAILED' || status.status === 'CANCELLED' || status.status === 'TIMED_OUT') {
                const errorMsg = status.error || `Job ${status.status.toLowerCase()}`;
                this.logger.error('RunPod job failed', { jobId, status: status.status, error: errorMsg });
                throw new Error(`RunPod job failed: ${errorMsg}`);
            }
            // Exponential backoff: increase interval after first 10 polls
            if (pollCount > 10) {
                pollInterval = Math.min(pollInterval * 1.2, 10000); // Max 10 seconds
            }
            this.logger.debug('Job still processing, waiting...', {
                jobId,
                status: status.status,
                pollCount,
                nextPollIn: `${Math.round(pollInterval / 1000)}s`
            });
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new Error(`RunPod job timed out after ${maxWaitTime / 1000}s`);
    }
    /**
     * Get the S3 URL from a completed job
     */
    getImageUrl(jobStatus) {
        if (!jobStatus.output?.images || jobStatus.output.images.length === 0) {
            return null;
        }
        // Return the first image URL
        const firstImage = jobStatus.output.images[0];
        return firstImage.data;
    }
    /**
     * Build ComfyUI workflow from input parameters
     * Based on the workflow structure in runpod_info.md
     */
    buildWorkflow(input) {
        // Enhanced prompt for D&D battlemaps
        const enhancedPrompt = `2d DnD battlemap of ${input.prompt}, top-down view, overhead perspective, aerial`;
        // Use provided negative prompt or default
        const negativePrompt = input.negative_prompt ||
            'grid, low angle, isometric, oblique, horizon, text, watermark, logo, caption, people, creatures, monsters, blurry, artifacts';
        // Generate random seed if not provided
        const seed = input.seed !== undefined ? input.seed : Math.floor(Math.random() * 1000000);
        return {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": input.steps || 30,
                    "cfg": input.cfg || 2.5,
                    "sampler_name": input.sampler_name || "dpmpp_2m_sde",
                    "scheduler": input.scheduler || "karras",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "ckpt_name": "dDBattlemapsSDXL10_v10.safetensors"
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "5": {
                "inputs": {
                    "width": input.width,
                    "height": input.height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "text": enhancedPrompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": negativePrompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": "battlemap",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        };
    }
    /**
     * Health check for RunPod endpoint
     */
    async checkHealth() {
        try {
            // RunPod serverless endpoints don't have a dedicated health endpoint
            // but we can verify the API key and endpoint are valid
            const response = await this.client.get('/health', {
                validateStatus: (status) => status < 500 // Accept 404, just not 500s
            });
            this.logger.info('RunPod health check passed');
            return true;
        }
        catch (error) {
            // If we get a 404, the endpoint exists but doesn't have /health - that's OK
            if (error.response?.status === 404) {
                this.logger.info('RunPod endpoint accessible (no /health endpoint)');
                return true;
            }
            this.logger.warn('RunPod health check failed', { error: error.message });
            return false;
        }
    }
}
//# sourceMappingURL=runpod-client.js.map