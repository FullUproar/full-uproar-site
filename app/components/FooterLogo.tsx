'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * FooterLogo Component
 * ====================
 * Displays the full Fugly logo for footer sections.
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * This component was optimized to fix performance issues:
 *
 * PREVIOUS ISSUES:
 * - Made API call on EVERY page load (no caching)
 * - Used dynamic require() as fallback (bad pattern)
 * - Used regular <img> instead of Next.js Image
 *
 * CURRENT SOLUTION:
 * - Caches artwork URL in localStorage with 1-hour TTL
 * - Loads from cache immediately (instant display)
 * - Uses Next.js Image for automatic optimization
 * - Falls back to simple "FU" circle if no logo found
 *
 * If images aren't loading:
 * 1. Check localStorage key 'footer-logo-cache'
 * 2. Verify /api/artwork endpoint returns 'fuglogo' entry
 * 3. Check browser console for errors
 */

interface FooterLogoProps {
  size?: number;
  style?: React.CSSProperties;
}

interface LogoCache {
  imageUrl: string | null;
  timestamp: number;
}

const CACHE_KEY = 'footer-logo-cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCache(): LogoCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: LogoCache = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_TTL) {
      return null; // Cache expired
    }

    return data;
  } catch {
    return null;
  }
}

function setCache(imageUrl: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheData: LogoCache = {
      imageUrl,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // localStorage might be full or disabled
  }
}

export default function FooterLogo({
  size = 80,
  style = {}
}: FooterLogoProps) {
  const [mounted, setMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fetchedRef = useRef(false);

  // On mount: load from cache immediately, then fetch fresh data
  useEffect(() => {
    setMounted(true);

    // Load from cache immediately
    const cached = getCache();
    if (cached && cached.imageUrl) {
      setLogoUrl(cached.imageUrl);
    }

    // Fetch fresh data in background (but only once per mount)
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchArtwork();
    }
  }, []);

  async function fetchArtwork() {
    try {
      const res = await fetch('/api/artwork', {
        cache: 'default',
      });

      if (!res.ok) return;

      const data = await res.json();

      const fuglogo = data.find((art: any) =>
        art.name.toLowerCase() === 'fuglogo' ||
        art.name.toLowerCase().includes('fuglogo')
      );

      const url = fuglogo?.imageUrl || fuglogo?.largeUrl || null;

      // Update cache
      setCache(url);

      // Update state if we didn't have cached data
      if (!logoUrl && url) {
        setLogoUrl(url);
      }
    } catch (err) {
      console.error('Failed to fetch footer logo:', err);
    }
  }

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...style
  };

  // Before mount, show empty placeholder (no flash)
  if (!mounted) {
    return <div style={{ ...containerStyle, background: 'transparent' }} />;
  }

  // If no logo URL or image failed, show fallback
  if (!logoUrl || imageError) {
    return (
      <div
        style={{
          ...containerStyle,
          background: '#FF8200',
          borderRadius: '50%',
          fontSize: `${size * 0.3}px`,
          fontWeight: 900,
          color: '#111827',
        }}
      >
        FU
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Image
        src={logoUrl}
        alt="Full Uproar Logo"
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
        }}
        onError={() => setImageError(true)}
        unoptimized // External URLs from blob storage
      />
    </div>
  );
}
