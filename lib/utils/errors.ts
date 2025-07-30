// Centralized error handling utilities

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, details);
    this.name = 'ExternalServiceError';
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): {
  statusCode: number;
  body: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
  };
} {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp
      }
    };
  }

  if (error instanceof Error) {
    // Log unexpected errors
    console.error('Unexpected error:', error);
    
    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return {
      statusCode: 500,
      body: {
        message: isDev ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: isDev ? { stack: error.stack } : undefined,
        timestamp
      }
    };
  }

  // Unknown error type
  console.error('Unknown error type:', error);
  
  return {
    statusCode: 500,
    body: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp
    }
  };
}

// Type guard for Prisma errors
export function isPrismaError(error: unknown): error is { code: string; meta?: any } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    (error as any).code.startsWith('P')
  );
}

// Convert Prisma errors to AppErrors
export function handlePrismaError(error: unknown): AppError {
  if (!isPrismaError(error)) {
    return new AppError('Database error', 'DATABASE_ERROR', 500);
  }

  switch (error.code) {
    case 'P2002':
      const field = error.meta?.target?.[0] || 'field';
      return new ConflictError(`Duplicate ${field}`, error.meta);
    
    case 'P2003':
      return new ValidationError('Foreign key constraint violation', error.meta);
    
    case 'P2025':
      return new NotFoundError('Record');
    
    default:
      return new AppError('Database operation failed', 'DATABASE_ERROR', 500, error);
  }
}