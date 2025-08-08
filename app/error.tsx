'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (in production, send to error tracking service)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        {/* Error Animation */}
        <div style={{
          fontSize: '8rem',
          fontWeight: 900,
          color: '#ef4444',
          marginBottom: '2rem',
          lineHeight: 1,
          textShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
          animation: 'pulse 2s infinite'
        }}>
          500
        </div>
        
        <AlertTriangle style={{
          width: '80px',
          height: '80px',
          color: '#f97316',
          margin: '0 auto 2rem',
          animation: 'shake 0.5s ease-in-out infinite'
        }} />
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '1rem',
          color: '#fdba74',
          textTransform: 'uppercase'
        }}>
          Maximum Chaos Achieved
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#fde68a',
          marginBottom: '3rem',
          fontWeight: 'bold'
        }}>
          Something broke so spectacularly that even Fugly is impressed.
          <br />
          This is either a feature or a catastrophic failure. Hard to tell.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f97316',
              color: '#111827',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              fontSize: '1.1rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <RefreshCw size={20} />
            TRY AGAIN
          </button>
          
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            color: '#f97316',
            padding: '1rem 2rem',
            borderRadius: '50px',
            fontWeight: 900,
            textDecoration: 'none',
            border: '3px solid #f97316',
            transition: 'all 0.2s',
            fontSize: '1.1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f97316';
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#f97316';
          }}>
            <Home size={20} />
            RUN HOME
          </Link>
        </div>
        
        <div style={{
          marginTop: '4rem',
          padding: '1.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '1rem',
          border: '2px solid rgba(239, 68, 68, 0.3)'
        }}>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            margin: 0
          }}>
            <strong style={{ color: '#fdba74' }}>Error Details:</strong> {error.message || 'Unknown chaos occurred'}
            {error.digest && (
              <>
                <br />
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Reference: {error.digest}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}