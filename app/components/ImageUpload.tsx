'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export default function ImageUpload({ onImageUploaded, currentImageUrl, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
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

    // Validate file size (1MB for better performance with base64)
    if (file.size > 1 * 1024 * 1024) {
      setError('File size must be less than 1MB for best performance');
      return;
    }

    setError(null);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 data URL (works on Vercel without file storage)
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onImageUploaded(dataUrl);
        setError(null);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to process image. Please try again.');
        setPreview(currentImageUrl || null);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
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
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
            <p style={styles.uploadText}>
              Click to upload an image
              <br />
              <span style={{ fontSize: '0.75rem' }}>JPEG, PNG, GIF, WebP • Max 1MB for best performance</span>
            </p>
          </div>
        )}
        
        {isUploading && (
          <p style={styles.success}>Uploading...</p>
        )}
      </div>

      {error && (
        <p style={styles.error}>{error}</p>
      )}
    </div>
  );
}