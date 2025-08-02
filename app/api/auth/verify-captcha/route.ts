import { NextRequest, NextResponse } from 'next/server';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'No token provided' 
      }, { status: 400 });
    }

    if (!TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      // In development, allow bypass
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ 
        success: false,
        error: 'CAPTCHA not configured' 
      }, { status: 500 });
    }

    // Verify with Cloudflare
    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    if (ip) {
      formData.append('remoteip', ip);
    }

    const result = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData
    });

    const data = await result.json();

    return NextResponse.json({
      success: data.success,
      error: data['error-codes']?.[0]
    });
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Verification failed' 
    }, { status: 500 });
  }
}