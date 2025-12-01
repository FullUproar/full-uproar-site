'use client';

import React from 'react';
import { DollarSign, TrendingUp, BarChart3, PieChart, FileText, Calculator } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

export default function FinancialIntelligence({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={adminStyles.title}>
          Financial Intelligence
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Financial reporting and analytics
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div style={{
        ...adminStyles.card,
        textAlign: 'center',
        padding: '60px 40px',
        background: 'rgba(30, 41, 59, 0.8)',
      }}>
        <DollarSign size={64} style={{ color: '#64748b', marginBottom: '20px', opacity: 0.5 }} />
        <h2 style={{ color: '#fde68a', fontSize: '24px', marginBottom: '16px' }}>
          Financial Dashboard Coming Soon
        </h2>
        <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 30px' }}>
          This section will include revenue tracking, expense management, profit &amp; loss statements,
          tax reporting, and cash flow analysis once integrated with your accounting system.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {[
            { icon: <TrendingUp size={24} />, title: 'Revenue Tracking', desc: 'Real-time sales metrics' },
            { icon: <BarChart3 size={24} />, title: 'Expense Analysis', desc: 'Cost breakdown & trends' },
            { icon: <FileText size={24} />, title: 'P&L Statements', desc: 'Automated reporting' },
            { icon: <Calculator size={24} />, title: 'Tax Management', desc: 'Sales tax by state' },
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
          Requires integration with Stripe, accounting software, or manual data entry
        </p>
      </div>
    </div>
  );
}
