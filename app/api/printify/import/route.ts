import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrintifyClient, PrintifyProduct, PrintifyProductImage } from '@/lib/printify/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, importAll = true } = body; // Default to importing all
    
    const client = new PrintifyClient();
    await client.initialize();
    
    // Get all products or specific ones
    let productsToImport: PrintifyProduct[] = [];
    
    if (productIds && productIds.length > 0) {
      // Import specific products
      productsToImport = await Promise.all(
        productIds.map((id: string) => client.getProduct(id))
      );
    } else if (importAll) {
      // Get ALL products using pagination
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await client.getProducts(50, page);
        const products = response.data || [];
        productsToImport = [...productsToImport, ...products];
        
        // Check if there are more pages
        hasMore = products.length === 50 && productsToImport.length < (response.total || 0);
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 20) {
          console.warn('Reached pagination limit of 20 pages');
          break;
        }
      }
      
      console.log(`Fetched ${productsToImport.length} products from Printify`);
    } else {
      // Get just first page
      const response = await client.getProducts(50, 1);
      productsToImport = response.data || [];
    }
    
    const results = {
      imported: 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    };
    
    for (const product of productsToImport) {
      try {
        const merchData = client.convertToMerch(product);
        
        // Check if product already exists
        const existing = await prisma.merch.findFirst({
          where: { printifyId: product.id }
        });
        
        if (existing) {
          // Update existing product
          await prisma.merch.update({
            where: { id: existing.id },
            data: merchData
          });
          
          // Also import/update images
          if (product.images && product.images.length > 0) {
            // Clear existing images
            await prisma.merchImage.deleteMany({
              where: { merchId: existing.id }
            });
            
            // Add new images
            await Promise.all(
              product.images.slice(0, 5).map((img: PrintifyProductImage, index: number) => // Limit to 5 images
                prisma.merchImage.create({
                  data: {
                    merchId: existing.id,
                    imageUrl: img.src,
                    alt: `${product.title} - Image ${index + 1}`,
                    isPrimary: index === 0,
                    sortOrder: index
                  }
                })
              )
            );
          }
          
          results.updated++;
          results.details.push({ 
            id: product.id, 
            title: product.title, 
            action: 'updated' 
          });
        } else {
          // Create new product
          const newMerch = await prisma.merch.create({
            data: merchData
          });
          
          // Add images
          if (product.images && product.images.length > 0) {
            await Promise.all(
              product.images.slice(0, 5).map((img: any, index: number) =>
                prisma.merchImage.create({
                  data: {
                    merchId: newMerch.id,
                    imageUrl: img.src,
                    alt: `${product.title} - Image ${index + 1}`,
                    isPrimary: index === 0,
                    sortOrder: index
                  }
                })
              )
            );
          }
          
          // Create inventory records for each size
          if (merchData.sizes) {
            const sizes = JSON.parse(merchData.sizes);
            await Promise.all(
              sizes.map((size: string) =>
                prisma.inventory.create({
                  data: {
                    merchId: newMerch.id,
                    size: size,
                    quantity: 999, // POD products have unlimited inventory
                    reserved: 0
                  }
                })
              )
            );
          }
          
          results.imported++;
          results.details.push({ 
            id: product.id, 
            title: product.title, 
            action: 'imported',
            localId: newMerch.id
          });
        }
      } catch (error) {
        console.error(`Error importing product ${product.id}:`, error);
        results.errors++;
        results.details.push({ 
          id: product.id, 
          title: product.title, 
          action: 'error',
          error: String(error)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.errors} errors`,
      results
    });
  } catch (error) {
    console.error('Error importing from Printify:', error);
    return NextResponse.json({ 
      error: 'Failed to import from Printify',
      details: String(error)
    }, { status: 500 });
  }
}

// GET endpoint to preview available products
export async function GET() {
  try {
    const client = new PrintifyClient();
    await client.initialize();
    
    const response = await client.getProducts(50, 1);
    const products = response.data || [];
    
    // Return simplified product list for preview
    const simplifiedProducts = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      imageUrl: product.images[0]?.src || null,
      variantCount: product.variants?.length || 0,
      blueprint_id: product.blueprint_id
    }));
    
    return NextResponse.json({
      total: response.total || products.length,
      products: simplifiedProducts
    });
  } catch (error) {
    console.error('Error fetching Printify products:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Printify products',
      details: String(error)
    }, { status: 500 });
  }
}