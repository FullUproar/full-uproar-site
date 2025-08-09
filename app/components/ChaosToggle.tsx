'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Heart, Volume2, VolumeX, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useChaos } from '@/lib/chaos-context';

export default function ChaosToggle() {
  const { chaosLevel, setChaosLevel } = useChaos();
  const [showMenu, setShowMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getIcon = () => {
    switch(chaosLevel) {
      case 'off': return <Heart size={20} />;
      case 'mild': return <Eye size={20} />;
      case 'full': return <Zap size={20} />;
    }
  };

  const getLabel = () => {
    switch(chaosLevel) {
      case 'off': return 'Sensory-Friendly';
      case 'mild': return 'Mild Chaos';
      case 'full': return 'FULL FUGLY';
    }
  };

  // Calculate dropdown position when menu opens
  useEffect(() => {
    if (showMenu && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // Approximate height of dropdown
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // If not enough space below and more space above, position dropdown above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }

      // Also check horizontal positioning
      if (dropdownRef.current) {
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth) {
          // Adjust position if dropdown goes off screen to the right
          const overflow = dropdownRect.right - window.innerWidth;
          dropdownRef.current.style.right = `${overflow + 10}px`;
        }
      }
    }
  }, [showMenu]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: chaosLevel === 'full' ? '#f97316' : chaosLevel === 'mild' ? '#fdba74' : '#10b981',
          color: chaosLevel === 'off' ? '#fff' : '#111827',
          border: 'none',
          borderRadius: '50px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.3s',
          transform: chaosLevel === 'full' ? 'rotate(-2deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => {
          if (chaosLevel === 'full') {
            e.currentTarget.style.transform = 'rotate(2deg) scale(1.05)';
          } else {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = chaosLevel === 'full' ? 'rotate(-2deg)' : 'rotate(0deg)';
        }}
        aria-label="Toggle chaos level"
      >
        {getIcon()}
        <span style={{ display: 'inline' }}>
          {getLabel()}
        </span>
      </button>

      {showMenu && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div 
            ref={dropdownRef}
            style={{
            position: 'absolute',
            ...(dropdownPosition === 'top' ? {
              bottom: '100%',
              marginBottom: '0.5rem',
            } : {
              top: '100%',
              marginTop: '0.5rem',
            }),
            right: 0,
            background: '#1f2937',
            border: '2px solid #f97316',
            borderRadius: '1rem',
            padding: '1rem',
            minWidth: '250px',
            maxWidth: '90vw',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ 
              color: '#fdba74', 
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}>
              Chaos Control Panel™
            </h3>
            
            <button
              onClick={() => {
                setChaosLevel('full');
                setShowMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem',
                background: chaosLevel === 'full' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                border: chaosLevel === 'full' ? '2px solid #f97316' : '2px solid transparent',
                borderRadius: '0.5rem',
                color: '#fde68a',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = chaosLevel === 'full' ? 'rgba(249, 115, 22, 0.2)' : 'transparent';
              }}
            >
              <Zap size={20} style={{ color: '#f97316' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>FULL FUGLY</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Maximum chaos, animations, and orange
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setChaosLevel('mild');
                setShowMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem',
                background: chaosLevel === 'mild' ? 'rgba(253, 186, 116, 0.2)' : 'transparent',
                border: chaosLevel === 'mild' ? '2px solid #fdba74' : '2px solid transparent',
                borderRadius: '0.5rem',
                color: '#fde68a',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(253, 186, 116, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = chaosLevel === 'mild' ? 'rgba(253, 186, 116, 0.2)' : 'transparent';
              }}
            >
              <Eye size={20} style={{ color: '#fdba74' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Mild Chaos</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Reduced animations, calmer colors
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setChaosLevel('off');
                setShowMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem',
                background: chaosLevel === 'off' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: chaosLevel === 'off' ? '2px solid #10b981' : '2px solid transparent',
                borderRadius: '0.5rem',
                color: '#fde68a',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = chaosLevel === 'off' ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
              }}
            >
              <Heart size={20} style={{ color: '#10b981' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Sensory-Friendly</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  No animations, calming interface
                </div>
              </div>
            </button>

            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #374151',
              fontSize: '0.75rem',
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              {chaosLevel === 'off' ? 
                "Thanks for needing less chaos 💚" :
                chaosLevel === 'mild' ?
                "A reasonable amount of mayhem" :
                "EMBRACE THE MADNESS 🔥"
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}