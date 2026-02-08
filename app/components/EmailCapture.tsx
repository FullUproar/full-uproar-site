'use client';

import { useState, useEffect } from 'react';
import { Zap, Check, Mail, X } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'newsletter-subscribed';

interface EmailCaptureProps {
  variant: 'inline' | 'banner' | 'compact' | 'card';
  source: string;
  heading?: string;
  subtext?: string;
  showName?: boolean;
  ctaText?: string;
  prefillEmail?: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

export default function EmailCapture({
  variant,
  source,
  heading,
  subtext,
  showName = false,
  ctaText,
  prefillEmail,
  onSuccess,
  onDismiss,
}: EmailCaptureProps) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAlreadySubscribed(localStorage.getItem(STORAGE_KEY) === 'true');
    }
  }, []);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !EMAIL_REGEX.test(email)) {
      setErrorMsg('Please enter a valid email');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, source })
      });

      if (response.ok) {
        setStatus('success');
        localStorage.setItem(STORAGE_KEY, 'true');
        setAlreadySubscribed(true);
        onSuccess?.();
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Failed to subscribe');
      setStatus('error');
    }
  };

  // Already subscribed - show minimal confirmation
  if (alreadySubscribed && variant !== 'card') {
    if (variant === 'compact') return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.875rem' }}>
        <Check size={16} />
        <span>You're on the list!</span>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: variant === 'compact' ? '0.75rem' : '1rem',
        background: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
      }}>
        <Check size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
        <span style={{ color: '#22c55e', fontWeight: 600 }}>
          You're in! Get ready for chaos in your inbox.
        </span>
      </div>
    );
  }

  const defaultHeadings: Record<string, string> = {
    inline: 'Get chaos in your inbox',
    banner: 'Never miss a drop',
    compact: 'Join the chaos crew',
    card: 'Stay in the loop',
  };

  const defaultSubtexts: Record<string, string> = {
    inline: '',
    banner: 'New game alerts, exclusive deals, and updates.',
    compact: 'Deals & new game alerts.',
    card: 'Get notified about new games, exclusive deals, and chaos-worthy updates.',
  };

  const defaultCtas: Record<string, string> = {
    inline: 'Subscribe',
    banner: 'Sign Me Up',
    compact: 'Join',
    card: 'Subscribe',
  };

  const h = heading || defaultHeadings[variant];
  const sub = subtext !== undefined ? subtext : defaultSubtexts[variant];
  const cta = ctaText || defaultCtas[variant];

  // --- INLINE variant (footer) ---
  if (variant === 'inline') {
    return (
      <div>
        <p style={{ color: '#FF8200', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          {h}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder="your@email.com"
            style={{
              flex: 1,
              padding: '0.625rem 0.75rem',
              background: '#1f2937',
              border: status === 'error' ? '1px solid #ef4444' : '1px solid #374151',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.625rem 1rem',
              background: '#FF8200',
              border: 'none',
              borderRadius: '6px',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {cta} <Zap size={14} />
          </button>
        </form>
        {status === 'error' && (
          <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{errorMsg}</p>
        )}
        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>No spam. Just chaos.</p>
      </div>
    );
  }

  // --- BANNER variant (shop pages) ---
  if (variant === 'banner') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(255, 130, 0, 0.2)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        margin: '2rem 0',
      }}>
        <Mail size={28} style={{ color: '#FF8200', marginBottom: '0.75rem' }} />
        <h3 style={{ color: '#FF8200', fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {h}
        </h3>
        {sub && (
          <p style={{ color: '#9ca3af', marginBottom: '1.25rem', fontSize: '0.95rem' }}>{sub}</p>
        )}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '0.5rem',
          maxWidth: '440px',
          margin: '0 auto',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {showName && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                flex: '1 1 140px',
                padding: '0.75rem 1rem',
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder="your@email.com"
            style={{
              flex: '1 1 200px',
              padding: '0.75rem 1rem',
              background: '#111827',
              border: status === 'error' ? '1px solid #ef4444' : '1px solid #374151',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#FF8200',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0a0a',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {cta} <Zap size={16} />
          </button>
        </form>
        {status === 'error' && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{errorMsg}</p>
        )}
      </div>
    );
  }

  // --- COMPACT variant (slide-in) ---
  if (variant === 'compact') {
    return (
      <div style={{ position: 'relative' }}>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={16} />
          </button>
        )}
        <p style={{ color: '#FF8200', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          {h}
        </p>
        {sub && (
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{sub}</p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder="your@email.com"
            style={{
              flex: 1,
              padding: '0.5rem 0.625rem',
              background: '#1f2937',
              border: status === 'error' ? '1px solid #ef4444' : '1px solid #374151',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#FF8200',
              border: 'none',
              borderRadius: '6px',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: status === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {cta}
          </button>
        </form>
        {status === 'error' && (
          <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.3rem' }}>{errorMsg}</p>
        )}
      </div>
    );
  }

  // --- CARD variant (order confirmation, standalone) ---
  return (
    <div style={{
      background: '#1f2937',
      borderRadius: '12px',
      padding: '2rem',
      border: '4px solid rgba(255, 130, 0, 0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <Mail size={24} style={{ color: '#FF8200' }} />
        <h3 style={{ color: '#FF8200', fontWeight: 900, fontSize: '1.15rem', margin: 0 }}>
          {h}
        </h3>
      </div>
      {sub && (
        <p style={{ color: '#9ca3af', marginBottom: '1.25rem', fontSize: '0.9rem' }}>{sub}</p>
      )}
      {alreadySubscribed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e' }}>
          <Check size={18} />
          <span style={{ fontWeight: 600 }}>You're already on the list!</span>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {showName && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  flex: '1 1 140px',
                  padding: '0.75rem 1rem',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="your@email.com"
              style={{
                flex: '1 1 200px',
                padding: '0.75rem 1rem',
                background: '#111827',
                border: status === 'error' ? '1px solid #ef4444' : '1px solid #374151',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#FF8200',
                border: 'none',
                borderRadius: '8px',
                color: '#0a0a0a',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: status === 'loading' ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {cta} <Zap size={16} />
            </button>
          </form>
          {status === 'error' && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{errorMsg}</p>
          )}
          <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            No spam. Unsubscribe anytime.
          </p>
        </>
      )}
    </div>
  );
}
