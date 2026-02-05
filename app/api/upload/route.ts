import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * POST /api/upload
 *
 * Uploads and optimizes images, generating multiple sizes.
 *
 * ⚠️ AI MAINTAINER NOTE:
 * This endpoint generates 3 image sizes:
 * - thumbnail: 150x150 (for lists, grids)
 * - medium: 600x600 (main display)
 * - large: 1200x1200 (hero, lightbox)
 *
 * Query params:
 * - webp=true: Convert to WebP format (~30% smaller files)
 *
 * Returns:
 * - imageUrl: medium size (default display)
 * - thumbnailUrl: small size
 * - largeUrl: large size
 * - format: 'webp' | 'png' | 'jpeg'
 */

// Configure sharp for Vercel
sharp.cache(false);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useWebP = searchParams.get('webp') === 'true';

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }

    // Get the image buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create resized versions
    const sizes = {
      thumbnail: { width: 150, height: 150, quality: 75 },
      medium: { width: 600, height: 600, quality: 80 },
      large: { width: 1200, height: 1200, quality: 85 }
    };

    const resizedImages: Record<string, string> = {};
    let outputFormat = 'jpeg';

    // Check if image has transparency
    const metadata = await sharp(buffer).metadata();
    const hasAlpha = metadata.channels === 4 || file.type === 'image/png';

    // Process each size
    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      try {
        let resized: Buffer;
        let mimeType: string;

        if (useWebP) {
          // WebP supports transparency and better compression
          resized = await sharp(buffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({
              quality: dimensions.quality,
              effort: 4 // Balance speed and compression
            })
            .toBuffer();
          mimeType = 'image/webp';
          outputFormat = 'webp';
        } else if (hasAlpha) {
          // Preserve transparency with PNG
          resized = await sharp(buffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .withMetadata({ density: 72 })
            .png({ quality: 90, compressionLevel: 9 })
            .toBuffer();
          mimeType = 'image/png';
          outputFormat = 'png';
        } else {
          // Use JPEG for non-transparent images
          resized = await sharp(buffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .withMetadata({ density: 72 })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          mimeType = 'image/jpeg';
          outputFormat = 'jpeg';
        }

        // Convert to base64 data URL
        const base64 = resized.toString('base64');
        resizedImages[sizeName] = `data:${mimeType};base64,${base64}`;
      } catch (err) {
        console.error(`Error resizing ${sizeName}:`, err);
        // Fall back to original
        const base64 = buffer.toString('base64');
        resizedImages[sizeName] = `data:${file.type};base64,${base64}`;
      }
    }

    // Create a unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;

    return NextResponse.json({
      message: 'Upload successful',
      imageUrl: resizedImages.medium,
      thumbnailUrl: resizedImages.thumbnail,
      largeUrl: resizedImages.large,
      filename: filename,
      size: file.size,
      type: file.type,
      format: outputFormat,
      webp: useWebP
    });

  } catch (error) {
    console.error('Upload error:', error);

    // If sharp fails, fall back to simple base64
    try {
      const data = await request.formData();
      const file: File | null = data.get('file') as unknown as File;

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return NextResponse.json({
          message: 'Upload successful (without resizing)',
          imageUrl: dataUrl,
          thumbnailUrl: dataUrl,
          largeUrl: dataUrl,
          filename: `${Date.now()}-${file.name}`,
          warning: 'Image resizing failed, using original size'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
