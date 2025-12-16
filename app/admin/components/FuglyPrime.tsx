'use client';

import React from 'react';
import {
  Crown, Gift, Users, Star, Zap, Package,
  Sparkles, Flame, Shield, Diamond, Rocket
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

export default function FuglyPrime({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const upcomingFeatures = [
    {
      icon: <Crown size={32} />,
      title: 'FUGLY PRIME Membership',
      description: 'Monthly subscription with exclusive perks, discounts, and early access to new releases',
      color: '#f97316',
    },
    {
      icon: <Package size={32} />,
      title: 'Monthly Chaos Box',
      description: 'Curated mystery boxes shipped monthly with exclusive merch, games, and surprises',
      color: '#a855f7',
    },
    {
      icon: <Star size={32} />,
      title: 'Loyalty Rewards Program',
      description: 'Earn points on every purchase, unlock tiers, and redeem for exclusive rewards',
      color: '#eab308',
    },
    {
      icon: <Users size={32} />,
      title: 'Affiliate Program',
      description: 'Earn commission by sharing your love for Full Uproar with your community',
      color: '#10b981',
    },
  ];

  const tiers = [
    { name: 'Chaos Rookie', icon: <Star size={16} />, color: '#94a3b8' },
    { name: 'Chaos Player', icon: <Zap size={16} />, color: '#3b82f6' },
    { name: 'Chaos Champion', icon: <Flame size={16} />, color: '#f97316' },
    { name: 'Chaos Master', icon: <Shield size={16} />, color: '#a855f7' },
    { name: 'FUGLY PRIME', icon: <Diamond size={16} />, color: '#fbbf24' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          marginBottom: '1.5rem',
          boxShadow: '0 20px 60px rgba(249, 115, 22, 0.4)',
        }}>
          <Crown size={48} style={{ color: '#fff' }} />
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #f97316, #fbbf24)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          FUGLY PRIME
        </h1>

        <div style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(168, 85, 247, 0.2))',
          borderRadius: '50px',
          border: '2px solid rgba(249, 115, 22, 0.3)',
          marginBottom: '1.5rem',
        }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fbbf24',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <Rocket size={24} />
            Coming Soon
            <Sparkles size={20} />
          </span>
        </div>

        <p style={{
          color: '#94a3b8',
          fontSize: '1.125rem',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          The ultimate membership experience for true chaos enthusiasts.
          Subscriptions, loyalty rewards, and monthly mystery boxes are on the way.
        </p>
      </div>

      {/* Upcoming Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}>
        {upcomingFeatures.map((feature, index) => (
          <div
            key={index}
            style={{
              ...adminStyles.card,
              background: 'linear-gradient(145deg, #1a1f2e 0%, #0f1219 100%)',
              border: `2px solid ${feature.color}33`,
              padding: '2rem',
              textAlign: 'center',
              transition: 'all 0.3s',
            }}
          >
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '1rem',
              background: `${feature.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: feature.color,
            }}>
              {feature.icon}
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.75rem',
            }}>
              {feature.title}
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Loyalty Tiers Preview */}
      <div style={{
        ...adminStyles.card,
        background: 'linear-gradient(145deg, #1a1f2e 0%, #0f1219 100%)',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#f97316',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <Gift size={24} />
          Loyalty Tier Preview
        </h2>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
        }}>
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: `${tier.color}15`,
                borderRadius: '50px',
                border: `2px solid ${tier.color}40`,
              }}
            >
              <span style={{ color: tier.color }}>{tier.icon}</span>
              <span style={{ color: tier.color, fontWeight: 'bold', fontSize: '0.9rem' }}>
                {tier.name}
              </span>
              {index < tiers.length - 1 && (
                <span style={{ color: '#4b5563', marginLeft: '0.5rem' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Teaser */}
      <div style={{
        ...adminStyles.card,
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(168, 85, 247, 0.1))',
        border: '2px solid rgba(249, 115, 22, 0.3)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#fdba74',
          marginBottom: '1rem',
        }}>
          FUGLY PRIME Membership
        </h3>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}>
          <span style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: '#f97316',
          }}>
            $6.66
          </span>
          <span style={{ color: '#94a3b8', fontSize: '1.125rem' }}>/month</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
          or $69/year (save $10.92)
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Stripe subscription integration coming soon
        </p>
      </div>
    </div>
  );
}
