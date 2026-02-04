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
  const [fadeOutText, setFadeOutText] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  const textSequence = [
    { text: "GAME NIGHT", delay: 800 },
    { text: "IS ABOUT", delay: 2000 },
    { text: "TO GET", delay: 3200 },
    { text: "FUGLY!", delay: 4600, isExplosion: true },
  ];

  useEffect(() => {
    // Sequence animation
    const timers: ReturnType<typeof setTimeout>[] = [];

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

    // Fade out text after FUGLY appears (longer pause to read)
    const fadeTimer = setTimeout(() => {
      setFadeOutText(true);
    }, 6800);
    timers.push(fadeTimer);

    // Show Fugly logo (Cheshire cat style)
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 8000);
    timers.push(logoTimer);

    // Show final CTA
    const ctaTimer = setTimeout(() => {
      setShowCTA(true);
    }, 10500);
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
      background: 'rgba(255, 130, 0, 0.2)',
      border: '2px solid #FF8200',
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
      opacity: fadeOutText ? 0 : 1,
      transition: 'opacity 1s ease-out',
    },
    fuglyLogoContainer: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      width: '80vw',
      maxWidth: '800px',
      opacity: showLogo ? 1 : 0,
      transform: showLogo ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
      transition: 'opacity 2s ease-out, transform 2s ease-out',
      zIndex: 15,
      textAlign: 'center' as const,
    },
    fuglyLogoText: {
      fontSize: 'clamp(5rem, 20vw, 16rem)',
      fontWeight: 900,
      color: '#FF8200',
      textTransform: 'uppercase' as const,
      lineHeight: 1,
      letterSpacing: '0.1em',
      WebkitTextStroke: '4px #000',
      textShadow: '0 0 40px rgba(255, 130, 0, 0.8), 0 0 80px rgba(255, 130, 0, 0.4), 0 0 120px rgba(255, 130, 0, 0.2)',
      animation: showLogo ? 'cheshireFade 2.5s ease-out' : 'none',
    },
    impactText: {
      fontSize: 'clamp(3rem, 15vw, 10rem)',
      fontWeight: 900,
      color: '#FF8200',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
      lineHeight: 1,
      textShadow: '0 0 20px rgba(255, 130, 0, 0.8), 0 0 40px rgba(255, 130, 0, 0.5)',
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
      color: '#FBDB65',
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
      background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
      color: '#fff',
      fontSize: 'clamp(1.2rem, 3vw, 2rem)',
      fontWeight: 900,
      padding: 'clamp(15px, 3vw, 25px) clamp(40px, 6vw, 60px)',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      boxShadow: '0 10px 30px rgba(255, 130, 0, 0.5), 0 0 20px rgba(255, 130, 0, 0.3)',
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
      background: 'radial-gradient(circle at 50% 50%, rgba(255, 130, 0, 0.15) 0%, transparent 70%)',
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
          background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 130, 0, 0.2)',
          borderColor: isMuted ? '#ef4444' : '#FF8200',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isMuted ? <VolumeX size={24} color="#ef4444" /> : <Volume2 size={24} color="#FF8200" />}
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
            GAME NIGHT
          </div>
        )}

        {sequence >= 2 && (
          <div
            style={{
              ...styles.impactText,
              animation: 'slideInRight 0.5s ease-out',
            }}
          >
            IS ABOUT
          </div>
        )}

        {sequence >= 3 && (
          <div
            style={{
              ...styles.impactText,
              animation: 'scaleIn 0.4s ease-out',
            }}
          >
            TO GET
          </div>
        )}

        {sequence >= 4 && (
          <div style={styles.explosionText}>
            FUGLY!
          </div>
        )}
      </div>

      {/* Fugly Logo - Cheshire Cat Style */}
      <div style={styles.fuglyLogoContainer}>
        <div style={styles.fuglyLogoText}>
          FUGLY
        </div>
      </div>

      {/* CTA Section */}
      {showCTA && (
        <div style={styles.ctaContainer}>
          <button
            onClick={handleBuyNow}
            style={styles.primaryButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 130, 0, 0.7), 0 0 30px rgba(255, 130, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 130, 0, 0.5), 0 0 20px rgba(255, 130, 0, 0.3)';
            }}
          >
            UNLEASH THE CHAOS
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

        /* Cheshire Cat fade - starts invisible, gradually appears */
        @keyframes cheshireFade {
          0% {
            opacity: 0;
            filter: brightness(0) drop-shadow(0 0 0px rgba(255, 130, 0, 0));
          }
          20% {
            opacity: 0.1;
            filter: brightness(0.3) drop-shadow(0 0 10px rgba(255, 130, 0, 0.2));
          }
          40% {
            opacity: 0.3;
            filter: brightness(0.5) drop-shadow(0 0 20px rgba(255, 130, 0, 0.4));
          }
          60% {
            opacity: 0.6;
            filter: brightness(0.8) drop-shadow(0 0 30px rgba(255, 130, 0, 0.6));
          }
          80% {
            opacity: 0.9;
            filter: brightness(1) drop-shadow(0 0 40px rgba(255, 130, 0, 0.8));
          }
          100% {
            opacity: 1;
            filter: brightness(1) drop-shadow(0 0 40px rgba(255, 130, 0, 0.8)) drop-shadow(0 0 80px rgba(255, 130, 0, 0.4));
          }
        }
      `}</style>
    </div>
  );
}
