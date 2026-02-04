'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Wand2 } from 'lucide-react';

// =============================================================================
// PASSWORD PROTECTION FOR GAME KIT
// Uses the same password as the play-online section
// =============================================================================

const STORAGE_KEY = 'fu-game-test-auth';

// Same password as play-online
const FALLBACK_PASSWORD = 'FuglyTest2026!';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  form: {
    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(20, 30, 48, 0.95) 100%)',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '400px',
    width: '100%',
    border: '1px solid rgba(255, 130, 0, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    textAlign: 'center' as const,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 'bold' as const,
    color: '#FF8200',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#FBDB65',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    textAlign: 'left' as const,
  },
  input: {
    width: '100%',
    padding: '16px 18px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '16px',
    marginBottom: '20px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    border: '2px solid #ef4444',
  },
  button: {
    width: '100%',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    boxShadow: '0 4px 14px rgba(255, 130, 0, 0.4)',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '16px',
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '6px',
  },
  notice: {
    marginTop: '24px',
    padding: '12px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px dashed rgba(139, 92, 246, 0.3)',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#a78bfa',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    fontSize: '13px',
    marginBottom: '8px',
  },
};

function PasswordGate({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Use the same password as play-online
  const requiredPassword = process.env.NEXT_PUBLIC_GAME_PASSWORD || FALLBACK_PASSWORD;

  useEffect(() => {
    // Check if already authenticated (shares auth with play-online)
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth === requiredPassword) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [requiredPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === requiredPassword) {
      localStorage.setItem(STORAGE_KEY, password);
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#9ca3af' }}>Loading...</div>
      </div>
    );
  }

  // Authenticated - show game kit
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - show password form
  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.logoContainer}>
          <Wand2 size={32} style={{ color: '#FF8200' }} />
          <div style={styles.logo}>Game Kit</div>
        </div>
        <div style={styles.subtitle}>Create Your Own Card Games</div>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Password</label>
        <input
          type="password"
          style={{
            ...styles.input,
            ...(error ? styles.inputError : {}),
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter access password"
          autoFocus
        />

        <button type="submit" style={styles.button}>
          Access Game Kit
        </button>

        <div style={styles.notice}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#c4b5fd' }}>
            ✨ Coming Soon Features
          </div>
          <div style={styles.feature}>📝 Create custom card games</div>
          <div style={styles.feature}>🎨 Visual card editor</div>
          <div style={styles.feature}>🔗 Share with friends</div>
          <div style={styles.feature}>🎮 Play online together</div>
        </div>
      </form>
    </div>
  );
}

export default function GameKitLayout({ children }: { children: ReactNode }) {
  return <PasswordGate>{children}</PasswordGate>;
}
