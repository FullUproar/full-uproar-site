import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth/require-admin';

/**
 * POST /api/admin/artwork/optimize
 *
 * Backfill endpoint to regenerate optimized image sizes for artwork.
 * Can process a single artwork by ID or all artwork that needs optimization.
 *
 * ⚠️ AI MAINTAINER NOTE:
 * This endpoint exists because some older artwork may only have imageUrl
 * without proper thumbnailUrl and largeUrl variants. This regenerates
 * all sizes from the original image.
 *
 * Query params:
 * - id: Optional artwork ID to optimize a single item
 * - all: If "true", optimize all artwork that needs it
 * - webp: If "true", convert to WebP format (smaller files)
 * - dryRun: If "true", just report what would be optimized
 */

// Configure for potentially long-running operations
export const runtime = 'nodejs';
export const maxDuration = 60;

// Sharp configuration
sharp.cache(false);

const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
};

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    // Handle base64 data URLs
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }

    // Handle external URLs
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FullUproar-ImageOptimizer/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

async function optimizeImage(
  buffer: Buffer,
  size: { width: number; height: number },
  useWebP: boolean = false
): Promise<string> {
  try {
    const metadata = await sharp(buffer).metadata();
    const hasAlpha = metadata.channels === 4;

    let processed: Buffer;
    let mimeType: string;

    if (useWebP) {
      // WebP supports both transparency and better compression
      processed = await sharp(buffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: size.width <= 150 ? 75 : size.width <= 600 ? 80 : 85,
          effort: 4, // Balance between speed and compression
        })
        .toBuffer();
      mimeType = 'image/webp';
    } else if (hasAlpha) {
      // Preserve transparency with PNG
      processed = await sharp(buffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer();
      mimeType = 'image/png';
    } else {
      // Use JPEG for non-transparent images
      processed = await sharp(buffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      mimeType = 'image/jpeg';
    }

    return `data:${mimeType};base64,${processed.toString('base64')}`;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

function needsOptimization(artwork: any): boolean {
  // Missing thumbnail or large
  if (!artwork.thumbnailUrl || !artwork.largeUrl) {
    return true;
  }

  // All URLs are the same (no optimization was done)
  if (
    artwork.imageUrl === artwork.thumbnailUrl &&
    artwork.imageUrl === artwork.largeUrl
  ) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';
    const useWebP = searchParams.get('webp') === 'true';
    const dryRun = searchParams.get('dryRun') === 'true';

    // Get artwork to process
    let artworkToProcess: any[] = [];

    if (id) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: parseInt(id) }
      });
      if (artwork) {
        artworkToProcess = [artwork];
      }
    } else if (all) {
      const allArtwork = await prisma.artwork.findMany();
      artworkToProcess = allArtwork.filter(needsOptimization);
    } else {
      return NextResponse.json(
        { error: 'Must specify id or all=true' },
        { status: 400 }
      );
    }

    if (artworkToProcess.length === 0) {
      return NextResponse.json({
        message: 'No artwork needs optimization',
        processed: 0
      });
    }

    // Dry run - just report what would be optimized
    if (dryRun) {
      return NextResponse.json({
        message: 'Dry run - these artwork items would be optimized',
        count: artworkToProcess.length,
        items: artworkToProcess.map(a => ({
          id: a.id,
          name: a.name,
          hasThumbnail: !!a.thumbnailUrl,
          hasLarge: !!a.largeUrl,
          allSame: a.imageUrl === a.thumbnailUrl && a.imageUrl === a.largeUrl
        }))
      });
    }

    // Process each artwork
    const results: any[] = [];
    const errors: any[] = [];

    for (const artwork of artworkToProcess) {
      try {
        // Download the original image
        const sourceUrl = artwork.largeUrl || artwork.imageUrl;
        const buffer = await downloadImage(sourceUrl);

        if (!buffer) {
          errors.push({
            id: artwork.id,
            name: artwork.name,
            error: 'Failed to download image'
          });
          continue;
        }

        // Generate all sizes
        const [thumbnail, medium, large] = await Promise.all([
          optimizeImage(buffer, IMAGE_SIZES.thumbnail, useWebP),
          optimizeImage(buffer, IMAGE_SIZES.medium, useWebP),
          optimizeImage(buffer, IMAGE_SIZES.large, useWebP)
        ]);

        // Update the artwork record
        await prisma.artwork.update({
          where: { id: artwork.id },
          data: {
            thumbnailUrl: thumbnail,
            imageUrl: medium,
            largeUrl: large
          }
        });

        results.push({
          id: artwork.id,
          name: artwork.name,
          status: 'optimized',
          format: useWebP ? 'webp' : 'auto'
        });
      } catch (error) {
        errors.push({
          id: artwork.id,
          name: artwork.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Optimized ${results.length} artwork items`,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Optimize artwork error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize artwork', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  // GET to check status / what needs optimization
  try {
    const allArtwork = await prisma.artwork.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        thumbnailUrl: true,
        largeUrl: true
      }
    });

    const needsWork = allArtwork.filter(needsOptimization);

    return NextResponse.json({
      total: allArtwork.length,
      needsOptimization: needsWork.length,
      optimized: allArtwork.length - needsWork.length,
      items: needsWork.map(a => ({
        id: a.id,
        name: a.name,
        issues: {
          noThumbnail: !a.thumbnailUrl,
          noLarge: !a.largeUrl,
          allSame: a.imageUrl === a.thumbnailUrl && a.imageUrl === a.largeUrl
        }
      }))
    });
  } catch (error) {
    console.error('Check optimization status error:', error);
    return NextResponse.json(
      { error: 'Failed to check optimization status' },
      { status: 500 }
    );
  }
}
