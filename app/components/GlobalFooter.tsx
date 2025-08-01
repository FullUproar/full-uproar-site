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
    <footer className="mt-auto border-t border-gray-800 bg-gray-900/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          {showLogo && (
            <FooterLogo size={40} />
          )}
          <div className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Full Uproar. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}