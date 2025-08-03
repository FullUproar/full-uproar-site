import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    
    // Check if Printify is enabled
    const printifyEnabled = await prisma.settings.findUnique({
      where: { key: 'printify_enabled' }
    });
    
    const where: any = { 
      archived: { not: true }
    };
    if (category) where.category = category;
    if (featured === 'true') where.featured = true;
    
    // If Printify is disabled, exclude Printify products
    if (printifyEnabled?.value !== 'true') {
      where.isPrintify = false;
    }
    
    const merch = await prisma.merch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        inventory: true,
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ]
        }
      }
    });
    
    // Calculate total stock for each item
    const merchWithStock = merch.map(item => {
      const totalStock = item.inventory.reduce((sum, inv) => sum + (inv.quantity - inv.reserved), 0);
      return {
        ...item,
        totalStock
      };
    });
    
    return NextResponse.json(merchWithStock);
  } catch (error) {
    console.error('Error fetching merch:', error);
    return NextResponse.json({ error: 'Failed to fetch merch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse sizes if provided
    const sizes = body.sizes ? (typeof body.sizes === 'string' ? JSON.parse(body.sizes) : body.sizes) : null;
    
    const merch = await prisma.merch.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        description: body.description,
        category: body.category,
        priceCents: body.priceCents,
        imageUrl: body.imageUrl,
        sizes: sizes ? JSON.stringify(sizes) : null,
        featured: body.featured || false,
        images: body.additionalImages ? {
          create: body.additionalImages.map((img: any, index: number) => ({
            imageUrl: img.url,
            alt: img.alt || body.name,
            isPrimary: index === 0 && !body.imageUrl,
            sortOrder: index
          }))
        } : undefined
      },
      include: {
        images: true
      }
    });
    
    // Create inventory entries for each size (or one entry for non-sized items)
    if (sizes && Array.isArray(sizes)) {
      await Promise.all(
        sizes.map(size => 
          prisma.inventory.create({
            data: {
              merchId: merch.id,
              size,
              quantity: 0
            }
          })
        )
      );
    } else {
      await prisma.inventory.create({
        data: {
          merchId: merch.id,
          quantity: 0
        }
      });
    }
    
    return NextResponse.json(merch, { status: 201 });
  } catch (error) {
    console.error('Error creating merch:', error);
    return NextResponse.json({ error: 'Failed to create merch' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Merch ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const sizes = body.sizes ? (typeof body.sizes === 'string' ? JSON.parse(body.sizes) : body.sizes) : null;
    
    const merch = await prisma.merch.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: body.category,
        priceCents: body.priceCents,
        imageUrl: body.imageUrl,
        sizes: sizes ? JSON.stringify(sizes) : null,
        featured: body.featured
      }
    });
    
    // Update inventory if sizes changed
    if (sizes) {
      const existingInventory = await prisma.inventory.findMany({
        where: { merchId: parseInt(id) }
      });
      
      const existingSizes = existingInventory.map(inv => inv.size).filter(Boolean);
      const newSizes = sizes.filter((size: string) => !existingSizes.includes(size));
      
      // Add inventory for new sizes
      await Promise.all(
        newSizes.map((size: string) => 
          prisma.inventory.create({
            data: {
              merchId: parseInt(id),
              size,
              quantity: 0
            }
          })
        )
      );
    }
    
    return NextResponse.json(merch);
  } catch (error) {
    console.error('Error updating merch:', error);
    return NextResponse.json({ error: 'Failed to update merch' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Merch ID is required' }, { status: 400 });
    }
    
    // Delete inventory first
    await prisma.inventory.deleteMany({
      where: { merchId: parseInt(id) }
    });
    
    // Then delete merch
    await prisma.merch.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch:', error);
    return NextResponse.json({ error: 'Failed to delete merch' }, { status: 500 });
  }
}