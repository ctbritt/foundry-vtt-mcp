import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
const SIZE_MAPPING = {
    small: 1024,
    medium: 1536,
    large: 2048
};
export class ComfyUIClient {
    config;
    logger;
    process;
    baseUrl;
    clientId;
    constructor(options) {
        this.logger = options.logger.child({ component: 'ComfyUIClient' });
        this.clientId = `ai-maps-server-${Date.now()}`;
        // ComfyUI configuration - can be overridden via options or environment
        const host = options.config?.host || process.env.COMFYUI_HOST || '127.0.0.1';
        const port = options.config?.port || parseInt(process.env.COMFYUI_PORT || '31411', 10);
        this.config = {
            installPath: this.getDefaultInstallPath(),
            host: host,
            port: port,
            pythonCommand: 'python',
            autoStart: true,
            ...options.config
        };
        this.baseUrl = `http://${this.config.host}:${this.config.port}`;
        this.logger.info('ComfyUI client initialized', {
            baseUrl: this.baseUrl,
            installPath: this.config.installPath,
            clientId: this.clientId
        });
    }
    getDefaultInstallPath() {
        const isWindows = os.platform() === 'win32';
        // Check environment variable first
        if (process.env.COMFYUI_PATH) {
            return process.env.COMFYUI_PATH;
        }
        // Search for existing ComfyUI installation
        const searchPaths = [];
        if (isWindows) {
            searchPaths.push(path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'foundry-mcp-server', 'ComfyUI-headless'), path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI', 'ComfyUI'), path.join(os.homedir(), 'AppData', 'Local', 'FoundryMCPServer', 'ComfyUI'), path.join(os.homedir(), 'ComfyUI'));
        }
        else {
            // Linux/Mac - check common locations
            searchPaths.push(path.join(os.homedir(), 'ComfyUI'), path.join(os.homedir(), 'comfyui'), path.join(os.homedir(), '.local', 'share', 'FoundryMCPServer', 'ComfyUI'), path.join('/opt', 'ComfyUI'), path.join('/opt', 'comfyui'));
        }
        // Return first path that exists and has main.py
        for (const searchPath of searchPaths) {
            try {
                const mainPyPath = path.join(searchPath, 'main.py');
                if (require('fs').existsSync(mainPyPath)) {
                    return searchPath;
                }
            }
            catch {
                // Continue searching
            }
        }
        // Return undefined if no installation found (will be handled by autoStart logic)
        return undefined;
    }
    async checkInstallation() {
        if (!this.config.installPath) {
            return false;
        }
        try {
            const mainPyPath = path.join(this.config.installPath, 'main.py');
            await fs.access(mainPyPath);
            this.logger.debug('ComfyUI installation found', { path: mainPyPath });
            return true;
        }
        catch (error) {
            this.logger.warn('ComfyUI installation not found', {
                expectedPath: this.config.installPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    async checkHealth() {
        const startTime = Date.now();
        try {
            const response = await axios.get(`${this.baseUrl}/system_stats`, {
                timeout: 5000
            });
            const responseTime = Date.now() - startTime;
            const gpuInfo = this.extractGPUInfo(response.data);
            return {
                available: true,
                responseTime,
                systemInfo: response.data,
                gpuInfo
            };
        }
        catch (error) {
            this.logger.debug('ComfyUI health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                available: false
            };
        }
    }
    extractGPUInfo(systemStats) {
        // Try to extract GPU information from system stats
        const gpuFields = ['device_name', 'gpu_name', 'device', 'gpu_device', 'torch_device_name'];
        for (const field of gpuFields) {
            if (systemStats[field]) {
                return systemStats[field];
            }
        }
        // Try nested objects
        if (systemStats.system && typeof systemStats.system === 'object') {
            for (const field of gpuFields) {
                if (systemStats.system[field]) {
                    return systemStats.system[field];
                }
            }
        }
        return undefined;
    }
    async startService() {
        // Skip process spawning if no install path (remote mode)
        if (!this.config.installPath) {
            this.logger.info('ComfyUI in remote mode - skipping service start');
            throw new Error('Cannot start ComfyUI service in remote mode. Ensure remote ComfyUI instance is running.');
        }
        if (this.process && !this.process.killed) {
            this.logger.warn('ComfyUI service already running');
            return;
        }
        const isInstalled = await this.checkInstallation();
        if (!isInstalled) {
            throw new Error('ComfyUI is not installed');
        }
        this.logger.info('Starting ComfyUI service', {
            installPath: this.config.installPath,
            port: this.config.port
        });
        const mainPyPath = path.join(this.config.installPath, 'main.py');
        this.process = spawn(this.config.pythonCommand, [
            mainPyPath,
            '--port', this.config.port.toString(),
            '--listen', this.config.host,
            '--disable-auto-launch',
            '--dont-print-server'
        ], {
            cwd: this.config.installPath,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
            windowsHide: true,
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1'
            }
        });
        // Handle process events
        this.process.on('error', (error) => {
            this.logger.error('ComfyUI process error', { error: error.message });
        });
        this.process.on('exit', (code, signal) => {
            this.logger.info('ComfyUI process exited', { code, signal });
            this.process = undefined;
        });
        // Log stderr for debugging
        if (this.process.stderr) {
            this.process.stderr.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    this.logger.debug('ComfyUI stderr', { output });
                }
            });
        }
        // Log stdout for debugging
        if (this.process.stdout) {
            this.process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    this.logger.debug('ComfyUI stdout', { output });
                }
            });
        }
        // Wait for service to become available
        await this.waitForServiceReady();
        this.logger.info('ComfyUI service started successfully');
    }
    async stopService() {
        // Skip process management if no install path (remote mode)
        if (!this.config.installPath) {
            this.logger.info('ComfyUI in remote mode - skipping service stop');
            return;
        }
        if (!this.process || this.process.killed) {
            this.logger.warn('ComfyUI service is not running');
            return;
        }
        this.logger.info('Stopping ComfyUI service');
        this.process.kill('SIGTERM');
        // Force kill after timeout
        setTimeout(() => {
            if (this.process && !this.process.killed) {
                this.logger.warn('Force killing ComfyUI process');
                this.process.kill('SIGKILL');
            }
        }, 5000);
        this.process = undefined;
        this.logger.info('ComfyUI service stopped');
    }
    async waitForServiceReady() {
        const maxWaitTime = 60000; // 60 seconds
        const checkInterval = 2000; // 2 seconds
        const startTime = Date.now();
        this.logger.info('Waiting for ComfyUI service to become ready...');
        while (Date.now() - startTime < maxWaitTime) {
            const health = await this.checkHealth();
            if (health.available) {
                this.logger.info('ComfyUI service is ready', {
                    responseTime: health.responseTime
                });
                return;
            }
            // Check if process is still running
            if (!this.process || this.process.killed) {
                throw new Error('ComfyUI process exited before becoming ready');
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        throw new Error('ComfyUI service failed to become ready within timeout');
    }
    async submitJob(input) {
        const workflow = this.buildWorkflow(input);
        try {
            const response = await axios.post(`${this.baseUrl}/prompt`, {
                prompt: workflow,
                client_id: this.clientId
            }, {
                timeout: 10000
            });
            this.logger.info('ComfyUI job submitted', {
                promptId: response.data.prompt_id,
                clientId: this.clientId
            });
            return response.data;
        }
        catch (error) {
            const responseStatus = error?.response?.status;
            const responseData = error?.response?.data;
            this.logger.error('Failed to submit job to ComfyUI', {
                error: error instanceof Error ? error.message : 'Unknown error',
                status: responseStatus,
                response: responseData
            });
            throw error;
        }
    }
    async getJobStatus(promptId) {
        try {
            this.logger.info('Checking job status', { promptId, baseUrl: this.baseUrl });
            // Check history for completed jobs
            const historyResponse = await axios.get(`${this.baseUrl}/history/${promptId}`, {
                timeout: 5000
            });
            const historyKeys = Object.keys(historyResponse.data);
            this.logger.info('History response', { promptId, historyKeys, hasData: historyKeys.length > 0 });
            if (historyResponse.data && historyKeys.length > 0) {
                this.logger.info('Job found in history - complete', { promptId });
                return 'complete';
            }
            // Check queue for pending/running jobs
            const queueResponse = await axios.get(`${this.baseUrl}/queue`, {
                timeout: 5000
            });
            const queueData = queueResponse.data;
            const runningCount = queueData.queue_running?.length || 0;
            const pendingCount = queueData.queue_pending?.length || 0;
            this.logger.info('Queue response', {
                promptId,
                runningCount,
                pendingCount,
                runningIds: queueData.queue_running?.map((item) => item[1]) || [],
                pendingIds: queueData.queue_pending?.map((item) => item[1]) || []
            });
            // Check running queue
            if (queueData.queue_running && queueData.queue_running.some((item) => item[1] === promptId)) {
                this.logger.info('Job found in running queue', { promptId });
                return 'running';
            }
            // Check pending queue
            if (queueData.queue_pending && queueData.queue_pending.some((item) => item[1] === promptId)) {
                this.logger.info('Job found in pending queue', { promptId });
                return 'queued';
            }
            // Not found in any queue, might have failed or been removed
            this.logger.warn('Job not found in any queue - returning failed', { promptId });
            return 'failed';
        }
        catch (error) {
            this.logger.error('Failed to get job status from ComfyUI', {
                promptId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return 'failed';
        }
    }
    async getJobImages(promptId) {
        try {
            const historyResponse = await axios.get(`${this.baseUrl}/history/${promptId}`, {
                timeout: 5000
            });
            const history = historyResponse.data;
            if (!history || !Object.keys(history).length) {
                return [];
            }
            const jobData = history[promptId];
            if (!jobData || !jobData.outputs) {
                return [];
            }
            // Extract image filenames from outputs
            const imageFilenames = [];
            for (const nodeId of Object.keys(jobData.outputs)) {
                const nodeOutput = jobData.outputs[nodeId];
                if (nodeOutput && nodeOutput.images && Array.isArray(nodeOutput.images)) {
                    for (const image of nodeOutput.images) {
                        if (image.filename) {
                            imageFilenames.push(image.filename);
                        }
                    }
                }
            }
            return imageFilenames;
        }
        catch (error) {
            this.logger.error('Failed to get job images from ComfyUI', {
                promptId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }
    async downloadImage(filename) {
        try {
            const response = await axios.get(`${this.baseUrl}/view`, {
                params: { filename },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return Buffer.from(response.data);
        }
        catch (error) {
            this.logger.error('Failed to download image from ComfyUI', {
                filename,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async cancelJob(promptId) {
        try {
            const response = await axios.post(`${this.baseUrl}/interrupt`, {}, {
                timeout: 5000
            });
            this.logger.info('ComfyUI job cancelled', { promptId });
            return response.status === 200;
        }
        catch (error) {
            this.logger.error('Failed to cancel ComfyUI job', {
                promptId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    buildWorkflow(input) {
        // Enhanced prompt for D&D Battlemaps SDXL
        const enhancedPrompt = `2d DnD battlemap of ${input.prompt}, top-down view, overhead perspective, aerial`;
        // Negative prompt optimized for battlemap generation
        const negativePrompt = 'grid, low angle, isometric, oblique, horizon, text, watermark, logo, caption, people, creatures, monsters, blurry, artifacts';
        return {
            "1": {
                "inputs": {
                    "ckpt_name": "dDBattlemapsSDXL10_v10.safetensors"
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "2": {
                "inputs": {
                    "text": enhancedPrompt,
                    "clip": ["1", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "3": {
                "inputs": {
                    "text": negativePrompt,
                    "clip": ["1", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "4": {
                "inputs": {
                    "width": input.width,
                    "height": input.height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "5": {
                "inputs": {
                    "seed": input.seed || Math.floor(Math.random() * 1000000),
                    "steps": 30, // D&D Battlemaps SDXL recommended
                    "cfg": 2.5, // D&D Battlemaps SDXL optimal CFG (2-3 range)
                    "denoise": 1.0,
                    "sampler_name": "dpmpp_2m_sde", // DPM++ 2M SDE recommended
                    "scheduler": "karras",
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "latent_image": ["4", 0]
                },
                "class_type": "KSampler"
            },
            "9": {
                "inputs": {
                    "vae_name": "sdxl_vae.safetensors"
                },
                "class_type": "VAELoader"
            },
            "6": {
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["9", 0]
                },
                "class_type": "VAEDecode"
            },
            "7": {
                "inputs": {
                    "filename_prefix": "battlemap",
                    "images": ["6", 0]
                },
                "class_type": "SaveImage"
            }
        };
    }
    getSizePixels(size) {
        return SIZE_MAPPING[size];
    }
    async shutdown() {
        if (this.process && !this.process.killed) {
            await this.stopService();
        }
        this.logger.info('ComfyUI client shutdown complete');
    }
}
//# sourceMappingURL=comfyui-client.js.map