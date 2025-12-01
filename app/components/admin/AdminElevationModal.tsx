'use client';

import { useState } from 'react';
import { Shield, X, AlertTriangle, Mail } from 'lucide-react';

interface AdminElevationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onElevated: () => void;
  requiresSetup?: boolean;
}

export default function AdminElevationModal({
  isOpen,
  onClose,
  onElevated,
  requiresSetup = false,
}: AdminElevationModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleElevate = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/2fa/elevate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid code');
        return;
      }

      onElevated();
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // If user needs 2FA setup, show message to contact admin
  if (requiresSetup) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '450px',
            width: '100%',
            border: '2px solid #f97316',
            boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <AlertTriangle size={48} style={{ color: '#f97316', margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#fde68a', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              2FA Setup Required
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              Your account requires two-factor authentication to access admin features.
            </p>
          </div>

          <div style={{
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid #f97316',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <Mail size={32} style={{ color: '#f97316', marginBottom: '0.75rem' }} />
            <p style={{ color: '#fde68a', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Contact an existing admin to send you a 2FA setup email.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
              You must have a @fulluproar.com email address to receive the setup.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: '0.75rem',
              background: 'transparent',
              color: '#9ca3af',
              border: '1px solid #6b7280',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Normal verification flow
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '450px',
          width: '100%',
          border: '2px solid #f97316',
          boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.25)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Shield size={48} style={{ color: '#f97316', margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#fde68a', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Admin Verification Required
          </h2>
          <p style={{ color: '#9ca3af' }}>
            Enter your authenticator code to access admin features
          </p>
        </div>

        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(val);
              setError('');
            }}
            placeholder="000000"
            autoFocus
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '2rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              background: '#374151',
              border: error ? '2px solid #ef4444' : '2px solid #6b7280',
              borderRadius: '0.5rem',
              color: '#fff',
              marginBottom: '1rem',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.length === 6) {
                handleElevate();
              }
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button
            onClick={handleElevate}
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading || code.length !== 6 ? '#6b7280' : '#f97316',
              color: loading || code.length !== 6 ? '#fff' : '#0a0a0a',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
            Session will remain elevated for 3 hours
          </p>
        </div>
      </div>
    </div>
  );
}
