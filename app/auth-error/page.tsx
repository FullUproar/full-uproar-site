'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There's a problem with the server configuration.",
  AccessDenied: "Access denied. You don't have permission.",
  Verification: 'The verification link has expired or already been used.',
  OAuthSignin: 'There was a problem signing in with your provider.',
  OAuthCallback: 'There was a problem signing in with your provider.',
  OAuthCreateAccount: 'There was a problem signing in with your provider.',
  EmailCreateAccount: 'Could not create account with this email.',
  Callback: 'There was a problem during authentication.',
  CredentialsSignin: 'Invalid email or password.',
  Default: 'An unexpected error occurred.',
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
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '0.5rem',
    fontSize: '0.925rem',
    textAlign: 'center' as const,
    lineHeight: 1.5,
    marginBottom: '1.5rem',
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(45deg, #FF8200, #ea580c)',
    color: '#111827',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  link: {
    color: '#FF8200',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') || 'Default';
  const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <FuglyLogo size={80} />
        </div>

        <h1 style={styles.title}>Authentication Error</h1>
        <p style={styles.subtitle}>Something went wrong</p>

        <div style={styles.errorBox}>
          {errorMessage}
        </div>

        <Link href="/sign-in" style={styles.button}>
          Try Again
        </Link>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
          <Link href="/" style={styles.link}>
            Go Home
          </Link>
        </p>
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
        <h1 style={styles.title}>Authentication Error</h1>
        <p style={styles.subtitle}>Loading...</p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
