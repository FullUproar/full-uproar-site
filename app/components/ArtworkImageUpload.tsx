'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { generateImageSizes, ImageSizes } from '@/lib/imageUtils';

interface ArtworkImageUploadProps {
  onImageSizesGenerated: (imageSizes: ImageSizes) => void;
  currentImageUrl?: string;
}

export default function ArtworkImageUpload({ onImageSizesGenerated, currentImageUrl }: ArtworkImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Reading original image...');

    try {
      setUploadProgress('Generating thumbnail (100x100)...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI update

      setUploadProgress('Generating small size (300x300)...');
      await new Promise(resolve => setTimeout(resolve, 100));

      setUploadProgress('Generating medium size (600x600)...');
      await new Promise(resolve => setTimeout(resolve, 100));

      setUploadProgress('Generating large size (1200x1200)...');
      await new Promise(resolve => setTimeout(resolve, 100));

      setUploadProgress('Processing all sizes...');
      const imageSizes = await generateImageSizes(file);

      setUploadProgress('Complete!');
      onImageSizesGenerated(imageSizes);

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      
      // Reset the input
      event.target.value = '';
    }
  };

  const styles = {
    container: {
      border: '2px dashed #d1d5db',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      textAlign: 'center' as const,
      background: '#f9fafb',
      transition: 'all 0.3s'
    },
    activeContainer: {
      borderColor: '#f97316',
      background: '#fff7ed'
    },
    uploadButton: {
      background: '#f97316',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '0 auto'
    },
    disabledButton: {
      background: '#9ca3af',
      cursor: 'not-allowed'
    },
    preview: {
      width: '80px',
      height: '80px',
      borderRadius: '0.5rem',
      objectFit: 'cover' as const,
      margin: '0 auto 1rem auto',
      display: 'block'
    },
    progressText: {
      color: '#f97316',
      fontWeight: 'bold',
      marginTop: '1rem',
      fontSize: '0.875rem'
    },
    helpText: {
      color: '#6b7280',
      fontSize: '0.875rem',
      marginTop: '0.5rem'
    }
  };

  return (
    <div style={{
      ...styles.container,
      ...(isUploading ? styles.activeContainer : {})
    }}>
      {currentImageUrl && !isUploading && (
        <img src={currentImageUrl} alt="Current" style={styles.preview} />
      )}
      
      {isUploading ? (
        <div>
          <Loader2 style={{ 
            height: '2rem', 
            width: '2rem', 
            margin: '0 auto 1rem auto', 
            display: 'block',
            animation: 'spin 1s linear infinite' 
          }} />
          <div style={styles.progressText}>{uploadProgress}</div>
          <div style={styles.helpText}>
            Generating multiple sizes for optimal performance...
          </div>
        </div>
      ) : (
        <>
          <ImageIcon style={{ 
            height: '2rem', 
            width: '2rem', 
            margin: '0 auto 1rem auto', 
            display: 'block',
            color: '#9ca3af'
          }} />
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="artwork-file-input"
          />
          
          <label htmlFor="artwork-file-input">
            <button 
              type="button"
              style={{
                ...styles.uploadButton,
                ...(isUploading ? styles.disabledButton : {})
              }}
              disabled={isUploading}
              onClick={() => document.getElementById('artwork-file-input')?.click()}
            >
              <Upload size={16} />
              Upload Fugly Artwork
            </button>
          </label>
          
          <div style={styles.helpText}>
            Upload any size image - we'll automatically generate:<br />
            • Thumbnail (100x100) for admin tables<br />
            • Small (300x300) for cards<br />
            • Medium (600x600) for sections<br />
            • Large (1200x1200) for backgrounds<br />
            Max 10MB • JPG, PNG, GIF, WebP
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}