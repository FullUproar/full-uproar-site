'use client';

import { useState } from 'react';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    link: {
      color: '#FF8200',
      textDecoration: 'none',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <FuglyLogo size={80} />
        </div>

        <h1 style={styles.title}>Reset Your Password</h1>
        <p style={styles.subtitle}>
          Enter your email and we&apos;ll send you a reset link
        </p>

        {submitted ? (
          <div>
            <div style={styles.success}>
              If an account exists with that email, you&apos;ll receive a reset link shortly.
            </div>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
              <Link href="/sign-in" style={styles.link}>
                Back to Sign In
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
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
                {loading ? 'Sending...' : 'Send Reset Link'}
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
