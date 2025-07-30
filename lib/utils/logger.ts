// Centralized logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    // In production, you might want to send logs to a service like Datadog, LogRocket, etc.
    // For now, we'll use console methods
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(`[${timestamp}] DEBUG:`, message, context || '');
        }
        break;
      case 'info':
        console.info(`[${timestamp}] INFO:`, message, context || '');
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, context || '');
        break;
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, context || '');
        break;
    }

    // In production, send to logging service
    if (!this.isDevelopment && process.env.LOGGING_ENDPOINT) {
      // This would send logs to your logging service
      // fetch(process.env.LOGGING_ENDPOINT, { method: 'POST', body: JSON.stringify(logEntry) })
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };
    this.log('error', message, errorContext);
  }

  // API request logging
  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API Request: ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, context);
  }

  // Database query logging
  dbQuery(operation: string, table: string, duration: number, context?: LogContext) {
    this.debug(`DB Query: ${operation} on ${table} (${duration}ms)`, context);
  }

  // External service logging
  externalRequest(service: string, endpoint: string, context?: LogContext) {
    this.info(`External Request: ${service} - ${endpoint}`, context);
  }

  externalResponse(service: string, endpoint: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `External Response: ${service} - ${endpoint} - ${statusCode} (${duration}ms)`, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Performance tracking utility
export class PerformanceTracker {
  private startTime: number;
  
  constructor(private operation: string) {
    this.startTime = Date.now();
  }

  end(context?: LogContext) {
    const duration = Date.now() - this.startTime;
    logger.debug(`Performance: ${this.operation} completed in ${duration}ms`, context);
    return duration;
  }
}

// Request tracking middleware helper
export function trackApiRequest(request: Request) {
  const start = Date.now();
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;

  logger.apiRequest(method, path, {
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(request.headers)
  });

  return {
    logResponse: (statusCode: number, context?: LogContext) => {
      const duration = Date.now() - start;
      logger.apiResponse(method, path, statusCode, duration, context);
    }
  };
}