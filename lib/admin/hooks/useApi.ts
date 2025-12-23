/**
 * React hooks for data fetching with proper error handling, loading states, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, PaginatedResponse } from '../types';
import { api } from '../utils/api-client';
import { logger } from '../utils/logger';

interface UseApiOptions {
  cache?: {
    ttl?: number;
    key?: string;
  };
  retry?: {
    attempts?: number;
    delay?: number;
  };
  autoFetch?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

/**
 * Hook for GET requests
 */
export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint, {
        cacheConfig: options.cache,
        retry: options.retry,
      });

      if (!isMounted.current) return;

      if (response.success) {
        setData(response.data || null);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error);
        options.onError?.(response.error);
        logger.error(`Failed to fetch ${endpoint}`, response.error);
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      setError(err);
      options.onError?.(err);
      logger.error(`Error fetching ${endpoint}`, err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint, options]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    if (options.autoFetch !== false) {
      fetchData();
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  return { data, loading, error, refetch: fetchData, mutate };
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 */
interface UseMutationOptions<T> extends UseApiOptions {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  invalidate?: string[]; // Endpoints to clear cache after mutation
}

interface UseMutationState<T, D = any> {
  data: T | null;
  loading: boolean;
  error: any | null;
  mutate: (payload?: D) => Promise<ApiResponse<T>>;
  reset: () => void;
}

export function useMutation<T, D = any>(
  endpoint: string,
  options: UseMutationOptions<T> = {}
): UseMutationState<T, D> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const mutate = useCallback(async (payload?: D): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<T>;
      
      switch (options.method) {
        case 'PUT':
          response = await api.put<T>(endpoint, payload, { retry: options.retry });
          break;
        case 'PATCH':
          response = await api.patch<T>(endpoint, payload, { retry: options.retry });
          break;
        case 'DELETE':
          response = await api.delete<T>(endpoint, { retry: options.retry });
          break;
        default: // POST
          response = await api.post<T>(endpoint, payload, { retry: options.retry });
      }

      if (response.success) {
        setData(response.data || null);
        options.onSuccess?.(response.data);
        
        // Invalidate cache for specified endpoints
        options.invalidate?.forEach(ep => api.clearCache(ep));
      } else {
        setError(response.error);
        options.onError?.(response.error);
        logger.error(`Mutation failed: ${endpoint}`, response.error);
      }

      return response;
    } catch (err) {
      setError(err);
      options.onError?.(err);
      logger.error(`Mutation error: ${endpoint}`, err);
      
      return {
        success: false,
        error: {
          code: 'MUTATION_ERROR',
          message: 'Mutation failed',
          details: err as Record<string, any>,
        },
      };
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * Hook for paginated data
 */
interface UsePaginatedOptions<T> extends UseApiOptions {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginatedState<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: any | null;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => Promise<void>;
}

export function usePaginated<T>(
  endpoint: string,
  options: UsePaginatedOptions<T> = {}
): UsePaginatedState<T> {
  const [page, setPage] = useState(options.initialPage || 1);
  const [pageSize] = useState(options.pageSize || 20);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${endpoint}?page=${page}&pageSize=${pageSize}`;
      const response = await api.get<PaginatedResponse<T>>(url, {
        cacheConfig: options.cache,
        retry: options.retry,
      });

      if (!isMounted.current) return;

      if (response.success && response.data) {
        setItems(response.data.items);
        setTotal(response.data.total);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error);
        options.onError?.(response.error);
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      setError(err);
      options.onError?.(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint, page, pageSize, options]);

  const nextPage = useCallback(() => {
    if (page * pageSize < total) {
      setPage(page + 1);
    }
  }, [page, pageSize, total]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [page]);

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
    loading,
    error,
    setPage,
    nextPage,
    prevPage,
    refetch: fetchData,
  };
}

/**
 * Hook for infinite scrolling
 */
interface UseInfiniteScrollOptions<T> extends UseApiOptions {
  pageSize?: number;
}

interface UseInfiniteScrollState<T> {
  items: T[];
  loading: boolean;
  error: any | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useInfiniteScroll<T>(
  endpoint: string,
  options: UseInfiniteScrollOptions<T> = {}
): UseInfiniteScrollState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const pageSize = options.pageSize || 20;
  const isMounted = useRef(true);

  const loadMore = useCallback(async () => {
    if (!endpoint || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${endpoint}?page=${page}&pageSize=${pageSize}`;
      const response = await api.get<PaginatedResponse<T>>(url, {
        cacheConfig: options.cache,
        retry: options.retry,
      });

      if (!isMounted.current) return;

      if (response.success && response.data) {
        const newItems = response.data.items;
        setItems(prev => [...prev, ...newItems]);
        setHasMore(response.data.hasMore);
        setPage(prev => prev + 1);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error);
        options.onError?.(response.error);
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      setError(err);
      options.onError?.(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [endpoint, page, pageSize, loading, hasMore, options]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    if (options.autoFetch !== false) {
      loadMore();
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  return { items, loading, error, hasMore, loadMore, reset };
}

/**
 * Hook for polling data
 */
interface UsePollingOptions extends UseApiOptions {
  interval?: number; // Polling interval in ms
  enabled?: boolean;
}

export function usePolling<T>(
  endpoint: string,
  options: UsePollingOptions = {}
): UseApiState<T> {
  const { interval = 5000, enabled = true, ...apiOptions } = options;
  const result = useApi<T>(endpoint, { ...apiOptions, autoFetch: false });
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    result.refetch();

    // Start polling
    intervalRef.current = setInterval(() => {
      result.refetch();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, endpoint]);

  return result;
}

/**
 * Hook for debounced search
 */
interface UseSearchOptions<T> extends UseApiOptions {
  debounce?: number;
  minLength?: number;
}

export function useSearch<T>(
  baseEndpoint: string,
  options: UseSearchOptions<T> = {}
): {
  results: T | null;
  loading: boolean;
  error: any | null;
  search: (query: string) => void;
  clear: () => void;
} {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { debounce = 300, minLength = 2 } = options;

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = `${baseEndpoint}?q=${encodeURIComponent(searchQuery)}`;
      const response = await api.get<T>(endpoint, {
        cacheConfig: options.cache,
        retry: options.retry,
      });

      if (response.success) {
        setResults(response.data || null);
        options.onSuccess?.(response.data);
      } else {
        setError(response.error);
        options.onError?.(response.error);
      }
    } catch (err) {
      setError(err);
      options.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, minLength, options]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.length < minLength) {
      setResults(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery);
    }, debounce);
  }, [debounce, minLength, performSearch]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return { results, loading, error, search, clear };
}