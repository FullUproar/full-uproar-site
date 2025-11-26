'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import GlobalFooter from '../components/GlobalFooter';
import { Zap, Heart, Gamepad2, Sparkles, Target, Shield, Users, Flame, Crown } from 'lucide-react';
import FuglyLogo from '../components/FuglyLogo';

type AboutSection = 'mission' | 'what-we-do' | 'philosophy' | 'tribe' | 'promise' | 'fugly';

interface SectionConfig {
  id: AboutSection;
  label: string;
  icon: React.ElementType;
  color: string;
}

const sections: SectionConfig[] = [
  { id: 'mission', label: 'Mission', icon: Target, color: '#FF7500' },
  { id: 'what-we-do', label: 'What We Do', icon: Gamepad2, color: '#fbbf24' },
  { id: 'philosophy', label: 'Philosophy', icon: Sparkles, color: '#FF7500' },
  { id: 'tribe', label: 'Our Tribe', icon: Users, color: '#fbbf24' },
  { id: 'promise', label: 'Our Promise', icon: Shield, color: '#10b981' },
  { id: 'fugly', label: 'Fugly', icon: Crown, color: '#FF7500' },
];

export default function AboutPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<AboutSection>('mission');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSectionChange = (section: AboutSection) => {
    if (section === activeSection) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(section);
      setIsTransitioning(false);
    }, 150);
  };

  const activeConfig = sections.find(s => s.id === activeSection)!;

  const renderContent = () => {
    switch (activeSection) {
      case 'mission':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 900,
              color: '#FF7500',
              marginBottom: '1.5rem'
            }}>
              WHY WE EXIST
            </h2>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.35rem',
              lineHeight: 1.8,
              marginBottom: '1.5rem',
              maxWidth: '42rem',
              margin: '0 auto 1.5rem'
            }}>
              We make games—and game-modifiers—that break stale routines wide open and replace them with{' '}
              <strong style={{ color: '#FF7500' }}>bold laughter</strong>,{' '}
              <strong style={{ color: '#fbbf24' }}>clever chaos</strong>, and unforgettable{' '}
              <strong style={{ color: '#FF7500' }}>Afterroar™</strong> moments.
            </p>
            <p style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              color: '#fdba74',
              fontStyle: 'italic',
              fontWeight: 500
            }}>
              We're here to reinvent game night, not politely participate in it.
            </p>
          </div>
        );

      case 'what-we-do':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 900,
              color: '#fbbf24',
              marginBottom: '1.5rem'
            }}>
              WHAT WE ACTUALLY DO
            </h2>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.35rem',
              lineHeight: 1.8,
              marginBottom: '2rem',
              maxWidth: '42rem',
              margin: '0 auto 2rem'
            }}>
              We create <strong style={{ color: '#FF7500' }}>original games</strong>,{' '}
              <strong style={{ color: '#fbbf24' }}>chaos-infused rule hacks</strong>, and{' '}
              <strong style={{ color: '#FF7500' }}>playful modifiers</strong> that plug into the games you already love.
            </p>
            <div style={{
              background: 'rgba(251, 191, 36, 0.15)',
              border: '2px solid #fbbf24',
              borderRadius: '1rem',
              padding: '1.5rem 2rem',
              display: 'inline-block'
            }}>
              <p style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 900,
                color: '#fbbf24',
                margin: 0
              }}>
                We don't replace your favorite games—we supercharge them.
              </p>
            </div>
          </div>
        );

      case 'philosophy':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 900,
              color: '#FF7500',
              marginBottom: '1.5rem'
            }}>
              OUR PHILOSOPHY
            </h2>
            <p style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: 900,
              color: '#fbbf24',
              marginBottom: '1.5rem'
            }}>
              We break molds where it matters—not for gimmicks, but for joy.
            </p>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.35rem',
              lineHeight: 1.8,
              marginBottom: '1.5rem',
              maxWidth: '42rem',
              margin: '0 auto 1.5rem'
            }}>
              Full Uproar isn't about tearing down other games. We <em>celebrate</em> them.
              We <em>remix</em> them. We help people play in ways that feel freer, funnier, and more human.
            </p>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              color: '#fdba74',
              fontStyle: 'italic'
            }}>
              We're here to flip expectations, not tables (well… usually).
            </p>
          </div>
        );

      case 'tribe':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 900,
              color: '#fbbf24',
              marginBottom: '1.5rem'
            }}>
              WHO WE BUILD FOR
            </h2>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.35rem',
              lineHeight: 1.8,
              marginBottom: '1.5rem',
              maxWidth: '42rem',
              margin: '0 auto 1.5rem'
            }}>
              We make games for the people who show up to game night ready to{' '}
              <strong style={{ color: '#FF7500' }}>stir the pot</strong>,{' '}
              <strong style={{ color: '#fbbf24' }}>start a ruckus</strong>,{' '}
              <strong style={{ color: '#FF7500' }}>hack the rules</strong>, and{' '}
              <strong style={{ color: '#fbbf24' }}>laugh way too loud</strong>.
            </p>
            <div style={{
              background: 'rgba(255, 117, 0, 0.1)',
              border: '2px solid #FF7500',
              borderRadius: '1rem',
              padding: '1.5rem 2rem',
              display: 'inline-block',
              maxWidth: '36rem'
            }}>
              <p style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                color: '#fdba74',
                margin: 0
              }}>
                If you've ever felt the electric buzz after a night of ridiculous fun—that lingering echo we call the{' '}
                <strong style={{ color: '#FF7500' }}>Afterroar™</strong>—you're one of us.
              </p>
            </div>
          </div>
        );

      case 'promise':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 900,
              color: '#10b981',
              marginBottom: '1.5rem'
            }}>
              OUR PROMISE
            </h2>
            <div style={{
              maxWidth: '36rem',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <p style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', lineHeight: 1.6, margin: 0 }}>
                We proudly support other great game creators.
              </p>
              <p style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', lineHeight: 1.6, margin: 0 }}>
                We don't resell their games, bundle them, or pretend to speak for them.
              </p>
              <p style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', lineHeight: 1.6, color: '#10b981', margin: 0, fontWeight: 500 }}>
                We just love helping players get the most out of the entire world of party games—and we'll always link you straight to the original creators.
              </p>
            </div>
          </div>
        );

      case 'fugly':
        return (
          <div style={{ textAlign: 'center' }}>
            <FuglyLogo size={isMobile ? 100 : 140} style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: 900,
              color: '#FF7500',
              marginBottom: '0.25rem'
            }}>
              FUGLY THE CHAOS GREMLIN
            </h2>
            <p style={{
              color: '#fbbf24',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              fontSize: '1rem',
              letterSpacing: '0.15em'
            }}>
              CHIEF DISRUPTION OFFICER
            </p>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              lineHeight: 1.8,
              maxWidth: '32rem',
              margin: '0 auto 1rem'
            }}>
              He's the id of the company, the voice in your head saying <em>"Do it, it'll be fun,"</em> and the official spirit animal of game-night mischief.
            </p>
            <p style={{
              fontSize: '1.125rem',
              color: '#fdba74',
              fontStyle: 'italic'
            }}>
              He doesn't wear pants. He does wear attitude.
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #111827, #0f172a)',
      color: '#fde68a'
    }}>
      <Navigation />

      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>

        {/* Hero - Identity Statement (Always visible) */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: 900,
            color: '#FF7500',
            marginBottom: '0.5rem',
            lineHeight: 1.3
          }}>
            Full Uproar is the iconoclastic party-game company built for people who want game night to actually feel{' '}
            <span style={{
              background: 'linear-gradient(90deg, #FF7500, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>alive</span>.
          </h1>
        </div>

        {/* Section Navigation - Icon Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? '0.5rem' : '0.75rem',
          marginBottom: '2rem'
        }}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
                  background: isActive
                    ? `linear-gradient(135deg, ${section.color}, ${section.color}cc)`
                    : 'rgba(31, 41, 55, 0.8)',
                  border: `2px solid ${isActive ? section.color : '#374151'}`,
                  borderRadius: '50px',
                  color: isActive ? '#111827' : '#9ca3af',
                  fontWeight: 700,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isActive ? `0 4px 20px ${section.color}40` : 'none'
                }}
              >
                <Icon size={isMobile ? 16 : 18} />
                {!isMobile && section.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          border: `3px solid ${activeConfig.color}`,
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          minHeight: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.3s ease',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
          transitionProperty: 'opacity, transform, border-color',
          transitionDuration: '0.15s'
        }}>
          {renderContent()}
        </div>

        {/* Brand Closer */}
        <div style={{
          marginTop: '3rem',
          background: 'linear-gradient(135deg, #FF7500, #ea580c)',
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem' : '2.5rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#111827',
            lineHeight: 1.6,
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            We're not here to sell you cardboard. We're here to help you{' '}
            <strong>unleash chaos responsibly</strong>, <strong>laugh loudly</strong>,{' '}
            and walk away with a story worth retelling.
          </p>
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            color: '#111827',
            fontWeight: 900,
            margin: 0
          }}>
            Welcome to Full Uproar. Let's break game night—in the best possible way.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ color: '#fdba74', fontSize: '1rem', marginBottom: '1rem' }}>
            Ready to experience the Afterroar™?
          </p>
          <a
            href="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: '#FF7500',
              color: '#111827',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              fontWeight: 900,
              fontSize: '1.125rem',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(255, 117, 0, 0.4)'
            }}
          >
            <Gamepad2 size={24} />
            BROWSE OUR GAMES
          </a>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
