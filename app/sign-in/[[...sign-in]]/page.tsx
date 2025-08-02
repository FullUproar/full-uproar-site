'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      } else {
        console.error('Sign in not complete:', result);
        setError('Sign in failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.errors?.[0]?.message || 'Invalid email or password');
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
        
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to continue the chaos</p>

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

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
          Don't have an account?{' '}
          <Link href="/sign-up" style={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}