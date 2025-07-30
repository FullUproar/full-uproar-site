import { NextRequest, NextResponse } from 'next/server';
import { PrintifyClient } from '@/lib/printify/client';

export async function GET() {
  try {
    const client = new PrintifyClient();
    await client.initialize();
    
    const debug: any = {
      timestamp: new Date().toISOString(),
      steps: []
    };
    
    // Step 1: Get shops
    try {
      debug.steps.push({ step: 'Fetching shops...' });
      const shops = await client.getShops();
      debug.shops = shops;
      debug.steps.push({ step: 'Shops fetched', count: shops?.length || 0 });
    } catch (error) {
      debug.steps.push({ step: 'Error fetching shops', error: String(error) });
    }
    
    // Step 2: Get products with detailed info
    try {
      debug.steps.push({ step: 'Fetching products...' });
      const response = await client.getProducts(10, 1); // Just get 10 for testing
      debug.productsResponse = {
        data: response.data?.length || 0,
        total: response.total,
        current_page: response.current_page,
        last_page: response.last_page,
        raw: response
      };
      debug.steps.push({ step: 'Products fetched', count: response.data?.length || 0 });
    } catch (error) {
      debug.steps.push({ step: 'Error fetching products', error: String(error) });
    }
    
    return NextResponse.json(debug);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}