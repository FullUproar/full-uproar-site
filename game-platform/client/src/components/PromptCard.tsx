'use client';

import React from 'react';
import type { Card as CardType } from '@full-uproar/game-platform-core';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    background: '#000',
    color: '#fff',
    borderRadius: '12px',
    padding: '24px',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    border: '3px solid #333',
    maxWidth: '400px',
    margin: '0 auto',
  },
  text: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    lineHeight: 1.4,
    flex: 1,
  },
  blank: {
    display: 'inline-block',
    borderBottom: '3px solid #fff',
    minWidth: '100px',
    margin: '0 4px',
  },
  filledBlank: {
    display: 'inline',
    color: '#f97316',
    fontWeight: 'bold' as const,
  },
  footer: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickBadge: {
    background: '#fff',
    color: '#000',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  brand: {
    fontSize: '10px',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
};

// =============================================================================
// PROMPT CARD COMPONENT
// =============================================================================

interface PromptCardProps {
  card: CardType;
  filledAnswers?: string[];
}

export function PromptCard({ card, filledAnswers = [] }: PromptCardProps) {
  const text = card.properties?.text || '';
  const pick = card.properties?.pick || 1;

  // Split text by underscores to find blanks
  const parts = text.split(/(_+)/);
  let answerIndex = 0;

  const renderText = () => {
    return parts.map((part: string, i: number) => {
      if (part.match(/^_+$/)) {
        // This is a blank
        const answer = filledAnswers[answerIndex];
        answerIndex++;

        if (answer) {
          return (
            <span key={i} style={styles.filledBlank}>
              {answer}
            </span>
          );
        }
        return <span key={i} style={styles.blank} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // If no blanks in text, it's a "fill in the end" card
  const hasNoBlanks = !text.includes('_');

  return (
    <div style={styles.container}>
      <div style={styles.text}>
        {renderText()}
        {hasNoBlanks && filledAnswers.length > 0 && (
          <>
            {' '}
            <span style={styles.filledBlank}>{filledAnswers.join(' ')}</span>
          </>
        )}
      </div>
      <div style={styles.footer}>
        {pick > 1 && <span style={styles.pickBadge}>PICK {pick}</span>}
        <span style={styles.brand}>Full Uproar</span>
      </div>
    </div>
  );
}
