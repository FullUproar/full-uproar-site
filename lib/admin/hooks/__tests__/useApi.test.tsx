/**
 * Tests for React hooks for data fetching
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useApi,
  useMutation,
  usePaginated,
  useInfiniteScroll,
  usePolling,
  useSearch
} from '../useApi';
import { api } from '../../utils/api-client';

// Mock the API client
jest.mock('../../utils/api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    clearCache: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useApi', () => {
  it('should fetch data on mount', async () => {
    const mockData = { id: 1, name: 'Test' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(api.get).toHaveBeenCalledWith('/api/test', expect.any(Object));
  });

  it('should handle fetch errors', async () => {
    const mockError = { code: 'ERROR', message: 'Failed' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useApi('/api/error'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should refetch data', async () => {
    const mockData1 = { id: 1, version: 1 };
    const mockData2 = { id: 1, version: 2 };

    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockData1 })
      .mockResolvedValueOnce({ success: true, data: mockData2 });

    const { result } = renderHook(() => useApi('/api/refetch'));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(mockData2);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('should mutate data locally', async () => {
    const mockData = { id: 1, name: 'Original' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useApi('/api/mutate'));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    const newData = { id: 1, name: 'Updated' };
    act(() => {
      result.current.mutate(newData);
    });

    expect(result.current.data).toEqual(newData);
  });

  it('should skip auto-fetch when disabled', () => {
    renderHook(() => useApi('/api/no-auto', { autoFetch: false }));

    expect(api.get).not.toHaveBeenCalled();
  });

  it('should call success callback', async () => {
    const mockData = { success: true };
    const onSuccess = jest.fn();

    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockData,
    });

    renderHook(() => useApi('/api/success', { onSuccess }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('should call error callback', async () => {
    const mockError = { code: 'ERROR' };
    const onError = jest.fn();

    (api.get as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    renderHook(() => useApi('/api/error', { onError }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });
});

describe('useMutation', () => {
  it('should perform POST mutation', async () => {
    const mockResponse = { id: 1, created: true };
    (api.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockResponse,
    });

    const { result } = renderHook(() => useMutation('/api/create'));

    expect(result.current.loading).toBe(false);

    let response: any;
    await act(async () => {
      response = await result.current.mutate({ name: 'New Item' });
    });

    expect(response.success).toBe(true);
    expect(result.current.data).toEqual(mockResponse);
    expect(api.post).toHaveBeenCalledWith(
      '/api/create',
      { name: 'New Item' },
      expect.any(Object)
    );
  });

  it('should perform PUT mutation', async () => {
    const mockResponse = { id: 1, updated: true };
    (api.put as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockResponse,
    });

    const { result } = renderHook(() =>
      useMutation('/api/update', { method: 'PUT' })
    );

    await act(async () => {
      await result.current.mutate({ name: 'Updated' });
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(api.put).toHaveBeenCalled();
  });

  it('should perform DELETE mutation', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: null,
    });

    const { result } = renderHook(() =>
      useMutation('/api/delete', { method: 'DELETE' })
    );

    await act(async () => {
      await result.current.mutate();
    });

    expect(api.delete).toHaveBeenCalled();
  });

  it('should invalidate cache after mutation', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { created: true },
    });

    const { result } = renderHook(() =>
      useMutation('/api/create', { invalidate: ['/api/list', '/api/summary'] })
    );

    await act(async () => {
      await result.current.mutate({});
    });

    expect(api.clearCache).toHaveBeenCalledWith('/api/list');
    expect(api.clearCache).toHaveBeenCalledWith('/api/summary');
  });

  it('should handle mutation errors', async () => {
    const mockError = { code: 'VALIDATION', message: 'Invalid data' };
    (api.post as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useMutation('/api/create'));

    let response: any;
    await act(async () => {
      response = await result.current.mutate({});
    });

    expect(response.success).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should reset mutation state', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { id: 1 },
    });

    const { result } = renderHook(() => useMutation('/api/create'));

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.data).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe('usePaginated', () => {
  const mockPage1 = {
    items: [{ id: 1 }, { id: 2 }],
    total: 5,
    hasMore: true,
  };

  const mockPage2 = {
    items: [{ id: 3 }, { id: 4 }],
    total: 5,
    hasMore: true,
  };

  const mockPage3 = {
    items: [{ id: 5 }],
    total: 5,
    hasMore: false,
  };

  it('should fetch first page', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockPage1,
    });

    const { result } = renderHook(() =>
      usePaginated('/api/paginated', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockPage1.items);
    expect(result.current.total).toBe(5);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
    expect(api.get).toHaveBeenCalledWith(
      '/api/paginated?page=1&pageSize=2',
      expect.any(Object)
    );
  });

  it('should navigate to next page', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockPage1 })
      .mockResolvedValueOnce({ success: true, data: mockPage2 });

    const { result } = renderHook(() =>
      usePaginated('/api/paginated', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.items).toEqual(mockPage1.items);
    });

    act(() => {
      result.current.nextPage();
    });

    await waitFor(() => {
      expect(result.current.items).toEqual(mockPage2.items);
    });

    expect(result.current.page).toBe(2);
  });

  it('should navigate to previous page', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockPage2 })
      .mockResolvedValueOnce({ success: true, data: mockPage1 });

    const { result } = renderHook(() =>
      usePaginated('/api/paginated', { pageSize: 2, initialPage: 2 })
    );

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });

    act(() => {
      result.current.prevPage();
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });
  });

  it('should set specific page', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockPage1 })
      .mockResolvedValueOnce({ success: true, data: mockPage3 });

    const { result } = renderHook(() =>
      usePaginated('/api/paginated', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(3);
    });

    expect(result.current.hasMore).toBe(false);
  });
});

describe('useInfiniteScroll', () => {
  const mockPage1 = {
    items: [{ id: 1 }, { id: 2 }],
    hasMore: true,
  };

  const mockPage2 = {
    items: [{ id: 3 }, { id: 4 }],
    hasMore: true,
  };

  const mockPage3 = {
    items: [{ id: 5 }],
    hasMore: false,
  };

  it('should load initial items', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockPage1,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll('/api/infinite', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockPage1.items);
    expect(result.current.hasMore).toBe(true);
  });

  it('should load more items', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockPage1 })
      .mockResolvedValueOnce({ success: true, data: mockPage2 });

    const { result } = renderHook(() =>
      useInfiniteScroll('/api/infinite', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.items).toHaveLength(4);
    expect(result.current.items).toEqual([
      ...mockPage1.items,
      ...mockPage2.items,
    ]);
  });

  it('should stop loading when no more items', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockPage1 })
      .mockResolvedValueOnce({ success: true, data: mockPage3 });

    const { result } = renderHook(() =>
      useInfiniteScroll('/api/infinite', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.hasMore).toBe(true);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);

    // Try loading more (should not make another request)
    await act(async () => {
      await result.current.loadMore();
    });

    expect(api.get).toHaveBeenCalledTimes(2); // Not 3
  });

  it('should reset infinite scroll', async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockPage1 })
      .mockResolvedValueOnce({ success: true, data: mockPage2 });

    const { result } = renderHook(() =>
      useInfiniteScroll('/api/infinite', { pageSize: 2 })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.items).toHaveLength(4);

    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });
});

describe('usePolling', () => {
  it('should poll data at intervals', async () => {
    const mockData1 = { count: 1 };
    const mockData2 = { count: 2 };
    const mockData3 = { count: 3 };

    (api.get as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: mockData1 })
      .mockResolvedValueOnce({ success: true, data: mockData2 })
      .mockResolvedValueOnce({ success: true, data: mockData3 });

    const { result } = renderHook(() =>
      usePolling('/api/poll', { interval: 1000 })
    );

    // Initial fetch
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Advance timer for first interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    // Advance timer for second interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData3);
    });

    expect(api.get).toHaveBeenCalledTimes(3);
  });

  it('should stop polling when disabled', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      success: true,
      data: { value: 1 },
    });

    const { result, rerender } = renderHook(
      ({ enabled }) => usePolling('/api/poll', { interval: 1000, enabled }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(result.current.data).toBeTruthy();
    });

    const initialCallCount = (api.get as jest.Mock).mock.calls.length;

    // Disable polling
    rerender({ enabled: false });

    // Advance timer - should not make more calls
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(api.get).toHaveBeenCalledTimes(initialCallCount);
  });
});

describe('useSearch', () => {
  it('should search with debounce', async () => {
    const mockResults = { results: [{ id: 1, name: 'Result 1' }] };
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockResults,
    });

    const { result } = renderHook(() =>
      useSearch('/api/search', { debounce: 500, minLength: 3 })
    );

    act(() => {
      result.current.search('tes');
    });

    // Should not search yet (min length not met)
    expect(api.get).not.toHaveBeenCalled();

    act(() => {
      result.current.search('test');
    });

    // Should not search immediately (debouncing)
    expect(api.get).not.toHaveBeenCalled();

    // Advance timer past debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });

    expect(api.get).toHaveBeenCalledWith(
      '/api/search?q=test',
      expect.any(Object)
    );
  });

  it('should cancel previous search on new input', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      success: true,
      data: { results: [] },
    });

    const { result } = renderHook(() =>
      useSearch('/api/search', { debounce: 500 })
    );

    act(() => {
      result.current.search('first');
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // New search before debounce completes
    act(() => {
      result.current.search('second');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    // Should only search for "second"
    expect(api.get).toHaveBeenCalledWith(
      '/api/search?q=second',
      expect.any(Object)
    );
  });

  it('should clear search results', async () => {
    const mockResults = { results: [{ id: 1 }] };
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: mockResults,
    });

    const { result } = renderHook(() => useSearch('/api/search'));

    act(() => {
      result.current.search('test');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle search errors', async () => {
    const mockError = { code: 'SEARCH_ERROR', message: 'Search failed' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: mockError,
    });

    const { result } = renderHook(() => useSearch('/api/search'));

    act(() => {
      result.current.search('error');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    expect(result.current.results).toBeNull();
  });
});