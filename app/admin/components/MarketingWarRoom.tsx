'use client';

import React from 'react';
import { Target, TrendingUp, Calendar, Users, Brain, Link2, Zap } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

export default function MarketingWarRoom({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={adminStyles.title}>
          Marketing War Room
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Campaign planning, attribution tracking, and marketing analytics
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div style={{
        ...adminStyles.card,
        textAlign: 'center',
        padding: '60px 40px',
        background: 'rgba(30, 41, 59, 0.8)',
      }}>
        <Target size={64} style={{ color: '#64748b', marginBottom: '20px', opacity: 0.5 }} />
        <h2 style={{ color: '#FBDB65', fontSize: '24px', marginBottom: '16px' }}>
          Marketing Dashboard Coming Soon
        </h2>
        <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 30px' }}>
          This section will include campaign management, multi-touch attribution,
          UTM tracking, and marketing performance analytics.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {[
            { icon: <Calendar size={24} />, title: 'Campaign Planner', desc: 'Multi-channel campaigns' },
            { icon: <TrendingUp size={24} />, title: 'Attribution', desc: 'Track conversion paths' },
            { icon: <Link2 size={24} />, title: 'UTM Builder', desc: 'Generate tracking links' },
            { icon: <Zap size={24} />, title: 'A/B Testing', desc: 'Experiment framework' },
          ].map((feature, index) => (
            <div key={index} style={{
              padding: '20px',
              background: 'rgba(148, 163, 184, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}>
              <div style={{ color: '#64748b', marginBottom: '10px' }}>{feature.icon}</div>
              <h3 style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '4px' }}>{feature.title}</h3>
              <p style={{ color: '#64748b', fontSize: '12px' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '30px' }}>
          Requires integration with ad platforms, email service, and analytics
        </p>
      </div>
    </div>
  );
}
