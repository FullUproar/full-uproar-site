import { headers } from 'next/headers';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private serviceName: string;
  private isDevelopment: boolean;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private async getRequestContext(): Promise<LogContext> {
    try {
      const headersList = await headers();
      return {
        requestId: headersList.get('x-request-id') || undefined,
        ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined,
        userAgent: headersList.get('user-agent') || undefined,
      };
    } catch {
      return {};
    }
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty print for development
      const color = this.getColor(entry.level);
      const reset = '\x1b[0m';
      return `${color}[${entry.timestamp}] [${entry.level}] ${entry.message}${reset}\n${
        entry.context ? JSON.stringify(entry.context, null, 2) : ''
      }${entry.error ? `\nError: ${entry.error.message}\n${entry.error.stack}` : ''}`;
    }
    // JSON for production
    return JSON.stringify({
      service: this.serviceName,
      ...entry
    });
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.CRITICAL: return '\x1b[35m'; // Magenta
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedLog);
        break;
    }

    // In production, send to logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // TODO: Implement integration with logging service (e.g., Datadog, CloudWatch, etc.)
    // This is a placeholder for future implementation
    try {
      // await fetch(process.env.LOGGING_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to service:', error);
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  // API route logging helpers
  async logApiRequest(method: string, path: string, context?: LogContext) {
    const requestContext = await this.getRequestContext();
    this.info(`API Request: ${method} ${path}`, {
      ...requestContext,
      ...context,
      action: 'api_request',
      method,
      path
    });
  }

  async logApiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    const requestContext = await this.getRequestContext();
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;
    
    this.log(level, `API Response: ${method} ${path} - ${statusCode}`, {
      ...requestContext,
      ...context,
      action: 'api_response',
      method,
      path,
      statusCode,
      duration
    });
  }

  // Database operation logging
  logDatabaseQuery(operation: string, table: string, duration: number, context?: LogContext) {
    this.debug(`Database Query: ${operation} on ${table}`, {
      ...context,
      action: 'database_query',
      operation,
      table,
      duration
    });
  }

  // Security event logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    const level = severity === 'critical' ? LogLevel.CRITICAL :
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN :
                  LogLevel.INFO;
    
    this.log(level, `Security Event: ${event}`, {
      ...context,
      action: 'security_event',
      event,
      severity
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext) {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      action: 'performance',
      operation,
      duration
    });
  }
}

// Create singleton instances for different services
export const apiLogger = new Logger('api');
export const dbLogger = new Logger('database');
export const authLogger = new Logger('auth');
export const paymentLogger = new Logger('payment');
export const systemLogger = new Logger('system');

// Performance timing helper
export function withTiming<T>(
  operation: string,
  logger: Logger = apiLogger
): (fn: () => T | Promise<T>) => Promise<T> {
  return async (fn: () => T | Promise<T>) => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      logger.logPerformance(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${operation} failed after ${duration}ms`, error as Error);
      throw error;
    }
  };
}