'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface FuglyPointingProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function FuglyPointing({ 
  size = 80,
  style = {}
}: FuglyPointingProps) {
  const [pointingUrl, setPointingUrl] = useState<string | null>(null);
  const [middleFingerUrl, setMiddleFingerUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Fetch artwork for both fugly-pointing and middle finger
    fetch('/api/artwork')
      .then(res => res.json())
      .then(data => {
        const pointing = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly-pointing' || 
          art.name.toLowerCase().includes('pointing')
        );
        
        const middleFinger = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly1' || 
          art.name.toLowerCase().includes('fugly1') ||
          art.name.toLowerCase().includes('finger')
        );
        
        if (pointing) {
          setPointingUrl(pointing.imageUrl || pointing.largeUrl);
        }
        
        if (middleFinger) {
          setMiddleFingerUrl(middleFinger.imageUrl || middleFinger.largeUrl);
        }
      })
      .catch(err => console.error('Failed to load images:', err));
  }, []);

  // Determine which image to show
  const currentUrl = isHovered && middleFingerUrl ? middleFingerUrl : pointingUrl;
  
  if (!currentUrl) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        display: 'inline-block',
        position: 'relative',
        ...style
      }}
    >
      <Image
        src={currentUrl}
        alt={isHovered ? "Fugly flipping the bird" : "Fugly pointing"}
        width={size}
        height={size}
        unoptimized
        style={{
          width: `${size}px`,
          height: 'auto',
          objectFit: 'contain',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
        }}
      />
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#dc2626',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          animation: 'bounce 0.5s ease-in-out',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          FUGLY SAYS HI! 🖕
        </div>
      )}
    </div>
  );
}