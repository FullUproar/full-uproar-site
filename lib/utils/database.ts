// Database connection utilities

/**
 * Get database URL with proper connection pooling settings
 * This prevents "too many connections" errors in serverless environments
 */
export function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // If it's already a connection pool URL (contains ?pgbouncer=true or ?connection_limit)
  if (baseUrl.includes('?') && (baseUrl.includes('pgbouncer=true') || baseUrl.includes('connection_limit'))) {
    return baseUrl;
  }

  // Add connection pooling parameters for production
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(baseUrl);
    
    // Add connection pool parameters
    url.searchParams.set('connection_limit', '1'); // Serverless best practice
    url.searchParams.set('pool_timeout', '20'); // Wait up to 20s for connection
    
    // If using Supabase or similar service with pgbouncer
    if (baseUrl.includes('supabase') || baseUrl.includes('pooler')) {
      url.searchParams.set('pgbouncer', 'true');
    }
    
    return url.toString();
  }

  return baseUrl;
}

/**
 * Clean up stale connections (for use in long-running processes)
 */
export async function cleanupConnections(prisma: any): Promise<void> {
  try {
    await prisma.$disconnect();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to cleanup connections:', error);
  }
}