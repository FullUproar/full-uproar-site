'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Turnstile from '@/app/components/Turnstile';
import FuglyLogo from '@/app/components/FuglyLogo';

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    
    setError('');
    setLoading(true);

    try {
      // Verify CAPTCHA first
      if (!captchaToken) {
        setError('Please complete the CAPTCHA');
        setLoading(false);
        return;
      }

      const captchaResponse = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken })
      });

      const captchaResult = await captchaResponse.json();
      if (!captchaResult.success) {
        setError('CAPTCHA verification failed. Please try again.');
        setCaptchaToken('');
        setLoading(false);
        return;
      }

      // Create the user
      await signUp.create({
        emailAddress: email,
        password,
        username,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.errors?.[0]?.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  // Handle verification
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setError('');
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/');
      } else {
        console.error('Sign up not complete:', completeSignUp);
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Verification failed');
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
      padding: '1rem'
    },
    card: {
      background: 'rgba(17, 24, 39, 0.95)',
      border: '2px solid #f97316',
      borderRadius: '1rem',
      padding: '2rem',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 900,
      color: '#f97316',
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
      background: 'linear-gradient(45deg, #f97316, #ea580c)',
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
      color: '#f97316',
      textDecoration: 'none',
      fontWeight: 500
    }
  };

  if (!isLoaded) {
    return null;
  }

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

            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="chaos@example.com"
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
                  placeholder="ChaosLord420"
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
                  placeholder="••••••••"
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