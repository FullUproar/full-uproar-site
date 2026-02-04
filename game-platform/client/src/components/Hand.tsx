'use client';

import React, { useState, useCallback } from 'react';
import type { Card as CardType } from '@full-uproar/game-platform-core';
import { Card } from './Card';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    padding: '16px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderTop: '2px solid rgba(255, 130, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#FBDB65',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  submitButton: {
    padding: '8px 24px',
    background: '#FF8200',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.2s',
  },
  submitButtonDisabled: {
    background: '#4b5563',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  cards: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto' as const,
    padding: '8px 0',
  },
  selectedInfo: {
    fontSize: '12px',
    color: '#9ca3af',
  },
};

// =============================================================================
// HAND COMPONENT
// =============================================================================

interface HandProps {
  cards: CardType[];
  pickCount?: number; // How many cards to pick (from black card)
  onSubmit?: (cardIds: string[]) => void;
  disabled?: boolean;
}

export function Hand({ cards, pickCount = 1, onSubmit, disabled = false }: HandProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (disabled) return;

      setSelectedCards((prev) => {
        const isSelected = prev.includes(cardId);

        if (isSelected) {
          // Deselect
          return prev.filter((id) => id !== cardId);
        } else if (prev.length < pickCount) {
          // Select (if under limit)
          return [...prev, cardId];
        } else if (pickCount === 1) {
          // Single pick - replace selection
          return [cardId];
        }
        // At limit, can't select more
        return prev;
      });
    },
    [disabled, pickCount]
  );

  const handleSubmit = useCallback(() => {
    if (onSubmit && selectedCards.length === pickCount) {
      onSubmit(selectedCards);
      setSelectedCards([]);
    }
  }, [onSubmit, selectedCards, pickCount]);

  const canSubmit = selectedCards.length === pickCount && !disabled;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <span style={styles.title}>Your Hand</span>
          {pickCount > 1 && (
            <span style={styles.selectedInfo}>
              {' '}
              - Select {pickCount} cards ({selectedCards.length}/{pickCount})
            </span>
          )}
        </div>
        {onSubmit && (
          <button
            style={{
              ...styles.submitButton,
              ...(canSubmit ? {} : styles.submitButtonDisabled),
            }}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit {pickCount > 1 ? 'Cards' : 'Card'}
          </button>
        )}
      </div>

      <div style={styles.cards}>
        {cards.map((card) => {
          const selectedIndex = selectedCards.indexOf(card.id);
          const isSelected = selectedIndex !== -1;

          return (
            <Card
              key={card.id}
              card={card}
              selected={isSelected}
              disabled={disabled}
              onClick={() => handleCardClick(card.id)}
              order={pickCount > 1 && isSelected ? selectedIndex + 1 : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
