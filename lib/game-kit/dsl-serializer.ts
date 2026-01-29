/**
 * FuScript Serializer
 *
 * Converts game config (JSON) to FuScript - a human-readable game definition format.
 * This allows users to copy/paste/share game definitions easily.
 */

// =============================================================================
// TYPES (matching builder page types)
// =============================================================================

type BlockKind = 'game' | 'round' | 'turn' | 'phase' | 'action' | 'condition' | 'trigger';

interface Block {
  id: string;
  kind: BlockKind;
  type: string;
  name: string;
  description?: string;
  children?: Block[];
  properties?: Record<string, any>;
  collapsed?: boolean;
}

interface CardProperty {
  name: string;
  type: 'string' | 'number' | 'boolean';
  label: string;
  default?: any;
}

interface CardTypeDefinition {
  id: string;
  type: string;
  name: string;
  color: string;
  textColor: string;
  properties: CardProperty[];
}

interface ZoneDefinition {
  id: string;
  name: string;
  scope: 'shared' | 'perPlayer';
  visibility: 'public' | 'private' | 'owner';
}

interface DeckDefinition {
  id: string;
  name: string;
  cardType: string;
  cards: Array<{ id: string; properties: Record<string, any> }>;
}

interface ResourceDefinition {
  id: string;
  name: string;
  initialValue: number;
  min?: number;
  max?: number;
}

export interface GameConfig {
  id: string;
  name: string;
  version?: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  cardTypes: CardTypeDefinition[];
  zones: ZoneDefinition[];
  resources: ResourceDefinition[];
  decks: DeckDefinition[];
  blocks: Block[];
}

// =============================================================================
// SERIALIZER OPTIONS
// =============================================================================

export interface SerializerOptions {
  includeComments?: boolean;
  indentSize?: number;
  includeEmptyDecks?: boolean;
}

const defaultOptions: SerializerOptions = {
  includeComments: true,
  indentSize: 2,
  includeEmptyDecks: false,
};

// =============================================================================
// MAIN SERIALIZER
// =============================================================================

/**
 * Convert a game config to FuScript format
 */
export function gameConfigToFuScript(
  config: GameConfig,
  options: SerializerOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const lines: string[] = [];

  // Header
  lines.push(`// Game: ${config.name}`);
  lines.push(`// Version: ${config.version || '1.0.0'}`);
  if (config.minPlayers && config.maxPlayers) {
    lines.push(`// Players: ${config.minPlayers}-${config.maxPlayers}`);
  }
  if (config.description) {
    lines.push(`// ${config.description}`);
  }
  lines.push('');

  // Components Section
  lines.push('=== COMPONENTS ===');
  lines.push('');

  // Card Types
  if (config.cardTypes.length > 0) {
    for (const cardType of config.cardTypes) {
      lines.push(...serializeCardType(cardType, opts));
      lines.push('');
    }
  }

  // Zones
  if (config.zones.length > 0) {
    for (const zone of config.zones) {
      lines.push(serializeZone(zone));
    }
    lines.push('');
  }

  // Resources
  if (config.resources.length > 0) {
    for (const resource of config.resources) {
      lines.push(serializeResource(resource));
    }
    lines.push('');
  }

  // Decks (summary only - don't list all cards)
  const decksToShow = opts.includeEmptyDecks
    ? config.decks
    : config.decks.filter(d => d.cards.length > 0);

  if (decksToShow.length > 0) {
    for (const deck of decksToShow) {
      lines.push(serializeDeck(deck));
    }
    lines.push('');
  }

  // Flow Section
  lines.push('=== FLOW ===');
  lines.push('');

  // Blocks
  if (config.blocks.length > 0) {
    for (const block of config.blocks) {
      lines.push(...serializeBlock(block, 0, opts));
    }
  } else {
    lines.push('// No game flow defined yet');
  }

  return lines.join('\n');
}

// =============================================================================
// COMPONENT SERIALIZERS
// =============================================================================

function serializeCardType(cardType: CardTypeDefinition, opts: SerializerOptions): string[] {
  const lines: string[] = [];
  lines.push(`CardType "${cardType.name}" {`);
  lines.push(`  color: ${cardType.color}`);
  lines.push(`  textColor: ${cardType.textColor}`);

  if (cardType.properties.length > 0) {
    lines.push('  properties:');
    for (const prop of cardType.properties) {
      const defaultStr = prop.default !== undefined ? ` = ${JSON.stringify(prop.default)}` : '';
      lines.push(`    ${prop.name}: ${prop.type}${defaultStr}`);
    }
  }

  lines.push('}');
  return lines;
}

function serializeZone(zone: ZoneDefinition): string {
  return `Zone ${zone.name} (${zone.scope}, ${zone.visibility})`;
}

function serializeResource(resource: ResourceDefinition): string {
  let constraints = '';
  if (resource.min !== undefined || resource.max !== undefined) {
    const parts = [];
    if (resource.min !== undefined) parts.push(`min: ${resource.min}`);
    if (resource.max !== undefined) parts.push(`max: ${resource.max}`);
    constraints = `, ${parts.join(', ')}`;
  }
  return `Resource ${resource.name} (initial: ${resource.initialValue}${constraints})`;
}

function serializeDeck(deck: DeckDefinition): string {
  return `Deck "${deck.name}" (type: ${deck.cardType}, cards: ${deck.cards.length})`;
}

// =============================================================================
// BLOCK SERIALIZERS
// =============================================================================

function serializeBlock(block: Block, depth: number, opts: SerializerOptions): string[] {
  const indent = ' '.repeat(depth * opts.indentSize!);
  const lines: string[] = [];

  // Get the block header
  const header = getBlockHeader(block);
  const propsStr = serializeBlockProperties(block);

  // Structure blocks with children
  if (block.children && block.children.length > 0) {
    lines.push(`${indent}${header}${propsStr} {`);

    // Add description as comment if present
    if (block.description && opts.includeComments) {
      lines.push(`${indent}  // ${block.description}`);
    }

    for (const child of block.children) {
      lines.push(...serializeBlock(child, depth + 1, opts));
    }

    lines.push(`${indent}}`);
  }
  // Action blocks (single line or multi-line depending on type)
  else {
    const actionLine = serializeAction(block);

    if (block.description && opts.includeComments) {
      lines.push(`${indent}${actionLine}  // ${block.description}`);
    } else {
      lines.push(`${indent}${actionLine}`);
    }
  }

  // Add blank line after major structure blocks
  if (['game', 'round', 'turn'].includes(block.kind)) {
    lines.push('');
  }

  return lines;
}

function getBlockHeader(block: Block): string {
  // Use kind-based naming for structure blocks
  switch (block.kind) {
    case 'game':
      return `Game "${block.name}"`;
    case 'round':
      return `Round "${block.name}"`;
    case 'turn':
      return `Turn "${block.name}"`;
    case 'phase':
      return `Phase "${block.name}"`;
    case 'condition':
      return `If`;
    case 'trigger':
      return `On "${block.name}"`;
    default:
      return block.name;
  }
}

function serializeBlockProperties(block: Block): string {
  const props = block.properties || {};
  const parts: string[] = [];

  // Handle common iteration properties
  if (props.iterate) {
    switch (props.iterate) {
      case 'until':
        if (props.condition) {
          parts.push(`until: ${serializeExpression(props.condition)}`);
        }
        break;
      case 'while':
        if (props.condition) {
          parts.push(`while: ${serializeExpression(props.condition)}`);
        }
        break;
      case 'forEachPlayer':
        parts.push(`forEachPlayer: ${props.order || 'turnOrder'}`);
        break;
      case 'repeat':
        parts.push(`repeat: ${props.count || 1}`);
        break;
    }
  }

  // Handle target properties for turns
  if (props.target) {
    parts.push(`target: ${props.target}`);
  }

  // Handle timeout
  if (props.timeout) {
    parts.push(`timeout: ${props.timeout}s`);
  }

  if (parts.length === 0) return '';
  return ` (${parts.join(', ')})`;
}

function serializeExpression(expr: any): string {
  if (typeof expr === 'string') return expr;
  if (typeof expr === 'number') return String(expr);
  if (typeof expr === 'boolean') return String(expr);

  // Handle common expression patterns
  if (expr && typeof expr === 'object') {
    if (expr.type === 'comparison') {
      return `${expr.left} ${expr.operator} ${expr.right}`;
    }
    if (expr.variable && expr.operator && expr.value !== undefined) {
      return `${expr.variable} ${expr.operator} ${expr.value}`;
    }
  }

  return JSON.stringify(expr);
}

// =============================================================================
// ACTION SERIALIZERS
// =============================================================================

function serializeAction(block: Block): string {
  const props = block.properties || {};
  const type = block.type;

  switch (type) {
    // Card Movement Actions
    case 'draw':
      return `Draw ${props.count || 1} from ${props.from || 'deck'} to ${props.to || 'hand'}`;

    case 'play':
      return `Play ${props.count || 1} from ${props.from || 'hand'} to ${props.to || 'table'}`;

    case 'discard':
      return `Discard ${props.count || 'all'} from ${props.from || 'hand'} to ${props.to || 'discard'}`;

    case 'move':
      return `Move ${props.count || 1} from ${props.from || 'hand'} to ${props.to || 'table'}`;

    case 'shuffle':
      return `Shuffle ${props.zone || 'deck'}`;

    case 'reveal':
      return `Reveal ${props.zone || 'submissions'}${props.shuffle ? ' (shuffled)' : ''}`;

    case 'hide':
      return `Hide ${props.zone || 'hand'}`;

    // Turn Actions
    case 'nextTurn':
      return 'Next turn';

    case 'skipTurn':
      return `Skip ${props.player || 'next player'}`;

    case 'reverseTurnOrder':
      return 'Reverse turn order';

    case 'grantExtraTurn':
      return `Grant extra turn to ${props.player || 'current player'}`;

    // Scoring Actions
    case 'addScore':
    case 'increment':
      return `Add ${props.amount || props.by || 1} to ${props.variable || props.resource || 'score'}`;

    case 'subtractScore':
    case 'decrement':
      return `Subtract ${props.amount || props.by || 1} from ${props.variable || props.resource || 'score'}`;

    case 'setScore':
    case 'set':
      return `Set ${props.variable || props.resource || 'score'} to ${props.value || 0}`;

    // Role Actions
    case 'rotateJudge':
      return 'Rotate judge';

    case 'setJudge':
      return `Set judge to ${props.player || 'winner'}`;

    case 'rotateDealer':
      return 'Rotate dealer';

    // Player Actions
    case 'submit':
      return `${props.who || 'All players'}: Submit ${props.count || 1} from ${props.from || 'hand'}`;

    case 'choose':
      return `${props.who || 'Judge'}: Choose ${props.what || 'winner'} from ${props.from || 'submissions'}`;

    case 'vote':
      return `${props.who || 'All players'}: Vote for ${props.what || 'favorite'}`;

    // Communication
    case 'announce':
      return `Announce "${props.message || props.text || ''}"`;

    case 'prompt':
      return `Prompt ${props.player || 'current player'}: "${props.message || ''}"`;

    // Set Collection (Go Fish, Rummy)
    case 'checkForSets':
      return `Check for sets of ${props.size || 4} (group by: ${props.groupBy || 'rank'})`;

    case 'formSet':
      return `Form set from ${props.cards || 'selected cards'}`;

    case 'scoreSet':
      return `Score set (${props.points || 1} points)`;

    // Request Actions (Go Fish)
    case 'requestCards':
      return `Request ${props.filter || 'cards'} from ${props.target || 'other player'}`;

    // Conditional Actions
    case 'if':
      return `If ${serializeExpression(props.condition)}`;

    case 'else':
      return 'Else';

    case 'elseIf':
      return `Else if ${serializeExpression(props.condition)}`;

    // Timer Actions
    case 'wait':
      return `Wait ${props.duration || 1}s`;

    case 'startTimer':
      return `Start timer (${props.duration || 30}s)`;

    // Comparison Actions (War, etc.)
    case 'compare':
      return `Compare ${props.cards || 'cards'} by ${props.property || 'value'}`;

    case 'highestWins':
      return 'Highest wins';

    case 'lowestWins':
      return 'Lowest wins';

    // Special Card Effects (Uno, etc.)
    case 'applyEffect':
      return `Apply effect: ${props.effect || 'card effect'}`;

    case 'skipNext':
      return 'Skip next player';

    case 'drawPenalty':
      return `${props.player || 'Next player'}: Draw ${props.count || 2} cards`;

    // Betting (Poker)
    case 'bet':
      return `${props.player || 'Current player'}: Bet ${props.amount || 'any'}`;

    case 'call':
      return 'Call';

    case 'raise':
      return `Raise by ${props.amount || 'minimum'}`;

    case 'fold':
      return 'Fold';

    case 'check':
      return 'Check';

    case 'allIn':
      return 'All in';

    // Go Fish / Request Actions
    case 'blindDraw':
      return `Blind draw ${props.count || 1} from ${props.from || 'target player'}`;

    case 'offerHand':
      return `Offer hand to ${props.target || 'other player'}`;

    // Matching Actions (Uno, Crazy Eights)
    case 'matchPlay':
      return `Play matching ${props.match || 'colorOrRank'}`;

    case 'playWild':
      return `Play wild and declare ${props.declareProperty || 'color'}`;

    case 'discardPairs':
      return `Discard all pairs (by ${props.matchBy || 'rank'})`;

    // Meld Actions (Rummy)
    case 'formMeld':
      return `Form ${props.type || 'meld'} (min ${props.minCards || 3} cards)`;

    case 'layOff':
      return `Lay off card to meld`;

    case 'checkBook':
      return `Check for book of ${props.size || 4} (by ${props.groupBy || 'rank'})`;

    // Simultaneous Actions (War, Snap)
    case 'simultaneousReveal':
      return `All players reveal ${props.count || 1} card from ${props.from || 'deck'}`;

    case 'warBattle':
      return `War battle: ${props.faceDown || 3} face-down, ${props.faceUp || 1} face-up`;

    case 'claimPile':
      return `Winner claims all table cards`;

    // Hand Management
    case 'swapHands':
      return `Swap hands with ${props.target || 'target player'}`;

    case 'shuffleHands':
      return `Shuffle and redistribute all hands`;

    // Grid/Memory Actions
    case 'flipAtPosition':
      return `Flip card at position ${props.position !== undefined ? props.position : '?'}`;

    case 'flipBack':
      return `Flip cards back face-down`;

    case 'checkPairMatch':
      return `Check if flipped cards match (by ${props.matchBy || 'rank'})`;

    case 'claimPair':
      return `Claim matched pair`;

    // Elimination Actions
    case 'eliminatePlayer':
      return `Eliminate ${props.player || 'player'}`;

    case 'eliminateOnEmpty':
      return `Eliminate player if hand is empty`;

    case 'lastPlayerWins':
      return `Last remaining player wins`;

    // Default
    default:
      if (Object.keys(props).length > 0) {
        return `${block.name} ${JSON.stringify(props)}`;
      }
      return block.name;
  }
}

// =============================================================================
// HELPER: PARSE FUSCRIPT (for future import feature)
// =============================================================================

/**
 * Validate FuScript syntax (basic check)
 */
export function validateFuScript(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = code.split('\n');

  let braceDepth = 0;
  let inComponentsSection = false;
  let inFlowSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip comments and empty lines
    if (line.startsWith('//') || line === '') continue;

    // Track sections
    if (line === '=== COMPONENTS ===') {
      inComponentsSection = true;
      inFlowSection = false;
      continue;
    }
    if (line === '=== FLOW ===') {
      inComponentsSection = false;
      inFlowSection = true;
      continue;
    }
    if (line.startsWith('=== ') && line.endsWith(' ===')) {
      continue;
    }

    // Track brace depth
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    if (braceDepth < 0) {
      errors.push(`Line ${lineNum}: Unexpected closing brace`);
    }
  }

  if (braceDepth !== 0) {
    errors.push(`Unbalanced braces: ${braceDepth > 0 ? 'missing closing' : 'extra closing'} brace(s)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default gameConfigToFuScript;
