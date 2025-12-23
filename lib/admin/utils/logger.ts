/**
 * Centralized logging system for admin panel
 * Provides structured logging with different levels and automatic error tracking
 */

import { LogLevel, SystemLog } from '../types';

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private context: LogContext = {};
  private queue: SystemLog[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {
    // Start flush interval
    this.startFlushInterval();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set global context that will be included in all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear specific context keys
   */
  clearContext(keys?: string[]): void {
    if (keys) {
      keys.forEach(key => delete this.context[key]);
    } else {
      this.context = {};
    }
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  /**
   * Log general information
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log warnings
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARNING, message, metadata);
  }

  /**
   * Log errors with stack traces
   */
  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const errorMetadata = {
      ...metadata,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    
    this.log(LogLevel.ERROR, message, errorMetadata);
    
    // In production, send to error tracking service
    if (!this.isDevelopment && error) {
      this.trackError(error);
    }
  }

  /**
   * Log critical errors that need immediate attention
   */
  critical(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, metadata);
    
    // Immediately flush critical logs
    this.flush();
    
    // Alert monitoring service
    this.sendAlert(message, error);
  }

  /**
   * Track performance metrics
   */
  metric(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
    const metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags: { ...tags, ...this.context },
    };

    if (this.isDevelopment) {
      console.log('[METRIC]', metric);
    }

    // Send to metrics service
    this.sendMetric(metric);
  }

  /**
   * Time an operation
   */
  async time<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.metric(name, duration, 'ms', { status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.metric(name, duration, 'ms', { status: 'error' });
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = Object.create(this);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const log: SystemLog = {
      id: this.generateId(),
      level,
      message,
      category: metadata?.category || 'general',
      timestamp: new Date(),
      userId: this.context.userId,
      metadata: {
        ...this.context,
        ...metadata,
      },
    };

    // Console output in development
    if (this.isDevelopment) {
      const color = this.getConsoleColor(level);
      const prefix = `[${level.toUpperCase()}] [${new Date().toISOString()}]`;
      console.log(color, prefix, message, metadata || '');
    }

    // Add to queue
    this.queue.push(log);

    // Flush if queue is getting large
    if (this.queue.length >= 100) {
      this.flush();
    }
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m%s\x1b[0m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m%s\x1b[0m'; // Green
      case LogLevel.WARNING: return '\x1b[33m%s\x1b[0m'; // Yellow
      case LogLevel.ERROR: return '\x1b[31m%s\x1b[0m'; // Red
      case LogLevel.CRITICAL: return '\x1b[35m%s\x1b[0m'; // Magenta
      default: return '\x1b[37m%s\x1b[0m'; // White
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushInterval(): void {
    // Flush logs every 10 seconds
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, 10000);

    // Cleanup on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.flush());
      process.on('SIGINT', () => {
        this.flush();
        process.exit();
      });
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const logs = [...this.queue];
    this.queue = [];

    try {
      // In production, send to logging service
      if (!this.isDevelopment) {
        await fetch('/api/admin/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs }),
        });
      }
    } catch (error) {
      // If logging fails, at least console.error it
      console.error('Failed to flush logs:', error, logs);
    }
  }

  private trackError(error: Error | any): void {
    // Integration with error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }

  private sendAlert(message: string, error?: Error | any): void {
    // Send to alerting service (e.g., PagerDuty, Discord webhook)
    if (!this.isDevelopment) {
      fetch('/api/admin/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'critical',
          message,
          error: error?.toString(),
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }
  }

  private sendMetric(metric: any): void {
    // Send to metrics service (e.g., DataDog, CloudWatch)
    if (!this.isDevelopment) {
      fetch('/api/admin/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(() => {
        // Metrics are fire-and-forget
      });
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const setLogContext = (context: LogContext) => logger.setContext(context);
export const debug = (message: string, metadata?: Record<string, any>) => logger.debug(message, metadata);
export const info = (message: string, metadata?: Record<string, any>) => logger.info(message, metadata);
export const warn = (message: string, metadata?: Record<string, any>) => logger.warn(message, metadata);
export const error = (message: string, error?: Error | any, metadata?: Record<string, any>) => 
  logger.error(message, error, metadata);
export const critical = (message: string, error?: Error | any, metadata?: Record<string, any>) => 
  logger.critical(message, error, metadata);
export const metric = (name: string, value: number, unit?: string, tags?: Record<string, string>) => 
  logger.metric(name, value, unit, tags);
export const timeOperation = <T>(name: string, operation: () => Promise<T>) => 
  logger.time(name, operation);

export default logger;