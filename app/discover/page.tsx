'use client';

import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { Gamepad2, Users, BookOpen, HelpCircle, Heart, Compass, ArrowLeft } from 'lucide-react';

const discoverSections = [
  {
    title: 'Our Games',
    description: 'Learn about our game series, how they work, and find the perfect one for your group.',
    href: '/discover/games',
    icon: Gamepad2,
    color: '#f97316',
  },
  {
    title: 'Meet Fugly',
    description: 'The chaos-loving mascot behind everything we do.',
    href: '/discover/fugly',
    icon: Heart,
    color: '#ec4899',
  },
  {
    title: 'About Us',
    description: 'The team behind Full Uproar and our mission to revolutionize game nights.',
    href: '/discover/about',
    icon: Users,
    color: '#8b5cf6',
  },
  {
    title: 'The Line',
    description: 'Our philosophy on chaos, humor, and keeping game nights fun for everyone.',
    href: '/discover/the-line',
    icon: BookOpen,
    color: '#10b981',
  },
  {
    title: 'FAQ',
    description: 'Common questions about ordering, games, shipping, and more.',
    href: '/discover/faq',
    icon: HelpCircle,
    color: '#3b82f6',
  },
  {
    title: 'What is Afterroar?',
    description: 'Discover our subscription service for the ultimate game night experience.',
    href: '/discover/afterroar',
    icon: Compass,
    color: '#fbbf24',
  },
];

export default function DiscoverPage() {
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
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #f97316, #fbbf24, #f97316)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1rem'
          }}>
            Discover Full Uproar
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#fdba74', maxWidth: '600px', margin: '0 auto' }}>
            Learn about our games, meet our team, and explore what makes Full Uproar the home of beautiful chaos.
          </p>
        </div>

        {/* Sections Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {discoverSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #1f2937, #111827)',
                  borderRadius: '1.5rem',
                  padding: '2rem',
                  border: `3px solid ${section.color}40`,
                  transition: 'all 0.3s',
                  height: '100%',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '1rem',
                    background: `linear-gradient(135deg, ${section.color}, ${section.color}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <Icon size={28} color="#fff" />
                  </div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: section.color,
                    marginBottom: '0.75rem'
                  }}>
                    {section.title}
                  </h2>
                  <p style={{
                    color: '#e2e8f0',
                    lineHeight: 1.6
                  }}>
                    {section.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
