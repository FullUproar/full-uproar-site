// Mock NextResponse before imports
const mockNextResponse = jest.fn((body, init) => ({
  body,
  status: init?.status || 200,
}));

mockNextResponse.json = jest.fn((data, init) => ({
  ...init,
  body: data,
  json: () => Promise.resolve(data),
}));

mockNextResponse.redirect = jest.fn((url, status) => ({
  url,
  status,
}));

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  noContentResponse,
  CacheHeaders,
  CorsHeaders
} from '@/lib/utils/api-response';
import { NextResponse } from 'next/server';

// Mock error handler
jest.mock('@/lib/utils/errors', () => ({
  handleApiError: jest.fn((error) => ({
    statusCode: 500,
    body: {
      code: 'INTERNAL_ERROR',
      message: typeof error === 'string' ? error : 'An error occurred',
      timestamp: new Date().toISOString(),
    },
  })),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('API Response Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successResponse', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      successResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          timestamp: expect.any(String),
        }),
        { status: 200 }
      );
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      successResponse(data, 'Operation successful');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          message: 'Operation successful',
          timestamp: expect.any(String),
        }),
        { status: 200 }
      );
    });

    it('should use custom status code', () => {
      const data = { created: true };
      successResponse(data, 'Created', 201);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          message: 'Created',
        }),
        { status: 201 }
      );
    });
  });

  describe('errorResponse', () => {
    it('should handle error and return response', () => {
      const error = new Error('Something went wrong');
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: expect.any(String),
        }),
        { status: 500 }
      );
    });

    it('should log error with request context', () => {
      const { logger } = require('@/lib/utils/logger');
      const error = new Error('Test error');
      const context = { method: 'GET', path: '/api/test' };
      
      errorResponse(error, context);

      expect(logger.error).toHaveBeenCalledWith(
        'API Error: GET /api/test',
        error,
        { statusCode: 500 }
      );
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated response with metadata', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      
      paginatedResponse(data, 1, 10, 25);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 25,
            totalPages: 3,
          },
          timestamp: expect.any(String),
        })
      );
    });

    it('should include message when provided', () => {
      const data = [{ id: 1 }];
      
      paginatedResponse(data, 1, 20, 100, 'Results found');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          message: 'Results found',
          pagination: {
            page: 1,
            pageSize: 20,
            total: 100,
            totalPages: 5,
          },
        })
      );
    });

    it('should handle empty results', () => {
      paginatedResponse([], 1, 10, 0);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
          },
        })
      );
    });
  });

  describe('noContentResponse', () => {
    it('should return 204 response', () => {
      const response = noContentResponse();
      
      expect(response).toBeDefined();
      expect(mockNextResponse).toHaveBeenCalledWith(null, { status: 204 });
    });
  });

  describe('CacheHeaders', () => {
    it('should provide no-cache headers', () => {
      expect(CacheHeaders.noCache).toEqual({
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
    });

    it('should provide public cache headers', () => {
      const headers = CacheHeaders.publicCache(3600);
      
      expect(headers).toEqual({
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      });
    });

    it('should provide private cache headers', () => {
      const headers = CacheHeaders.privateCache(1800);
      
      expect(headers).toEqual({
        'Cache-Control': 'private, max-age=1800',
      });
    });
  });

  describe('CorsHeaders', () => {
    it('should provide allow-all CORS headers', () => {
      expect(CorsHeaders.allowAll).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
    });

    it('should provide origin-specific CORS headers', () => {
      const headers = CorsHeaders.allowOrigin('https://example.com');
      
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      });
    });
  });
});