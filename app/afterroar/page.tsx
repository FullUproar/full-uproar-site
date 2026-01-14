'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import GlobalFooter from '../components/GlobalFooter';
import { Check, Sparkles, Package, Zap, Users, Calendar, Trophy, Heart, ArrowRight } from 'lucide-react';

export default function AfterroarPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/afterroar/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'afterroar_page' })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      alert('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      position: 'relative'
    }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(249, 115, 22, 0.2)',
            borderRadius: '50px',
            border: '2px solid rgba(249, 115, 22, 0.4)',
            color: '#f97316',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Coming Soon
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #f97316, #fbbf24, #a855f7)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1.5rem',
            lineHeight: 1.1
          }}>
            Afterroar
          </h1>

          <p style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            color: '#fdba74',
            marginBottom: '1rem',
            fontWeight: 700
          }}>
            Traditions Worth Keeping
          </p>

          <p style={{
            fontSize: '1.25rem',
            color: '#94a3b8',
            maxWidth: '42rem',
            margin: '0 auto 3rem',
            lineHeight: 1.7
          }}>
            Turn your game nights into rituals. The echo, the memory, what sticks after the table is cleared.
          </p>

          <div style={{
            display: 'inline-block',
            padding: '1rem 1.5rem',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '2px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '0.75rem',
            color: '#c084fc',
            fontSize: '1.125rem',
            fontWeight: 'bold'
          }}>
            <Sparkles size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.75rem' }} />
            Free is for events. Paid is for traditions.
          </div>
        </div>

        {/* Tier Comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '2rem',
          marginBottom: '4rem',
          maxWidth: '900px',
          margin: '0 auto 4rem'
        }}>
          {/* Digital Tier */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
            borderRadius: '1.5rem',
            border: '3px solid rgba(249, 115, 22, 0.3)',
            padding: '2rem',
            position: 'relative'
          }}>
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.5rem'
            }}>
              Afterroar
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Digital tools for recurring traditions
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <span style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: '#fff'
              }}>
                $9-12
              </span>
              <span style={{ color: '#94a3b8', fontSize: '1rem' }}>/month</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              {[
                'Recurring game nights (Rituals)',
                'Advanced planning tools',
                'Campaign tracking (RPGs)',
                'Game night history & stats',
                'Verification badge',
                'Member-only community perks'
              ].map((feature, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <Check size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: '0.125rem' }} />
                  <span style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Tier */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1))',
            borderRadius: '1.5rem',
            border: '3px solid #a855f7',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: '#a855f7',
              color: '#fff',
              padding: '0.375rem 0.875rem',
              borderRadius: '50px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Most Popular
            </div>

            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#c084fc',
              marginBottom: '0.5rem'
            }}>
              Afterroar+
            </h3>
            <p style={{ color: '#c4b5fd', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Everything above + monthly box
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <span style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: '#fff'
              }}>
                $19-25
              </span>
              <span style={{ color: '#c4b5fd', fontSize: '1rem' }}>/month</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                border: '2px solid rgba(168, 85, 247, 0.3)'
              }}>
                <Package size={24} style={{ color: '#c084fc', marginBottom: '0.5rem' }} />
                <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.25rem' }}>Monthly Box</p>
                <p style={{ color: '#c4b5fd', fontSize: '0.875rem' }}>
                  Curated games, accessories, exclusive content, and surprises
                </p>
              </div>

              {[
                'All Afterroar digital features',
                'Exclusive comics & expanded universe',
                'Early access to new games',
                'Member-only merch discounts',
                'Priority support'
              ].map((feature, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <Check size={20} style={{ color: '#a855f7', flexShrink: 0, marginTop: '0.125rem' }} />
                  <span style={{ color: '#fff', fontSize: '0.95rem' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto 4rem',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '2px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#f97316',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            What Makes It Worth It?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '2rem'
          }}>
            {[
              { icon: Calendar, title: 'Rituals, Not Just Events', desc: 'Recurring game nights that become traditions your group looks forward to' },
              { icon: Trophy, title: 'Campaigns & Series', desc: 'Track ongoing RPG campaigns and weekly game series with persistent history' },
              { icon: Users, title: 'Build Your Table', desc: 'Tools designed for groups that stick together, not one-off meetups' },
              { icon: Heart, title: 'What Sticks', desc: 'Stats, memories, inside jokes—the stuff that turns game night into legacy' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  background: 'rgba(249, 115, 22, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <item.icon size={24} style={{ color: '#f97316' }} />
                </div>
                <div>
                  <h3 style={{ color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist CTA */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
          borderRadius: '1.5rem',
          border: '3px solid #a855f7',
          padding: '3rem 2rem',
          boxShadow: '0 20px 60px rgba(168, 85, 247, 0.2)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#c084fc',
            marginBottom: '1rem'
          }}>
            Join the Waitlist
          </h2>
          <p style={{
            color: '#94a3b8',
            marginBottom: '2rem',
            fontSize: '1.125rem'
          }}>
            Be the first to know when Afterroar launches. Founding members get special perks.
          </p>

          {!submitted ? (
            <form onSubmit={handleWaitlist} style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#a855f7'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 40px rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 50px rgba(168, 85, 247, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(168, 85, 247, 0.4)';
                }}
              >
                Join Waitlist
                <ArrowRight size={20} />
              </button>
            </form>
          ) : (
            <div style={{
              padding: '2rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.75rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
              <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                You're on the list!
              </p>
              <p style={{ color: '#94a3b8' }}>
                We'll let you know when Afterroar launches. Check your email for confirmation.
              </p>
            </div>
          )}
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
