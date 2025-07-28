export interface ImageSizes {
  thumbnail: string;  // 100x100
  medium: string;     // 600x600 - main display size
  large: string;      // 1200x1200
}

export const IMAGE_SIZES = {
  thumbnail: 100,
  medium: 600,
  large: 1200
} as const;

// More aggressive compression to reduce payload size
export const IMAGE_QUALITY = {
  thumbnail: 0.6,  // Small, can be lower quality
  medium: 0.7,     // Main display, balanced
  large: 0.75      // Hero images, decent quality
} as const;

export async function resizeImage(file: File, maxSize: number, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to base64
      const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function generateImageSizes(file: File): Promise<ImageSizes> {
  const [thumbnail, medium, large] = await Promise.all([
    resizeImage(file, IMAGE_SIZES.thumbnail, IMAGE_QUALITY.thumbnail),
    resizeImage(file, IMAGE_SIZES.medium, IMAGE_QUALITY.medium),
    resizeImage(file, IMAGE_SIZES.large, IMAGE_QUALITY.large)
  ]);

  return {
    thumbnail,
    medium,
    large
  };
}

export function getImageForSize(artwork: any, size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'): string {
  switch (size) {
    case 'thumbnail':
      return artwork.thumbnailUrl || artwork.imageUrl;
    case 'small':
    case 'medium':
    case 'original':
      return artwork.imageUrl; // medium is our default
    case 'large':
      return artwork.largeUrl || artwork.imageUrl;
    default:
      return artwork.imageUrl;
  }
}