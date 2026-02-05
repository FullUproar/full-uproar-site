/**
 * Backfill Artwork Images Script
 *
 * This script regenerates optimized image sizes (thumbnail, medium, large)
 * for all artwork that needs it.
 *
 * Usage:
 *   npx ts-node scripts/backfill-artwork-images.ts
 *   npx ts-node scripts/backfill-artwork-images.ts --webp
 *   npx ts-node scripts/backfill-artwork-images.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

// Sharp configuration
sharp.cache(false);

const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 75 },
  medium: { width: 600, height: 600, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 }
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
  size: { width: number; height: number; quality: number },
  useWebP: boolean = false
): Promise<string> {
  const metadata = await sharp(buffer).metadata();
  const hasAlpha = metadata.channels === 4;

  let processed: Buffer;
  let mimeType: string;

  if (useWebP) {
    processed = await sharp(buffer)
      .resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: size.quality,
        effort: 4,
      })
      .toBuffer();
    mimeType = 'image/webp';
  } else if (hasAlpha) {
    processed = await sharp(buffer)
      .resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();
    mimeType = 'image/png';
  } else {
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
}

function needsOptimization(artwork: any): boolean {
  if (!artwork.thumbnailUrl || !artwork.largeUrl) {
    return true;
  }
  if (
    artwork.imageUrl === artwork.thumbnailUrl &&
    artwork.imageUrl === artwork.largeUrl
  ) {
    return true;
  }
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const useWebP = args.includes('--webp');
  const dryRun = args.includes('--dry-run');

  console.log('🖼️  Artwork Image Backfill Script');
  console.log('================================');
  console.log(`WebP conversion: ${useWebP ? 'YES' : 'NO'}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
  console.log('');

  try {
    // Get all artwork
    const allArtwork = await prisma.artwork.findMany();
    const needsWork = allArtwork.filter(needsOptimization);

    console.log(`Total artwork: ${allArtwork.length}`);
    console.log(`Needs optimization: ${needsWork.length}`);
    console.log('');

    if (needsWork.length === 0) {
      console.log('✅ All artwork is already optimized!');
      return;
    }

    if (dryRun) {
      console.log('Would optimize:');
      for (const artwork of needsWork) {
        console.log(`  - ${artwork.id}: ${artwork.name}`);
      }
      return;
    }

    let processed = 0;
    let errors = 0;

    for (const artwork of needsWork) {
      console.log(`Processing: ${artwork.name} (ID: ${artwork.id})`);

      try {
        const sourceUrl = artwork.largeUrl || artwork.imageUrl;
        const buffer = await downloadImage(sourceUrl);

        if (!buffer) {
          console.log(`  ❌ Failed to download image`);
          errors++;
          continue;
        }

        const originalSize = buffer.length;
        console.log(`  📥 Downloaded: ${(originalSize / 1024).toFixed(1)} KB`);

        // Generate all sizes
        const [thumbnail, medium, large] = await Promise.all([
          optimizeImage(buffer, IMAGE_SIZES.thumbnail, useWebP),
          optimizeImage(buffer, IMAGE_SIZES.medium, useWebP),
          optimizeImage(buffer, IMAGE_SIZES.large, useWebP)
        ]);

        // Calculate sizes
        const thumbSize = Buffer.from(thumbnail.split(',')[1], 'base64').length;
        const medSize = Buffer.from(medium.split(',')[1], 'base64').length;
        const largeSize = Buffer.from(large.split(',')[1], 'base64').length;

        console.log(`  📐 Thumbnail: ${(thumbSize / 1024).toFixed(1)} KB`);
        console.log(`  📐 Medium: ${(medSize / 1024).toFixed(1)} KB`);
        console.log(`  📐 Large: ${(largeSize / 1024).toFixed(1)} KB`);

        // Update the artwork record
        await prisma.artwork.update({
          where: { id: artwork.id },
          data: {
            thumbnailUrl: thumbnail,
            imageUrl: medium,
            largeUrl: large
          }
        });

        console.log(`  ✅ Updated!`);
        processed++;
      } catch (error) {
        console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        errors++;
      }
    }

    console.log('');
    console.log('================================');
    console.log(`✅ Processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
