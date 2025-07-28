export interface ImageSizes {
  original: string;
  thumbnail: string;  // 100x100
  small: string;      // 300x300
  medium: string;     // 600x600
  large: string;      // 1200x1200
}

export const IMAGE_SIZES = {
  thumbnail: 100,
  small: 300,
  medium: 600,
  large: 1200
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
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const [thumbnail, small, medium, large] = await Promise.all([
    resizeImage(file, IMAGE_SIZES.thumbnail, 0.9),
    resizeImage(file, IMAGE_SIZES.small, 0.85),
    resizeImage(file, IMAGE_SIZES.medium, 0.8),
    resizeImage(file, IMAGE_SIZES.large, 0.75)
  ]);

  return {
    original,
    thumbnail,
    small,
    medium,
    large
  };
}

export function getImageForSize(artwork: any, size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'): string {
  switch (size) {
    case 'thumbnail':
      return artwork.thumbnailUrl || artwork.smallUrl || artwork.imageUrl;
    case 'small':
      return artwork.smallUrl || artwork.mediumUrl || artwork.imageUrl;
    case 'medium':
      return artwork.mediumUrl || artwork.largeUrl || artwork.imageUrl;
    case 'large':
      return artwork.largeUrl || artwork.imageUrl;
    case 'original':
    default:
      return artwork.imageUrl;
  }
}