'use client';

import { useState, useEffect } from 'react';

interface FuglyLogoProps {
  size?: number;
  fallbackText?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function FuglyLogo({ 
  size = 40, 
  fallbackText = 'FU',
  style = {},
  onClick
}: FuglyLogoProps) {
  const [logos, setLogos] = useState<{ fugly1?: any; fugly2?: any; fugly3?: any }>({});
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Fetch logo artwork
    fetch('/api/artwork')
      .then(res => res.json())
      .then(data => {
        // Find all fugly logos
        const fugly1 = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly1' || 
          art.name.toLowerCase().includes('fugly1')
        );
        const fugly2 = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly2' || 
          art.name.toLowerCase().includes('fugly2')
        );
        const fugly3 = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly3' || 
          art.name.toLowerCase().includes('fugly3')
        );
        
        setLogos({ fugly1, fugly2, fugly3 });
        
        // Set initial random logo (fugly2 or fugly3)
        const randomOptions = [fugly2, fugly3].filter(Boolean);
        if (randomOptions.length > 0) {
          const randomLogo = randomOptions[Math.floor(Math.random() * randomOptions.length)];
          setCurrentLogoUrl(size <= 50 ? (randomLogo.thumbnailUrl || randomLogo.imageUrl) : randomLogo.imageUrl);
        } else if (fugly1) {
          // Fallback to fugly1 if no fugly2/3
          setCurrentLogoUrl(size <= 50 ? (fugly1.thumbnailUrl || fugly1.imageUrl) : fugly1.imageUrl);
        }
      })
      .catch(err => console.error('Failed to load logo:', err));
  }, [size]);

  useEffect(() => {
    if (isHovered && logos.fugly1) {
      // Show fugly1 (middle finger) on hover
      setCurrentLogoUrl(size <= 50 ? (logos.fugly1.thumbnailUrl || logos.fugly1.imageUrl) : logos.fugly1.imageUrl);
    } else {
      // Show random fugly2/3 when not hovered
      const randomOptions = [logos.fugly2, logos.fugly3].filter(Boolean);
      if (randomOptions.length > 0) {
        const randomLogo = randomOptions[Math.floor(Math.random() * randomOptions.length)];
        setCurrentLogoUrl(size <= 50 ? (randomLogo.thumbnailUrl || randomLogo.imageUrl) : randomLogo.imageUrl);
      }
    }
  }, [isHovered, logos, size]);

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  const fallbackStyle: React.CSSProperties = {
    ...containerStyle,
    background: '#f97316',
    borderRadius: '50%',
    fontSize: `${size * 0.5}px`,
    fontWeight: 900,
    color: '#111827',
  };

  if (currentLogoUrl) {
    return (
      <div 
        style={containerStyle} 
        onClick={onClick} 
        data-fugly-logo
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={currentLogoUrl} 
          alt="Full Uproar Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'all 0.2s ease'
          }}
        />
      </div>
    );
  }

  // Fallback to text with orange circle if no logo found
  return (
    <div style={fallbackStyle} onClick={onClick} data-fugly-logo>
      {fallbackText}
    </div>
  );
}