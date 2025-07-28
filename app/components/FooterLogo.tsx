'use client';

import { useState, useEffect } from 'react';

interface FooterLogoProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function FooterLogo({ 
  size = 80,
  style = {}
}: FooterLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch fuglogo artwork
    fetch('/api/artwork')
      .then(res => res.json())
      .then(data => {
        const fuglogo = data.find((art: any) => 
          art.name.toLowerCase() === 'fuglogo' || 
          art.name.toLowerCase().includes('fuglogo')
        );
        
        if (fuglogo) {
          setLogoUrl(fuglogo.imageUrl || fuglogo.largeUrl);
        }
      })
      .catch(err => console.error('Failed to load footer logo:', err));
  }, []);

  if (!logoUrl) {
    // Fallback to regular FuglyLogo if no fuglogo found
    const FuglyLogo = require('./FuglyLogo').default;
    return <FuglyLogo size={size} style={style} />;
  }

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}>
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