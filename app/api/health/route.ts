import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    printify?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

async function checkDatabase(): Promise<HealthCheck['services']['database']> {
  const start = Date.now();
  try {
    // Use a simpler query that doesn't create new connections
    await prisma.$executeRaw`SELECT 1`;
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    // Don't create new connections if we're already having connection issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If it's a connection pool error, provide helpful context
    if (errorMessage.includes('too many connections')) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: 'Database connection pool exhausted. Connections will recover automatically.',
      };
    }
    
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: errorMessage,
    };
  }
}

async function checkRedis(): Promise<HealthCheck['services']['redis']> {
  // Only check if Redis is configured
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return undefined;
  }

  const start = Date.now();
  try {
    const response = await fetch(process.env.UPSTASH_REDIS_REST_URL + '/ping', {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (response.ok) {
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } else {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkPrintify(): Promise<HealthCheck['services']['printify']> {
  if (!config.get('services').printify.enabled) {
    return undefined;
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.printify.com/v1/shops.json', {
      headers: {
        Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
      },
    });

    if (response.ok) {
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } else {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  // Basic health check - just return OK
  const isBasic = request.nextUrl.searchParams.get('basic') === 'true';
  
  if (isBasic) {
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      prismaModels: Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'))
    }, { status: 200 });
  }

  // Detailed health check
  const [database, redis, printify] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkPrintify(),
  ]);

  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: config.get('app').env,
    services: {
      database,
      ...(redis && { redis }),
      ...(printify && { printify }),
    },
    system: {
      uptime: process.uptime(),
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
    },
  };

  // Determine overall status
  const serviceStatuses = Object.values(health.services).filter(Boolean);
  const downServices = serviceStatuses.filter(s => s.status === 'down');
  
  if (downServices.length > 0) {
    health.status = downServices.includes(health.services.database) ? 'unhealthy' : 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}