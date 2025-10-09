import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const ConfigSchema = z.object({
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  logFormat: z.enum(['json', 'simple']).default('simple'),
  enableFileLogging: z.boolean().default(false),
  logFilePath: z.string().optional(),
  foundry: z.object({
    host: z.string().default('localhost'),
    port: z.number().min(1024).max(65535).default(31415),
    namespace: z.string().default('/foundry-mcp'),
    reconnectAttempts: z.number().min(1).max(20).default(5),
    reconnectDelay: z.number().min(100).max(30000).default(1000),
    connectionTimeout: z.number().min(1000).max(60000).default(10000),
    protocol: z.enum(['ws', 'wss']).default('ws'),
    remoteMode: z.boolean().default(false),
    dataPath: z.string().optional(), // Custom path for generated maps (remote mode)
    rejectUnauthorized: z.boolean().default(true), // TLS certificate validation
  }),
  comfyui: z.object({
    mode: z.enum(['local', 'remote', 'disabled', 'auto']).default('local'),
    remoteUrl: z.string().optional(), // Full URL like http://192.168.1.100:31411
    remoteHost: z.string().default('127.0.0.1'),
    remotePort: z.number().min(1024).max(65535).default(31411),
    // Remote service providers
    providers: z.array(z.object({
      name: z.string(), // 'comfyai-run', 'runpod', 'custom', etc.
      url: z.string(),
      apiKey: z.string().optional(),
      priority: z.number().min(1).max(10).default(5), // Higher = more preferred
      enabled: z.boolean().default(true),
      timeout: z.number().min(5000).max(300000).default(60000), // 1 minute default
      retryAttempts: z.number().min(0).max(5).default(2),
    })).default([]),
    // Fallback behavior
    fallbackToLocal: z.boolean().default(true),
    healthCheckInterval: z.number().min(10000).max(300000).default(30000), // 30 seconds
  }),
  server: z.object({
    name: z.string().default('foundry-mcp-server'),
    version: z.string().default('0.4.17'),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

const rawConfig = {
  logLevel: process.env.LOG_LEVEL || 'warn',
  logFormat: process.env.LOG_FORMAT || 'simple',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  logFilePath: process.env.LOG_FILE_PATH,
  foundry: {
    host: process.env.FOUNDRY_HOST || 'localhost',
    port: parseInt(process.env.FOUNDRY_PORT || '31415', 10),
    namespace: process.env.FOUNDRY_NAMESPACE || '/foundry-mcp',
    reconnectAttempts: parseInt(process.env.FOUNDRY_RECONNECT_ATTEMPTS || '5', 10),
    reconnectDelay: parseInt(process.env.FOUNDRY_RECONNECT_DELAY || '1000', 10),
    connectionTimeout: parseInt(process.env.FOUNDRY_CONNECTION_TIMEOUT || '10000', 10),
    protocol: (process.env.FOUNDRY_PROTOCOL || 'ws') as 'ws' | 'wss',
    remoteMode: process.env.FOUNDRY_REMOTE_MODE === 'true',
    dataPath: process.env.FOUNDRY_DATA_PATH,
    rejectUnauthorized: process.env.FOUNDRY_REJECT_UNAUTHORIZED !== 'false',
  },
  comfyui: {
    mode: (process.env.COMFYUI_MODE || 'local') as 'local' | 'remote' | 'disabled' | 'auto',
    remoteUrl: process.env.COMFYUI_REMOTE_URL,
    remoteHost: process.env.COMFYUI_REMOTE_HOST || '127.0.0.1',
    remotePort: parseInt(process.env.COMFYUI_REMOTE_PORT || '31411', 10),
    providers: process.env.COMFYUI_PROVIDERS ? JSON.parse(process.env.COMFYUI_PROVIDERS) : [],
    fallbackToLocal: process.env.COMFYUI_FALLBACK_TO_LOCAL !== 'false',
    healthCheckInterval: parseInt(process.env.COMFYUI_HEALTH_CHECK_INTERVAL || '30000', 10),
  },
  server: {
    name: process.env.SERVER_NAME || 'foundry-mcp-server',
    version: process.env.SERVER_VERSION || '1.0.0',
  },
};

export const config = ConfigSchema.parse(rawConfig);
