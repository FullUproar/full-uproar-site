'use client';

import { useState } from 'react';
import { Skull, Eye, EyeOff, Gamepad2 } from 'lucide-react';

interface PasswordGateProps {
  onCorrectPassword: () => void;
}

export default function PasswordGate({ onCorrectPassword }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === 'fuglyonly') {
      onCorrectPassword();
    } else {
      setIsWrong(true);
      setAttempts(prev => prev + 1);
      setPassword('');
      setTimeout(() => setIsWrong(false), 2000);
    }
  };

  const getWrongMessage = () => {
    if (attempts === 1) return "Nice try, but Fugly sees through your lies! 😼";
    if (attempts === 2) return "Getting warmer... or maybe colder? Fugly's not telling! 🔥❄️";
    if (attempts === 3) return "Fugly is starting to get annoyed... 😾";
    if (attempts >= 4) return "Fugly demands tribute! (Hint: it rhymes with 'smugly') 🎭";
    return "Wrong password! Fugly is not amused! 😤";
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    },
    card: {
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: 'clamp(1.5rem, 5vw, 3rem)',
      maxWidth: '450px',
      width: '100%',
      textAlign: 'center' as const,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.5)'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    logo: {
      width: 'clamp(3rem, 8vw, 4rem)',
      height: 'clamp(3rem, 8vw, 4rem)',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
      fontWeight: 900,
      color: 'white',
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)'
    },
    title: {
      fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
      fontWeight: 900,
      color: '#fdba74',
      marginBottom: '0.5rem',
      textShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
    },
    subtitle: {
      fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
      color: '#e2e8f0',
      marginBottom: '2rem',
      lineHeight: '1.6',
      opacity: 0.9
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    inputContainer: {
      position: 'relative' as const,
      width: '100%'
    },
    input: {
      width: '100%',
      padding: 'clamp(0.75rem, 2vw, 1rem)',
      paddingRight: '3rem',
      border: `2px solid ${isWrong ? '#ef4444' : 'rgba(249, 115, 22, 0.3)'}`,
      borderRadius: '0.5rem',
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      outline: 'none',
      transition: 'all 0.3s',
      background: isWrong ? 'rgba(239, 68, 68, 0.1)' : 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      boxSizing: 'border-box' as const
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#fdba74',
      padding: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    button: {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%',
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
    },
    errorMessage: {
      color: '#fca5a5',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      fontWeight: 600,
      marginTop: '0.75rem',
      animation: isWrong ? 'shake 0.5s' : undefined,
      padding: '0 1rem'
    },
    hint: {
      color: '#94a3b8',
      fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
      fontStyle: 'italic',
      marginTop: '1.5rem',
      opacity: 0.8
    },
    gameIcon: {
      color: '#fdba74',
      filter: 'drop-shadow(0 2px 4px rgba(249, 115, 22, 0.3))'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            FU
          </div>
          <Gamepad2 size={32} style={styles.gameIcon} />
        </div>
        
        <h1 style={styles.title}>
          Welcome to Full Uproar
        </h1>
        
        <p style={styles.subtitle}>
          This is Fugly's secret gaming lair!
          <br />
          <strong style={{ color: '#fdba74' }}>Early Access Only</strong>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access code..."
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#f97316';
                e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                if (!isWrong) {
                  e.target.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                  e.target.style.boxShadow = 'none';
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
            }}
          >
            <Skull size={20} />
            Enter the Arena
          </button>
        </form>

        {isWrong && (
          <div style={styles.errorMessage}>
            {getWrongMessage()}
          </div>
        )}

        <div style={styles.hint}>
          Psst... if you're supposed to be here, you know the magic word! 🎮
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @media (max-width: 640px) {
          input {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
}