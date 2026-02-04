'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Heart, Sparkles } from 'lucide-react';
import { useChaos } from '@/lib/chaos-context';

export default function ChaosToggle() {
  const { chaosEnabled, toggleChaos } = useChaos();
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getIcon = () => {
    return chaosEnabled ? <Zap size={20} /> : <Heart size={20} />;
  };

  const getLabel = () => {
    return chaosEnabled ? 'CHAOS ON' : 'Chill Mode';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={toggleChaos}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: chaosEnabled ? '#FF8200' : '#10b981',
          color: chaosEnabled ? '#111827' : '#fff',
          border: 'none',
          borderRadius: '50px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.3s',
          transform: chaosEnabled ? 'rotate(-2deg)' : 'rotate(0deg)',
          animation: chaosEnabled ? 'pulse 2s infinite' : 'none',
        }}
        aria-label="Toggle chaos mode"
      >
        {getIcon()}
        <span style={{ display: 'inline' }}>
          {getLabel()}
        </span>
      </button>

      {showTooltip && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: '#1f2937',
            border: '2px solid #FF8200',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            minWidth: '200px',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ 
            color: '#FBDB65', 
            fontSize: '0.875rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem'
          }}>
            {chaosEnabled ? '🔥 Chaos Mode Active!' : '💚 Chill Mode Active'}
          </div>
          <div style={{ 
            color: '#94a3b8', 
            fontSize: '0.75rem' 
          }}>
            {chaosEnabled 
              ? 'Click to calm things down a bit' 
              : 'Click to unleash the madness!'
            }
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 130, 0, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 130, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 130, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}