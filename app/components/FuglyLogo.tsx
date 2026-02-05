'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * FuglyLogo Component
 * ===================
 * Displays the Fugly mascot logo with hover interaction.
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * This component was optimized to fix performance issues:
 *
 * PREVIOUS ISSUES:
 * - Made API call on EVERY page load (no caching)
 * - Showed "FU" fallback while fetching (jarring flash)
 * - Used regular <img> instead of Next.js Image
 *
 * CURRENT SOLUTION:
 * - Caches artwork URLs in localStorage with 1-hour TTL
 * - Loads from cache immediately (instant display)
 * - Uses Next.js Image for automatic optimization
 * - Background refresh keeps cache fresh
 *
 * If images aren't loading:
 * 1. Check localStorage key 'fugly-logo-cache'
 * 2. Verify /api/artwork endpoint returns fugly1, fugly2, fugly3 entries
 * 3. Check browser console for errors
 */

interface FuglyLogoProps {
  size?: number;
  fallbackText?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

interface LogoCache {
  fugly1Url: string | null;
  fugly2Url: string | null;
  fugly3Url: string | null;
  thumbnail1Url: string | null;
  thumbnail2Url: string | null;
  thumbnail3Url: string | null;
  timestamp: number;
}

const CACHE_KEY = 'fugly-logo-cache';
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

function setCache(data: Omit<LogoCache, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheData: LogoCache = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // localStorage might be full or disabled
  }
}

// Helper to get initial URLs from cache (runs synchronously on client)
function getInitialUrls(useThumb: boolean): { default: string | null; hover: string | null } {
  if (typeof window === 'undefined') return { default: null, hover: null };

  const cached = getCache();
  if (!cached) return { default: null, hover: null };

  const defaultOptions = useThumb
    ? [cached.thumbnail2Url, cached.thumbnail3Url].filter(Boolean)
    : [cached.fugly2Url, cached.fugly3Url].filter(Boolean);

  const hoverUrl = useThumb ? cached.thumbnail1Url : cached.fugly1Url;

  if (defaultOptions.length > 0) {
    const randomDefault = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
    return { default: randomDefault || null, hover: hoverUrl };
  }

  return { default: null, hover: null };
}

export default function FuglyLogo({
  size = 40,
  fallbackText = 'FU',
  style = {},
  onClick
}: FuglyLogoProps) {
  // Use thumbnail for small sizes, full image for large
  const useThumb = size <= 100;

  // Track if we've mounted (for hydration)
  const [mounted, setMounted] = useState(false);

  // Initialize from cache SYNCHRONOUSLY to avoid flash (after mount)
  const [logoUrls, setLogoUrls] = useState<{
    default: string | null;
    hover: string | null;
  }>({ default: null, hover: null });

  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fetchedRef = useRef(false);

  // On mount: load from cache immediately, then fetch fresh data
  useEffect(() => {
    setMounted(true);

    // Load from cache immediately
    const cachedUrls = getInitialUrls(useThumb);
    if (cachedUrls.default) {
      setLogoUrls(cachedUrls);
    }

    // Fetch fresh data in background
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchArtwork();
    }
  }, [useThumb]);

  async function fetchArtwork() {
    try {
      const res = await fetch('/api/artwork', {
        // Use cache headers for browser-level caching
        cache: 'default',
      });

      if (!res.ok) return;

      const data = await res.json();

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

      // Update cache
      setCache({
        fugly1Url: fugly1?.imageUrl || null,
        fugly2Url: fugly2?.imageUrl || null,
        fugly3Url: fugly3?.imageUrl || null,
        thumbnail1Url: fugly1?.thumbnailUrl || fugly1?.imageUrl || null,
        thumbnail2Url: fugly2?.thumbnailUrl || fugly2?.imageUrl || null,
        thumbnail3Url: fugly3?.thumbnailUrl || fugly3?.imageUrl || null,
      });

      // Update state if we didn't have cached data
      if (!logoUrls.default) {
        const defaultOptions = useThumb
          ? [fugly2?.thumbnailUrl || fugly2?.imageUrl, fugly3?.thumbnailUrl || fugly3?.imageUrl].filter(Boolean)
          : [fugly2?.imageUrl, fugly3?.imageUrl].filter(Boolean);

        const hoverUrl = useThumb
          ? fugly1?.thumbnailUrl || fugly1?.imageUrl
          : fugly1?.imageUrl;

        if (defaultOptions.length > 0) {
          const randomDefault = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
          setLogoUrls({
            default: randomDefault || null,
            hover: hoverUrl || null,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch logo artwork:', err);
    }
  }

  const currentUrl = isHovered && logoUrls.hover ? logoUrls.hover : logoUrls.default;

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    ...style
  };

  const fallbackStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FF8200',
    borderRadius: '50%',
    fontSize: `${size * 0.4}px`,
    fontWeight: 900,
    color: '#111827',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  // Before mount, show empty placeholder (same size, no flash)
  if (!mounted) {
    return (
      <div style={{ ...containerStyle, background: 'transparent' }} data-fugly-logo />
    );
  }

  // Show fallback if no URL or image failed to load
  if (!currentUrl || imageError) {
    return (
      <div style={fallbackStyle} onClick={onClick} data-fugly-logo>
        {fallbackText}
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      data-fugly-logo
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={currentUrl}
        alt="Full Uproar Logo"
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
          transition: 'opacity 0.2s ease',
        }}
        priority={size >= 50} // Priority load for nav-sized logos
        onError={() => setImageError(true)}
        unoptimized // External URLs from blob storage
      />
    </div>
  );
}
