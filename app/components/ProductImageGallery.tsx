'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductImage {
  id?: number;
  imageUrl: string;
  alt?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  primaryImageUrl?: string | null;
  productName: string;
}

export default function ProductImageGallery({ images, primaryImageUrl, productName }: ProductImageGalleryProps) {
  // Combine primary image with additional images
  const allImages: ProductImage[] = [];
  
  // Add primary image first if it exists
  if (primaryImageUrl) {
    allImages.push({
      imageUrl: primaryImageUrl,
      alt: productName,
      isPrimary: true,
      sortOrder: -1
    });
  }
  
  // Add other images
  allImages.push(...images.filter(img => img.imageUrl !== primaryImageUrl));
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  if (allImages.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        background: '#374151',
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '4rem',
        color: '#6b7280'
      }}>
        🎮
      </div>
    );
  }
  
  const currentImage = allImages[selectedIndex];
  
  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  
  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % allImages.length);
  };
  
  return (
    <>
      <div style={{ position: 'relative' }}>
        {/* Main Image Display */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          background: '#1f2937',
          borderRadius: '1rem',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => setShowModal(true)}
        >
          <img
            src={currentImage.imageUrl}
            alt={currentImage.alt || productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
          
          {/* Zoom indicator */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <ZoomIn size={16} /> Click to zoom
          </div>
          
          {/* Navigation Arrows - only show if multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '3rem',
                  height: '3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                }}
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '3rem',
                  height: '3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        {/* Thumbnail Strip - only show if multiple images */}
        {allImages.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            overflowX: 'auto',
            padding: '0.5rem 0'
          }}>
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                style={{
                  minWidth: '80px',
                  height: '80px',
                  border: selectedIndex === index ? '3px solid #FF8200' : '3px solid transparent',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#374151',
                  padding: 0,
                  transition: 'all 0.3s'
                }}
              >
                <img
                  src={image.imageUrl}
                  alt={image.alt || `${productName} ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Fullscreen Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowModal(false)}
        >
          <img
            src={currentImage.imageUrl}
            alt={currentImage.alt || productName}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain'
            }}
          />
          
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
          
          {/* Modal Navigation - only show if multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                style={{
                  position: 'absolute',
                  left: '2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={32} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                style={{
                  position: 'absolute',
                  right: '2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}