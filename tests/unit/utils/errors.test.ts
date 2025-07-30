import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  handleApiError,
} from '@/lib/utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should include details if provided', () => {
      const details = { field: 'test' };
      const error = new AppError('Error', 'ERROR', 400, details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should default to 400 status code', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should format message with resource and id', () => {
      const error = new NotFoundError('User', '123');
      
      expect(error.message).toBe('User with ID 123 not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle missing id', () => {
      const error = new NotFoundError('Resource');
      
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have 401 status code', () => {
      const error = new UnauthorizedError('Not logged in');
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status code', () => {
      const error = new ForbiddenError('Access denied');
      
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new ConflictError('Duplicate entry');
      
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });
});

describe('handleApiError', () => {
  it('should handle AppError correctly', () => {
    const appError = new ValidationError('Invalid input');
    const result = handleApiError(appError);
    
    expect(result.statusCode).toBe(400);
    expect(result.body.message).toBe('Invalid input');
    expect(result.body.code).toBe('VALIDATION_ERROR');
  });

  it('should handle regular Error', () => {
    const error = new Error('Something went wrong');
    const result = handleApiError(error);
    
    expect(result.statusCode).toBe(500);
    expect(result.body.code).toBe('INTERNAL_ERROR');
  });

  it('should handle unknown error types', () => {
    const result = handleApiError('string error');
    
    expect(result.statusCode).toBe(500);
    expect(result.body.message).toBe('An unexpected error occurred');
    expect(result.body.code).toBe('UNKNOWN_ERROR');
  });

  it('should include timestamp', () => {
    const error = new Error('Test');
    const result = handleApiError(error);
    
    expect(result.body.timestamp).toBeDefined();
    expect(new Date(result.body.timestamp).getTime()).toBeCloseTo(Date.now(), -2);
  });
});