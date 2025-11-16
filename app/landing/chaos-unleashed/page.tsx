'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';

export default function ChaosUnleashedLanding() {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const [sequence, setSequence] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const textSequence = [
    { text: "THIS", delay: 800 },
    { text: "GAME NIGHT", delay: 2000 },
    { text: "IS ABOUT TO GET", delay: 3400 },
    { text: "ABSOLUTELY", delay: 4800 },
    { text: "FUCKED", delay: 6000, isExplosion: true },
  ];

  useEffect(() => {
    // Sequence animation
    const timers: NodeJS.Timeout[] = [];

    textSequence.forEach((item, index) => {
      const timer = setTimeout(() => {
        setSequence(index + 1);

        // Trigger shake/impact effect
        if (!isMuted) {
          // You can add sound effects here via Howler.js or Web Audio API
          console.log(`🔊 IMPACT ${index + 1}`);
        }
      }, item.delay);
      timers.push(timer);
    });

    // Show final CTA
    const ctaTimer = setTimeout(() => {
      setShowCTA(true);
    }, 7200);
    timers.push(ctaTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const handleBuyNow = async () => {
    // Add main Fugly game to cart (you'll need to fetch the actual product)
    // For now, navigate to games page
    router.push('/games');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #000000 0%, #1a0000 50%, #330000 100%)',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    muteButton: {
      position: 'absolute' as const,
      top: '20px',
      right: '20px',
      background: 'rgba(249, 115, 22, 0.2)',
      border: '2px solid #f97316',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 100,
      transition: 'all 0.3s ease',
    },
    textContainer: {
      position: 'relative' as const,
      zIndex: 10,
    },
    impactText: {
      fontSize: 'clamp(3rem, 15vw, 10rem)',
      fontWeight: 900,
      color: '#f97316',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
      lineHeight: 1,
      textShadow: '0 0 20px rgba(249, 115, 22, 0.8), 0 0 40px rgba(249, 115, 22, 0.5)',
      letterSpacing: '0.05em',
      margin: '20px 0',
      WebkitTextStroke: '2px #000',
    },
    explosionText: {
      fontSize: 'clamp(4rem, 20vw, 15rem)',
      fontWeight: 900,
      color: '#ff0000',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
      lineHeight: 1,
      textShadow: '0 0 30px rgba(255, 0, 0, 1), 0 0 60px rgba(255, 165, 0, 0.8)',
      letterSpacing: '0.1em',
      margin: '40px 0',
      WebkitTextStroke: '3px #000',
      animation: 'explosion 0.5s ease-out',
    },
    logoText: {
      fontSize: 'clamp(3rem, 12vw, 8rem)',
      fontWeight: 900,
      color: '#fdba74',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
      textShadow: '0 0 20px rgba(253, 186, 116, 0.8)',
      letterSpacing: '0.15em',
      margin: '40px 0',
    },
    ctaContainer: {
      position: 'absolute' as const,
      bottom: '10%',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '20px',
      opacity: showCTA ? 1 : 0,
      transition: 'opacity 0.5s ease-in',
      zIndex: 20,
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: '#fff',
      fontSize: 'clamp(1.2rem, 3vw, 2rem)',
      fontWeight: 900,
      padding: 'clamp(15px, 3vw, 25px) clamp(40px, 6vw, 60px)',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      boxShadow: '0 10px 30px rgba(249, 115, 22, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      animation: 'pulse 2s ease-in-out infinite',
    },
    backgroundGlow: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
      animation: 'pulse 3s ease-in-out infinite',
    },
  };

  return (
    <div style={styles.container}>
      {/* Background glow effect */}
      <div style={styles.backgroundGlow} />

      {/* Mute button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        style={{
          ...styles.muteButton,
          background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
          borderColor: isMuted ? '#ef4444' : '#f97316',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isMuted ? <VolumeX size={24} color="#ef4444" /> : <Volume2 size={24} color="#f97316" />}
      </button>

      {/* Text sequence */}
      <div style={styles.textContainer}>
        {sequence >= 1 && (
          <div
            style={{
              ...styles.impactText,
              animation: 'slideInLeft 0.5s ease-out',
            }}
          >
            THIS
          </div>
        )}

        {sequence >= 2 && (
          <div
            style={{
              ...styles.impactText,
              animation: 'slideInRight 0.5s ease-out',
            }}
          >
            GAME NIGHT
          </div>
        )}

        {sequence >= 3 && (
          <div
            style={{
              ...styles.impactText,
              fontSize: 'clamp(2rem, 10vw, 7rem)',
              animation: 'fadeIn 0.5s ease-in',
            }}
          >
            IS ABOUT TO GET
          </div>
        )}

        {sequence >= 4 && (
          <div
            style={{
              ...styles.impactText,
              animation: 'scaleIn 0.4s ease-out',
            }}
          >
            ABSOLUTELY
          </div>
        )}

        {sequence >= 5 && (
          <div style={styles.explosionText}>
            FUCKED
          </div>
        )}

        {showCTA && (
          <div
            style={{
              ...styles.logoText,
              animation: 'fadeIn 1s ease-in',
            }}
          >
            FUGLY
          </div>
        )}
      </div>

      {/* CTA Section */}
      {showCTA && (
        <div style={styles.ctaContainer}>
          <button
            onClick={handleBuyNow}
            style={styles.primaryButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(249, 115, 22, 0.7), 0 0 30px rgba(249, 115, 22, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)';
            }}
          >
            UNLEASH CHAOS
            <ArrowRight size={28} />
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100vw);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100vw);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes explosion {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }

        /* Screen shake effect */
        body.shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
