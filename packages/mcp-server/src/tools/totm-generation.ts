/**
 * Theatre of the Mind Image Generation
 * Uses OpenAI DALL-E / GPT-Image for narrative scene images
 * No ComfyUI/RunPod needed - direct API calls
 */

import { z } from 'zod';
import { Logger } from '../logger.js';
import OpenAI from 'openai';

export interface TotMToolsOptions {
  logger: Logger;
  foundryClient?: any;
  openaiApiKey?: string;
}

export interface TotMGenerationParams {
  prompt: string;
  title?: string;
  style?: 'vivid' | 'natural';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  uploadToFoundry?: boolean;
}

export class TotMGenerationTools {
  private logger: Logger;
  private openai: OpenAI | null = null;
  private foundryClient: any;

  constructor({ logger, foundryClient, openaiApiKey }: TotMToolsOptions) {
    this.logger = logger.child({ component: 'TotMGenerationTools' });
    this.foundryClient = foundryClient;
    
    // Initialize OpenAI client
    const apiKey = openaiApiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.info('OpenAI client initialized for TotM generation');
    } else {
      this.logger.warn('No OpenAI API key found - TotM generation will be unavailable');
    }
  }

  getToolDefinitions() {
    return [
      {
        name: 'generate-totm',
        description: `Generate a Theatre of the Mind scene image using AI (OpenAI DALL-E 3). Creates narrative/cinematic images for storytelling, NOT tactical battlemaps. 
        
Use for: establishing shots, dramatic moments, NPC portraits, location art, journal illustrations, Dark Sun vistas.
Do NOT use for: combat maps, tactical grids, top-down battle scenes (use generate-map instead).

The image is automatically uploaded to Foundry VTT and can be used in journals or as scene backgrounds.`,
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Detailed description of the scene to generate. Be specific about lighting, mood, composition, and fantasy elements. For Dark Sun, mention the setting explicitly.',
            },
            title: {
              type: 'string',
              description: 'Title for the image (used for filename). Defaults to first few words of prompt.',
            },
            style: {
              type: 'string',
              enum: ['vivid', 'natural'],
              description: 'Image style. "vivid" for dramatic/hyper-real, "natural" for more realistic. Default: vivid',
            },
            size: {
              type: 'string',
              enum: ['1024x1024', '1792x1024', '1024x1792'],
              description: 'Image dimensions. 1792x1024 for landscape, 1024x1792 for portrait, 1024x1024 for square. Default: 1792x1024',
            },
            quality: {
              type: 'string', 
              enum: ['standard', 'hd'],
              description: 'Image quality. "hd" has more detail but costs more. Default: hd',
            },
          },
          required: ['prompt'],
        },
      },
    ];
  }

  async handleGenerateTotM(args: any): Promise<any> {
    const schema = z.object({
      prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
      title: z.string().optional(),
      style: z.enum(['vivid', 'natural']).default('vivid'),
      size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1792x1024'),
      quality: z.enum(['standard', 'hd']).default('hd'),
    });

    const params = schema.parse(args);

    if (!this.openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
      };
    }

    this.logger.info('Generating TotM image', { 
      promptLength: params.prompt.length,
      style: params.style,
      size: params.size,
      quality: params.quality,
    });

    try {
      // Enhance prompt for fantasy TTRPG context
      const enhancedPrompt = this.enhancePrompt(params.prompt);
      
      this.logger.debug('Calling OpenAI image generation', { enhancedPrompt });

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: params.size,
        style: params.style,
        quality: params.quality,
        response_format: 'b64_json',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from OpenAI');
      }

      const imageData = response.data[0];
      
      if (!imageData.b64_json) {
        throw new Error('Image data missing base64 content');
      }

      // Generate filename
      const title = params.title || this.generateTitle(params.prompt);
      const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      const timestamp = Date.now();
      const filename = `totm-${sanitizedTitle}-${timestamp}.png`;

      this.logger.info('TotM image generated, uploading to Foundry', { filename });

      // Upload to Foundry if client is connected
      let foundryPath: string | null = null;
      if (this.foundryClient?.isConnected()) {
        try {
          const uploadResult = await this.foundryClient.query(
            'foundry-mcp-bridge.upload-generated-map',
            {
              filename: filename,
              imageData: imageData.b64_json,
              subfolder: 'totm-images'  // Use different folder than battlemaps
            }
          );
          
          if (uploadResult.success) {
            foundryPath = uploadResult.path;
            this.logger.info('TotM image uploaded to Foundry', { path: foundryPath });
          } else {
            this.logger.warn('Failed to upload to Foundry', { error: uploadResult.error });
          }
        } catch (uploadError: any) {
          this.logger.warn('Upload to Foundry failed', { error: uploadError.message });
        }
      } else {
        this.logger.info('Foundry not connected, returning base64 only');
      }

      return {
        success: true,
        title,
        filename,
        foundryPath,
        revisedPrompt: imageData.revised_prompt,
        size: params.size,
        quality: params.quality,
        message: foundryPath 
          ? `Image "${title}" generated and uploaded to Foundry at: ${foundryPath}`
          : `Image "${title}" generated. Foundry not connected - base64 data available.`,
        // Only include base64 if not uploaded (to save response size)
        ...(foundryPath ? {} : { base64: imageData.b64_json }),
      };

    } catch (error: any) {
      this.logger.error('TotM generation failed', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'content_policy_violation') {
        return {
          success: false,
          error: 'Image generation was blocked by content policy. Try rephrasing the prompt.',
        };
      }
      
      if (error.code === 'rate_limit_exceeded') {
        return {
          success: false,
          error: 'OpenAI rate limit exceeded. Please wait a moment and try again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to generate image',
      };
    }
  }

  /**
   * Enhance the prompt for fantasy TTRPG context
   */
  private enhancePrompt(prompt: string): string {
    // Check if prompt already has style indicators
    const hasStyleIndicators = /\b(fantasy|dnd|d&d|ttrpg|rpg|medieval|magic|dark sun|athas)\b/i.test(prompt);
    
    // Check for Dark Sun specific terms
    const isDarkSun = /\b(dark sun|athas|tyr|urik|draj|raam|nibenay|gulg|balic|sorcerer.?king|defiler|preserver|thri.?kreen|mul|half.?giant|templar|tablelands)\b/i.test(prompt);
    
    if (isDarkSun) {
      return `Dark Sun / Athas setting: ${prompt}. Post-apocalyptic desert fantasy world, harsh sunlight, dried seas, brutal survival, ancient ruins, no metal weapons, psionics, oppressive sorcerer-kings. Highly detailed digital fantasy art, dramatic lighting, cinematic composition.`;
    }
    
    if (hasStyleIndicators) {
      // User knows what they want, just add quality modifiers
      return `${prompt}. Highly detailed digital fantasy art, dramatic lighting, cinematic composition.`;
    }

    // Add general fantasy TTRPG context
    return `Fantasy TTRPG scene: ${prompt}. Highly detailed digital fantasy art, dramatic lighting, cinematic composition, suitable for tabletop roleplaying game illustration.`;
  }

  /**
   * Generate a title from the prompt
   */
  private generateTitle(prompt: string): string {
    // Take first few meaningful words
    const words = prompt
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 4);
    
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
}
