'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import GlobalFooter from '../components/GlobalFooter';
import { Zap, Heart, Gamepad2, Sparkles, Target, Shield, Users } from 'lucide-react';
import FuglyLogo from '../components/FuglyLogo';

export default function AboutPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #111827, #1f2937)',
      color: '#fde68a'
    }}>
      <Navigation />

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>

        {/* Section 1: Hero - One-Sentence Identity */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{
            fontSize: isMobile ? '2.25rem' : '3.5rem',
            fontWeight: 900,
            color: '#FF7500',
            marginBottom: '1.5rem',
            lineHeight: 1.2
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

        {/* Section 2: The Mission - Why We Exist */}
        <div style={{
          background: 'rgba(255, 117, 0, 0.1)',
          border: '3px solid #FF7500',
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem' : '2.5rem',
          marginBottom: '3rem',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#FF7500',
            color: '#111827',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            fontWeight: 900,
            fontSize: '0.875rem',
            letterSpacing: '0.1em'
          }}>
            WHY WE EXIST
          </div>

          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            lineHeight: 1.8,
            marginTop: '0.5rem',
            textAlign: 'center'
          }}>
            We make games—and game-modifiers—that break stale routines wide open and replace them with{' '}
            <strong style={{ color: '#FF7500' }}>bold laughter</strong>,{' '}
            <strong style={{ color: '#fbbf24' }}>clever chaos</strong>, and unforgettable{' '}
            <strong style={{ color: '#FF7500' }}>Afterroar™</strong> moments.
            <br /><br />
            <em style={{ color: '#fdba74' }}>We're here to reinvent game night, not politely participate in it.</em>
          </p>
        </div>

        {/* Section 3: What We Actually Do */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2rem',
            fontWeight: 900,
            color: '#FF7500',
            marginBottom: '1.5rem'
          }}>
            WHAT WE ACTUALLY DO
          </h2>

          <div style={{
            background: '#1f2937',
            border: '2px solid #374151',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '42rem',
            margin: '0 auto'
          }}>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '1rem' }}>
              We create <strong style={{ color: '#FF7500' }}>original games</strong>,{' '}
              <strong style={{ color: '#fbbf24' }}>chaos-infused rule hacks</strong>, and{' '}
              <strong style={{ color: '#FF7500' }}>playful modifiers</strong> that plug into the games you already love.
            </p>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#FF7500',
              borderTop: '1px solid #374151',
              paddingTop: '1rem',
              marginBottom: 0
            }}>
              We don't replace your favorite games—we supercharge them.
            </p>
          </div>
        </div>

        {/* Section 4: Our Philosophy - The Iconoclastic Core */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 117, 0, 0.15), rgba(251, 191, 36, 0.1))',
          border: '3px solid #fbbf24',
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem' : '2.5rem',
          marginBottom: '3rem',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fbbf24',
            color: '#111827',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            fontWeight: 900,
            fontSize: '0.875rem',
            letterSpacing: '0.1em'
          }}>
            OUR PHILOSOPHY
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <p style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: 900,
              color: '#fbbf24',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              We break molds where it matters—not for gimmicks, but for joy.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, textAlign: 'center', marginBottom: '1rem' }}>
              Full Uproar isn't about tearing down other games. We <em>celebrate</em> them.
              We <em>remix</em> them. We help people play in ways that feel freer, funnier, and more human.
            </p>
            <p style={{
              fontSize: '1.125rem',
              color: '#fdba74',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              We're here to flip expectations, not tables (well… usually).
            </p>
          </div>
        </div>

        {/* Section 5: The Tribe - Who We Build For */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2rem',
            fontWeight: 900,
            color: '#FF7500',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            WHO WE BUILD FOR
          </h2>

          <div style={{
            background: '#1f2937',
            border: '2px solid #FF7500',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <Users size={40} color="#FF7500" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '1rem' }}>
              We make games for the people who show up to game night ready to{' '}
              <strong style={{ color: '#FF7500' }}>stir the pot</strong>,{' '}
              <strong style={{ color: '#fbbf24' }}>start a ruckus</strong>,{' '}
              <strong style={{ color: '#FF7500' }}>hack the rules</strong>, and{' '}
              <strong style={{ color: '#fbbf24' }}>laugh way too loud</strong>.
            </p>
            <p style={{
              fontSize: '1.125rem',
              color: '#fdba74',
              borderTop: '1px solid #374151',
              paddingTop: '1rem',
              marginBottom: 0
            }}>
              If you've ever felt the electric buzz after a night of ridiculous fun—that lingering echo we call the{' '}
              <strong style={{ color: '#FF7500' }}>Afterroar™</strong>—you're one of us.
            </p>
          </div>
        </div>

        {/* Section 6: High-Road Transparency */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid #10b981',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
            <Shield size={28} color="#10b981" />
            <h3 style={{ color: '#10b981', fontWeight: 900, fontSize: '1.25rem', margin: 0 }}>
              OUR PROMISE
            </h3>
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, textAlign: 'center', marginBottom: '0.75rem' }}>
            We proudly support other great game creators.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, textAlign: 'center', marginBottom: '0.75rem' }}>
            We don't resell their games, bundle them, or pretend to speak for them.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, textAlign: 'center', color: '#fdba74', marginBottom: 0 }}>
            We just love helping players get the most out of the entire world of party games—and we'll always link you straight to the original creators.
          </p>
        </div>

        {/* Section 7: The Mascot - Fugly */}
        <div style={{
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          border: '3px solid #FF7500',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '3rem',
          textAlign: 'center',
          transform: 'rotate(-1deg)'
        }}>
          <FuglyLogo size={120} style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{
            color: '#FF7500',
            fontWeight: 900,
            fontSize: '1.75rem',
            marginBottom: '0.25rem'
          }}>
            FUGLY THE CHAOS GREMLIN
          </h3>
          <p style={{
            color: '#fbbf24',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            fontSize: '1rem',
            letterSpacing: '0.1em'
          }}>
            CHIEF DISRUPTION OFFICER
          </p>
          <p style={{ fontSize: '1.125rem', lineHeight: 1.8, maxWidth: '32rem', margin: '0 auto 1rem' }}>
            He's the id of the company, the voice in your head saying <em>"Do it, it'll be fun,"</em> and the official spirit animal of game-night mischief.
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#fdba74',
            fontStyle: 'italic'
          }}>
            He doesn't wear pants. He does wear attitude.
          </p>
        </div>

        {/* Section 8: The Closer - Brand Promise */}
        <div style={{
          background: 'linear-gradient(135deg, #FF7500, #ea580c)',
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem' : '3rem',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <Sparkles size={40} color="#111827" style={{ marginBottom: '1rem' }} />
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            color: '#111827',
            lineHeight: 1.8,
            fontWeight: 500,
            marginBottom: '1.5rem'
          }}>
            We're not here to sell you cardboard.
          </p>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            color: '#111827',
            lineHeight: 1.8,
            fontWeight: 500,
            marginBottom: '1.5rem'
          }}>
            We're here to help you <strong>unleash chaos responsibly</strong>, <strong>laugh loudly</strong>, and walk away with a story worth retelling.
          </p>
          <p style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            color: '#111827',
            fontWeight: 900,
            marginBottom: 0
          }}>
            Welcome to Full Uproar.<br />
            Let's break game night—in the best possible way.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fdba74', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
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
