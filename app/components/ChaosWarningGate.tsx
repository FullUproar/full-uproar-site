'use client';

import { useState } from 'react';
import { AlertTriangle, Skull, Heart, Zap, Shield, Volume2, Eye, ArrowRight, Sparkles } from 'lucide-react';
import PasswordGate from './PasswordGate';
import { useChaos } from '@/lib/chaos-context';

interface ChaosWarningGateProps {
  onProceed: () => void;
}

export default function ChaosWarningGate({ onProceed }: ChaosWarningGateProps) {
  const [stage, setStage] = useState<'warning' | 'password' | 'complete'>('warning');
  const [acknowledged, setAcknowledged] = useState(false);
  const { setChaosLevel } = useChaos();

  const handleProceedFromWarning = (level: 'off' | 'mild' | 'full') => {
    setChaosLevel(level);
    setStage('password');
  };

  const handlePasswordSuccess = () => {
    setStage('complete');
    setTimeout(() => onProceed(), 500);
  };

  if (stage === 'password') {
    return <PasswordGate onCorrectPassword={handlePasswordSuccess} />;
  }

  if (stage === 'complete') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f97316',
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>
        Loading chaos...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1f2937 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        fontSize: '3rem',
        opacity: 0.1,
        animation: 'float 10s ease-in-out infinite'
      }}>🔥</div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        fontSize: '3rem',
        opacity: 0.1,
        animation: 'float 12s ease-in-out infinite',
        animationDelay: '2s'
      }}>💀</div>
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '5%',
        fontSize: '3rem',
        opacity: 0.1,
        animation: 'float 15s ease-in-out infinite',
        animationDelay: '4s'
      }}>😈</div>

      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '700px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '3px solid #f97316',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <AlertTriangle size={48} style={{ color: '#f97316' }} />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#f97316',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            Chaos Warning
          </h1>
          <AlertTriangle size={48} style={{ color: '#f97316' }} />
        </div>

        <div style={{
          background: 'rgba(249, 115, 22, 0.1)',
          border: '2px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <p style={{
            color: '#fdba74',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            lineHeight: 1.4
          }}>
            ⚠️ WARNING: This website contains:
          </p>
          <ul style={{
            color: '#fde68a',
            fontSize: '1rem',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            lineHeight: 1.8
          }}>
            <li>🔥 Aggressive orange color schemes</li>
            <li>💀 Rapid animations and transitions</li>
            <li>😈 Rotating, wobbling, and shaking elements</li>
            <li>🎨 High contrast "fugly" aesthetics</li>
            <li>📢 Loud visual chaos and mayhem</li>
            <li>🌀 Potential friendship destruction</li>
          </ul>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{
            color: '#94a3b8',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}>
            Choose your experience level:
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => handleProceedFromWarning('full')}
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#111827',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) rotate(-2deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Zap size={24} style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.1rem' }}>FULL CHAOS</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>I fear nothing</div>
          </button>

          <button
            onClick={() => handleProceedFromWarning('mild')}
            style={{
              background: 'linear-gradient(135deg, #fdba74, #fbbf24)',
              color: '#111827',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Eye size={24} style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.1rem' }}>MILD CHAOS</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Some restraint</div>
          </button>

          <button
            onClick={() => handleProceedFromWarning('off')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart size={24} style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.1rem' }}>CALM MODE</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Sensory-friendly</div>
          </button>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#10b981',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            <Shield size={20} />
            <span>Accessibility Note</span>
          </div>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            margin: 0,
            lineHeight: 1.5
          }}>
            We genuinely care about accessibility. "Calm Mode" removes animations, 
            reduces contrast, and provides a peaceful browsing experience. You can 
            change this anytime using the toggle in the navigation.
          </p>
        </div>

        <div style={{
          textAlign: 'center'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#94a3b8',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            I understand this site may cause sensory overload or seizures
          </label>
        </div>

        {!acknowledged && (
          <p style={{
            textAlign: 'center',
            color: '#ef4444',
            fontSize: '0.85rem',
            marginTop: '0.5rem'
          }}>
            Please acknowledge the warning to continue
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(5deg);
          }
          50% {
            transform: translateY(0) rotate(-5deg);
          }
          75% {
            transform: translateY(-10px) rotate(3deg);
          }
        }
      `}</style>
    </div>
  );
}