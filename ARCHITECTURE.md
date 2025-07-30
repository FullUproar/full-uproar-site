# Full Uproar Site Architecture

## Overview

This document outlines the architecture and engineering standards for the Full Uproar e-commerce site.

## Project Structure

```
full-uproar-site/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   └── v1/           # Versioned API endpoints
│   ├── (routes)/         # Page routes
│   └── components/       # Page-specific components
├── components/            # Shared React components
├── lib/                   # Core application logic
│   ├── api/              # API utilities and base handlers
│   ├── config/           # Configuration management
│   ├── services/         # Business logic and data access
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Key Architectural Decisions

### 1. Type Safety

- **TypeScript everywhere**: All files use TypeScript with strict mode
- **Shared type definitions**: Centralized in `lib/types/`
- **Runtime validation**: Using Zod for API request/response validation
- **No `any` types**: All data is properly typed

### 2. API Design

- **RESTful endpoints**: Following REST conventions
- **Versioned APIs**: All APIs under `/api/v1/`
- **Consistent responses**: Using `ApiResponse<T>` wrapper
- **Error handling**: Centralized error handling with proper HTTP status codes
- **Validation**: All inputs validated using Zod schemas

Example API structure:
```typescript
export const { GET, POST, PUT, DELETE } = createApiHandler({
  GET: {
    query: schema,
    handler: async ({ query }) => {
      // Implementation
    }
  }
});
```

### 3. Data Access Layer

- **Service pattern**: Business logic in service classes
- **Base service**: Common CRUD operations in `BaseService`
- **Transaction support**: Complex operations use database transactions
- **Performance tracking**: All database operations are logged with timing

### 4. Error Handling

- **Custom error classes**: Specific errors for different scenarios
- **Consistent error responses**: All errors follow the same format
- **Proper HTTP status codes**: Mapped to error types
- **Error logging**: All errors are logged with context

### 5. Logging & Monitoring

- **Structured logging**: Using custom logger with levels
- **Performance tracking**: Automatic timing for operations
- **Request tracking**: All API requests are logged
- **External service monitoring**: Track third-party API calls

### 6. Configuration

- **Centralized config**: All configuration in one place
- **Environment-based**: Different configs for dev/staging/prod
- **Type-safe**: Configuration object is fully typed
- **Runtime updates**: Support for dynamic configuration

## Code Standards

### TypeScript

```typescript
// ✅ Good
interface User {
  id: number;
  email: string;
  name: string;
}

// ❌ Bad
const user: any = { id: 1, email: 'test@example.com' };
```

### API Routes

```typescript
// ✅ Good - Using createApiHandler
export const { GET, POST } = createApiHandler({
  GET: {
    query: paginationSchema,
    handler: async ({ query }) => {
      const data = await service.findMany(query);
      return successResponse(data);
    }
  }
});

// ❌ Bad - Manual error handling
export async function GET(request: Request) {
  try {
    // Implementation
  } catch (error) {
    // Manual error handling
  }
}
```

### Services

```typescript
// ✅ Good - Extending BaseService
class GameService extends BaseService<Game, CreateGameInput, UpdateGameInput> {
  async findFeatured(limit: number): Promise<Game[]> {
    return this.findMany({
      where: { featured: true },
      take: limit
    });
  }
}

// ❌ Bad - Direct Prisma calls in routes
const games = await prisma.game.findMany({ where: { featured: true } });
```

### Error Handling

```typescript
// ✅ Good
if (!resource) {
  throw new NotFoundError('Game', id);
}

// ❌ Bad
if (!resource) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

### Validation

```typescript
// ✅ Good
const validated = await validateRequest(body, createGameSchema);

// ❌ Bad
const title = body.title as string;
const price = Number(body.price);
```

## Best Practices

1. **Always validate inputs**: Use Zod schemas for all external data
2. **Use services for business logic**: Don't put logic in API routes
3. **Handle errors properly**: Use custom error classes
4. **Log important operations**: Use the logger for debugging
5. **Track performance**: Use PerformanceTracker for slow operations
6. **Type everything**: No `any` types or type assertions
7. **Use transactions**: For operations that modify multiple tables
8. **Document complex logic**: Add comments for non-obvious code

## Common Patterns

### Creating a new API endpoint

1. Define types in `lib/types/`
2. Create validation schemas in `lib/utils/validation.ts`
3. Create/update service in `lib/services/`
4. Create API route using `createApiHandler`

### Adding a new external service

1. Create types in `lib/types/[service].ts`
2. Create client in `lib/services/[service]-client.ts`
3. Add configuration in `lib/config/`
4. Use logger for all external calls

### Handling file uploads

1. Validate file type and size
2. Use proper error handling
3. Store metadata in database
4. Log upload operations

## Security Considerations

1. **Input validation**: All inputs are validated and sanitized
2. **SQL injection**: Using Prisma parameterized queries
3. **XSS prevention**: Sanitizing user-generated content
4. **Rate limiting**: API endpoints have rate limits
5. **Authentication**: Using Clerk for secure authentication
6. **Authorization**: Checking permissions before operations

## Performance Considerations

1. **Database queries**: Use includes wisely, avoid N+1 queries
2. **Pagination**: Always paginate large datasets
3. **Caching**: Cache frequently accessed data
4. **Lazy loading**: Load data only when needed
5. **Image optimization**: Use Next.js Image component

## Deployment

1. **Environment variables**: All secrets in env vars
2. **Database migrations**: Run Prisma migrations
3. **Type checking**: Run TypeScript compiler
4. **Testing**: Run test suite before deployment
5. **Monitoring**: Set up error tracking and monitoring

## Future Improvements

1. **API documentation**: Generate OpenAPI specs
2. **Testing**: Add comprehensive test suite
3. **Caching layer**: Add Redis for performance
4. **Event system**: Implement event-driven architecture
5. **Microservices**: Split into smaller services as needed