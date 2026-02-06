'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { colors } from '@/lib/design-system';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Shop error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <AlertTriangle style={{ width: 64, height: 64, color: colors.primary, margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: colors.creamYellow, marginBottom: '0.75rem' }}>
          Shop Hit a Snag
        </h1>
        <p style={{ color: colors.textSecondary, marginBottom: '2rem' }}>
          We couldn&apos;t load the shop right now. Give it another shot.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: colors.primary, color: '#111', padding: '0.75rem 1.5rem',
              borderRadius: '50px', fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            <RefreshCw size={18} /> Try Again
          </button>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            color: colors.primary, padding: '0.75rem 1.5rem',
            borderRadius: '50px', fontWeight: 700, textDecoration: 'none',
            border: `2px solid ${colors.primary}`,
          }}>
            <Home size={18} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
