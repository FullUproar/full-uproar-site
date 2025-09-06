import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test 1: Check Clerk authentication
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        results.tests.clerkAuth = {
          status: 'PASS',
          userId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress
        };
      } else {
        results.tests.clerkAuth = 'No user authenticated';
      }
    } catch (e: any) {
      results.tests.clerkAuth = `FAIL: ${e.message}`;
    }

    // Test 2: Check database user
    if (results.tests.clerkAuth?.userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: results.tests.clerkAuth.userId }
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
          const clerkUser = await currentUser();
          if (clerkUser?.emailAddresses[0]?.emailAddress) {
            const userByEmail = await prisma.user.findUnique({
              where: { email: clerkUser.emailAddresses[0].emailAddress }
            });
            
            if (userByEmail) {
              results.tests.dbUserByEmail = {
                found: true,
                id: userByEmail.id,
                clerkId: userByEmail.clerkId,
                role: userByEmail.role,
                needsClerkIdUpdate: userByEmail.clerkId !== clerkUser.id
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