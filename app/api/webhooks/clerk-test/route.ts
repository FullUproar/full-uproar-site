import { NextResponse } from 'next/server';

// Ultra-simple webhook endpoint to test if Clerk is sending ANY data
export async function POST(req: Request) {
  console.log('[WEBHOOK TEST] ========================================');
  console.log('[WEBHOOK TEST] Received POST at:', new Date().toISOString());

  try {
    // Log headers
    const headers: any = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[WEBHOOK TEST] Headers:', JSON.stringify(headers, null, 2));

    // Log body
    const body = await req.text();
    console.log('[WEBHOOK TEST] Raw body:', body);

    // Try to parse as JSON
    try {
      const json = JSON.parse(body);
      console.log('[WEBHOOK TEST] Parsed JSON:', JSON.stringify(json, null, 2));
      console.log('[WEBHOOK TEST] Event type:', json.type);
      console.log('[WEBHOOK TEST] Event object:', json.object);
    } catch (e) {
      console.log('[WEBHOOK TEST] Not valid JSON');
    }

    console.log('[WEBHOOK TEST] ========================================');

    // Always return success
    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      message: 'Test webhook received'
    });

  } catch (error) {
    console.error('[WEBHOOK TEST] Error:', error);
    return NextResponse.json({
      error: 'Test webhook error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Webhook test endpoint active',
    instructions: [
      '1. Update Clerk webhook URL to: https://fulluproar.com/api/webhooks/clerk-test',
      '2. This endpoint logs everything without verification',
      '3. Check Vercel function logs to see what is received',
      '4. If nothing appears, the webhook URL in Clerk is wrong'
    ],
    timestamp: new Date().toISOString()
  });
}