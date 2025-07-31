'use client';

import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-8px)',
      marginBottom: '4px'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)',
      marginTop: '4px'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(-8px)',
      marginRight: '4px'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(8px)',
      marginLeft: '4px'
    }
  };

  const arrowStyles = {
    top: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderColor: 'rgba(249, 115, 22, 0.95) transparent transparent transparent',
      borderWidth: '6px 6px 0 6px'
    },
    bottom: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderColor: 'transparent transparent rgba(249, 115, 22, 0.95) transparent',
      borderWidth: '0 6px 6px 6px'
    },
    left: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderColor: 'transparent transparent transparent rgba(249, 115, 22, 0.95)',
      borderWidth: '6px 0 6px 6px'
    },
    right: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderColor: 'transparent rgba(249, 115, 22, 0.95) transparent transparent',
      borderWidth: '6px 6px 6px 0'
    }
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    ...positionStyles[position],
    background: 'rgba(249, 115, 22, 0.95)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    pointerEvents: 'none',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)'
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    ...arrowStyles[position]
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div style={tooltipStyle}>
          {text}
          <div style={arrowStyle} />
        </div>
      )}
    </div>
  );
}