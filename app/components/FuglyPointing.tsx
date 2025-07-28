'use client';

import { useState, useEffect } from 'react';

interface FuglyPointingProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function FuglyPointing({ 
  size = 80,
  style = {}
}: FuglyPointingProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch artwork for fugly-pointing
    fetch('/api/artwork')
      .then(res => res.json())
      .then(data => {
        const pointing = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly-pointing' || 
          art.name.toLowerCase().includes('pointing')
        );
        
        if (pointing) {
          setImageUrl(pointing.imageUrl || pointing.largeUrl);
        }
      })
      .catch(err => console.error('Failed to load pointing image:', err));
  }, []);

  if (!imageUrl) return null;

  return (
    <img 
      src={imageUrl} 
      alt="Fugly pointing"
      style={{
        width: `${size}px`,
        height: 'auto',
        objectFit: 'contain',
        ...style
      }}
    />
  );
}