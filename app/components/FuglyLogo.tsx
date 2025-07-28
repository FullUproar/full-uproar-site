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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch logo artwork
    fetch('/api/artwork')
      .then(res => res.json())
      .then(data => {
        // Look for specific fugly1 logo first, then fall back to any logo
        const fuglyLogo = data.find((art: any) => 
          art.name.toLowerCase() === 'fugly1' || 
          art.name.toLowerCase().includes('fugly1')
        );
        
        const logo = fuglyLogo || data.find((art: any) => art.category === 'logo');
        
        if (logo) {
          // Use thumbnail for small sizes, medium for larger
          setLogoUrl(size <= 50 ? (logo.thumbnailUrl || logo.imageUrl) : logo.imageUrl);
        }
      })
      .catch(err => console.error('Failed to load logo:', err));
  }, [size]);

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

  if (logoUrl) {
    return (
      <div style={containerStyle} onClick={onClick} data-fugly-logo>
        <img 
          src={logoUrl} 
          alt="Full Uproar Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
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