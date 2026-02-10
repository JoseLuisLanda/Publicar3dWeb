import { Injectable } from '@angular/core';
import { ILogger } from '../interfaces/services.interface';
import { environment } from '../../../environments/environment';

/**
 * Logger Service
 * Implements Single Responsibility Principle (SRP) - Only handles logging
 * Implements Dependency Inversion Principle (DIP) - Depends on ILogger interface
 * Can be easily extended to send logs to external services
 */
@Injectable({
    providedIn: 'root'
})
export class LoggerService implements ILogger {
    private readonly isProduction = environment.production;

    /**
     * Log general information
     * @param message Log message
     * @param args Additional arguments
     */
    log(message: string, ...args: any[]): void {
        if (!this.isProduction) {
            console.log(`[LOG] ${this.getTimestamp()} - ${message}`, ...args);
        }
    }

    /**
     * Log error
     * @param message Error message
     * @param error Error object
     */
    error(message: string, error?: any): void {
        console.error(`[ERROR] ${this.getTimestamp()} - ${message}`, error);

        // In production, you could send this to an error tracking service
        if (this.isProduction) {
            this.sendToErrorTracking(message, error);
        }
    }

    /**
     * Log warning
     * @param message Warning message
     * @param args Additional arguments
     */
    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${this.getTimestamp()} - ${message}`, ...args);
    }

    /**
     * Log info
     * @param message Info message
     * @param args Additional arguments
     */
    info(message: string, ...args: any[]): void {
        if (!this.isProduction) {
            console.info(`[INFO] ${this.getTimestamp()} - ${message}`, ...args);
        }
    }

    /**
     * Get formatted timestamp
     */
    private getTimestamp(): string {
        return new Date().toISOString();
    }

    /**
     * Send error to tracking service (placeholder)
     * Following Open/Closed Principle - can be extended
     */
    private sendToErrorTracking(message: string, error?: any): void {
        // TODO: Implement error tracking service integration
        // e.g., Sentry, LogRocket, etc.
    }
}
