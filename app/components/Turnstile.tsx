'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    turnstile: any;
  }
}

export default function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'dark',
  size = 'normal'
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  // Store callbacks in refs to prevent re-renders from recreating the widget
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  // Update refs when callbacks change
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    // Don't load script multiple times
    if (scriptLoadedRef.current) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      scriptLoadedRef.current = true;
      initWidget();
      return;
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      initWidget();
    };

    document.body.appendChild(script);

    function initWidget() {
      // Wait for Turnstile to be ready
      const checkTurnstile = setInterval(() => {
        if (window.turnstile && containerRef.current && !widgetIdRef.current) {
          clearInterval(checkTurnstile);

          // Render the widget with wrapper callbacks that use refs
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onVerifyRef.current?.(token),
            'error-callback': () => onErrorRef.current?.(),
            'expired-callback': () => onExpireRef.current?.(),
            theme,
            size
          });
        }
      }, 100);

      // Cleanup interval after 10 seconds to prevent memory leak
      setTimeout(() => clearInterval(checkTurnstile), 10000);
    }

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be removed
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, size]); // Only re-run if these change

  return <div ref={containerRef} />;
}
