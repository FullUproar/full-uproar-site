'use client';

import { useEffect } from 'react';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import { AdminElevationProvider } from '@/app/components/admin/AdminElevationProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add PWA manifest for admin
  useEffect(() => {
    // Add manifest link
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/admin-manifest.json';
    document.head.appendChild(manifestLink);

    // Add theme color
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#0a0a0a';
    document.head.appendChild(themeColor);

    // Add apple mobile web app meta tags
    const appleMobile = document.createElement('meta');
    appleMobile.name = 'apple-mobile-web-app-capable';
    appleMobile.content = 'yes';
    document.head.appendChild(appleMobile);

    const appleStatus = document.createElement('meta');
    appleStatus.name = 'apple-mobile-web-app-status-bar-style';
    appleStatus.content = 'black-translucent';
    document.head.appendChild(appleStatus);

    return () => {
      manifestLink.remove();
      themeColor.remove();
      appleMobile.remove();
      appleStatus.remove();
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log admin panel errors
        console.error('Admin panel error:', error, errorInfo);

        // In production, send to error tracking
        if (process.env.NODE_ENV === 'production') {
          // TODO: Send to Sentry or similar
        }
      }}
    >
      <AdminElevationProvider>
        {children}
      </AdminElevationProvider>
    </ErrorBoundary>
  );
}