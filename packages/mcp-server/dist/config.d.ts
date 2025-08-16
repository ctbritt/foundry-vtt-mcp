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
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
        connectionTimeout: number;
    }, {
        host?: string | undefined;
        port?: number | undefined;
        namespace?: string | undefined;
        reconnectAttempts?: number | undefined;
        reconnectDelay?: number | undefined;
        connectionTimeout?: number | undefined;
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
    };
    server: {
        name: string;
        version: string;
    };
    logFilePath?: string | undefined;
};
export {};
