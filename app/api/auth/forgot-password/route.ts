import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    success: true,
    message: 'If an account exists, a reset link has been sent',
  });

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Look up user -- if not found, still return success
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return successResponse;
    }

    // Generate a random reset token with 1 hour expiry
    const token = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // Send reset email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fulluproar.com';
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

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
        subject: 'Reset your Full Uproar password',
        text: `You requested a password reset for your Full Uproar account.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
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
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Password Reset</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px 0;">
                Hey there!
              </p>
              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                You requested a password reset for your Full Uproar account. Click the button below to set a new password:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display: inline-block; background-color: #FF8200; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">
                This link expires in 1 hour.
              </p>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                If you didn't request this, you can safely ignore this email.
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
      console.warn('Email not configured - reset link:', resetLink);
    }

    return successResponse;
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to prevent email enumeration
    return successResponse;
  }
}
