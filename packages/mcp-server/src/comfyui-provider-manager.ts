import axios, { AxiosInstance } from 'axios';
import { Logger } from './logger.js';

export interface ComfyUIProvider {
  name: string;
  url: string;
  apiKey?: string;
  priority: number;
  enabled: boolean;
  timeout: number;
  retryAttempts: number;
}

export interface ComfyUIHealthInfo {
  available: boolean;
  responseTime?: number;
  systemInfo?: any;
  gpuInfo?: string;
  provider: string;
  lastChecked: number;
}

export interface ComfyUIJobResponse {
  prompt_id: string;
  number: number;
  node_errors?: any;
}

export interface ComfyUIWorkflowInput {
  prompt: string;
  width: number;
  height: number;
  seed?: number;
}

export class ComfyUIProviderManager {
  private providers: ComfyUIProvider[] = [];
  private activeProvider: ComfyUIProvider | null = null;
  private healthStatus = new Map<string, ComfyUIHealthInfo>();
  private logger: Logger;
  private healthCheckInterval?: NodeJS.Timeout;
  private httpClients = new Map<string, AxiosInstance>();

  constructor(options: { logger: Logger; providers: ComfyUIProvider[] }) {
    this.logger = options.logger.child({ component: 'ComfyUIProviderManager' });
    this.providers = options.providers.filter(p => p.enabled).sort((a, b) => b.priority - a.priority);
    
    this.logger.info('ComfyUI Provider Manager initialized', {
      providerCount: this.providers.length,
      providers: this.providers.map(p => ({ name: p.name, url: p.url, priority: p.priority }))
    });

    this.initializeHttpClients();
    this.startHealthChecks();
  }

  private initializeHttpClients(): void {
    for (const provider of this.providers) {
      const client = axios.create({
        baseURL: provider.url,
        timeout: provider.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey && { 'Authorization': `Bearer ${provider.apiKey}` })
        }
      });

      // Add request/response interceptors for logging
      client.interceptors.request.use(
        (config) => {
          this.logger.debug('ComfyUI request', {
            provider: provider.name,
            method: config.method?.toUpperCase(),
            url: config.url
          });
          return config;
        },
        (error) => {
          this.logger.error('ComfyUI request error', { provider: provider.name, error });
          return Promise.reject(error);
        }
      );

      client.interceptors.response.use(
        (response) => {
          this.logger.debug('ComfyUI response', {
            provider: provider.name,
            status: response.status,
            responseTime: response.config.metadata?.endTime - response.config.metadata?.startTime
          });
          return response;
        },
        (error) => {
          this.logger.error('ComfyUI response error', {
            provider: provider.name,
            status: error.response?.status,
            message: error.message
          });
          return Promise.reject(error);
        }
      );

      this.httpClients.set(provider.name, client);
    }
  }

  private startHealthChecks(): void {
    // Initial health check
    this.checkAllProvidersHealth();

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkAllProvidersHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkAllProvidersHealth(): Promise<void> {
    const healthPromises = this.providers.map(provider => this.checkProviderHealth(provider));
    await Promise.allSettled(healthPromises);
    
    // Update active provider based on health status
    this.updateActiveProvider();
  }

  private async checkProviderHealth(provider: ComfyUIProvider): Promise<void> {
    const startTime = Date.now();
    
    try {
      const client = this.httpClients.get(provider.name);
      if (!client) {
        throw new Error('HTTP client not found for provider');
      }

      const response = await client.get('/system_stats', {
        timeout: 5000,
        metadata: { startTime }
      });

      const responseTime = Date.now() - startTime;
      const gpuInfo = this.extractGPUInfo(response.data);

      this.healthStatus.set(provider.name, {
        available: true,
        responseTime,
        systemInfo: response.data,
        gpuInfo,
        provider: provider.name,
        lastChecked: Date.now()
      });

      this.logger.debug('Provider health check successful', {
        provider: provider.name,
        responseTime,
        gpuInfo
      });

    } catch (error) {
      this.healthStatus.set(provider.name, {
        available: false,
        provider: provider.name,
        lastChecked: Date.now()
      });

      this.logger.debug('Provider health check failed', {
        provider: provider.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private extractGPUInfo(systemStats: any): string | undefined {
    const gpuFields = ['device_name', 'gpu_name', 'device', 'gpu_device', 'torch_device_name'];
    
    for (const field of gpuFields) {
      if (systemStats[field]) {
        return systemStats[field];
      }
    }

    if (systemStats.system && typeof systemStats.system === 'object') {
      for (const field of gpuFields) {
        if (systemStats.system[field]) {
          return systemStats.system[field];
        }
      }
    }

    return undefined;
  }

  private updateActiveProvider(): void {
    // Find the best available provider
    const availableProviders = this.providers.filter(provider => {
      const health = this.healthStatus.get(provider.name);
      return health?.available === true;
    });

    if (availableProviders.length === 0) {
      this.activeProvider = null;
      this.logger.warn('No ComfyUI providers available');
      return;
    }

    // Select the highest priority available provider
    const newActiveProvider = availableProviders[0];
    
    if (this.activeProvider?.name !== newActiveProvider.name) {
      this.activeProvider = newActiveProvider;
      this.logger.info('Active ComfyUI provider changed', {
        newProvider: newActiveProvider.name,
        url: newActiveProvider.url
      });
    }
  }

  async getActiveProvider(): Promise<ComfyUIProvider | null> {
    if (!this.activeProvider) {
      await this.checkAllProvidersHealth();
    }
    return this.activeProvider;
  }

  async submitJob(input: ComfyUIWorkflowInput): Promise<ComfyUIJobResponse> {
    const provider = await this.getActiveProvider();
    if (!provider) {
      throw new Error('No ComfyUI providers available');
    }

    const client = this.httpClients.get(provider.name);
    if (!client) {
      throw new Error(`HTTP client not found for provider: ${provider.name}`);
    }

    const workflow = this.buildWorkflow(input);
    const clientId = `foundry-mcp-${Date.now()}`;

    try {
      const response = await client.post('/prompt', {
        prompt: workflow,
        client_id: clientId
      });

      this.logger.info('ComfyUI job submitted', {
        provider: provider.name,
        promptId: response.data.prompt_id,
        clientId
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to submit job to ComfyUI', {
        provider: provider.name,
        error: error.message,
        status: error.response?.status
      });

      // If this provider fails, try to switch to another
      if (error.response?.status >= 500) {
        this.logger.warn('Provider returned server error, switching providers', {
          provider: provider.name,
          status: error.response.status
        });
        this.healthStatus.set(provider.name, {
          available: false,
          provider: provider.name,
          lastChecked: Date.now()
        });
        this.updateActiveProvider();
      }

      throw error;
    }
  }

  async getJobStatus(promptId: string): Promise<'queued' | 'running' | 'complete' | 'failed'> {
    const provider = await this.getActiveProvider();
    if (!provider) {
      throw new Error('No ComfyUI providers available');
    }

    const client = this.httpClients.get(provider.name);
    if (!client) {
      throw new Error(`HTTP client not found for provider: ${provider.name}`);
    }

    try {
      // Check history for completed jobs
      const historyResponse = await client.get(`/history/${promptId}`, { timeout: 5000 });
      
      if (historyResponse.data && Object.keys(historyResponse.data).length > 0) {
        return 'complete';
      }

      // Check queue for pending/running jobs
      const queueResponse = await client.get('/queue', { timeout: 5000 });
      const queueData = queueResponse.data;

      // Check running queue
      if (queueData.queue_running && queueData.queue_running.some((item: any) => item[1] === promptId)) {
        return 'running';
      }

      // Check pending queue
      if (queueData.queue_pending && queueData.queue_pending.some((item: any) => item[1] === promptId)) {
        return 'queued';
      }

      return 'failed';
    } catch (error) {
      this.logger.error('Failed to get job status from ComfyUI', {
        provider: provider.name,
        promptId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 'failed';
    }
  }

  async getJobImages(promptId: string): Promise<string[]> {
    const provider = await this.getActiveProvider();
    if (!provider) {
      throw new Error('No ComfyUI providers available');
    }

    const client = this.httpClients.get(provider.name);
    if (!client) {
      throw new Error(`HTTP client not found for provider: ${provider.name}`);
    }

    try {
      const historyResponse = await client.get(`/history/${promptId}`, { timeout: 5000 });
      const history = historyResponse.data;
      
      if (!history || !Object.keys(history).length) {
        return [];
      }

      const jobData = history[promptId];
      if (!jobData || !jobData.outputs) {
        return [];
      }

      const imageFilenames: string[] = [];
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
    } catch (error) {
      this.logger.error('Failed to get job images from ComfyUI', {
        provider: provider.name,
        promptId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async downloadImage(filename: string): Promise<Buffer> {
    const provider = await this.getActiveProvider();
    if (!provider) {
      throw new Error('No ComfyUI providers available');
    }

    const client = this.httpClients.get(provider.name);
    if (!client) {
      throw new Error(`HTTP client not found for provider: ${provider.name}`);
    }

    try {
      const response = await client.get('/view', {
        params: { filename },
        responseType: 'arraybuffer',
        timeout: 30000
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to download image from ComfyUI', {
        provider: provider.name,
        filename,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async cancelJob(promptId: string): Promise<boolean> {
    const provider = await this.getActiveProvider();
    if (!provider) {
      throw new Error('No ComfyUI providers available');
    }

    const client = this.httpClients.get(provider.name);
    if (!client) {
      throw new Error(`HTTP client not found for provider: ${provider.name}`);
    }

    try {
      const response = await client.post('/interrupt', {}, { timeout: 5000 });
      this.logger.info('ComfyUI job cancelled', { provider: provider.name, promptId });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Failed to cancel ComfyUI job', {
        provider: provider.name,
        promptId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private buildWorkflow(input: ComfyUIWorkflowInput): Record<string, any> {
    // Enhanced prompt for D&D Battlemaps SDXL
    const enhancedPrompt = `2d DnD battlemap of ${input.prompt}, top-down view, overhead perspective, aerial`;

    // Negative prompt optimized for battlemap generation
    const negativePrompt = 'grid, low angle, isometric, oblique, horizon, text, watermark, logo, caption, people, creatures, monsters, blurry, artifacts';

    return {
      "1": { // CheckpointLoaderSimple
        "inputs": {
          "ckpt_name": "dDBattlemapsSDXL10_upscaleV10.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": { // CLIP Text Encode (Positive)
        "inputs": {
          "text": enhancedPrompt,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": { // CLIP Text Encode (Negative)
        "inputs": {
          "text": negativePrompt,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": { // Empty Latent Image
        "inputs": {
          "width": input.width,
          "height": input.height,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "5": { // KSampler
        "inputs": {
          "seed": input.seed || Math.floor(Math.random() * 1000000),
          "steps": 35,
          "cfg": 10.0,
          "denoise": 1.0,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["4", 0]
        },
        "class_type": "KSampler"
      },
      "9": { // VAE Loader
        "inputs": {
          "vae_name": "sdxl_vae.safetensors"
        },
        "class_type": "VAELoader"
      },
      "6": { // VAE Decode
        "inputs": {
          "samples": ["5", 0],
          "vae": ["9", 0]
        },
        "class_type": "VAEDecode"
      },
      "7": { // Save Image
        "inputs": {
          "filename_prefix": "battlemap",
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    };
  }

  getSizePixels(size: 'small' | 'medium' | 'large'): number {
    const SIZE_MAPPING = {
      small: 1024,
      medium: 1536,
      large: 2048
    } as const;
    return SIZE_MAPPING[size];
  }

  getHealthStatus(): Map<string, ComfyUIHealthInfo> {
    return new Map(this.healthStatus);
  }

  getProviders(): ComfyUIProvider[] {
    return [...this.providers];
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.logger.info('ComfyUI Provider Manager shutdown complete');
  }
}