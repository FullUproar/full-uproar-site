import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { lastUsedAt: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!user) {
      return NextResponse.json([]);
    }

    return NextResponse.json(user.addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      // Create user if doesn't exist
      const { sessionClaims } = await auth();
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: sessionClaims?.email as string || '',
          displayName: sessionClaims?.fullName as string || 'User'
        }
      });
    }

    // If this is the first address or marked as default, unset other defaults
    if (body.isDefault || (await prisma.userAddress.count({ where: { userId: user.id } })) === 0) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
      body.isDefault = true;
    }

    // Create the address
    const address = await prisma.userAddress.create({
      data: {
        userId: user.id,
        nickname: body.nickname,
        isDefault: body.isDefault || false,
        fullName: body.fullName,
        phone: body.phone,
        street: body.street,
        apartment: body.apartment,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country || 'US'
      }
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId: user.id
      }
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.userAddress.updateMany({
        where: { 
          userId: user.id,
          id: { not: addressId }
        },
        data: { isDefault: false }
      });
    }

    // Update the address
    const address = await prisma.userAddress.update({
      where: { id: addressId },
      data: body
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');
    
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify address belongs to user and delete
    await prisma.userAddress.deleteMany({
      where: {
        id: addressId,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}