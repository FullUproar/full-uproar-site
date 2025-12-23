import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-enhanced';

const HTML_TO_DESIGN_API = 'https://api.to.design/html';

/**
 * HTML to Design API Integration
 *
 * Converts HTML pages to Figma-compatible models using html.to.design API
 *
 * POST /api/admin/figma/html-to-design
 *
 * Body:
 * - urls: string[] - Array of URLs to convert
 * - html?: string - Raw HTML to convert (alternative to urls)
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    const apiKey = process.env.HTML_TO_DESIGN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HTML_TO_DESIGN_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { urls, html } = body;

    // If raw HTML provided, convert directly
    if (html) {
      const result = await convertHtmlToFigma(apiKey, html);
      return NextResponse.json({ success: true, results: [result] });
    }

    // If URLs provided, fetch and convert each
    if (urls && Array.isArray(urls) && urls.length > 0) {
      const results = [];
      const errors = [];

      for (const url of urls) {
        try {
          // Fetch the page HTML
          const pageHtml = await fetchPageHtml(url);

          // Convert to Figma model
          const result = await convertHtmlToFigma(apiKey, pageHtml);
          results.push({
            url,
            success: true,
            model: result.model,
            images: result.images,
          });
        } catch (error) {
          errors.push({
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: urls.length,
          converted: results.length,
          failed: errors.length,
        },
      });
    }

    return NextResponse.json(
      { error: 'Either urls array or html string is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('HTML to Design API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch HTML content from a URL
 */
async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract CSS from the page for complete styling
  // The API expects: <style>${CSS}</style>${HTML}
  return html;
}

/**
 * Convert HTML to Figma model using html.to.design API
 */
async function convertHtmlToFigma(
  apiKey: string,
  html: string
): Promise<{ model: unknown; images: unknown }> {
  const response = await fetch(HTML_TO_DESIGN_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      html,
      clip: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`html.to.design API error: ${response.status} - ${errorText}`);
  }

  const { model, images } = await response.json();
  return { model, images };
}

/**
 * GET endpoint to check API status
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    const apiKey = process.env.HTML_TO_DESIGN_API_KEY;

    return NextResponse.json({
      configured: !!apiKey,
      endpoint: HTML_TO_DESIGN_API,
      message: apiKey
        ? 'HTML to Design API is configured'
        : 'HTML_TO_DESIGN_API_KEY environment variable not set',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
