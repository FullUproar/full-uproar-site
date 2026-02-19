'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Turnstile from '@/app/components/Turnstile';
import FuglyLogo from '@/app/components/FuglyLogo';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!captchaToken) {
        setError('Please complete the CAPTCHA');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, captchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred during sign up');
        setCaptchaToken('');
        setLoading(false);
        return;
      }

      setPendingVerification(true);
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Auto sign-in after verification
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/');
        router.refresh();
      } else {
        router.push('/sign-in');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    },
    card: {
      background: 'rgba(17, 24, 39, 0.95)',
      border: '2px solid #FF8200',
      borderRadius: '1rem',
      padding: '2rem',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 900,
      color: '#FF8200',
      textAlign: 'center' as const,
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#9ca3af',
      textAlign: 'center' as const,
      marginBottom: '2rem'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    label: {
      display: 'block',
      color: '#e5e7eb',
      fontSize: '0.875rem',
      fontWeight: 500,
      marginBottom: '0.25rem'
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
      transition: 'border-color 0.2s'
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
      marginTop: '0.5rem'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #ef4444',
      color: '#fca5a5',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem'
    },
    link: {
      color: '#FF8200',
      textDecoration: 'none',
      fontWeight: 500
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '1.5rem 0',
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#374151'
    },
    dividerText: {
      padding: '0 1rem'
    },
    googleButton: {
      width: '100%',
      padding: '0.75rem 1.5rem',
      background: '#fff',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontWeight: 600,
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <FuglyLogo size={80} />
        </div>

        {!pendingVerification ? (
          <>
            <h1 style={styles.title}>Join the Chaos</h1>
            <p style={styles.subtitle}>Create your Full Uproar account</p>

            <button
              type="button"
              onClick={signUpWithGoogle}
              style={styles.googleButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div style={styles.divider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine}></div>
            </div>

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

              <div>
                <label htmlFor="username" style={styles.label}>Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" style={styles.label}>Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              {error && (
                <div style={styles.error}>{error}</div>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onVerify={setCaptchaToken}
                  onError={() => {
                    setError('CAPTCHA failed. Please refresh and try again.');
                    setCaptchaToken('');
                  }}
                  theme="dark"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !captchaToken}
                style={{
                  ...styles.button,
                  opacity: loading || !captchaToken ? 0.5 : 1,
                  cursor: loading || !captchaToken ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
              Already have an account?{' '}
              <Link href="/sign-in" style={styles.link}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Verify Your Email</h1>
            <p style={styles.subtitle}>
              We sent a verification code to {email}
            </p>

            <form onSubmit={handleVerification} style={styles.form}>
              <div>
                <label htmlFor="code" style={styles.label}>Verification Code</label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={styles.input}
                  placeholder="Enter 6-digit code"
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
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
