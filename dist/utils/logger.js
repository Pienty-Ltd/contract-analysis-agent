"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    info(message, ...args) {
        console.log(`[INFO] ${message}`, ...args);
    }
    error(message, error) {
        console.error(`[ERROR] ${message}`, error);
    }
    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    }
    debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
}
exports.Logger = Logger;
