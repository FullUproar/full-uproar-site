import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test 1: Check authentication
    try {
      const session = await getSession();
      if (session?.user) {
        results.tests.auth = {
          status: 'PASS',
          userId: session.user.id,
          email: session.user.email
        };
      } else {
        results.tests.auth = 'No user authenticated';
      }
    } catch (e: any) {
      results.tests.auth = `FAIL: ${e.message}`;
    }

    // Test 2: Check database user
    if (results.tests.auth?.userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: results.tests.auth.userId }
        });

        if (dbUser) {
          results.tests.dbUser = {
            status: 'PASS',
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role
          };
        } else {
          results.tests.dbUser = 'User not found in database';

          // Try to find by email
          const session = await getSession();
          if (session?.user?.email) {
            const userByEmail = await prisma.user.findUnique({
              where: { email: session.user.email }
            });

            if (userByEmail) {
              results.tests.dbUserByEmail = {
                found: true,
                id: userByEmail.id,
                role: userByEmail.role,
                needsIdUpdate: userByEmail.id !== session.user.id
              };
            }
          }
        }
      } catch (e: any) {
        results.tests.dbUser = `FAIL: ${e.message}`;
      }
    }

    // Test 3: Check permission function
    try {
      const { checkPermission } = await import('@/lib/auth');
      const hasPermission = await checkPermission('products', 'read');
      results.tests.permission = {
        products_read: hasPermission
      };
    } catch (e: any) {
      results.tests.permission = `FAIL: ${e.message}`;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      ...results,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
