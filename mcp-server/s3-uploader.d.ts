import { Logger } from './logger.js';
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
export declare class S3Uploader {
    private client;
    private config;
    private logger;
    constructor(options: {
        logger: Logger;
        config: S3Config;
    });
    /**
     * Upload an image buffer to S3
     */
    uploadBuffer(buffer: Buffer, options: {
        jobId: string;
        filename?: string;
        contentType?: string;
    }): Promise<S3UploadResult>;
    /**
     * Download an image from a URL and upload to S3
     * Useful for downloading from RunPod's temporary storage
     */
    uploadFromUrl(url: string, options: {
        jobId: string;
        filename?: string;
    }): Promise<S3UploadResult>;
    /**
     * Get the public URL for an S3 key
     */
    private getPublicUrl;
    /**
     * Check if S3 is configured and accessible
     */
    checkHealth(): Promise<boolean>;
}
