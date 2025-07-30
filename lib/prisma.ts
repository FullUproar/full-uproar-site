import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '@/lib/utils/database';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

// IMPORTANT: Store Prisma client in global scope in ALL environments
// This prevents creating multiple instances in serverless
globalForPrisma.prisma = prisma;

// Ensure the client connects on first use
export async function connectPrisma() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Disconnect on app termination
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
