'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface SymbolHelperProps {
  onInsert: (symbol: string) => void;
  style?: React.CSSProperties;
}

export default function SymbolHelper({ onInsert, style }: SymbolHelperProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const symbols = [
    { symbol: '™', name: 'Trademark', shortcut: 'Alt+0153' },
    { symbol: '®', name: 'Registered', shortcut: 'Alt+0174' },
    { symbol: '©', name: 'Copyright', shortcut: 'Alt+0169' },
  ];

  const defaultStyle = {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  };

  const buttonStyle = {
    padding: '4px 8px',
    background: 'rgba(255, 130, 0, 0.2)',
    border: '1px solid rgba(255, 130, 0, 0.5)',
    borderRadius: '6px',
    color: '#FBDB65',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const tooltipStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: '0',
    marginTop: '8px',
    background: 'rgba(30, 41, 59, 0.95)',
    border: '2px solid rgba(255, 130, 0, 0.5)',
    borderRadius: '8px',
    padding: '12px',
    zIndex: 1000,
    minWidth: '200px',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div style={{ ...defaultStyle, ...style }}>
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          ...buttonStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Info size={14} />
        Symbols
      </button>
      
      {showTooltip && (
        <div style={tooltipStyle}>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#94a3b8' }}>
            Click to insert symbol:
          </div>
          {symbols.map(({ symbol, name, shortcut }) => (
            <button
              key={symbol}
              type="button"
              onClick={() => onInsert(symbol)}
              style={{
                ...buttonStyle,
                display: 'block',
                width: '100%',
                marginBottom: '4px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 130, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 130, 0, 0.2)';
              }}
            >
              <span style={{ fontSize: '16px', marginRight: '8px' }}>{symbol}</span>
              <span style={{ fontSize: '11px', color: '#e2e8f0' }}>{name}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', float: 'right' }}>{shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}