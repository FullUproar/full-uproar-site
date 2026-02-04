'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export default function ComingSoonBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #1f2937 0%, #0f172a 50%, #1f2937 100%)',
      borderBottom: '1px solid #374151',
      padding: '0.625rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      position: 'relative',
      zIndex: 100
    }}>
      <Sparkles size={14} color="#FF8200" />
      <span style={{
        color: '#FBDB65',
        fontSize: '0.8125rem',
        fontWeight: 500,
        letterSpacing: '0.02em'
      }}>
        We're putting the finishing touches on chaos.
        <span style={{ color: '#FF8200', fontWeight: 700, marginLeft: '0.375rem' }}>
          Game mods drop Spring 2026.
        </span>
      </span>
      <Sparkles size={14} color="#FF8200" />
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute',
          right: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
