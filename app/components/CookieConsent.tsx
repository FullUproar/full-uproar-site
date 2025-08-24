'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setShowBanner(true);
        setIsAnimating(true);
      }, 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsAnimating(false);
    setTimeout(() => setShowBanner(false), 300);
    
    // Enable analytics if consent given
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsAnimating(false);
    setTimeout(() => setShowBanner(false), 300);
    
    // Disable analytics if consent declined
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#1f2937',
      borderTop: '3px solid #f97316',
      padding: '1.5rem',
      zIndex: 9999,
      transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          flex: 1,
        }}>
          <Cookie size={32} style={{ color: '#f97316', flexShrink: 0, marginTop: '0.25rem' }} />
          <div>
            <h3 style={{
              color: '#fdba74',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}>
              🍪 We use cookies (the digital kind, not the delicious kind)
            </h3>
            <p style={{
              color: '#cbd5e1',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              marginBottom: '0.5rem',
            }}>
              We use cookies to make your chaos experience better, remember your cart, 
              and see which pages make you laugh the most. No personal data is sold to evil corporations 
              (we keep all the evil in-house).
            </p>
            <Link 
              href="/privacy" 
              style={{
                color: '#94a3b8',
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              Learn more in our Privacy Policy
            </Link>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}>
          <button
            onClick={handleDecline}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.875rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Nah, I'm Good
          </button>
          
          <button
            onClick={handleAccept}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#f97316',
              color: '#111827',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              fontSize: '0.875rem',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Accept Cookies
          </button>

          <button
            onClick={handleDecline}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            aria-label="Close cookie banner"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}