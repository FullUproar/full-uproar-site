'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, X, AlertTriangle } from 'lucide-react';

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
  const [setupMode, setSetupMode] = useState(requiresSetup);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [setupStep, setSetupStep] = useState<'init' | 'scan' | 'verify'>('init');

  useEffect(() => {
    if (requiresSetup) {
      setSetupMode(true);
    }
  }, [requiresSetup]);

  const handleSetupStart = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start 2FA setup');
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupStep('scan');
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid code');
        return;
      }

      // Now elevate
      const elevateRes = await fetch('/api/admin/2fa/elevate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (elevateRes.ok) {
        onElevated();
      } else {
        setError('2FA enabled but elevation failed. Try again.');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

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
        if (data.requiresSetup) {
          setSetupMode(true);
          setSetupStep('init');
        } else {
          setError(data.error || 'Invalid code');
        }
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
        if (e.target === e.currentTarget && !setupMode) {
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
        }}
      >
        {!setupMode && (
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
        )}

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Shield size={48} style={{ color: '#f97316', margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#fde68a', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {setupMode ? 'Set Up Admin 2FA' : 'Admin Verification Required'}
          </h2>
          <p style={{ color: '#9ca3af' }}>
            {setupMode
              ? 'Secure your admin access with two-factor authentication'
              : 'Enter your authenticator code to access admin features'}
          </p>
        </div>

        {setupMode ? (
          <>
            {setupStep === 'init' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid #f97316',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  <AlertTriangle size={24} style={{ color: '#f97316', marginBottom: '0.5rem' }} />
                  <p style={{ color: '#fde68a', fontSize: '0.875rem' }}>
                    2FA is required for admin access. You'll need an authenticator app like Google Authenticator or Authy.
                  </p>
                </div>
                <button
                  onClick={handleSetupStart}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading ? '#6b7280' : '#f97316',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {loading ? 'Setting up...' : 'Start Setup'}
                </button>
              </div>
            )}

            {setupStep === 'scan' && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#e5e7eb', marginBottom: '1rem' }}>
                  Scan this QR code with your authenticator app:
                </p>
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    style={{
                      maxWidth: '200px',
                      margin: '0 auto 1rem',
                      display: 'block',
                      borderRadius: '0.5rem',
                    }}
                  />
                )}
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Or enter this code manually:
                </p>
                <code style={{
                  display: 'block',
                  background: '#374151',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  color: '#fde68a',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all',
                  marginBottom: '1.5rem',
                }}>
                  {secret}
                </code>
                <button
                  onClick={() => setSetupStep('verify')}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#f97316',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  I've Scanned It - Continue
                </button>
              </div>
            )}

            {setupStep === 'verify' && (
              <div>
                <p style={{ color: '#e5e7eb', marginBottom: '1rem', textAlign: 'center' }}>
                  Enter the 6-digit code from your authenticator app:
                </p>
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
                      handleSetupVerify();
                    }
                  }}
                />
                {error && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                    {error}
                  </p>
                )}
                <button
                  onClick={handleSetupVerify}
                  disabled={loading || code.length !== 6}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading || code.length !== 6 ? '#6b7280' : '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {loading ? 'Verifying...' : 'Complete Setup'}
                </button>
              </div>
            )}
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
}
