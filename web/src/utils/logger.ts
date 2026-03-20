/**
 * Structured logging utility with levels
 * Prevents production console spam and provides better debugging
 */

enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

class Logger {
    private level: LogLevel;
    
    constructor() {
        // Production: only errors and warnings
        // Development: all levels
        this.level = process.env.NODE_ENV === 'production' 
            ? LogLevel.WARN 
            : LogLevel.DEBUG;
    }
    
    setLevel(level: LogLevel) {
        this.level = level;
    }
    
    error(...args: any[]) {
        console.error('[ERROR]', ...args);
    }
    
    warn(...args: any[]) {
        if (this.level >= LogLevel.WARN) {
            console.warn('[WARN]', ...args);
        }
    }
    
    info(...args: any[]) {
        if (this.level >= LogLevel.INFO) {
            console.info('[INFO]', ...args);
        }
    }
    
    debug(...args: any[]) {
        if (this.level >= LogLevel.DEBUG) {
            console.log('[DEBUG]', ...args);
        }
    }
}

export const logger = new Logger();
export { LogLevel };
