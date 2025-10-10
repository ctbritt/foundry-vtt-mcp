import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    logLevel: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    logFormat: z.ZodDefault<z.ZodEnum<["json", "simple"]>>;
    enableFileLogging: z.ZodDefault<z.ZodBoolean>;
    logFilePath: z.ZodOptional<z.ZodString>;
    foundry: z.ZodObject<{
        host: z.ZodDefault<z.ZodString>;
        port: z.ZodDefault<z.ZodNumber>;
        namespace: z.ZodDefault<z.ZodString>;
        reconnectAttempts: z.ZodDefault<z.ZodNumber>;
        reconnectDelay: z.ZodDefault<z.ZodNumber>;
        connectionTimeout: z.ZodDefault<z.ZodNumber>;
        connectionType: z.ZodDefault<z.ZodEnum<["websocket", "webrtc", "auto"]>>;
        protocol: z.ZodDefault<z.ZodEnum<["ws", "wss"]>>;
        remoteMode: z.ZodDefault<z.ZodBoolean>;
        dataPath: z.ZodOptional<z.ZodString>;
        rejectUnauthorized: z.ZodDefault<z.ZodBoolean>;
        webrtc: z.ZodDefault<z.ZodObject<{
            stunServers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            stunServers: string[];
        }, {
            stunServers?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
        connectionTimeout: number;
        webrtc: {
            stunServers: string[];
        };
        connectionType: "websocket" | "webrtc" | "auto";
        protocol: "ws" | "wss";
        remoteMode: boolean;
        rejectUnauthorized: boolean;
        dataPath?: string | undefined;
    }, {
        host?: string | undefined;
        port?: number | undefined;
        namespace?: string | undefined;
        reconnectAttempts?: number | undefined;
        reconnectDelay?: number | undefined;
        connectionTimeout?: number | undefined;
        webrtc?: {
            stunServers?: string[] | undefined;
        } | undefined;
        connectionType?: "websocket" | "webrtc" | "auto" | undefined;
        protocol?: "ws" | "wss" | undefined;
        remoteMode?: boolean | undefined;
        dataPath?: string | undefined;
        rejectUnauthorized?: boolean | undefined;
    }>;
    comfyui: z.ZodObject<{
        port: z.ZodDefault<z.ZodNumber>;
        remoteUrl: z.ZodOptional<z.ZodString>;
        autoStart: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        port: number;
        autoStart: boolean;
        remoteUrl?: string | undefined;
    }, {
        port?: number | undefined;
        remoteUrl?: string | undefined;
        autoStart?: boolean | undefined;
    }>;
    runpod: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        apiKey: z.ZodOptional<z.ZodString>;
        endpointId: z.ZodOptional<z.ZodString>;
        apiUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        apiKey?: string | undefined;
        endpointId?: string | undefined;
        apiUrl?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        apiKey?: string | undefined;
        endpointId?: string | undefined;
        apiUrl?: string | undefined;
    }>;
    s3: z.ZodObject<{
        bucket: z.ZodOptional<z.ZodString>;
        region: z.ZodDefault<z.ZodString>;
        accessKeyId: z.ZodOptional<z.ZodString>;
        secretAccessKey: z.ZodOptional<z.ZodString>;
        publicBaseUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        region: string;
        bucket?: string | undefined;
        accessKeyId?: string | undefined;
        secretAccessKey?: string | undefined;
        publicBaseUrl?: string | undefined;
    }, {
        bucket?: string | undefined;
        region?: string | undefined;
        accessKeyId?: string | undefined;
        secretAccessKey?: string | undefined;
        publicBaseUrl?: string | undefined;
    }>;
    server: z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
    }, {
        name?: string | undefined;
        version?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    logLevel: "error" | "warn" | "info" | "debug";
    logFormat: "json" | "simple";
    enableFileLogging: boolean;
    foundry: {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
        connectionTimeout: number;
        webrtc: {
            stunServers: string[];
        };
        connectionType: "websocket" | "webrtc" | "auto";
        protocol: "ws" | "wss";
        remoteMode: boolean;
        rejectUnauthorized: boolean;
        dataPath?: string | undefined;
    };
    comfyui: {
        port: number;
        autoStart: boolean;
        remoteUrl?: string | undefined;
    };
    runpod: {
        enabled: boolean;
        apiKey?: string | undefined;
        endpointId?: string | undefined;
        apiUrl?: string | undefined;
    };
    s3: {
        region: string;
        bucket?: string | undefined;
        accessKeyId?: string | undefined;
        secretAccessKey?: string | undefined;
        publicBaseUrl?: string | undefined;
    };
    server: {
        name: string;
        version: string;
    };
    logFilePath?: string | undefined;
}, {
    foundry: {
        host?: string | undefined;
        port?: number | undefined;
        namespace?: string | undefined;
        reconnectAttempts?: number | undefined;
        reconnectDelay?: number | undefined;
        connectionTimeout?: number | undefined;
        webrtc?: {
            stunServers?: string[] | undefined;
        } | undefined;
        connectionType?: "websocket" | "webrtc" | "auto" | undefined;
        protocol?: "ws" | "wss" | undefined;
        remoteMode?: boolean | undefined;
        dataPath?: string | undefined;
        rejectUnauthorized?: boolean | undefined;
    };
    comfyui: {
        port?: number | undefined;
        remoteUrl?: string | undefined;
        autoStart?: boolean | undefined;
    };
    runpod: {
        enabled?: boolean | undefined;
        apiKey?: string | undefined;
        endpointId?: string | undefined;
        apiUrl?: string | undefined;
    };
    s3: {
        bucket?: string | undefined;
        region?: string | undefined;
        accessKeyId?: string | undefined;
        secretAccessKey?: string | undefined;
        publicBaseUrl?: string | undefined;
    };
    server: {
        name?: string | undefined;
        version?: string | undefined;
    };
    logLevel?: "error" | "warn" | "info" | "debug" | undefined;
    logFormat?: "json" | "simple" | undefined;
    enableFileLogging?: boolean | undefined;
    logFilePath?: string | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const config: {
    logLevel: "error" | "warn" | "info" | "debug";
    logFormat: "json" | "simple";
    enableFileLogging: boolean;
    foundry: {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
        connectionTimeout: number;
        webrtc: {
            stunServers: string[];
        };
        connectionType: "websocket" | "webrtc" | "auto";
        protocol: "ws" | "wss";
        remoteMode: boolean;
        rejectUnauthorized: boolean;
        dataPath?: string | undefined;
    };
    comfyui: {
        port: number;
        autoStart: boolean;
        remoteUrl?: string | undefined;
    };
    runpod: {
        enabled: boolean;
        apiKey?: string | undefined;
        endpointId?: string | undefined;
        apiUrl?: string | undefined;
    };
    s3: {
        region: string;
        bucket?: string | undefined;
        accessKeyId?: string | undefined;
        secretAccessKey?: string | undefined;
        publicBaseUrl?: string | undefined;
    };
    server: {
        name: string;
        version: string;
    };
    logFilePath?: string | undefined;
};
export {};
