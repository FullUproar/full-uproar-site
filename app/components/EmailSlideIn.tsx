'use client';

import { useState, useEffect } from 'react';
import EmailCapture from './EmailCapture';

const STORAGE_KEY = 'newsletter-subscribed';
const DISMISS_KEY = 'email-slidein-dismissed';
const SCROLL_THRESHOLD = 0.5; // 50% of page
const DELAY_MS = 20000; // 20 seconds

export default function EmailSlideIn() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Don't show if already subscribed or dismissed this session
    if (
      localStorage.getItem(STORAGE_KEY) === 'true' ||
      sessionStorage.getItem(DISMISS_KEY) === 'true'
    ) {
      return;
    }

    let timeElapsed = false;
    let scrollPassed = false;

    const tryShow = () => {
      if (timeElapsed && scrollPassed) {
        setVisible(true);
      }
    };

    const timer = setTimeout(() => {
      timeElapsed = true;
      tryShow();
    }, DELAY_MS);

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= SCROLL_THRESHOLD) {
        scrollPassed = true;
        tryShow();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleSuccess = () => {
    // Keep showing the success state briefly then hide
    setTimeout(() => setVisible(false), 3000);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        width: '320px',
        maxWidth: 'calc(100vw - 2rem)',
        background: '#111827',
        border: '1px solid rgba(255, 130, 0, 0.3)',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        animation: 'slideInUp 0.4s ease-out',
      }}
    >
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <EmailCapture
        variant="compact"
        source="slide-in"
        onDismiss={handleDismiss}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
