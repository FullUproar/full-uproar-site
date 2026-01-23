'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Sparkles } from 'lucide-react';
import { gameKitResponsiveCSS } from '@/lib/game-kit/responsive-styles';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#e2e8f0',
  },
  backButton: {
    position: 'absolute' as const,
    top: '20px',
    left: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fdba74',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    marginBottom: '32px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fdba74',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
  },
  codeInputContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  codeInput: {
    width: '48px',
    height: '64px',
    textAlign: 'center' as const,
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '12px',
    color: '#f97316',
    outline: 'none',
    textTransform: 'uppercase' as const,
  },
  button: {
    width: '100%',
    padding: '18px 24px',
    borderRadius: '14px',
    border: 'none',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#000',
    boxShadow: '0 10px 40px rgba(249, 115, 22, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '32px 0',
    color: '#64748b',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(249, 115, 22, 0.2)',
  },
  createLink: {
    display: 'block',
    padding: '14px 24px',
    borderRadius: '12px',
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    color: '#fdba74',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JoinGame() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow alphanumeric
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    setError(null);

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleJoin();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    // Focus appropriate input
    if (pasted.length >= 6) {
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  // Join room
  const handleJoin = async () => {
    const roomCode = code.join('');

    if (roomCode.length !== 6) {
      setError('Please enter a complete 6-character code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if room exists
      const response = await fetch(`/api/game-kit/sessions/${roomCode}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Room not found');
        setIsLoading(false);
        return;
      }

      // Navigate to room page
      router.push(`/room/${roomCode}`);
    } catch (err) {
      setError('Failed to connect. Please try again.');
      setIsLoading(false);
    }
  };

  const isComplete = code.every(c => c);

  return (
    <div style={styles.container} className="gk-container">
      <style jsx global>{gameKitResponsiveCSS}</style>
      <Link href="/game-kit" style={styles.backButton}>
        <ArrowLeft size={16} />
        Back
      </Link>

      <div style={styles.card}>
        <div style={styles.logo}>🎮</div>
        <h1 style={styles.title} className="gk-title">Join Game</h1>
        <p style={styles.subtitle} className="gk-subtitle">Enter the room code shown on the host's screen</p>

        <label style={styles.label}>Room Code</label>

        <div style={styles.codeInputContainer}>
          {code.map((char, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="gk-code-input"
              style={{
                ...styles.codeInput,
                borderColor: char ? '#f97316' : 'rgba(249, 115, 22, 0.3)',
              }}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={{
            ...styles.button,
            ...(isComplete && !isLoading ? {} : styles.buttonDisabled),
          }}
          onClick={handleJoin}
          disabled={!isComplete || isLoading}
        >
          {isLoading ? (
            <>Joining...</>
          ) : (
            <>
              <Gamepad2 size={20} />
              Join Game
            </>
          )}
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span>or</span>
          <div style={styles.dividerLine} />
        </div>

        <Link href="/game-kit" style={styles.createLink}>
          <Sparkles size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Create Your Own Game
        </Link>
      </div>
    </div>
  );
}
