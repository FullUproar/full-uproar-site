'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, X, AlertTriangle, Mail, Key, Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

interface AdminElevationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onElevated: () => void;
  requiresSetup?: boolean;
  canDismiss?: boolean;
  webauthnEnabled?: boolean;
  availableMethods?: string[];
}

type AuthMode = 'webauthn' | 'totp';

export default function AdminElevationModal({
  isOpen,
  onClose,
  onElevated,
  requiresSetup = false,
  canDismiss = false,
  webauthnEnabled = false,
  availableMethods = [],
}: AdminElevationModalProps) {
  const [mode, setMode] = useState<AuthMode>(webauthnEnabled ? 'webauthn' : 'totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [webauthnStatus, setWebauthnStatus] = useState<'idle' | 'waiting' | 'error'>('idle');

  // Reset state when modal opens/closes or webauthnEnabled changes
  useEffect(() => {
    if (isOpen) {
      setMode(webauthnEnabled ? 'webauthn' : 'totp');
      setCode('');
      setError('');
      setLoading(false);
      setWebauthnStatus('idle');
    }
  }, [isOpen, webauthnEnabled]);

  // Auto-trigger WebAuthn when in webauthn mode
  const initiateWebAuthn = useCallback(async () => {
    if (!isOpen || mode !== 'webauthn' || webauthnStatus === 'waiting') return;

    setWebauthnStatus('waiting');
    setError('');

    try {
      // Get authentication options from server
      const optionsRes = await fetch('/api/admin/webauthn/authenticate');
      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || data.message || 'Failed to get authentication options');
      }
      const options = await optionsRes.json();

      // Trigger browser WebAuthn prompt (user taps YubiKey)
      const authResponse = await startAuthentication(options);

      // Verify with server
      const verifyRes = await fetch('/api/admin/webauthn/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResponse }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || data.message || 'Verification failed');
      }

      onElevated();
    } catch (err: any) {
      // User cancelled or error
      const message = err?.message || 'Authentication failed';
      // Don't show error for user cancellation
      if (message.includes('cancelled') || message.includes('canceled') || message.includes('abort') || message.includes('NotAllowedError')) {
        setWebauthnStatus('idle');
      } else {
        setError(message);
        setWebauthnStatus('error');
      }
    }
  }, [isOpen, mode, webauthnStatus, onElevated]);

  useEffect(() => {
    if (isOpen && mode === 'webauthn' && webauthnStatus === 'idle') {
      // Small delay to let modal render before triggering browser prompt
      const timer = setTimeout(initiateWebAuthn, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode, webauthnStatus, initiateWebAuthn]);

  const handleTotpElevate = async () => {
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
        setError(data.error || data.message || 'Invalid code');
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

  // ─── Setup Required Mode ──────────────────────────────────────
  if (requiresSetup) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <AlertTriangle size={48} style={{ color: '#FF8200', margin: '0 auto 1rem' }} />
            <h2 style={titleStyle}>
              2FA Setup Required
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              Your account requires two-factor authentication to access admin features.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 130, 0, 0.1)',
            border: '1px solid #FF8200',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <Mail size={32} style={{ color: '#FF8200', marginBottom: '0.75rem' }} />
            <p style={{ color: '#FBDB65', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Contact an existing admin to send you a 2FA setup email.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
              You must have a @fulluproar.com email address to receive the setup.
            </p>
          </div>

          <button
            onClick={onClose}
            style={secondaryButtonStyle}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ─── WebAuthn Mode ────────────────────────────────────────────
  if (mode === 'webauthn') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          {canDismiss && <CloseButton onClick={onClose} />}

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Shield size={48} style={{ color: '#FF8200', margin: '0 auto 1rem' }} />
            <h2 style={titleStyle}>
              Admin Verification Required
            </h2>
            <p style={{ color: '#9ca3af' }}>
              Tap your security key to verify your identity
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem 1rem',
            background: 'rgba(255, 130, 0, 0.05)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 130, 0, 0.2)',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: webauthnStatus === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 130, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              animation: webauthnStatus === 'waiting' ? 'pulse 2s infinite' : 'none',
            }}>
              <Key size={40} style={{ color: webauthnStatus === 'error' ? '#ef4444' : '#FF8200' }} />
            </div>

            <p style={{
              color: webauthnStatus === 'error' ? '#ef4444' : '#FBDB65',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              marginBottom: '0.25rem',
            }}>
              {webauthnStatus === 'waiting' ? 'Waiting for security key...' :
               webauthnStatus === 'error' ? 'Authentication failed' :
               'Insert and tap your security key'}
            </p>

            {webauthnStatus === 'error' && error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            {(webauthnStatus === 'error' || webauthnStatus === 'idle') && (
              <button
                onClick={() => {
                  setWebauthnStatus('idle');
                  setError('');
                  // Will re-trigger via useEffect
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1.5rem',
                  background: '#FF8200',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Try Again
              </button>
            )}
          </div>

          {availableMethods.includes('totp') && (
            <button
              onClick={() => {
                setMode('totp');
                setError('');
                setWebauthnStatus('idle');
              }}
              style={switchMethodStyle}
            >
              Use authenticator app instead
            </button>
          )}

          <p style={sessionNoteStyle}>
            Session will remain elevated for 3 hours
          </p>

          <style>{pulseKeyframes}</style>
        </div>
      </div>
    );
  }

  // ─── TOTP Mode ────────────────────────────────────────────────
  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && canDismiss) {
          onClose();
        }
      }}
    >
      <div style={cardStyle}>
        {canDismiss && <CloseButton onClick={onClose} />}

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Shield size={48} style={{ color: '#FF8200', margin: '0 auto 1rem' }} />
          <h2 style={titleStyle}>
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
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.length === 6) {
                handleTotpElevate();
              }
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button
            onClick={handleTotpElevate}
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading || code.length !== 6 ? '#6b7280' : '#FF8200',
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

          {webauthnEnabled && (
            <button
              onClick={() => {
                setMode('webauthn');
                setError('');
                setCode('');
              }}
              style={switchMethodStyle}
            >
              Use security key instead
            </button>
          )}

          <p style={sessionNoteStyle}>
            Session will remain elevated for 3 hours
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
  );
}

// ─── Shared Styles ──────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
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
};

const cardStyle: React.CSSProperties = {
  background: '#1a1a2e',
  borderRadius: '1rem',
  padding: '2rem',
  maxWidth: '450px',
  width: '100%',
  border: '2px solid #FF8200',
  boxShadow: '0 25px 50px -12px rgba(255, 130, 0, 0.25)',
  position: 'relative',
};

const titleStyle: React.CSSProperties = {
  color: '#FBDB65',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '1.5rem',
  padding: '0.75rem',
  background: 'transparent',
  color: '#9ca3af',
  border: '1px solid #6b7280',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const switchMethodStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '1rem',
  padding: '0.5rem',
  background: 'transparent',
  color: '#9ca3af',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.85rem',
  textDecoration: 'underline',
  textAlign: 'center',
};

const sessionNoteStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '0.75rem',
  textAlign: 'center',
  marginTop: '1rem',
};

const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
`;
