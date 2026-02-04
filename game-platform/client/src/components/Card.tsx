'use client';

import React from 'react';
import type { Card as CardType } from '@full-uproar/game-platform-core';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  card: {
    position: 'relative' as const,
    width: '180px',
    minHeight: '240px',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  whiteCard: {
    background: '#ffffff',
    color: '#000000',
    border: '2px solid #e5e5e5',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  blackCard: {
    background: '#000000',
    color: '#ffffff',
    border: '2px solid #333333',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  cardText: {
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: 1.4,
    flex: 1,
  },
  cardFooter: {
    marginTop: '12px',
    fontSize: '11px',
    opacity: 0.6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  selected: {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 8px 24px rgba(255, 130, 0, 0.4)',
    border: '2px solid #FF8200',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  pickBadge: {
    position: 'absolute' as const,
    top: '-8px',
    right: '-8px',
    background: '#FF8200',
    color: '#000',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  orderBadge: {
    position: 'absolute' as const,
    top: '-8px',
    left: '-8px',
    background: '#7D55C7',
    color: '#fff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
};

// =============================================================================
// CARD COMPONENT
// =============================================================================

interface CardProps {
  card: CardType;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  order?: number; // For multi-pick ordering
  showPick?: boolean; // Show pick count for black cards
  faceDown?: boolean; // Show card back instead of content
}

export function Card({
  card,
  selected = false,
  disabled = false,
  onClick,
  order,
  showPick = false,
  faceDown = false,
}: CardProps) {
  const isBlack = card.type === 'black';
  const pickCount = card.properties?.pick ?? 1;

  // Show card back if face down
  if (faceDown) {
    return <CardBack type={isBlack ? 'black' : 'white'} />;
  }

  const cardStyle = {
    ...styles.card,
    ...(isBlack ? styles.blackCard : styles.whiteCard),
    ...(selected ? styles.selected : {}),
    ...(disabled ? styles.disabled : {}),
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-selected={selected}
      aria-disabled={disabled}
    >
      {/* Pick badge for black cards */}
      {isBlack && showPick && pickCount > 1 && (
        <div style={styles.pickBadge}>
          {pickCount}
        </div>
      )}

      {/* Order badge for multi-pick */}
      {order !== undefined && (
        <div style={styles.orderBadge}>
          {order}
        </div>
      )}

      {/* Card text */}
      <div style={styles.cardText}>
        {card.properties?.text ?? ''}
      </div>

      {/* Footer */}
      <div style={styles.cardFooter}>
        {isBlack ? 'Cards Against Humanity' : 'Full Uproar'}
      </div>
    </div>
  );
}

// =============================================================================
// CARD BACK (for hidden cards)
// =============================================================================

interface CardBackProps {
  type: 'white' | 'black';
  count?: number;
}

export function CardBack({ type, count }: CardBackProps) {
  const isBlack = type === 'black';

  const style = {
    ...styles.card,
    ...(isBlack ? styles.blackCard : styles.whiteCard),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <div style={style}>
      <div style={{ fontSize: '48px', opacity: 0.3 }}>?</div>
      {count !== undefined && count > 1 && (
        <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.5 }}>
          x{count}
        </div>
      )}
    </div>
  );
}
