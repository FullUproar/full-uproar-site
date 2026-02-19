import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, captchaToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate Turnstile CAPTCHA if secret key is configured
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!captchaToken) {
        return NextResponse.json(
          { error: 'CAPTCHA verification is required' },
          { status: 400 }
        );
      }

      const captchaResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: captchaToken,
          }),
        }
      );

      const captchaResult = await captchaResponse.json();
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed' },
          { status: 400 }
        );
      }
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        displayName: name || undefined,
        passwordHash,
        role: 'USER',
      },
    });

    // Generate 6-digit verification code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store verification token (10 minute expiry)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send verification email
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Full Uproar" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your Full Uproar verification code',
        text: `Your Full Uproar verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #FF8200 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Full Uproar</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Verify your email</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px 0;">
                Hey${name ? ` ${name}` : ''}!
              </p>
              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Your Full Uproar verification code is:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #FF8200; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 8px; font-family: monospace;">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                This code expires in 10 minutes.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });
    } else {
      console.warn('Email not configured - verification code:', code);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
