'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EmailCapture from './EmailCapture';

const FooterLogo = dynamic(() => import('./FooterLogo'), {
  ssr: false,
  loading: () => null
});

const linkStyle = {
  color: '#9ca3af',
  textDecoration: 'none' as const,
  transition: 'color 0.2s',
  fontSize: '0.85rem',
};

export default function GlobalFooter() {
  const pathname = usePathname();

  // Homepage has its own custom footer
  if (pathname === '/') {
    return null;
  }

  // Pages that already have their own email capture — don't double up in the footer
  const hasPageEmailCapture = pathname.startsWith('/shop') || pathname === '/cart' || pathname.startsWith('/checkout');

  return (
    <footer style={{
      backgroundColor: '#000',
      color: '#fff',
      padding: '2rem 0 1.5rem',
      borderTop: '1px solid #1f2937',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>
        {/* Top row: Logo + tagline on left, email capture on right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <FooterLogo size={100} />
            <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
              Professionally ruining<br />game nights since day one
            </p>
          </div>

          {!hasPageEmailCapture && (
            <EmailCapture variant="inline" source="footer" />
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1f2937', margin: '0 0 1rem' }} />

        {/* Bottom row: links left, copyright right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{
            display: 'flex',
            gap: '1.25rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <Link href="/privacy" style={linkStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={linkStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              Terms of Service
            </Link>
            <Link href="/returns" style={linkStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              Returns & Refunds
            </Link>
            <Link href="/discover/faq" style={linkStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              FAQ
            </Link>
            <Link href="/connect/contact" style={linkStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              Contact
            </Link>
            <a href="mailto:support@fulluproar.com" style={linkStyle}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF8200'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
              Support
            </a>
          </div>

          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} Full Uproar Games Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}