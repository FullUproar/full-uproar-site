/**
 * Tests for the API client
 */

// Mock logger to prevent Logger singleton from starting intervals and calling fetch
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    critical: jest.fn(),
    metric: jest.fn(),
  },
}));

import { api, apiClient } from '../api-client';

// Mock fetch
global.fetch = jest.fn();

// Mock performance.now()
global.performance = {
  now: jest.fn(() => Date.now()),
} as any;

// Mock setTimeout
const originalSetTimeout = global.setTimeout;
const mockSetTimeout = jest.fn((fn, delay) => {
  if (delay === 0) {
    fn();
    return 0;
  }
  return originalSetTimeout(fn, delay);
}) as any;
global.setTimeout = mockSetTimeout;

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
  apiClient.clearCache();
});

describe('ApiClient', () => {
  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await api.get('/api/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle GET request errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Resource not found' }),
      });

      const result = await api.get('/api/notfound');

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'Not Found',
        message: 'Resource not found',
        details: {},
      });
    });

    it('should cache GET responses', async () => {
      const mockData = { id: 1, cached: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      // First request
      await api.get('/api/cached', { cacheConfig: { ttl: 5000 } });

      // Second request (should use cache)
      const result = await api.get('/api/cached', { cacheConfig: { ttl: 5000 } });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1); // Only called once due to cache
    });

    it('should deduplicate concurrent requests', async () => {
      const mockData = { id: 1 };
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockImplementation(() => promise);

      // Make concurrent requests
      const request1 = api.get('/api/concurrent');
      const request2 = api.get('/api/concurrent');

      // Resolve the fetch
      resolvePromise({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const [result1, result2] = await Promise.all([request1, request2]);

      expect(result1.data).toEqual(mockData);
      expect(result2.data).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(1); // Only one actual request
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, ...requestData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await api.post('/api/items', requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated' };
      const responseData = { id: 1, ...updateData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await api.put('/api/items/1', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const patchData = { status: 'active' };
      const responseData = { id: 1, ...patchData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await api.patch('/api/items/1', patchData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => null,
      });

      const result = await api.delete('/api/items/1');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('File upload', () => {
    it('should upload single file', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const responseData = { fileId: '123' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await api.upload('/api/upload', file);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].body).toBeInstanceOf(FormData);
      expect(fetchCall[1].method).toBe('POST');
    });

    it('should upload multiple files', async () => {
      const files = [
        new File(['content1'], 'test1.txt', { type: 'text/plain' }),
        new File(['content2'], 'test2.txt', { type: 'text/plain' }),
      ];
      const responseData = { fileIds: ['123', '456'] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await api.upload('/api/upload', files);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
    });
  });

  describe('Retry logic', () => {
    it('should retry on server errors', async () => {
      const mockData = { success: true };
      
      // First attempt: 500 error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Server error' }),
      });

      // Second attempt: success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await api.get('/api/retry', {
        retry: { attempts: 2, delay: 10 },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Invalid request' }),
      });

      const result = await api.get('/api/badrequest', {
        retry: { attempts: 3, delay: 10 },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('Bad Request');
      expect(fetch).toHaveBeenCalledTimes(1); // No retries for 4xx errors
    });

    it('should apply exponential backoff', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });
      });

      await api.get('/api/backoff', {
        retry: { attempts: 3, delay: 10, backoff: true },
      });

      expect(fetch).toHaveBeenCalledTimes(3);
      // Check setTimeout was called with exponential delays
      const setTimeoutCalls = mockSetTimeout.mock.calls;
      const delays = setTimeoutCalls.map((call: any) => call[1]);
      expect(delays).toContain(10); // First retry: 10ms
      expect(delays).toContain(20); // Second retry: 20ms (10 * 2^1)
    });
  });

  describe('Timeout handling', () => {
    it('should timeout long requests', async () => {
      const abortError = new Error('The operation was aborted');
      (abortError as any).name = 'AbortError';

      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const result = await api.get('/api/timeout', {
        timeout: 100,
        retry: { attempts: 1 },
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Response parsing', () => {
    it('should parse JSON responses', async () => {
      const mockData = { type: 'json' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await api.get('/api/json');
      expect(result.data).toEqual(mockData);
    });

    it('should parse text responses', async () => {
      const mockText = 'Plain text response';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => mockText,
        json: async () => { throw new Error('Not JSON'); },
      });

      const result = await api.get('/api/text');
      expect(result.data).toBe(mockText);
    });

    it('should handle blob responses', async () => {
      const mockBlob = new Blob(['binary content']);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        blob: async () => mockBlob,
        json: async () => { throw new Error('Not JSON'); },
      });

      const result = await api.get('/api/blob');
      expect(result.data).toBe(mockBlob);
    });
  });

  describe('Cache management', () => {
    it('should clear specific cache entry', async () => {
      const mockData = { id: 1 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      // Cache the response
      await api.get('/api/cache-test', { cacheConfig: { ttl: 5000 } });
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear cache for this endpoint
      api.clearCache('/api/cache-test');

      // Next request should fetch again
      await api.get('/api/cache-test', { cacheConfig: { ttl: 5000 } });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const mockData = { id: 1 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      // Cache multiple responses
      await api.get('/api/cache1', { cacheConfig: { ttl: 5000 } });
      await api.get('/api/cache2', { cacheConfig: { ttl: 5000 } });
      expect(fetch).toHaveBeenCalledTimes(2);

      // Clear all cache
      api.clearCache();

      // Both should fetch again
      await api.get('/api/cache1', { cacheConfig: { ttl: 5000 } });
      await api.get('/api/cache2', { cacheConfig: { ttl: 5000 } });
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should respect cache TTL', async () => {
      jest.useFakeTimers();
      
      const mockData = { id: 1 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      // Cache with 1 second TTL
      await api.get('/api/ttl-test', { cacheConfig: { ttl: 1000 } });
      expect(fetch).toHaveBeenCalledTimes(1);

      // Immediately fetch again (should use cache)
      await api.get('/api/ttl-test', { cacheConfig: { ttl: 1000 } });
      expect(fetch).toHaveBeenCalledTimes(1);

      // Advance time past TTL
      jest.advanceTimersByTime(1100);

      // Should fetch again after TTL expires
      await api.get('/api/ttl-test', { cacheConfig: { ttl: 1000 } });
      expect(fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('URL building', () => {
    it('should handle relative URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await api.get('/api/relative');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/relative$/),
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await api.get('https://external.api.com/data');
      expect(fetch).toHaveBeenCalledWith(
        'https://external.api.com/data',
        expect.any(Object)
      );
    });

    it('should handle URLs without leading slash', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await api.get('api/no-slash');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/no-slash$/),
        expect.any(Object)
      );
    });
  });
});