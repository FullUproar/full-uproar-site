'use client';

import { TestTube, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TestModeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isTestMode, setIsTestMode] = useState(true);

  useEffect(() => {
    // Check if user has dismissed banner this session
    const dismissed = sessionStorage.getItem('test-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
    
    // Could check env variable here
    // setIsTestMode(process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE !== 'false');
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('test-banner-dismissed', 'true');
  };

  if (!isVisible || !isTestMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 text-white py-2 px-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="h-5 w-5 animate-bounce text-white drop-shadow-md" />
          <span className="font-bold text-sm drop-shadow-md">
            🧪 TEST MODE: Payment simulation active - No real charges will occur!
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss test mode banner"
        >
          <X className="h-4 w-4 text-white drop-shadow-md" />
        </button>
      </div>
    </div>
  );
}