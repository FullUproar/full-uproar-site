'use client';

import React, { createContext, useContext } from 'react';

interface ChaosContextType {
  chaosEnabled: boolean;
  toggleChaos: () => void;
}

const ChaosContext = createContext<ChaosContextType>({
  chaosEnabled: true,
  toggleChaos: () => {},
});

export function ChaosProvider({ children }: { children: React.ReactNode }) {
  // Chaos is always enabled - no toggle needed
  return (
    <ChaosContext.Provider value={{
      chaosEnabled: true,
      toggleChaos: () => {}
    }}>
      {children}
    </ChaosContext.Provider>
  );
}

export const useChaos = () => useContext(ChaosContext);
