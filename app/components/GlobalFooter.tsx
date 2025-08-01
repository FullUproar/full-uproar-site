'use client';

import dynamic from 'next/dynamic';

const FooterLogo = dynamic(() => import('./FooterLogo'), { 
  ssr: false,
  loading: () => null 
});

export default function GlobalFooter() {
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
        <p style={{ color: '#6b7280', marginTop: '2rem', fontWeight: 600 }}>
          © {new Date().getFullYear()} Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.
        </p>
      </div>
    </footer>
  );
}