'use client';

import { useState } from 'react';
import { Skull, Eye, EyeOff, Dices } from 'lucide-react';
import Image from 'next/image';

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
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute' as const,
      inset: 0,
      background: 'radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(253, 186, 116, 0.05) 0%, transparent 50%)',
      pointerEvents: 'none' as const
    },
    card: {
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem',
      padding: 'clamp(1.5rem, 5vw, 3rem)',
      maxWidth: '550px',
      width: '100%',
      textAlign: 'center' as const,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '3px solid #f97316',
      position: 'relative' as const,
      zIndex: 10
    },
    imageContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '2rem',
      marginBottom: '2rem',
      opacity: 0.8
    },
    fuglyImage: {
      borderRadius: '0.5rem',
      border: '2px solid rgba(249, 115, 22, 0.5)',
      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
      transform: 'rotate(-2deg)'
    },
    fuglyImage2: {
      borderRadius: '0.5rem',
      border: '2px solid rgba(139, 92, 246, 0.5)',
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
      transform: 'rotate(2deg)'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    logo: {
      width: 'clamp(4rem, 10vw, 5rem)',
      height: 'clamp(4rem, 10vw, 5rem)',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      fontWeight: 900,
      color: 'white',
      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.5)',
      border: '3px solid #fdba74'
    },
    title: {
      fontSize: 'clamp(2rem, 6vw, 3rem)',
      fontWeight: 900,
      color: '#f97316',
      marginBottom: '0.25rem',
      textShadow: '0 4px 12px rgba(249, 115, 22, 0.5)',
      letterSpacing: '-0.02em'
    },
    brandName: {
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      color: '#fdba74',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
      color: '#e2e8f0',
      marginBottom: '1.5rem',
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
      <div style={styles.backgroundPattern} />
      <div style={styles.card}>
        <div style={styles.imageContainer}>
          <div style={styles.fuglyImage}>
            <Image 
              src="/fugly_shirt.jpg" 
              alt="Fugly Games Gear" 
              width={120} 
              height={120}
              style={{ borderRadius: '0.5rem', display: 'block' }}
            />
          </div>
          <div style={styles.fuglyImage2}>
            <Image 
              src="/fugly_shirt copy.jpg" 
              alt="Fugly Exclusive Merch" 
              width={120} 
              height={120}
              style={{ borderRadius: '0.5rem', display: 'block' }}
            />
          </div>
        </div>

        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            FU
          </div>
          <Dices size={40} style={styles.gameIcon} />
        </div>
        
        <div style={styles.brandName}>FULL UPROAR GAMING</div>
        
        <h1 style={styles.title}>
          Enter the Fugly Zone
        </h1>
        
        <p style={styles.subtitle}>
          Where gaming gets loud, proud, and unapologetically FUGLY!
          <br />
          <strong style={{ color: '#fdba74' }}>🔥 Early Access Only 🔥</strong>
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
            <Skull size={24} />
            UNLEASH THE FUGLY
          </button>
        </form>

        {isWrong && (
          <div style={styles.errorMessage}>
            {getWrongMessage()}
          </div>
        )}

        <div style={styles.hint}>
          Psst... True gamers know the password! 🎮
          <br />
          <span style={{ fontSize: '0.7em', opacity: 0.7 }}>
            (It's what this site is all about...)
          </span>
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