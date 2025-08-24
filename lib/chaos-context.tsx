'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ChaosContextType {
  chaosEnabled: boolean;
  toggleChaos: () => void;
}

const ChaosContext = createContext<ChaosContextType>({
  chaosEnabled: true,
  toggleChaos: () => {},
});

export function ChaosProvider({ children }: { children: React.ReactNode }) {
  const [chaosEnabled, setChaosEnabled] = useState(true);

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fugly-chaos-enabled');
    if (stored !== null) {
      setChaosEnabled(stored === 'true');
    }
  }, []);

  const toggleChaos = () => {
    const newEnabled = !chaosEnabled;
    setChaosEnabled(newEnabled);
    localStorage.setItem('fugly-chaos-enabled', String(newEnabled));
  };

  return (
    <ChaosContext.Provider value={{ 
      chaosEnabled, 
      toggleChaos
    }}>
      {children}
    </ChaosContext.Provider>
  );
}

export const useChaos = () => useContext(ChaosContext);