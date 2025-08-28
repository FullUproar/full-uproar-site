/**
 * Robust API client with error handling, retries, caching, and monitoring
 */

import { ApiResponse, ApiError } from '../types';
import { logger } from './logger';

interface RequestConfig extends RequestInit {
  retry?: {
    attempts?: number;
    delay?: number;
    backoff?: boolean;
  };
  timeout?: number;
  cacheConfig?: {
    ttl?: number; // Time to live in ms
    key?: string;
  };
  skipAuth?: boolean;
}

interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
}

class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  private cache: Map<string, CachedResponse> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestId = 0;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Clear expired cache entries every minute
    setInterval(() => this.clearExpiredCache(), 60000);
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file(s)
   */
  async upload<T>(endpoint: string, files: File | File[], config?: RequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    } else {
      formData.append('file', files);
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        ...config?.headers,
        // Don't set Content-Type, let browser set it with boundary for multipart
      },
    });
  }

  /**
   * Download file
   */
  async download(endpoint: string, filename?: string, config?: RequestConfig): Promise<void> {
    const response = await this.rawRequest(endpoint, { ...config, method: 'GET' });
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || this.getFilenameFromResponse(response) || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Clear cache for specific endpoint or all
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      const cacheKey = this.getCacheKey(endpoint);
      this.cache.delete(cacheKey);
      logger.debug(`Cache cleared for: ${endpoint}`);
    } else {
      this.cache.clear();
      logger.debug('All cache cleared');
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async request<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const requestId = `req_${++this.requestId}`;
    const method = config?.method || 'GET';
    const url = this.buildUrl(endpoint);
    
    // Check cache for GET requests
    if (method === 'GET' && config?.cacheConfig) {
      const cached = this.getFromCache(endpoint);
      if (cached) {
        logger.debug(`Cache hit for: ${endpoint}`, { requestId });
        return { success: true, data: cached };
      }
    }

    // Deduplicate concurrent requests
    const requestKey = `${method}:${endpoint}`;
    if (this.pendingRequests.has(requestKey)) {
      logger.debug(`Deduplicating request: ${endpoint}`, { requestId });
      return this.pendingRequests.get(requestKey);
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(url, config, requestId);
    
    // Store as pending
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Cache successful GET responses
      if (method === 'GET' && result.success && config?.cacheConfig) {
        this.saveToCache(endpoint, result.data, config.cacheConfig.ttl);
      }
      
      return result;
    } finally {
      // Remove from pending
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeRequest<T>(
    url: string,
    config?: RequestConfig,
    requestId?: string
  ): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const retries = config?.retry?.attempts || 3;
    const retryDelay = config?.retry?.delay || 1000;
    const timeout = config?.timeout || 30000;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`API Request: ${url}`, { 
          method: config?.method,
          attempt,
          requestId 
        });

        const response = await this.fetchWithTimeout(url, {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': requestId || '',
            ...config?.headers,
          },
        }, timeout);

        const duration = performance.now() - startTime;
        
        // Log metrics
        logger.metric('api.request.duration', duration, 'ms', {
          endpoint: url,
          method: config?.method || 'GET',
          status: response.status.toString(),
        });

        // Handle response
        if (response.ok) {
          const data = await this.parseResponse<T>(response);
          
          logger.info(`API Success: ${url}`, {
            duration,
            status: response.status,
            requestId,
          });
          
          return {
            success: true,
            data,
            metadata: {
              timestamp: new Date().toISOString(),
              requestId: requestId || '',
              version: response.headers.get('X-API-Version') || '1.0',
            },
          };
        } else {
          // Handle error response
          const error = await this.parseErrorResponse(response);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            logger.warn(`API Client Error: ${url}`, {
              status: response.status,
              error,
              requestId,
            });
            
            return {
              success: false,
              error,
              metadata: {
                timestamp: new Date().toISOString(),
                requestId: requestId || '',
                version: response.headers.get('X-API-Version') || '1.0',
              },
            };
          }
          
          // Server error - will retry
          lastError = new Error(error.message);
        }
      } catch (error: any) {
        lastError = error;
        
        logger.error(`API Request Failed: ${url}`, error, {
          attempt,
          requestId,
        });
        
        // Don't retry on network errors in last attempt
        if (attempt === retries) {
          break;
        }
      }

      // Wait before retry with exponential backoff
      if (attempt < retries) {
        const delay = config?.retry?.backoff 
          ? retryDelay * Math.pow(2, attempt - 1)
          : retryDelay;
        
        logger.debug(`Retrying request in ${delay}ms...`, { requestId });
        await this.sleep(delay);
      }
    }

    // All attempts failed
    const duration = performance.now() - startTime;
    
    logger.error(`API Request Failed After Retries: ${url}`, lastError, {
      retries,
      duration,
      requestId,
    });
    
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: lastError?.message || 'Request failed',
        details: {
          url,
          attempts: retries,
          duration,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: requestId || '',
        version: '1.0',
      },
    };
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async rawRequest(endpoint: string, config?: RequestConfig): Promise<Response> {
    const url = this.buildUrl(endpoint);
    return fetch(url, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });
  }

  private buildUrl(endpoint: string): string {
    // Handle absolute URLs
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${path}`;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text() as any;
    } else {
      return response.blob() as any;
    }
  }

  private async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        return {
          code: error.code || response.statusText,
          message: error.message || error.error || response.statusText,
          details: error.details || {},
        };
      } else {
        const text = await response.text();
        return {
          code: response.statusText,
          message: text || response.statusText,
          details: {},
        };
      }
    } catch {
      return {
        code: 'PARSE_ERROR',
        message: 'Failed to parse error response',
        details: { status: response.status },
      };
    }
  }

  private getFilenameFromResponse(response: Response): string | null {
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const match = /filename="(.+)"/.exec(disposition);
      return match ? match[1] : null;
    }
    return null;
  }

  private getCacheKey(endpoint: string): string {
    return `cache_${endpoint}`;
  }

  private getFromCache(endpoint: string): any | null {
    const cacheKey = this.getCacheKey(endpoint);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  private saveToCache(endpoint: string, data: any, ttl: number = 5 * 60 * 1000): void {
    const cacheKey = this.getCacheKey(endpoint);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        expired.push(key);
      }
    });
    
    expired.forEach(key => this.cache.delete(key));
    
    if (expired.length > 0) {
      logger.debug(`Cleared ${expired.length} expired cache entries`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export convenience functions
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) => apiClient.get<T>(endpoint, config),
  post: <T>(endpoint: string, data?: any, config?: RequestConfig) => apiClient.post<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: any, config?: RequestConfig) => apiClient.put<T>(endpoint, data, config),
  patch: <T>(endpoint: string, data?: any, config?: RequestConfig) => apiClient.patch<T>(endpoint, data, config),
  delete: <T>(endpoint: string, config?: RequestConfig) => apiClient.delete<T>(endpoint, config),
  upload: <T>(endpoint: string, files: File | File[], config?: RequestConfig) => apiClient.upload<T>(endpoint, files, config),
  download: (endpoint: string, filename?: string, config?: RequestConfig) => apiClient.download(endpoint, filename, config),
  clearCache: (endpoint?: string) => apiClient.clearCache(endpoint),
};

export default apiClient;