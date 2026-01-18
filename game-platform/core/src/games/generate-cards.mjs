/**
 * Script to parse CAH JSON data and generate card packs
 * Run with: node generate-cards.mjs
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function countBlanks(text) {
  // Count underscores (blanks) in the text
  const matches = text.match(/_+/g);
  return matches ? matches.length : 0;
}

function parseCAHData() {
  const jsonPath = path.join(__dirname, 'cah-cards.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);

  console.log(`Total in dataset: ${data.white.length} white cards, ${data.black.length} black cards`);

  // Filter to only official packs
  const officialPacks = data.packs.filter(p => p.official);
  console.log(`Official packs: ${officialPacks.length}`);

  // Collect indices from official packs only
  const officialWhiteIndices = new Set();
  const officialBlackIndices = new Set();

  for (const pack of officialPacks) {
    if (pack.white) pack.white.forEach(i => officialWhiteIndices.add(i));
    if (pack.black) pack.black.forEach(i => officialBlackIndices.add(i));
  }

  console.log(`Official card indices: ${officialWhiteIndices.size} white, ${officialBlackIndices.size} black`);

  // Create cards from official indices only
  const allWhiteCards = [];
  for (const idx of officialWhiteIndices) {
    const text = data.white[idx];
    if (text) {
      allWhiteCards.push({
        id: `w-${idx}`,
        type: 'white',
        properties: { text },
      });
    }
  }

  const allBlackCards = [];
  for (const idx of officialBlackIndices) {
    const card = data.black[idx];
    if (card) {
      const text = typeof card === 'string' ? card : card.text;
      const pick = typeof card === 'object' ? (card.pick || 1) : 1;
      allBlackCards.push({
        id: `b-${idx}`,
        type: 'black',
        properties: {
          text,
          pick,
          blanks: pick,
        },
      });
    }
  }

  console.log(`Generated: ${allWhiteCards.length} white cards, ${allBlackCards.length} black cards`);

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
const whiteCards: Card[] = ${JSON.stringify(allWhiteCards)};

// All black cards (prompts)
const blackCards: Card[] = ${JSON.stringify(allBlackCards)};

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
