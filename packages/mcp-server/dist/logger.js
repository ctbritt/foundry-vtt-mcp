import winston from 'winston';
export class Logger {
    logger;
    constructor(config) {
        const formats = [];
        // Add timestamp to all logs
        formats.push(winston.format.timestamp());
        // Add error stack traces
        formats.push(winston.format.errors({ stack: true }));
        // Choose output format
        if (config.format === 'json') {
            formats.push(winston.format.json());
        }
        else {
            formats.push(winston.format.simple());
        }
        const transports = [];
        // Console transport
        if (config.enableConsole !== false) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                })),
            }));
        }
        // File transport
        if (config.enableFile && config.filePath) {
            transports.push(new winston.transports.File({
                filename: config.filePath,
                format: winston.format.json(),
            }));
        }
        this.logger = winston.createLogger({
            level: config.level,
            format: winston.format.combine(...formats),
            transports,
        });
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, error) {
        if (error instanceof Error) {
            this.logger.error(message, { error: error.message, stack: error.stack });
        }
        else if (error) {
            this.logger.error(message, { error });
        }
        else {
            this.logger.error(message);
        }
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    child(defaultMeta) {
        const childLogger = this.logger.child(defaultMeta);
        const childInstance = new Logger({
            level: 'info', // This will be overridden by the child logger
            enableConsole: false, // Child doesn't need its own transports
        });
        // Replace the logger instance
        childInstance.logger = childLogger;
        return childInstance;
    }
}
//# sourceMappingURL=logger.js.map