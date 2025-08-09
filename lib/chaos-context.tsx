'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChaosContextType {
  chaosEnabled: boolean;
  toggleChaos: () => void;
  chaosLevel: 'off' | 'mild' | 'full';
  setChaosLevel: (level: 'off' | 'mild' | 'full') => void;
}

const ChaosContext = createContext<ChaosContextType>({
  chaosEnabled: true,
  toggleChaos: () => {},
  chaosLevel: 'full',
  setChaosLevel: () => {},
});

export function ChaosProvider({ children }: { children: React.ReactNode }) {
  const [chaosEnabled, setChaosEnabled] = useState(true);
  const [chaosLevel, setChaosLevel] = useState<'off' | 'mild' | 'full'>('full');

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fugly-chaos-level');
    if (stored) {
      setChaosLevel(stored as 'off' | 'mild' | 'full');
      setChaosEnabled(stored !== 'off');
    }
  }, []);

  const toggleChaos = () => {
    const newEnabled = !chaosEnabled;
    setChaosEnabled(newEnabled);
    const newLevel = newEnabled ? 'full' : 'off';
    setChaosLevel(newLevel);
    localStorage.setItem('fugly-chaos-level', newLevel);
  };

  const handleSetChaosLevel = (level: 'off' | 'mild' | 'full') => {
    setChaosLevel(level);
    setChaosEnabled(level !== 'off');
    localStorage.setItem('fugly-chaos-level', level);
  };

  return (
    <ChaosContext.Provider value={{ 
      chaosEnabled, 
      toggleChaos, 
      chaosLevel, 
      setChaosLevel: handleSetChaosLevel 
    }}>
      {children}
    </ChaosContext.Provider>
  );
}

export const useChaos = () => useContext(ChaosContext);