# Admin API Patterns & Best Practices

## Table of Contents
1. [API Client Usage](#api-client-usage)
2. [Data Fetching Hooks](#data-fetching-hooks)
3. [Error Handling](#error-handling)
4. [Validation & Sanitization](#validation--sanitization)
5. [Loading States](#loading-states)
6. [Testing Guidelines](#testing-guidelines)

## API Client Usage

### Basic Requests

```typescript
import { api } from '@/lib/admin/utils/api-client';

// GET request
const response = await api.get<User>('/api/users/123');
if (response.success) {
  console.log(response.data); // Type-safe User object
}

// POST request
const newUser = { name: 'John', email: 'john@example.com' };
const response = await api.post<User>('/api/users', newUser);

// PUT request
const updates = { status: 'active' };
const response = await api.put<User>('/api/users/123', updates);

// DELETE request
const response = await api.delete('/api/users/123');
```

### Advanced Configuration

```typescript
// With retry logic
const response = await api.get('/api/data', {
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: true // Exponential backoff
  }
});

// With caching
const response = await api.get('/api/config', {
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    key: 'app-config'
  }
});

// With timeout
const response = await api.get('/api/slow-endpoint', {
  timeout: 10000 // 10 seconds
});

// File upload
const file = new File(['content'], 'document.pdf');
const response = await api.upload('/api/upload', file);

// Multiple file upload
const files = [file1, file2, file3];
const response = await api.upload('/api/upload-multiple', files);
```

## Data Fetching Hooks

### useApi - Basic Data Fetching

```typescript
import { useApi } from '@/lib/admin/hooks/useApi';

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, refetch } = useApi<User>(
    `/api/users/${userId}`,
    {
      cache: { ttl: 60000 },
      onSuccess: (user) => console.log('User loaded:', user),
      onError: (err) => console.error('Failed to load user:', err)
    }
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useMutation - Data Modifications

```typescript
import { useMutation } from '@/lib/admin/hooks/useApi';

function CreateUserForm() {
  const { mutate, loading, error, data } = useMutation<User>(
    '/api/users',
    {
      method: 'POST',
      invalidate: ['/api/users'], // Clear cache after success
      onSuccess: (user) => {
        toast.success(`User ${user.name} created!`);
        router.push(`/users/${user.id}`);
      }
    }
  );

  const handleSubmit = async (formData: UserFormData) => {
    const response = await mutate(formData);
    if (!response.success) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <LoadingButton loading={loading} type="submit">
        Create User
      </LoadingButton>
      {error && <ErrorAlert error={error} />}
    </form>
  );
}
```

### usePaginated - Paginated Lists

```typescript
import { usePaginated } from '@/lib/admin/hooks/useApi';

function UserList() {
  const {
    items,
    page,
    pageSize,
    total,
    hasMore,
    loading,
    error,
    nextPage,
    prevPage,
    setPage
  } = usePaginated<User>('/api/users', {
    pageSize: 20,
    initialPage: 1
  });

  return (
    <div>
      <h1>Users ({total} total)</h1>
      
      {loading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : (
        <UserTable users={items} />
      )}

      <Pagination>
        <button onClick={prevPage} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / pageSize)}</span>
        <button onClick={nextPage} disabled={!hasMore}>
          Next
        </button>
      </Pagination>
    </div>
  );
}
```

### useInfiniteScroll - Infinite Loading

```typescript
import { useInfiniteScroll } from '@/lib/admin/hooks/useApi';

function ActivityFeed() {
  const { items, loading, hasMore, loadMore } = useInfiniteScroll<Activity>(
    '/api/activities',
    { pageSize: 50 }
  );

  return (
    <InfiniteScrollContainer onReachBottom={loadMore}>
      {items.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
      {loading && <Spinner />}
      {!hasMore && <div>No more activities</div>}
    </InfiniteScrollContainer>
  );
}
```

### usePolling - Real-time Updates

```typescript
import { usePolling } from '@/lib/admin/hooks/useApi';

function SystemStatus() {
  const { data, error } = usePolling<Status>('/api/system/status', {
    interval: 5000, // Poll every 5 seconds
    enabled: true
  });

  return (
    <StatusIndicator
      status={data?.status || 'unknown'}
      lastUpdated={data?.timestamp}
    />
  );
}
```

### useSearch - Debounced Search

```typescript
import { useSearch } from '@/lib/admin/hooks/useApi';

function SearchBar() {
  const { results, loading, search, clear } = useSearch<SearchResults>(
    '/api/search',
    {
      debounce: 300,
      minLength: 2
    }
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => search(e.target.value)}
      />
      
      {loading && <InlineLoading text="Searching..." />}
      
      {results && (
        <SearchResults
          results={results}
          onClear={clear}
        />
      )}
    </div>
  );
}
```

## Error Handling

### Error Boundary Usage

```typescript
import { ErrorBoundary } from '@/app/admin/components/shared/ErrorBoundary';

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        logger.critical('Admin panel error', error, { errorInfo });
      }}
      fallback={<CustomErrorPage />}
    >
      {children}
    </ErrorBoundary>
  );
}

// For specific components
function RiskyComponent() {
  return (
    <ErrorBoundary isolate>
      <ComponentThatMightFail />
    </ErrorBoundary>
  );
}
```

### Using withErrorBoundary HOC

```typescript
import { withErrorBoundary } from '@/app/admin/components/shared/ErrorBoundary';

const SafeComponent = withErrorBoundary(DangerousComponent, {
  fallback: <div>Component failed to load</div>,
  onError: (error) => console.error('Component error:', error)
});
```

### Manual Error Handling

```typescript
import { useErrorHandler } from '@/app/admin/components/shared/ErrorBoundary';

function DataProcessor() {
  const { throwError } = useErrorHandler();

  const processData = async () => {
    try {
      const result = await complexOperation();
      return result;
    } catch (error) {
      // Throw to error boundary
      throwError(new Error('Processing failed'));
    }
  };
}
```

## Validation & Sanitization

### Input Validation

```typescript
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateCreditCard,
  validateForm
} from '@/lib/admin/utils/validation';

// Single field validation
const emailError = validateEmail('user@example.com');
if (emailError) {
  showError(emailError.message);
}

// Password validation (returns array of errors)
const passwordErrors = validatePassword('weak');
passwordErrors.forEach(error => {
  console.log(error.code, error.message);
});

// Form validation
const schema = {
  email: {
    required: true,
    custom: validateEmail
  },
  phone: {
    required: false,
    custom: (value) => validatePhone(value, false)
  },
  password: {
    required: true,
    custom: (value) => {
      const errors = validatePassword(value);
      return errors.length > 0 ? errors[0] : null;
    }
  }
};

const errors = validateForm(formData, schema);
```

### Input Sanitization

```typescript
import {
  sanitizeHtml,
  sanitizeSql,
  sanitizeUrl,
  sanitizeEmail,
  validateAndSanitize
} from '@/lib/admin/utils/validation';

// Prevent XSS
const safeHtml = sanitizeHtml(userInput);

// Prevent SQL injection
const safeSql = sanitizeSql(queryParam);

// Prevent open redirect
const safeUrl = sanitizeUrl(redirectUrl, ['example.com', 'trusted.com']);

// Combined validation and sanitization
const { value, error } = validateAndSanitize(userInput, 'email');
if (!error) {
  // Use sanitized value
  saveEmail(value);
}
```

## Loading States

### Basic Loading Components

```typescript
import {
  Spinner,
  FullPageLoading,
  InlineLoading,
  LoadingOverlay,
  LoadingButton
} from '@/app/admin/components/shared/LoadingStates';

// Full page loading
function App() {
  const { ready } = useAppInit();
  
  if (!ready) {
    return <FullPageLoading message="Initializing application..." />;
  }
  
  return <AppContent />;
}

// Overlay loading
function DataTable() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} message="Updating data..." />
      <table>...</table>
    </div>
  );
}

// Loading button
function SaveForm() {
  const [saving, setSaving] = useState(false);
  
  return (
    <LoadingButton
      loading={saving}
      loadingText="Saving..."
      onClick={handleSave}
      variant="primary"
    >
      Save Changes
    </LoadingButton>
  );
}
```

### Skeleton Loaders

```typescript
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable
} from '@/app/admin/components/shared/LoadingStates';

// Content placeholder
function UserProfileSkeleton() {
  return (
    <div>
      <Skeleton width={200} height={200} borderRadius="50%" />
      <SkeletonText lines={3} />
    </div>
  );
}

// Table placeholder
function LoadingTable() {
  return <SkeletonTable rows={10} columns={5} />;
}

// Card placeholder
function LoadingCards() {
  return (
    <div className="grid">
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
```

### Lazy Loading

```typescript
import { LazyLoad } from '@/app/admin/components/shared/LoadingStates';

function ExpensiveComponent() {
  return (
    <LazyLoad
      fallback={<SkeletonCard />}
      delay={200}
    >
      <ActualExpensiveComponent />
    </LazyLoad>
  );
}
```

## Testing Guidelines

### Testing API Calls

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '@/lib/admin/hooks/useApi';
import { api } from '@/lib/admin/utils/api-client';

jest.mock('@/lib/admin/utils/api-client');

test('should fetch user data', async () => {
  const mockUser = { id: 1, name: 'John' };
  (api.get as jest.Mock).mockResolvedValueOnce({
    success: true,
    data: mockUser
  });

  const { result } = renderHook(() => useApi('/api/users/1'));

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual(mockUser);
});
```

### Testing Validation

```typescript
import { validateEmail, sanitizeHtml } from '@/lib/admin/utils/validation';

describe('Validation', () => {
  test('validates email addresses', () => {
    expect(validateEmail('valid@email.com')).toBeNull();
    expect(validateEmail('invalid')).toEqual({
      field: 'email',
      message: 'Invalid email address'
    });
  });

  test('sanitizes HTML input', () => {
    const dirty = '<script>alert("XSS")</script>Hello';
    expect(sanitizeHtml(dirty)).toBe('Hello');
  });
});
```

### Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/app/admin/components/shared/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches and displays errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
});
```

## API Response Types

```typescript
// Standard API response
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Error structure
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Validation error
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
```

## Best Practices

1. **Always handle loading states** - Use skeletons or spinners
2. **Always handle error states** - Provide meaningful error messages
3. **Validate and sanitize all inputs** - Never trust user input
4. **Use TypeScript for type safety** - Define interfaces for all API responses
5. **Cache when appropriate** - Reduce unnecessary API calls
6. **Implement retry logic** - Handle transient failures gracefully
7. **Use error boundaries** - Prevent entire app crashes
8. **Test error scenarios** - Not just happy paths
9. **Log errors properly** - Use structured logging with context
10. **Monitor performance** - Track API response times

## Migration Guide

### From Direct Fetch to API Client

```typescript
// Before
try {
  const response = await fetch('/api/users');
  const data = await response.json();
  setUsers(data);
} catch (error) {
  console.error(error);
}

// After
const response = await api.get<User[]>('/api/users');
if (response.success) {
  setUsers(response.data);
} else {
  logger.error('Failed to fetch users', response.error);
}
```

### From useState to Data Hooks

```typescript
// Before
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

// After
const { data, loading, error } = useApi('/api/data');
```

## Troubleshooting

### Common Issues

1. **Infinite re-renders**: Check hook dependencies
2. **Stale cache**: Clear cache with `api.clearCache()`
3. **Race conditions**: Use request deduplication
4. **Memory leaks**: Components unmount before requests complete
5. **CORS errors**: Check API endpoint configuration

### Debug Mode

```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_API = true;
}

// In console
localStorage.setItem('DEBUG', 'api:*');
```