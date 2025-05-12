export class Logger {
    info(message: string, ...args: any[]): void {
        console.log(`[INFO] ${message}`, ...args);
    }

    error(message: string, error?: unknown): void {
        console.error(`[ERROR] ${message}`, error);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${message}`, ...args);
    }

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
} 