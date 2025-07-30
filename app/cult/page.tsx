'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { Users, Flame, Star, Crown, Skull, Heart } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function CultPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredPerk, setHoveredPerk] = useState<number | null>(null);
  const [cultLevel, setCultLevel] = useState(1);
  const [ritualActive, setRitualActive] = useState(false);
  const [devotion, setDevotion] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Simulate devotion increase
    const devotionInterval = setInterval(() => {
      setDevotion(prev => (prev + 1) % 101);
    }, 100);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(devotionInterval);
    };
  }, []);

  const cultPerks = [
    {
      icon: '🎭',
      title: 'EXCLUSIVE CHAOS',
      description: 'First access to new game modifiers that will destroy friendships',
      level: 1
    },
    {
      icon: '🔥',
      title: "FUGLY'S FAVOR",
      description: 'Personal insults from Fugly himself (it\'s an honor)',
      level: 2
    },
    {
      icon: '👹',
      title: 'CHAOS COUNCIL',
      description: 'Vote on which games to ruin next',
      level: 3
    },
    {
      icon: '💀',
      title: 'INNER CIRCLE',
      description: 'Secret beta access to experimental chaos tools',
      level: 4
    },
    {
      icon: '⚡',
      title: 'CHAOS ARCHITECT',
      description: 'Design your own game-ruining modifiers',
      level: 5
    },
    {
      icon: '👑',
      title: 'FUGLY\'S CHOSEN',
      description: 'Co-create chaos with Fugly himself',
      level: 6
    }
  ];

  const cultRanks = [
    'Chaos Initiate',
    'Disorder Disciple', 
    'Mayhem Merchant',
    'Anarchy Apostle',
    'Pandemonium Prophet',
    'FUGLY\'S RIGHT HAND'
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #1f2937, #111827)',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    nav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.9)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #a855f7'
    }
  };

  const performRitual = () => {
    setRitualActive(true);
    setTimeout(() => {
      setCultLevel(prev => Math.min(prev + 1, 6));
      setRitualActive(false);
    }, 3000);
  };

  return (
    <div style={styles.container}>
      {/* Mystical Background Effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent)`,
        animation: 'cultPulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <Navigation />

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem', position: 'relative' }}>
        {/* Epic Title */}
        <h1 style={{
          fontSize: isMobile ? '3rem' : '5rem',
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: '2rem',
          background: 'linear-gradient(45deg, #a855f7, #f97316, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: '0 0 40px rgba(168, 85, 247, 0.5)'
        }}>
          JOIN THE CULT OF FUGLY
        </h1>

        {/* User Status */}
        {user && (
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '1rem',
            border: '2px solid #a855f7'
          }}>
            <p style={{ color: '#d8b4fe', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Welcome, {user.firstName || 'Chaos Seeker'}!
            </p>
            <p style={{ color: '#a855f7', fontSize: '2rem', fontWeight: 900 }}>
              Rank: {cultRanks[cultLevel - 1]}
            </p>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      background: i < cultLevel ? '#a855f7' : 'rgba(168, 85, 247, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s'
                    }}
                  >
                    {i < cultLevel ? '⚡' : ''}
                  </div>
                ))}
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Level {cultLevel} of 6
              </p>
            </div>
          </div>
        )}

        {/* Devotion Meter */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 3rem auto',
          padding: '1.5rem',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '1rem',
          border: '2px solid #f97316',
          transform: 'rotate(-1deg)'
        }}>
          <h3 style={{ color: '#f97316', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', textAlign: 'center' }}>
            DEVOTION TO CHAOS
          </h3>
          <div style={{ 
            width: '100%', 
            height: '2rem', 
            background: 'rgba(0,0,0,0.5)', 
            borderRadius: '1rem',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${devotion}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #a855f7, #f97316, #ef4444)',
              transition: 'width 0.1s ease',
              animation: 'shimmer 2s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}>
              {devotion}%
            </div>
          </div>
          <p style={{ color: '#fdba74', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Your chaos energy is building...
          </p>
        </div>

        {/* Membership Perks Grid */}
        <div style={{
          background: 'rgba(249, 115, 22, 0.05)',
          border: '4px solid #f97316',
          borderRadius: '2rem',
          padding: isMobile ? '2rem' : '4rem',
          position: 'relative',
          transform: 'rotate(-1deg)',
          marginBottom: '3rem'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%) rotate(3deg)',
            background: 'linear-gradient(45deg, #a855f7, #f97316)',
            color: '#111827',
            padding: '0.5rem 2rem',
            borderRadius: '50px',
            fontWeight: 900,
            fontSize: '1.25rem'
          }}>
            CULT BENEFITS
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {cultPerks.map((perk, index) => (
              <div 
                key={index}
                style={{ 
                  background: cultLevel >= perk.level ? '#111827' : 'rgba(17, 24, 39, 0.5)', 
                  padding: '2rem', 
                  borderRadius: '1rem',
                  transform: `rotate(${index % 2 === 0 ? '2' : '-2'}deg)`,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  border: cultLevel >= perk.level ? '2px solid #a855f7' : '2px solid transparent',
                  opacity: cultLevel >= perk.level ? 1 : 0.6,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredPerk(index)}
                onMouseLeave={() => setHoveredPerk(null)}
              >
                {cultLevel >= perk.level && (
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, #a855f7, transparent)',
                    opacity: 0.3,
                    animation: 'pulse 2s infinite'
                  }} />
                )}
                
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem',
                  transform: hoveredPerk === index ? 'scale(1.2) rotate(10deg)' : 'scale(1)',
                  transition: 'transform 0.3s'
                }}>
                  {perk.icon}
                </div>
                <h3 style={{ 
                  color: cultLevel >= perk.level ? '#a855f7' : '#6b7280', 
                  fontSize: '1.5rem', 
                  fontWeight: 900, 
                  marginBottom: '0.5rem' 
                }}>
                  {perk.title}
                </h3>
                <p style={{ color: cultLevel >= perk.level ? '#fde68a' : '#9ca3af' }}>
                  {perk.description}
                </p>
                {cultLevel < perk.level && (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Unlocks at Level {perk.level}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ritual Button */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <button 
            onClick={performRitual}
            disabled={ritualActive || cultLevel >= 6}
            style={{
              background: ritualActive 
                ? 'linear-gradient(45deg, #111827, #1f2937)' 
                : cultLevel >= 6 
                  ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                  : 'linear-gradient(45deg, #a855f7, #f97316, #ef4444)',
              color: '#111827',
              padding: '1.5rem 4rem',
              borderRadius: '50px',
              border: 'none',
              fontWeight: 900,
              fontSize: '1.5rem',
              cursor: cultLevel >= 6 ? 'not-allowed' : 'pointer',
              transform: 'scale(1)',
              transition: 'all 0.3s',
              boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)',
              opacity: ritualActive ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!ritualActive && cultLevel < 6) {
                e.currentTarget.style.transform = 'scale(1.1) rotate(-2deg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {ritualActive ? '🔮 RITUAL IN PROGRESS...' : cultLevel >= 6 ? '👑 MAXIMUM CHAOS ACHIEVED' : 'PERFORM CHAOS RITUAL'}
          </button>
          {cultLevel < 6 && !ritualActive && (
            <p style={{ color: '#9ca3af', marginTop: '1rem', fontSize: '0.875rem' }}>
              Complete the ritual to advance your cult rank
            </p>
          )}
        </div>

        {/* Community Section */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          border: '2px solid #a855f7'
        }}>
          <h2 style={{ color: '#a855f7', fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            CULT STATISTICS
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            <div>
              <div style={{ fontSize: '3rem', color: '#f97316', fontWeight: 900 }}>13,666</div>
              <p style={{ color: '#fdba74' }}>Active Cultists</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', color: '#ef4444', fontWeight: 900 }}>666,666</div>
              <p style={{ color: '#fca5a5' }}>Games Ruined</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', color: '#a855f7', fontWeight: 900 }}>∞</div>
              <p style={{ color: '#d8b4fe' }}>Chaos Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cult Symbols */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {['🔥', '👹', '🎭', '💀', '⚡', '🔮', '👁️'].map((emoji, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              fontSize: '2rem',
              left: `${10 + i * 12}%`,
              top: '50%',
              animation: `cultFloat ${10 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0.2
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Ritual Effect */}
      {ritualActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(168, 85, 247, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'ritualFlash 0.5s ease-in-out infinite'
        }}>
          <div style={{
            fontSize: '8rem',
            animation: 'spin 1s linear infinite'
          }}>
            🔮
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes cultFloat {
          0%, 100% { 
            transform: translateY(0) rotate(0deg) scale(1);
          }
          25% { 
            transform: translateY(-30px) rotate(90deg) scale(1.2);
          }
          50% { 
            transform: translateY(-50px) rotate(180deg) scale(1);
          }
          75% { 
            transform: translateY(-30px) rotate(270deg) scale(0.8);
          }
        }

        @keyframes cultPulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes ritualFlash {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}