'use client';

import { useState } from 'react';
import { Skull, Eye, EyeOff } from 'lucide-react';

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
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '1rem',
      padding: '3rem',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center' as const,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '3px solid #f97316'
    },
    logo: {
      width: '4rem',
      height: '4rem',
      background: '#f97316',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem auto',
      fontSize: '1.5rem',
      fontWeight: 900,
      color: '#111827'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 900,
      color: '#111827',
      marginBottom: '1rem'
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#6b7280',
      marginBottom: '2rem',
      lineHeight: '1.6'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    inputContainer: {
      position: 'relative' as const
    },
    input: {
      width: '100%',
      padding: '1rem 3rem 1rem 1rem',
      border: `2px solid ${isWrong ? '#ef4444' : '#d1d5db'}`,
      borderRadius: '0.5rem',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.3s',
      background: isWrong ? '#fee2e2' : 'white'
    },
    eyeButton: {
      position: 'absolute' as const,
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280'
    },
    button: {
      background: '#f97316',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    errorMessage: {
      color: '#ef4444',
      fontSize: '0.875rem',
      fontWeight: 600,
      marginTop: '0.5rem',
      animation: isWrong ? 'shake 0.5s' : undefined
    },
    hint: {
      color: '#6b7280',
      fontSize: '0.75rem',
      fontStyle: 'italic',
      marginTop: '1rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          FU
        </div>
        
        <h1 style={styles.title}>
          🚫 HALT! 🚫
        </h1>
        
        <p style={styles.subtitle}>
          This is Fugly's secret lair! No unauthorized humans allowed.
          <br />
          <strong>Official Fugly Business Only!</strong>
          <br />
          <span style={{ fontSize: '0.875rem', color: '#f97316' }}>
            (Seriously, Fugly will judge you if you don't have the password)
          </span>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the secret Fugly password..."
              style={styles.input}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button type="submit" style={styles.button}>
            <Skull size={20} />
            Enter Fugly's Domain
          </button>
        </form>

        {isWrong && (
          <div style={styles.errorMessage}>
            {getWrongMessage()}
          </div>
        )}

        <div style={styles.hint}>
          Psst... if you're supposed to be here, you know the magic word! 🎭
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}