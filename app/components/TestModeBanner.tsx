'use client';

import { useState, useEffect } from 'react';
import { prisma } from '@/lib/prisma';

export default function TestModeBanner() {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // Check test mode status from settings
    const checkTestMode = async () => {
      try {
        const response = await fetch('/api/settings/test-mode');
        const data = await response.json();
        setIsTestMode(data.transactionTestMode || false);
      } catch (error) {
        console.error('Error checking test mode:', error);
      }
    };
    
    checkTestMode();
  }, []);

  if (!isTestMode) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: '#1f2937',
      borderBottom: '2px solid #FF8200',
      padding: '8px',
      textAlign: 'center',
    }}>
      <span style={{
        color: '#FBDB65',
        fontSize: '14px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        fontFamily: 'monospace',
      }}>
        TRANSACTION TEST MODE ACTIVE
      </span>
    </div>
  );
}