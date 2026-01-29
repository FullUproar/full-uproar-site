'use client';

import React from 'react';

// =============================================================================
// TOKEN TYPES & COLORS
// =============================================================================

type TokenType =
  | 'keyword'    // Round, Turn, Phase, CardType, Zone, Resource, Deck
  | 'action'     // Draw, Play, Shuffle, Add, Submit, etc.
  | 'string'     // "quoted strings"
  | 'number'     // 1, 42, 3.14
  | 'comment'    // // comments
  | 'section'    // === SECTION ===
  | 'operator'   // {, }, (, ), :, =
  | 'property'   // color:, timeout:, until:
  | 'text';      // default text

const tokenColors: Record<TokenType, string> = {
  keyword: '#f97316',   // Orange - structure keywords
  action: '#0ea5e9',    // Sky blue - actions
  string: '#10b981',    // Emerald - strings
  number: '#8b5cf6',    // Purple - numbers
  comment: '#64748b',   // Slate - comments
  section: '#fdba74',   // Light orange - section headers
  operator: '#94a3b8',  // Gray - punctuation
  property: '#a78bfa',  // Light purple - properties
  text: '#e2e8f0',      // Light gray - default
};

// =============================================================================
// TOKENIZER
// =============================================================================

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  'Game', 'Round', 'Turn', 'Phase', 'CardType', 'Zone', 'Resource', 'Deck',
  'If', 'Else', 'On', 'When', 'until', 'while', 'forEachPlayer', 'repeat',
  'target', 'timeout', 'All', 'players'
]);

const ACTIONS = new Set([
  'Draw', 'Play', 'Discard', 'Move', 'Shuffle', 'Reveal', 'Hide',
  'Add', 'Subtract', 'Set', 'Submit', 'Choose', 'Vote', 'Announce', 'Prompt',
  'Next', 'Skip', 'Reverse', 'Grant', 'Rotate', 'Check', 'Form', 'Score',
  'Request', 'Compare', 'Apply', 'Wait', 'Start', 'Bet', 'Call', 'Raise', 'Fold'
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];

  // Check for section headers (=== SECTION ===)
  if (line.trim().startsWith('===') && line.trim().endsWith('===')) {
    tokens.push({ type: 'section', value: line });
    return tokens;
  }

  // Check for full-line comments
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) {
    // Preserve leading whitespace
    const leadingSpace = line.match(/^(\s*)/)?.[1] || '';
    if (leadingSpace) {
      tokens.push({ type: 'text', value: leadingSpace });
    }
    tokens.push({ type: 'comment', value: trimmed });
    return tokens;
  }

  // Tokenize character by character
  let i = 0;
  let currentToken = '';
  let inString = false;
  let stringChar = '';

  while (i < line.length) {
    const char = line[i];

    // Handle strings
    if ((char === '"' || char === "'") && !inString) {
      // Flush current token
      if (currentToken) {
        tokens.push(classifyToken(currentToken));
        currentToken = '';
      }
      inString = true;
      stringChar = char;
      currentToken = char;
      i++;
      continue;
    }

    if (inString) {
      currentToken += char;
      if (char === stringChar) {
        tokens.push({ type: 'string', value: currentToken });
        currentToken = '';
        inString = false;
      }
      i++;
      continue;
    }

    // Handle inline comments
    if (char === '/' && line[i + 1] === '/') {
      // Flush current token
      if (currentToken) {
        tokens.push(classifyToken(currentToken));
        currentToken = '';
      }
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // Handle operators/punctuation
    if ('{}():,='.includes(char)) {
      if (currentToken) {
        tokens.push(classifyToken(currentToken));
        currentToken = '';
      }
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      if (currentToken) {
        tokens.push(classifyToken(currentToken));
        currentToken = '';
      }
      tokens.push({ type: 'text', value: char });
      i++;
      continue;
    }

    // Accumulate token
    currentToken += char;
    i++;
  }

  // Flush remaining token
  if (currentToken) {
    tokens.push(classifyToken(currentToken));
  }

  return tokens;
}

function classifyToken(token: string): Token {
  // Check if it's a number
  if (/^-?\d+(\.\d+)?s?$/.test(token)) {
    return { type: 'number', value: token };
  }

  // Check if it's a property (ends with :)
  if (token.endsWith(':')) {
    return { type: 'property', value: token };
  }

  // Check if it's a keyword
  if (KEYWORDS.has(token)) {
    return { type: 'keyword', value: token };
  }

  // Check if it's an action
  if (ACTIONS.has(token)) {
    return { type: 'action', value: token };
  }

  // Default to text
  return { type: 'text', value: token };
}

// =============================================================================
// COMPONENT
// =============================================================================

interface SyntaxHighlighterProps {
  code: string;
  showLineNumbers?: boolean;
}

export default function SyntaxHighlighter({
  code,
  showLineNumbers = true
}: SyntaxHighlighterProps) {
  const lines = code.split('\n');
  const lineNumberWidth = String(lines.length).length;

  return (
    <pre style={{
      margin: 0,
      padding: '16px',
      background: 'transparent',
      fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
      fontSize: '13px',
      lineHeight: '1.6',
      overflowX: 'auto',
    }}>
      <code>
        {lines.map((line, lineIndex) => {
          const tokens = tokenizeLine(line);

          return (
            <div key={lineIndex} style={{ display: 'flex', minHeight: '1.6em' }}>
              {showLineNumbers && (
                <span style={{
                  width: `${lineNumberWidth + 2}ch`,
                  paddingRight: '16px',
                  color: '#475569',
                  textAlign: 'right',
                  userSelect: 'none',
                  flexShrink: 0,
                }}>
                  {lineIndex + 1}
                </span>
              )}
              <span style={{ flex: 1 }}>
                {tokens.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  tokens.map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      style={{
                        color: tokenColors[token.type],
                        fontWeight: token.type === 'keyword' || token.type === 'section' ? '600' : 'normal',
                        fontStyle: token.type === 'comment' ? 'italic' : 'normal',
                      }}
                    >
                      {token.value}
                    </span>
                  ))
                )}
              </span>
            </div>
          );
        })}
      </code>
    </pre>
  );
}
