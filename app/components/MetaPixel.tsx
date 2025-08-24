'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

interface MetaPixelProps {
  pixelId: string;
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Meta Pixel
  useEffect(() => {
    if (!pixelId) return;

    // Load Meta Pixel script
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    // Initialize pixel
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }, [pixelId]);

  // Track page views on route changes
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}

// Helper functions for e-commerce events
export const MetaPixelEvents = {
  // Track when item is viewed
  viewContent: (contentId: string, contentName: string, contentType: 'product' | 'product_group', value: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [contentId],
        content_name: contentName,
        content_type: contentType,
        value: value,
        currency: currency
      });
    }
  },

  // Track add to cart
  addToCart: (contentId: string, contentName: string, contentType: 'product' | 'product_group', value: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [contentId],
        content_name: contentName,
        content_type: contentType,
        value: value,
        currency: currency
      });
    }
  },

  // Track checkout initiation
  initiateCheckout: (value: number, numItems: number, contentIds: string[], currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: contentIds,
        value: value,
        num_items: numItems,
        currency: currency
      });
    }
  },

  // Track purchase completion
  purchase: (value: number, contentIds: string[], contentType: string, numItems: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: contentIds,
        content_type: contentType,
        value: value,
        num_items: numItems,
        currency: currency
      });
    }
  },

  // Track search
  search: (searchString: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchString
      });
    }
  },

  // Track lead (newsletter signup, etc.)
  lead: (value?: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        value: value,
        currency: currency
      });
    }
  },

  // Track registration/signup
  completeRegistration: (value?: number, currency: string = 'USD') => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration', {
        value: value,
        currency: currency
      });
    }
  },

  // Custom events
  custom: (eventName: string, parameters?: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
  }
};