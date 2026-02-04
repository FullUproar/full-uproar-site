'use client';

import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { MessageSquare, Mail, Users, Heart, ArrowLeft } from 'lucide-react';

const connectOptions = [
  {
    title: 'Community Forum',
    description: 'Join discussions, share strategies, and connect with fellow chaos enthusiasts.',
    href: '/connect/forum',
    icon: MessageSquare,
    color: '#FF8200',
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
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            transition: 'color 0.2s'
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Users style={{ width: '2.5rem', height: '2.5rem', color: '#FF8200' }} />
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 900,
              color: '#FF8200',
              margin: 0
            }}>
              Connect
            </h1>
          </div>
          <p style={{ fontSize: '1.25rem', color: '#FBDB65', maxWidth: '600px', margin: '0 auto' }}>
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
          background: 'rgba(255, 130, 0, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 130, 0, 0.3)',
          textAlign: 'center'
        }}>
          <Heart style={{ width: '2rem', height: '2rem', color: '#ec4899', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#FF8200', marginBottom: '0.5rem' }}>
            Follow the Chaos
          </h3>
          <p style={{ color: '#FBDB65', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Stay updated with new games, events, and community highlights on our social channels.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Social links - update hrefs when accounts are ready */}
            <a
              href="https://discord.gg/fulluproar"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: '#5865F2',
                color: '#fff',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              Discord
            </a>
            <a
              href="https://instagram.com/fulluproar"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                color: '#fff',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com/@fulluproar"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: '#000',
                color: '#fff',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                border: '1px solid #333'
              }}
            >
              TikTok
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
