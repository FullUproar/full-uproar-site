'use client';

import dynamic from 'next/dynamic';

const FooterLogo = dynamic(() => import('./FooterLogo'), { 
  ssr: false,
  loading: () => null 
});

interface GlobalFooterProps {
  showLogo?: boolean;
}

export default function GlobalFooter({ showLogo = true }: GlobalFooterProps) {
  return (
    <footer className="bg-black text-white py-12 text-center">
      <div className="max-w-7xl mx-auto px-4">
        {showLogo && (
          <FooterLogo size={200} style={{ margin: '0 auto 1.5rem auto' }} />
        )}
        <p className="text-gray-400 font-semibold">
          Professionally ruining game nights since day one
        </p>
        <p className="text-gray-500 mt-8 font-semibold">
          © {new Date().getFullYear()} Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.
        </p>
      </div>
    </footer>
  );
}