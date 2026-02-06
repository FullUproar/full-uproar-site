'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ArtworkDisplay from './ArtworkDisplay';

interface ChaosCharacter {
  id: string;
  position: { x: number; y: number };
  animation: string;
  size: number;
  rotation: number;
  flipX: boolean;
  artworkIndex?: number;
}

export default function FuglyChaosMode() {
  const [chaosEnabled, setChaosEnabled] = useState(false);
  const [characters, setCharacters] = useState<ChaosCharacter[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [debugArtwork, setDebugArtwork] = useState<any[]>([]);

  // Chaos animations
  const animations = [
    'peekFromBottom',
    'peekFromSide',
    'floatAround',
    'spinAndVanish',
    'slideAcross',
    'bounceIn',
    'zigzag',
    'popUp'
  ];

  // Enable chaos mode after 3 clicks on Fugly logo or randomly
  useEffect(() => {
    // Fetch artwork marked for chaos mode
    fetch('/api/artwork')
      .then(res => {
        if (!res.ok) {
          console.error('Failed to fetch artwork for chaos mode');
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const chaosArtwork = data.filter((art: any) => art.chaosMode === true);
          setDebugArtwork(chaosArtwork);
        } else {
          setDebugArtwork([]);
        }
      })
      .catch(error => {
        console.error('Error fetching chaos mode artwork:', error);
        setDebugArtwork([]);
      });

    // Removed auto-trigger - now ONLY activates with 3 clicks on Fugly logo

    // Listen for logo clicks
    const handleLogoClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-fugly-logo]')) {
        setClickCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            setChaosEnabled(true);
            return 0;
          }
          return newCount;
        });
      }
    };

    document.addEventListener('click', handleLogoClick);
    return () => document.removeEventListener('click', handleLogoClick);
  }, []);

  // Spawn random characters when chaos is enabled
  useEffect(() => {
    if (!chaosEnabled) return;
    
    // Don't spawn anything if there's no artwork
    if (debugArtwork.length === 0) {
      return;
    }

    const spawnCharacter = () => {
      const id = Math.random().toString(36).substr(2, 9);
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y;

      switch (side) {
        case 0: // top
          x = 20 + Math.random() * 60; // 20-80% to stay more centered
          y = -10;
          break;
        case 1: // right
          x = 90;
          y = 20 + Math.random() * 60;
          break;
        case 2: // bottom
          x = 20 + Math.random() * 60;
          y = 90;
          break;
        case 3: // left
          x = -10;
          y = 20 + Math.random() * 60;
          break;
        default:
          x = 50;
          y = 50;
      }

      const newCharacter: ChaosCharacter = {
        id,
        position: { x, y },
        animation: animations[Math.floor(Math.random() * animations.length)],
        size: 100 + Math.random() * 200, // 100-300px
        rotation: Math.random() * 360,
        flipX: Math.random() > 0.5,
        artworkIndex: debugArtwork.length > 0 ? Math.floor(Math.random() * debugArtwork.length) : undefined
      };

      setCharacters(prev => [...prev, newCharacter]);

      // Remove character after animation (reduced from 8s to 5s)
      setTimeout(() => {
        setCharacters(prev => prev.filter(char => char.id !== id));
      }, 5000);
    };

    // Initial spawn burst - spawn 3 characters immediately
    spawnCharacter();
    setTimeout(() => spawnCharacter(), 500);
    setTimeout(() => spawnCharacter(), 1000);

    // Spawn new characters much more frequently
    const interval = setInterval(() => {
      // Always spawn at least one
      spawnCharacter();
      
      // 50% chance to spawn a second one
      if (Math.random() < 0.5) {
        setTimeout(() => spawnCharacter(), 200);
      }
      
      // 25% chance to spawn a third one
      if (Math.random() < 0.25) {
        setTimeout(() => spawnCharacter(), 400);
      }
    }, 1500); // Every 1.5 seconds instead of 3

    return () => clearInterval(interval);
  }, [chaosEnabled, debugArtwork]);

  if (!chaosEnabled && clickCount > 0) {
    // Show hint after first click
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#FF8200',
        color: '#111827',
        padding: '0.5rem 1rem',
        borderRadius: '50px',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        zIndex: 100,
        animation: 'pulse 2s infinite'
      }}>
        {3 - clickCount} more clicks to unleash chaos... 😈
      </div>
    );
  }

  // Check if we have chaos artwork
  if (chaosEnabled && debugArtwork.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(255, 130, 0, 0.9)',
        color: '#111827',
        padding: '2rem',
        borderRadius: '1rem',
        fontWeight: 'bold',
        zIndex: 1000,
        textAlign: 'center' as const,
        maxWidth: '400px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎭 CHAOS MODE NEEDS FUEL! 🎭</div>
        <div style={{ marginBottom: '1rem' }}>
          No artwork marked for chaos mode yet!
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          Go to Admin → Artwork and check "Use in Chaos Mode" on some images.
        </div>
        <button 
          onClick={() => setChaosEnabled(false)}
          style={{
            marginTop: '1rem',
            background: '#111827',
            color: '#FF8200',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Got it!
        </button>
      </div>
    );
  }

  // Don't render anything if chaos is not enabled
  if (!chaosEnabled) return null;

  return (
    <>
      {characters.map(char => (
        <div
          key={char.id}
          style={{
            position: 'fixed',
            left: `${char.position.x}%`,
            top: `${char.position.y}%`,
            width: `${char.size}px`,
            height: `${char.size}px`,
            transform: `rotate(${char.rotation}deg) scaleX(${char.flipX ? -1 : 1})`,
            zIndex: 999,
            pointerEvents: 'none',
            animation: `${char.animation} 5s ease-in-out`
          }}
        >
          {char.artworkIndex !== undefined && debugArtwork[char.artworkIndex] && (
            <Image
              src={debugArtwork[char.artworkIndex].imageUrl || debugArtwork[char.artworkIndex].largeUrl}
              alt="Fugly"
              width={200}
              height={200}
              unoptimized
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      ))}

      {chaosEnabled && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 130, 0, 0.9)',
          color: '#111827',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 1000,
          transform: 'rotate(-5deg)',
          animation: 'wobble 2s infinite'
        }}
        onClick={() => setChaosEnabled(false)}
        >
          CHAOS MODE ACTIVE! 🔥
          <br />
          <span style={{ fontSize: '0.75rem' }}>Click to restore order (boring)</span>
        </div>
      )}

      <style jsx>{`
        @keyframes peekFromBottom {
          0% { transform: translateY(50%) rotate(0deg); opacity: 0; }
          20% { transform: translateY(-50%) rotate(-10deg); opacity: 1; }
          80% { transform: translateY(-50%) rotate(10deg); opacity: 1; }
          100% { transform: translateY(50%) rotate(0deg); opacity: 0; }
        }

        @keyframes peekFromSide {
          0% { transform: translateX(-50%) rotate(0deg); opacity: 0; }
          20% { transform: translateX(0) rotate(-20deg); opacity: 1; }
          80% { transform: translateX(0) rotate(20deg); opacity: 1; }
          100% { transform: translateX(100%) rotate(360deg); opacity: 0; }
        }

        @keyframes floatAround {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(50px, -30px) rotate(90deg); }
          50% { transform: translate(-30px, 50px) rotate(180deg); }
          75% { transform: translate(30px, 30px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        @keyframes spinAndVanish {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(720deg); opacity: 1; }
          100% { transform: scale(0) rotate(1440deg); opacity: 0; }
        }

        @keyframes slideAcross {
          0% { transform: translateX(-200%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(300%); }
        }

        @keyframes bounceIn {
          0% { transform: scale(0) translateY(-100%); }
          50% { transform: scale(1.1) translateY(0); }
          60% { transform: scale(0.9) translateY(-20%); }
          70% { transform: scale(1.05) translateY(0); }
          80% { transform: scale(0.95) translateY(-10%); }
          90% { transform: scale(1) translateY(0); }
          100% { transform: scale(0) translateY(100%); }
        }

        @keyframes zigzag {
          0% { transform: translate(0, 0); }
          20% { transform: translate(100px, 50px); }
          40% { transform: translate(-50px, 100px); }
          60% { transform: translate(150px, 150px); }
          80% { transform: translate(-100px, 200px); }
          100% { transform: translate(200px, 300px); opacity: 0; }
        }

        @keyframes popUp {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          10% { transform: scale(1.5) rotate(10deg); opacity: 1; }
          90% { transform: scale(1.5) rotate(-10deg); opacity: 1; }
          100% { transform: scale(0) rotate(0deg); opacity: 0; }
        }

        @keyframes wobble {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </>
  );
}