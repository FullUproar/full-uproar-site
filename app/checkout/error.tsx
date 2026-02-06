'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react';
import { colors } from '@/lib/design-system';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Checkout error:', error);
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
        <AlertTriangle style={{ width: 64, height: 64, color: '#ef4444', margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: colors.creamYellow, marginBottom: '0.75rem' }}>
          Checkout Hit a Problem
        </h1>
        <p style={{ color: colors.textSecondary, marginBottom: '0.75rem' }}>
          Something went wrong during checkout. Don&apos;t worry &mdash; no charges were made.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Your cart is still saved. Try again or return to review your cart.
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
            <RefreshCw size={18} /> Retry Checkout
          </button>
          <Link href="/cart" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            color: colors.primary, padding: '0.75rem 1.5rem',
            borderRadius: '50px', fontWeight: 700, textDecoration: 'none',
            border: `2px solid ${colors.primary}`,
          }}>
            <ShoppingCart size={18} /> View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
