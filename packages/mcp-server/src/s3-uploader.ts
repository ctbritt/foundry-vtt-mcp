import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Logger } from './logger.js';
import axios from 'axios';

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
}

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
}

/**
 * S3 uploader for battlemap images
 * Handles upload to S3 and returns public URLs
 */
export class S3Uploader {
  private client: S3Client;
  private config: S3Config;
  private logger: Logger;

  constructor(options: { logger: Logger; config: S3Config }) {
    this.logger = options.logger.child({ component: 'S3Uploader' });
    this.config = options.config;

    this.client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    });

    this.logger.info('S3 uploader initialized', {
      bucket: this.config.bucket,
      region: this.config.region
    });
  }

  /**
   * Upload an image buffer to S3
   */
  async uploadBuffer(buffer: Buffer, options: {
    jobId: string;
    filename?: string;
    contentType?: string;
  }): Promise<S3UploadResult> {
    const date = new Date();
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const filename = options.filename || `battlemap_${Date.now()}.png`;
    const key = `${monthDay}/${options.jobId}/${filename}`;

    this.logger.info('Uploading image to S3', {
      bucket: this.config.bucket,
      key,
      size: buffer.length
    });

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || 'image/png',
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await this.client.send(command);

      const url = this.getPublicUrl(key);

      this.logger.info('Image uploaded successfully', { url, key });

      return {
        url,
        key,
        bucket: this.config.bucket
      };
    } catch (error: any) {
      this.logger.error('Failed to upload image to S3', {
        error: error.message,
        key
      });
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Download an image from a URL and upload to S3
   * Useful for downloading from RunPod's temporary storage
   */
  async uploadFromUrl(url: string, options: {
    jobId: string;
    filename?: string;
  }): Promise<S3UploadResult> {
    this.logger.info('Downloading image from URL', { url });

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout for large images
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';

      this.logger.info('Image downloaded, uploading to S3', {
        size: buffer.length,
        contentType
      });

      return await this.uploadBuffer(buffer, {
        jobId: options.jobId,
        ...(options.filename ? { filename: options.filename } : {}),
        contentType
      });
    } catch (error: any) {
      this.logger.error('Failed to download and upload image', {
        error: error.message,
        url
      });
      throw new Error(`Failed to download and upload image: ${error.message}`);
    }
  }

  /**
   * Get the public URL for an S3 key
   */
  private getPublicUrl(key: string): string {
    // Use custom public base URL if provided (e.g., CloudFront)
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl}/${key}`;
    }

    // Default S3 URL format
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Check if S3 is configured and accessible
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (with maxKeys=1 to minimize cost)
      // We don't actually need the results, just want to verify access
      const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 1
      });

      await this.client.send(command);
      
      this.logger.info('S3 health check passed');
      return true;
    } catch (error: any) {
      this.logger.warn('S3 health check failed', { error: error.message });
      return false;
    }
  }
}

