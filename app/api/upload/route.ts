import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// Image size configurations
const IMAGE_SIZES = {
  favicon: { width: 32, height: 32, quality: 90 },
  thumbnail: { width: 150, height: 150, quality: 85 },
  small: { width: 300, height: 300, quality: 85 },
  medium: { width: 600, height: 600, quality: 85 },
  large: { width: 1200, height: 1200, quality: 90 },
  original: { width: null, height: null, quality: 95 }
};

async function resizeImage(buffer: Buffer, sizeName: string) {
  const config = IMAGE_SIZES[sizeName as keyof typeof IMAGE_SIZES];
  if (!config) return null;

  let sharpInstance = sharp(buffer);
  
  // Get metadata to maintain aspect ratio
  const metadata = await sharpInstance.metadata();
  
  if (config.width || config.height) {
    sharpInstance = sharpInstance.resize(config.width, config.height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  return sharpInstance
    .jpeg({ quality: config.quality, progressive: true })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
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

    // No file size limit - we'll resize as needed
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename base
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase().replace(/\.[^/.]+$/, '');
    const filenameBase = `${timestamp}-${originalName}`;

    // Check if we're in production with Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production: Use Vercel Blob Storage
      const uploadPromises = [];
      const urls: Record<string, string> = {};

      // Process each size
      for (const [sizeName, _] of Object.entries(IMAGE_SIZES)) {
        const resizedBuffer = sizeName === 'original' 
          ? buffer 
          : await resizeImage(buffer, sizeName);
          
        if (resizedBuffer) {
          const filename = `${filenameBase}-${sizeName}.jpg`;
          uploadPromises.push(
            put(filename, resizedBuffer, {
              access: 'public',
              contentType: 'image/jpeg'
            }).then(blob => {
              urls[sizeName] = blob.url;
            })
          );
        }
      }

      await Promise.all(uploadPromises);

      return NextResponse.json({ 
        message: 'Upload successful',
        imageUrl: urls.medium || urls.original, // Default display size
        thumbnailUrl: urls.thumbnail,
        largeUrl: urls.large,
        urls: urls,
        filename: filenameBase
      });

    } else {
      // Development/No Blob Storage: Use data URLs
      const urls: Record<string, string> = {};
      
      // For development, just create a few sizes as data URLs
      const sizes = ['thumbnail', 'medium', 'original'];
      
      for (const sizeName of sizes) {
        const resizedBuffer = sizeName === 'original' 
          ? buffer 
          : await resizeImage(buffer, sizeName);
          
        if (resizedBuffer) {
          const base64 = resizedBuffer.toString('base64');
          urls[sizeName] = `data:image/jpeg;base64,${base64}`;
        }
      }

      return NextResponse.json({ 
        message: 'Upload successful (temporary storage)',
        imageUrl: urls.medium || urls.original,
        thumbnailUrl: urls.thumbnail,
        largeUrl: urls.original,
        urls: urls,
        filename: filenameBase,
        warning: 'Using temporary data URL storage. For production, set BLOB_READ_WRITE_TOKEN environment variable.'
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}