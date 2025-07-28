'use client';

import { useState, useEffect } from 'react';
import { getImageForSize } from '@/lib/imageUtils';

interface Artwork {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  smallUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  category: string;
  tags?: string;
}

interface ArtworkDisplayProps {
  category?: string;
  tags?: string[];
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  className?: string;
  style?: React.CSSProperties;
  fallbackText?: string;
  maxItems?: number;
}

export default function ArtworkDisplay({ 
  category, 
  tags,
  size = 'medium',
  className = '', 
  style = {}, 
  fallbackText = 'FUGLY',
  maxItems = 1 
}: ArtworkDisplayProps) {
  const [artwork, setArtwork] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtwork();
  }, [category, tags]);

  const fetchArtwork = async () => {
    try {
      const response = await fetch('/api/artwork');
      const data = await response.json();
      
      let filteredArtwork = data;
      
      // Filter by category if specified
      if (category) {
        filteredArtwork = filteredArtwork.filter((art: Artwork) => 
          art.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Filter by tags if specified
      if (tags && tags.length > 0) {
        filteredArtwork = filteredArtwork.filter((art: Artwork) => {
          if (!art.tags) return false;
          const artTags = art.tags.toLowerCase().split(',').map(t => t.trim());
          return tags.some(tag => artTags.includes(tag.toLowerCase()));
        });
      }
      
      // Limit results if maxItems specified
      if (maxItems > 0) {
        filteredArtwork = filteredArtwork.slice(0, maxItems);
      }
      
      setArtwork(filteredArtwork);
    } catch (error) {
      console.error('Error fetching artwork:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#f97316', fontWeight: 'bold' }}>Loading Fugly art...</span>
      </div>
    );
  }

  if (artwork.length === 0) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: 'inherit' }}>{fallbackText}</span>
      </div>
    );
  }

  if (maxItems === 1) {
    const art = artwork[0];
    const imageUrl = getImageForSize(art, size);
    return (
      <div className={className} style={style}>
        <img 
          src={imageUrl} 
          alt={art.name} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          title={art.description || art.name}
        />
      </div>
    );
  }

  // Multiple items - return a grid or carousel
  return (
    <div className={className} style={{ ...style, display: 'grid', gap: '1rem' }}>
      {artwork.map(art => {
        const imageUrl = getImageForSize(art, size);
        return (
          <div key={art.id}>
            <img 
              src={imageUrl} 
              alt={art.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              title={art.description || art.name}
            />
          </div>
        );
      })}
    </div>
  );
}