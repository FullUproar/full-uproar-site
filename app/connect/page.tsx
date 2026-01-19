'use client';

import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { MessageSquare, Mail, Users, Heart } from 'lucide-react';

const connectOptions = [
  {
    title: 'Community Forum',
    description: 'Join discussions, share strategies, and connect with fellow chaos enthusiasts.',
    href: '/connect/forum',
    icon: MessageSquare,
    color: '#f97316',
  },
  {
    title: 'Contact Us',
    description: 'Questions, feedback, or just want to say hi? We\'d love to hear from you.',
    href: '/connect/contact',
    icon: Mail,
    color: '#3b82f6',
  },
];

export default function ConnectPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Users style={{ width: '2.5rem', height: '2.5rem', color: '#f97316' }} />
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 900,
              color: '#f97316',
              margin: 0
            }}>
              Connect
            </h1>
          </div>
          <p style={{ fontSize: '1.25rem', color: '#fdba74', maxWidth: '600px', margin: '0 auto' }}>
            Join the Full Uproar community and connect with fellow chaos lovers.
          </p>
        </div>

        {/* Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {connectOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.href}
                href={option.href}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #1f2937, #111827)',
                  borderRadius: '1.5rem',
                  padding: '2.5rem',
                  border: `3px solid ${option.color}40`,
                  transition: 'all 0.3s',
                  height: '100%',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${option.color}, ${option.color}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    <Icon size={32} color="#fff" />
                  </div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: option.color,
                    marginBottom: '0.75rem'
                  }}>
                    {option.title}
                  </h2>
                  <p style={{
                    color: '#e2e8f0',
                    lineHeight: 1.6
                  }}>
                    {option.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Social CTA */}
        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          textAlign: 'center'
        }}>
          <Heart style={{ width: '2rem', height: '2rem', color: '#ec4899', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#f97316', marginBottom: '0.5rem' }}>
            Follow the Chaos
          </h3>
          <p style={{ color: '#fdba74', fontSize: '0.875rem' }}>
            Stay updated with new games, events, and community highlights on our social channels.
          </p>
        </div>
      </div>
    </div>
  );
}
