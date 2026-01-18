/**
 * Script to parse CAH JSON data and generate card packs
 * Run with: npx ts-node parse-cah-cards.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawCAHData {
  white: string[];
  black: string[];
  packs: Array<{
    name: string;
    white: number[];
    black: number[];
    official: boolean;
  }>;
}

interface Card {
  id: string;
  type: 'white' | 'black';
  properties: {
    text: string;
    pick?: number;
    blanks?: number;
  };
}

interface CardPack {
  id: string;
  name: string;
  description: string;
  official: boolean;
  cards: {
    black: Card[];
    white: Card[];
  };
}

function countBlanks(text: string): number {
  // Count underscores (blanks) in the text
  // CAH uses _ or ____ or similar for blanks
  const matches = text.match(/_+/g);
  return matches ? matches.length : 0;
}

function parseCAHData(): void {
  const jsonPath = path.join(__dirname, 'cah-cards.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data: RawCAHData = JSON.parse(rawData);

  console.log(`Found ${data.white.length} white cards`);
  console.log(`Found ${data.black.length} black cards`);
  console.log(`Found ${data.packs?.length || 0} packs`);

  // Create a combined "all cards" pack
  const allWhiteCards: Card[] = data.white.map((text, i) => ({
    id: `w-${i}`,
    type: 'white' as const,
    properties: { text },
  }));

  const allBlackCards: Card[] = data.black.map((text, i) => {
    const blanks = countBlanks(text);
    return {
      id: `b-${i}`,
      type: 'black' as const,
      properties: {
        text,
        pick: blanks > 0 ? blanks : 1,
        blanks: blanks > 0 ? blanks : 1,
      },
    };
  });

  // Create the combined pack
  const combinedPack: CardPack = {
    id: 'base',
    name: 'Cards Against Humanity - All Cards',
    description: `All CAH cards combined (${allWhiteCards.length} white, ${allBlackCards.length} black)`,
    official: true,
    cards: {
      white: allWhiteCards,
      black: allBlackCards,
    },
  };

  // Generate TypeScript output
  const output = `/**
 * Cards Against Humanity Card Data
 * Generated from cah-all-compact.json
 * Licensed under Creative Commons BY-NC-SA 2.0
 *
 * Total: ${allWhiteCards.length} white cards, ${allBlackCards.length} black cards
 */

import type { CardPack, Card } from '../types.js';

// All white cards (answers)
const whiteCards: Card[] = ${JSON.stringify(allWhiteCards, null, 2)};

// All black cards (prompts)
const blackCards: Card[] = ${JSON.stringify(allBlackCards, null, 2)};

/**
 * Get the combined CAH pack with all cards
 */
export function getCAHPack(): CardPack {
  return {
    id: 'base',
    name: 'Cards Against Humanity',
    description: 'The complete Cards Against Humanity experience',
    official: true,
    cards: {
      white: whiteCards,
      black: blackCards,
    },
  };
}

/**
 * Get all available packs
 */
export function getAllPacks(): CardPack[] {
  return [getCAHPack()];
}

/**
 * Combine multiple packs into one
 */
export function combinePacks(packs: CardPack[]): CardPack {
  const allWhite: Card[] = [];
  const allBlack: Card[] = [];

  for (const pack of packs) {
    allWhite.push(...pack.cards.white);
    allBlack.push(...pack.cards.black);
  }

  return {
    id: 'base',
    name: 'Combined Pack',
    description: \`Combined from: \${packs.map(p => p.name).join(', ')}\`,
    official: false,
    cards: {
      white: allWhite,
      black: allBlack,
    },
  };
}
`;

  const outputPath = path.join(__dirname, 'cah-packs.ts');
  fs.writeFileSync(outputPath, output);
  console.log(`Generated ${outputPath}`);
  console.log(`Total: ${allWhiteCards.length} white cards, ${allBlackCards.length} black cards`);
}

parseCAHData();
