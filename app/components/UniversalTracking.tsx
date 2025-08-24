'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    // Google
    gtag: any;
    dataLayer: any;
    // Microsoft
    clarity: any;
    // TikTok
    ttq: any;
    // Pinterest
    pintrk: any;
    // Snapchat
    snaptr: any;
  }
}

interface TrackingConfig {
  // Google
  googleAnalyticsId?: string;
  googleAdsId?: string;
  // Meta/Facebook - already have this
  metaPixelId?: string;
  // Microsoft
  clarityId?: string;
  bingAdsId?: string;
  // TikTok
  tiktokPixelId?: string;
  // Pinterest
  pinterestTagId?: string;
  // Snapchat
  snapchatPixelId?: string;
}

export default function UniversalTracking(config: TrackingConfig) {
  const pathname = usePathname();

  // Track page views across all platforms
  useEffect(() => {
    // Google Analytics
    if (config.googleAnalyticsId && window.gtag) {
      window.gtag('config', config.googleAnalyticsId, {
        page_path: pathname,
      });
    }

    // TikTok
    if (config.tiktokPixelId && window.ttq) {
      window.ttq.page();
    }

    // Pinterest
    if (config.pinterestTagId && window.pintrk) {
      window.pintrk('page');
    }

    // Snapchat
    if (config.snapchatPixelId && window.snaptr) {
      window.snaptr('PAGE_VIEW');
    }
  }, [pathname, config]);

  return (
    <>
      {/* Google Analytics & Ads */}
      {config.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${config.googleAnalyticsId}');
              ${config.googleAdsId ? `gtag('config', '${config.googleAdsId}');` : ''}
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity - FREE and EASY! */}
      {config.clarityId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${config.clarityId}");
          `}
        </Script>
      )}

      {/* TikTok Pixel */}
      {config.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${config.tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* Pinterest Tag */}
      {config.pinterestTagId && (
        <Script id="pinterest-tag" strategy="afterInteractive">
          {`
            !function(e){if(!window.pintrk){window.pintrk = function () {
            window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
              n=window.pintrk;n.queue=[],n.version="3.0";var
              t=document.createElement("script");t.async=!0,t.src=e;var
              r=document.getElementsByTagName("script")[0];
              r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '${config.pinterestTagId}');
            pintrk('page');
          `}
        </Script>
      )}

      {/* Snapchat Pixel */}
      {config.snapchatPixelId && (
        <Script id="snapchat-pixel" strategy="afterInteractive">
          {`
            (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
            {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
            a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
            r.src=n;var u=t.getElementsByTagName(s)[0];
            u.parentNode.insertBefore(r,u);})(window,document,
            'https://sc-static.net/scevent.min.js');
            snaptr('init', '${config.snapchatPixelId}');
            snaptr('track', 'PAGE_VIEW');
          `}
        </Script>
      )}
    </>
  );
}

// Universal tracking events that work across platforms
export const TrackingEvents = {
  trackPurchase: (orderId: string, value: number, items: any[]) => {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        value: value,
        currency: 'USD',
        items: items
      });
    }
    
    // TikTok
    if (window.ttq) {
      window.ttq.track('CompletePayment', {
        content_id: orderId,
        content_type: 'product',
        value: value,
        currency: 'USD',
        quantity: items.length
      });
    }
    
    // Pinterest
    if (window.pintrk) {
      window.pintrk('track', 'checkout', {
        value: value,
        currency: 'USD',
        order_id: orderId,
        order_quantity: items.length
      });
    }
    
    // Snapchat
    if (window.snaptr) {
      window.snaptr('track', 'PURCHASE', {
        transaction_id: orderId,
        currency: 'USD',
        price: value,
        number_items: items.length
      });
    }
  },

  trackAddToCart: (item: any) => {
    // Google
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: item.price,
        items: [item]
      });
    }
    
    // TikTok
    if (window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: item.id,
        content_type: 'product',
        value: item.price,
        currency: 'USD'
      });
    }
    
    // Pinterest
    if (window.pintrk) {
      window.pintrk('track', 'addtocart', {
        value: item.price,
        currency: 'USD',
        product_id: item.id
      });
    }
    
    // Snapchat
    if (window.snaptr) {
      window.snaptr('track', 'ADD_CART', {
        item_ids: [item.id],
        currency: 'USD',
        price: item.price
      });
    }
  },

  trackViewContent: (item: any) => {
    // Google
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: item.price,
        items: [item]
      });
    }
    
    // TikTok
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        content_id: item.id,
        content_type: 'product',
        value: item.price,
        currency: 'USD'
      });
    }
    
    // Pinterest
    if (window.pintrk) {
      window.pintrk('track', 'pagevisit', {
        product_id: item.id,
        value: item.price,
        currency: 'USD'
      });
    }
  },

  trackSignUp: (method: string = 'email') => {
    if (window.gtag) {
      window.gtag('event', 'sign_up', { method });
    }
    if (window.ttq) {
      window.ttq.track('CompleteRegistration');
    }
    if (window.pintrk) {
      window.pintrk('track', 'signup');
    }
    if (window.snaptr) {
      window.snaptr('track', 'SIGN_UP');
    }
  },
};