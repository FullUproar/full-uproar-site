'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Dynamically import analytics to avoid SSR issues
    import('@/lib/analytics/analytics').then(({ analytics }) => {
      analytics.init();
      analytics.trackPageView();
    });
  }, []);
  
  useEffect(() => {
    // Track page views on route change
    import('@/lib/analytics/analytics').then(({ analytics }) => {
      analytics.trackPageView();
    });
  }, [pathname]);
  
  return <>{children}</>;
}