import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ApiError {
  error: string;
  details?: any;
  code?: string;
  statusCode: number;
}

// Custom error classes
export class ValidationError extends Error {
  constructor(public details: any) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Error logging function
export function logError(error: any, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    error: {
      name: error.name || 'UnknownError',
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
    },
    context,
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry, LogRocket, etc.
    console.error(JSON.stringify(errorData));
  } else {
    console.error('API Error:', errorData);
  }
}

// Main error handler
export function handleApiError(error: any, context?: Record<string, any>): NextResponse<ApiError> {
  // Log the error
  logError(error, context);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.flatten(),
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // Handle custom errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.details,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'UNAUTHORIZED',
        statusCode: 403,
      },
      { status: 403 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'NOT_FOUND',
        statusCode: 404,
      },
      { status: 404 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'CONFLICT',
        statusCode: 409,
      },
      { status: 409 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'A unique constraint would be violated',
            code: 'UNIQUE_CONSTRAINT',
            statusCode: 409,
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: 'Record not found',
            code: 'NOT_FOUND',
            statusCode: 404,
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: 'Database operation failed',
            code: 'DATABASE_ERROR',
            statusCode: 500,
          },
          { status: 500 }
        );
    }
  }

  // Handle rate limit errors
  if (error.message?.includes('rate limit')) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
      },
      { status: 429 }
    );
  }

  // Generic error response for production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  // Detailed error for development
  return NextResponse.json(
    {
      error: error.message || 'An unexpected error occurred',
      details: {
        name: error.name,
        stack: error.stack,
      },
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
    { status: 500 }
  );
}

// Async wrapper for API routes
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  }) as T;
}