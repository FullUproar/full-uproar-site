'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Resize image using canvas - returns a promise with the data URL
function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use better quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG for better compression (unless it's a PNG with transparency)
        const isPng = file.type === 'image/png';
        const outputType = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, quality);

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({
  onImageUploaded,
  currentImageUrl,
  className,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [resizeInfo, setResizeInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Increased limit since we'll resize - 10MB original is fine
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setResizeInfo(null);
    setIsUploading(true);

    try {
      // Resize the image
      const resizedDataUrl = await resizeImage(file, maxWidth, maxHeight, quality);

      // Calculate compression info
      const originalSizeKB = Math.round(file.size / 1024);
      const newSizeKB = Math.round((resizedDataUrl.length * 3) / 4 / 1024); // Estimate base64 decoded size

      if (originalSizeKB > newSizeKB * 1.1) {
        setResizeInfo(`Optimized: ${originalSizeKB}KB → ${newSizeKB}KB`);
      }

      setPreview(resizedDataUrl);
      onImageUploaded(resizedDataUrl);
      setIsUploading(false);
    } catch (err) {
      console.error('Image processing error:', err);
      setError('Failed to process image. Please try again.');
      setPreview(currentImageUrl || null);
      setIsUploading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '0.5rem',
      padding: '2rem',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'border-color 0.3s',
      backgroundColor: '#f9fafb'
    },
    uploadAreaHover: {
      borderColor: '#f97316',
      backgroundColor: '#fff7ed'
    },
    hiddenInput: {
      display: 'none'
    },
    uploadText: {
      color: '#6b7280',
      fontSize: '0.875rem',
      fontWeight: 600
    },
    uploadButton: {
      background: '#f97316',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '0.875rem',
      marginTop: '0.5rem'
    },
    preview: {
      width: '100%',
      maxWidth: '200px',
      height: '150px',
      objectFit: 'cover' as const,
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
    },
    error: {
      color: '#dc2626',
      fontSize: '0.875rem',
      fontWeight: 600
    },
    success: {
      color: '#059669',
      fontSize: '0.875rem',
      fontWeight: 600
    }
  };

  return (
    <div style={styles.container} className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={styles.hiddenInput}
      />
      
      <div
        style={styles.uploadArea}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div>
            <img
              src={preview}
              alt="Preview"
              style={styles.preview}
            />
            <p style={styles.uploadText}>Click to change image</p>
            {resizeInfo && (
              <p style={{ ...styles.success, marginTop: '0.5rem' }}>{resizeInfo}</p>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
            <p style={styles.uploadText}>
              Click to upload an image
              <br />
              <span style={{ fontSize: '0.75rem' }}>
                JPEG, PNG, GIF, WebP • Auto-resized to {maxWidth}px max
              </span>
            </p>
          </div>
        )}

        {isUploading && (
          <p style={styles.success}>Processing image...</p>
        )}
      </div>

      {error && (
        <p style={styles.error}>{error}</p>
      )}
    </div>
  );
}