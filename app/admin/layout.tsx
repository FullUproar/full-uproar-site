'use client';

import ErrorBoundary from '@/app/components/ErrorBoundary';
import { AdminElevationProvider } from '@/app/components/admin/AdminElevationProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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