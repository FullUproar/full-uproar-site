'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import GlobalFooter from '../components/GlobalFooter';
import { Zap, Heart, Users, Gamepad2, Sparkles, Target } from 'lucide-react';

export default function AboutPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const values = [
    {
      icon: Zap,
      title: 'CHAOS FIRST',
      description: 'We believe the best game nights are the ones nobody saw coming. Predictable is boring.'
    },
    {
      icon: Heart,
      title: 'FRIENDSHIP TESTED',
      description: 'True friendships can survive anything—including our games. Probably.'
    },
    {
      icon: Users,
      title: 'EVERYONE PLAYS',
      description: 'Our games are designed for groups who want to laugh together (and occasionally at each other).'
    },
    {
      icon: Sparkles,
      title: 'BEAUTIFULLY WEIRD',
      description: "Normal is overrated. We make games that embrace the wonderfully strange."
    }
  ];

  const team = [
    {
      name: 'FUGLY',
      role: 'Chief Chaos Officer',
      description: 'An adorable gremlin who lives for game night mayhem. Rumor has it he was born from a cursed dice roll.',
      emoji: '👹'
    },
    {
      name: 'THE HUMANS',
      role: 'Game Designers & Chaos Enablers',
      description: 'A ragtag team of game designers, artists, and chaos enthusiasts who somehow convinced adults to pay them for this.',
      emoji: '🎮'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #111827, #1f2937)',
      color: '#fde68a'
    }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '4rem',
            fontWeight: 900,
            color: '#FF7500',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            ABOUT FULL UPROAR
          </h1>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            color: '#fdba74',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            We're a game company on a mission to make your game nights
            <span style={{ color: '#FF7500', fontWeight: 'bold' }}> unforgettably chaotic</span>.
          </p>
        </div>

        {/* Our Story */}
        <div style={{
          background: 'rgba(255, 117, 0, 0.1)',
          border: '3px solid #FF7500',
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem' : '3rem',
          marginBottom: '4rem',
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
            fontSize: '1rem'
          }}>
            OUR STORY
          </div>

          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Full Uproar started with a simple observation: <strong style={{ color: '#FF7500' }}>game nights are at their best when things go wonderfully wrong</strong>.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Those moments when someone makes an impossible comeback, when an alliance spectacularly betrays itself,
              when the whole table erupts in laughter at an absurd turn of events—<em>that's</em> why we play games together.
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              So we asked ourselves: <strong style={{ color: '#fbbf24' }}>What if we designed games specifically to create those moments?</strong>
            </p>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.8 }}>
              The result is the <strong style={{ color: '#FF7500' }}>Chaos Engine</strong>—our revolutionary game modification system
              that transforms any game you already own into something delightfully unpredictable. Plus a growing collection
              of original games designed from the ground up for maximum chaos.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 900,
            color: '#FF7500',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            WHAT WE BELIEVE
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  style={{
                    background: '#1f2937',
                    border: '2px solid #374151',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      background: 'rgba(255, 117, 0, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={28} color="#FF7500" />
                    </div>
                    <h3 style={{ color: '#FF7500', fontWeight: 900, fontSize: '1.25rem' }}>
                      {value.title}
                    </h3>
                  </div>
                  <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meet the Team */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 900,
            color: '#FF7500',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            MEET THE CHAOS CREW
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '2rem'
          }}>
            {team.map((member, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #1f2937, #111827)',
                  border: '3px solid #FF7500',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textAlign: 'center',
                  transform: `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`
                }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{member.emoji}</div>
                <h3 style={{ color: '#FF7500', fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                  {member.name}
                </h3>
                <p style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {member.role}
                </p>
                <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div style={{
          background: 'linear-gradient(135deg, #FF7500, #ea580c)',
          borderRadius: '1.5rem',
          padding: isMobile ? '2rem' : '3rem',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <Target size={48} color="#111827" style={{ marginBottom: '1rem' }} />
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 900,
            color: '#111827',
            marginBottom: '1rem'
          }}>
            OUR MISSION
          </h2>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            color: '#111827',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            To create games and game experiences that bring people together through
            shared chaos, laughter, and those "I can't believe that just happened" moments
            that become legendary stories.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fdba74', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
            Ready to add some chaos to your game night?
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
              transition: 'all 0.3s'
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
