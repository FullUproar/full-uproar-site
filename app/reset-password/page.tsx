'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: 'rgba(17, 24, 39, 0.95)',
    border: '2px solid #FF8200',
    borderRadius: '1rem',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#FF8200',
    textAlign: 'center' as const,
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  label: {
    display: 'block',
    color: '#e5e7eb',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    color: '#e5e7eb',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(45deg, #FF8200, #ea580c)',
    color: '#111827',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '0.5rem',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  },
  success: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid #22c55e',
    color: '#86efac',
    padding: '1rem',
    borderRadius: '0.5rem',
    fontSize: '0.925rem',
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  hint: {
    color: '#6b7280',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    lineHeight: 1.4,
  },
  link: {
    color: '#FF8200',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <FuglyLogo size={80} />
          </div>
          <h1 style={styles.title}>Invalid Link</h1>
          <p style={{ ...styles.subtitle, marginBottom: '1rem' }}>
            This password reset link is invalid or has expired.
          </p>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
            <Link href="/forgot-password" style={styles.link}>
              Request a new reset link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <FuglyLogo size={80} />
        </div>

        <h1 style={styles.title}>Set New Password</h1>
        <p style={styles.subtitle}>
          Choose a strong password for your account
        </p>

        {success ? (
          <div>
            <div style={styles.success}>
              Your password has been reset successfully!
            </div>
            <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link href="/sign-in" style={styles.link}>
                Sign In
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label htmlFor="password" style={styles.label}>New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                  minLength={8}
                />
                <p style={styles.hint}>
                  Must be 8+ characters with uppercase, lowercase, and a number.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div style={styles.error}>{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
              Remember your password?{' '}
              <Link href="/sign-in" style={styles.link}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <FuglyLogo size={80} />
        </div>
        <h1 style={styles.title}>Set New Password</h1>
        <p style={styles.subtitle}>Loading...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
