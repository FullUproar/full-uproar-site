'use client';

import dynamic from 'next/dynamic';

// Dynamically import the page component to avoid any SSR issues
const DesignComponentsPage = dynamic(
  () => import('../design-components/page'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ padding: '2rem', color: '#9ca3af' }}>
        Loading design components...
      </div>
    )
  }
);

export default function DesignComponentsView() {
  return <DesignComponentsPage />;
}