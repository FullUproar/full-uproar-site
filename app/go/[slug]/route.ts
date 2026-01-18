import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

/**
 * GET /go/[slug]
 * Redirect handler with scan tracking for QR codes and short links
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Find the redirect
    const redirect = await prisma.redirect.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    // Not found or inactive
    if (!redirect || !redirect.isActive) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Parse user agent for device info
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const referer = headersList.get('referer') || undefined;

    // Get IP address (check various headers for proxied requests)
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || undefined;

    // Parse user agent
    let device: string | undefined;
    let browser: string | undefined;
    let os: string | undefined;

    if (userAgent) {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      device = result.device.type || 'desktop'; // Default to desktop if no device type
      browser = result.browser.name || undefined;
      os = result.os.name || undefined;
    }

    // Parse UTM parameters from the request URL (if someone adds them)
    const url = new URL(request.url);
    const utmSource = url.searchParams.get('utm_source') || undefined;
    const utmMedium = url.searchParams.get('utm_medium') || undefined;
    const utmCampaign = url.searchParams.get('utm_campaign') || undefined;

    // Log the scan asynchronously (don't block the redirect)
    // Using Promise.all to run both updates in parallel
    Promise.all([
      // Create scan record
      prisma.redirectScan.create({
        data: {
          redirectId: redirect.id,
          ipAddress,
          userAgent,
          referer,
          device,
          browser,
          os,
          utmSource,
          utmMedium,
          utmCampaign,
        },
      }),
      // Update redirect stats
      prisma.redirect.update({
        where: { id: redirect.id },
        data: {
          scanCount: { increment: 1 },
          lastScannedAt: new Date(),
        },
      }),
    ]).catch((err) => {
      // Log but don't fail the redirect
      console.error('[Redirect] Failed to log scan:', err);
    });

    // Build destination URL with UTM passthrough if present
    let destination = redirect.destination;
    if (utmSource || utmMedium || utmCampaign) {
      const destUrl = new URL(destination);
      if (utmSource) destUrl.searchParams.set('utm_source', utmSource);
      if (utmMedium) destUrl.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) destUrl.searchParams.set('utm_campaign', utmCampaign);
      destination = destUrl.toString();
    }

    // Redirect with 302 (temporary) so browsers don't cache it
    // This allows us to change destinations without cache issues
    return NextResponse.redirect(destination, { status: 302 });
  } catch (error) {
    console.error('[Redirect] Error:', error);
    // On error, redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }
}
