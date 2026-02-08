'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EmailCapture from './EmailCapture';

const FooterLogo = dynamic(() => import('./FooterLogo'), {
  ssr: false,
  loading: () => null
});

export default function GlobalFooter() {
  const pathname = usePathname();

  // Homepage has its own custom footer
  if (pathname === '/') {
    return null;
  }

  return (
    <footer style={{ 
      backgroundColor: '#000', 
      color: '#fff', 
      padding: '3rem 0', 
      textAlign: 'center',
      borderTop: '1px solid #1f2937',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <FooterLogo size={200} style={{ margin: '0 auto 1.5rem auto' }} />
        <p style={{ color: '#9ca3af', fontWeight: 600 }}>
          Professionally ruining game nights since day one
        </p>
        
        <div style={{
          marginTop: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <EmailCapture variant="inline" source="footer" />
        </div>

        <div style={{
          marginTop: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <Link href="/privacy" style={{ 
            color: '#9ca3af', 
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ 
            color: '#9ca3af', 
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            Terms of Service
          </Link>
          <Link href="/returns" style={{ 
            color: '#9ca3af', 
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            Returns & Refunds
          </Link>
          <Link href="/discover/faq" style={{
            color: '#9ca3af',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            FAQ
          </Link>
          <Link href="/connect/contact" style={{
            color: '#9ca3af',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            Contact
          </Link>
          <a href="mailto:support@fulluproar.com" style={{ 
            color: '#9ca3af', 
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            Contact Support
          </a>
        </div>
        
        <p style={{ color: '#9ca3af', fontWeight: 600 }}>
          © {new Date().getFullYear()} Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.
        </p>
      </div>
    </footer>
  );
}