'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Google Analytics
declare global {
  interface Window {
    gtag: any;
    dataLayer: any;
    clarity: any;
  }
}

interface AnalyticsProps {
  gaId?: string;
  clarityId?: string;
  gtmId?: string;
}

export default function Analytics({ gaId, clarityId, gtmId }: AnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (gaId && window.gtag) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, gaId]);

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtmId && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity - Free heatmaps and session recordings */}
      {clarityId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}

// Analytics event helpers
export const AnalyticsEvents = {
  // E-commerce events for Google Analytics 4
  viewItem: (item: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: item.price,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
          item_category: item.category || 'game',
        }]
      });
    }
  },

  addToCart: (item: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: item.price,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          item_category: item.category || 'game',
        }]
      });
    }
  },

  beginCheckout: (items: any[], value: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: value,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: item.category || 'game',
        }))
      });
    }
  },

  purchase: (transactionId: string, items: any[], value: number, tax?: number, shipping?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        tax: tax || 0,
        shipping: shipping || 0,
        currency: 'USD',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: item.category || 'game',
        }))
      });
    }
  },

  // Custom events
  shareProduct: (method: string, contentType: string, itemId: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'share', {
        method: method,
        content_type: contentType,
        item_id: itemId,
      });
    }
  },

  search: (searchTerm: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
      });
    }
  },

  signUp: (method: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        method: method,
      });
    }
  },

  // Track custom conversions
  trackConversion: (conversionLabel: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': conversionLabel,
        'value': value || 0,
        'currency': 'USD'
      });
    }
  },
};