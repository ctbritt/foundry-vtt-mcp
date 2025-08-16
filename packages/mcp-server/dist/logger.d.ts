export interface LoggerConfig {
    level: string;
    format?: 'json' | 'simple';
    enableConsole?: boolean;
    enableFile?: boolean;
    filePath?: string;
}
export declare class Logger {
    private logger;
    constructor(config: LoggerConfig);
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: Error | any): void;
    debug(message: string, meta?: any): void;
    child(defaultMeta: any): Logger;
}
