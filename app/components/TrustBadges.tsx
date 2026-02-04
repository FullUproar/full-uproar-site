'use client';

import { Shield, Lock, CreditCard, Award, CheckCircle, Truck, RefreshCw, Headphones } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'horizontal' | 'vertical' | 'compact';
  showAll?: boolean;
}

export default function TrustBadges({ variant = 'horizontal', showAll = true }: TrustBadgesProps) {
  const containerStyle = {
    display: variant === 'vertical' ? 'flex' : 'grid',
    flexDirection: variant === 'vertical' ? 'column' as const : undefined,
    gridTemplateColumns: variant === 'compact' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    padding: '1.5rem',
    background: 'rgba(31, 41, 59, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 130, 0, 0.1)',
    marginTop: '1.5rem',
    marginBottom: '1.5rem'
  };

  const badgeStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: variant === 'compact' ? '0.5rem' : '0.75rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    transition: 'all 0.2s'
  };

  const iconStyle = {
    color: '#10b981',
    flexShrink: 0
  };

  const textStyle = {
    fontSize: variant === 'compact' ? '0.75rem' : '0.875rem',
    color: '#e2e8f0',
    lineHeight: '1.2'
  };

  const titleStyle = {
    fontWeight: 'bold',
    color: '#FBDB65',
    marginBottom: '0.125rem'
  };

  // Stripe-specific security badges
  const stripeBadge = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      background: 'linear-gradient(135deg, #635bff, #4f46e5)',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <Shield size={20} style={{ color: 'white' }} />
      <div>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
          Powered by Stripe
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
          Industry-leading payment security
        </div>
      </div>
    </div>
  );

  const securityBadges = [
    {
      icon: <Lock size={20} />,
      title: 'SSL Encrypted',
      description: '256-bit encryption'
    },
    {
      icon: <Shield size={20} />,
      title: 'PCI Compliant',
      description: 'Level 1 certified'
    },
    {
      icon: <CheckCircle size={20} />,
      title: 'Verified Business',
      description: 'Established 2024'
    },
    {
      icon: <Award size={20} />,
      title: 'Money Back',
      description: '30-day guarantee'
    }
  ];

  const serviceBadges = [
    {
      icon: <Truck size={20} />,
      title: 'Fast Shipping',
      description: '2-5 business days'
    },
    {
      icon: <RefreshCw size={20} />,
      title: 'Easy Returns',
      description: 'No questions asked'
    },
    {
      icon: <Headphones size={20} />,
      title: '24/7 Support',
      description: 'We\'re here to help'
    },
    {
      icon: <CreditCard size={20} />,
      title: 'Secure Checkout',
      description: 'Your data is safe'
    }
  ];

  const badges = showAll ? [...securityBadges, ...serviceBadges] : securityBadges;

  if (variant === 'compact') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginTop: '1rem'
      }}>
        <Lock size={16} style={{ color: '#10b981' }} />
        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>
          Secure Checkout • SSL Encrypted • Powered by Stripe
        </span>
      </div>
    );
  }

  return (
    <>
      {stripeBadge}
      <div style={containerStyle}>
        {badges.slice(0, variant === 'vertical' ? 4 : undefined).map((badge, index) => (
          <div key={index} style={badgeStyle}>
            <div style={iconStyle}>{badge.icon}</div>
            <div>
              <div style={titleStyle}>{badge.title}</div>
              <div style={textStyle}>{badge.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment method icons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '0.5rem' }}>
          We accept:
        </span>
        {/* Payment method SVGs */}
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <rect width="40" height="24" rx="4" fill="#1434CB"/>
          <path d="M16.5 9L14 15H15.5L16.5 12.5L17.5 15H19L16.5 9Z" fill="white"/>
          <path d="M21 9H19.5V15H21V9Z" fill="white"/>
          <path d="M23.5 11C23.5 10.4477 23.9477 10 24.5 10C25.0523 10 25.5 10.4477 25.5 11H27C27 9.61929 25.8807 8.5 24.5 8.5C23.1193 8.5 22 9.61929 22 11C22 12.3807 23.1193 13.5 24.5 13.5C23.1193 13.5 22 14.6193 22 16H23.5C23.5 15.4477 23.9477 15 24.5 15C25.0523 15 25.5 15.4477 25.5 16C25.5 16.5523 25.0523 17 24.5 17C23.9477 17 23.5 16.5523 23.5 16H22C22 17.3807 23.1193 18.5 24.5 18.5C25.8807 18.5 27 17.3807 27 16C27 14.6193 25.8807 13.5 24.5 13.5C25.8807 13.5 27 12.3807 27 11H25.5C25.5 11.5523 25.0523 12 24.5 12C23.9477 12 23.5 11.5523 23.5 11Z" fill="white"/>
        </svg>
        
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <rect width="40" height="24" rx="4" fill="#EB001B"/>
          <circle cx="16" cy="12" r="7" fill="#FF5F00"/>
          <circle cx="24" cy="12" r="7" fill="#F79E1B"/>
          <path d="M20 7C21.66 8.26 22.5 10.07 22.5 12C22.5 13.93 21.66 15.74 20 17C18.34 15.74 17.5 13.93 17.5 12C17.5 10.07 18.34 8.26 20 7Z" fill="#FF5F00"/>
        </svg>

        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <rect width="40" height="24" rx="4" fill="#00579F"/>
          <path d="M18 8H14L11 16H15L15.5 14H17.5L18 16H22L18 8ZM16 12L16.5 10H17L17.5 12H16Z" fill="white"/>
          <path d="M23 8L21 12L19 8H15L19 16H23L27 8H23Z" fill="white"/>
          <path d="M28 8V16H32V14H30V12H32V10H30V10H32V8H28Z" fill="white"/>
        </svg>

        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <rect width="40" height="24" rx="4" fill="#5A31F4"/>
          <path d="M14 9H16V15H14V9Z" fill="white"/>
          <path d="M17 9H19L20 12L21 9H23V15H21V11L20 14H20L19 11V15H17V9Z" fill="white"/>
          <path d="M24 9H26V15H24V9Z" fill="white"/>
        </svg>

        <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
          <rect width="40" height="24" rx="4" fill="#319C44"/>
          <circle cx="20" cy="12" r="8" fill="#FFC803"/>
          <path d="M20 8C20 8 18 10 18 12C18 14 20 16 20 16C20 16 22 14 22 12C22 10 20 8 20 8Z" fill="#319C44"/>
        </svg>
      </div>

      {/* Additional trust text */}
      <div style={{
        textAlign: 'center',
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px'
      }}>
        <div style={{ color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🔒 Your Information is Safe & Secure
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.5' }}>
          This site is protected by SSL encryption and our payment processing partner Stripe is PCI Level 1 certified 
          (the highest level of certification available). We never store your credit card information on our servers.
        </div>
      </div>

      {/* Social proof */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '1.5rem',
        padding: '1rem',
        color: '#e2e8f0',
        fontSize: '0.875rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#FF8200', fontSize: '1.5rem' }}>1,000+</div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Happy Customers</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#FF8200', fontSize: '1.5rem' }}>4.9/5</div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Average Rating</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#FF8200', fontSize: '1.5rem' }}>99%</div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Satisfaction Rate</div>
        </div>
      </div>
    </>
  );
}