'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import { ArrowRight, Check } from 'lucide-react';
import { colors } from '@/lib/colors';

export default function AfterroarPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/afterroar/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'afterroar_page' })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Failed to connect. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      position: 'relative'
    }}>
      <Navigation />

      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '8rem 1.5rem 4rem',
        textAlign: 'center'
      }}>
        {/* Word */}
        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.1,
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          After<span style={{ color: colors.creamYellow }}>roar</span>
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          fontStyle: 'italic',
          marginBottom: '2.5rem'
        }}>
          /&#8201;af&middot;ter&middot;roar&#8201;/ &mdash; <em>noun</em>
        </p>

        {/* Definition */}
        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
          color: '#e2e8f0',
          lineHeight: 1.7,
          marginBottom: '3rem'
        }}>
          The emotional afterglow of a night well played&mdash;the laughter, chaos, connection,
          and shared experience that makes you want to do it again. We coined a word for it.
          Then we built a subscription around it.
        </p>

        {/* Link to full story */}
        <a
          href="https://whatisafterroar.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: colors.creamYellow,
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: '3.5rem',
            letterSpacing: '0.02em'
          }}
        >
          See the full story at whatisafterroar.com <ArrowRight size={16} />
        </a>

        {/* Waitlist card */}
        <div style={{
          background: '#161b22',
          border: '1px solid rgba(125, 85, 199, 0.25)',
          borderRadius: '16px',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        }}>
          <div style={{
            display: 'inline-block',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: colors.purple,
            background: 'rgba(125, 85, 199, 0.1)',
            border: '1px solid rgba(125, 85, 199, 0.25)',
            borderRadius: '100px',
            padding: '0.3rem 1rem',
            marginBottom: '1rem'
          }}>
            Coming Soon
          </div>

          <h2 style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '0.5rem'
          }}>
            Afterroar+ Subscription
          </h2>

          <p style={{
            fontSize: '0.95rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            marginBottom: '1.5rem'
          }}>
            Something is coming that protects the afterroar. Details soon.
          </p>

          {status === 'success' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px'
            }}>
              <Check size={18} style={{ color: '#22c55e' }} />
              <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.95rem' }}>
                You&apos;re on the list.
              </span>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} style={{
              display: 'flex',
              gap: '0.5rem',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                required
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  background: '#1c2333',
                  border: status === 'error' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '0.7rem 1.25rem',
                  background: colors.primary,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0a0a',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap' as const,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  opacity: status === 'loading' ? 0.7 : 1
                }}
              >
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{errorMsg}</p>
          )}

          <p style={{
            fontSize: '0.7rem',
            color: '#64748b',
            marginTop: '0.75rem'
          }}>
            No spam. Unsubscribe anytime.
          </p>
        </div>

        {/* Trademark footer */}
        <p style={{
          fontSize: '0.7rem',
          color: '#64748b',
          marginTop: '3rem',
          lineHeight: 1.5
        }}>
          Afterroar&trade; is a trademark of Full Uproar Games. &copy; 2025 All rights reserved.
        </p>
      </div>
    </div>
  );
}
