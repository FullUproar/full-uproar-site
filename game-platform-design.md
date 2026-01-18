# Online Card & Dice Game Platform

## Design Document v1.0

### Overview

A general-purpose online platform for playing card and dice games in real-time, designed primarily for social play alongside voice chat. The platform provides a flexible engine that can support various game types through configuration rather than custom code.

**Primary Test Game:** Cards Against Humanity (CAH)

**Target Use Cases:**
- Playtesting Full Uproar Games titles
- Community game nights
- Subscription box digital components
- Personal use with friends

---

## Core Concepts

### Cards

The atomic unit of card games. Each card has an ID, a type, and arbitrary properties.

```typescript
interface Card {
  id: string
  type: string              // e.g., "white", "black", "action"
  properties: {
    text?: string
    image?: string
    value?: number
    category?: string
    pick?: number           // for prompt cards requiring multiple responses
    blanks?: number         // number of blanks in text (may differ from pick)
    [key: string]: any      // game-specific properties
  }
}
```

### Card Packs

Collections of cards that can be combined. Supports base games and expansions.

```typescript
interface CardPack {
  id: string
  name: string
  description?: string
  official: boolean         // licensed vs custom content
  cards: {
    [deckType: string]: Card[]  // e.g., { white: [...], black: [...] }
  }
}
```

At game start, selected packs merge into unified decks and shuffle.

### Decks

Named collections of cards that form draw piles. A game may have multiple decks.

```typescript
interface Deck {
  id: string
  cards: Card[]             // ordered, index 0 = top
  discardPile: Card[]
}
```

### Zones

Where cards can exist during play:

| Zone Type | Description | Example |
|-----------|-------------|---------|
| **Hand** | Private to a player, variable size | Player's 7 white cards |
| **Slot** | Fixed position(s) with rules | Submission area, prompt display |
| **Pile** | Shared stack (draw/discard) | Draw deck, discard pile |

### Slots

Fixed positions where cards can be placed. The key abstraction for game-specific mechanics.

```typescript
interface SlotDefinition {
  id: string
  name: string
  scope: "global" | "player"
  capacity: number          // max cards allowed
  ordered: boolean          // does order matter?
  visibility: "public" | "owner" | "judge" | "hidden"
  allowedCardTypes?: string[]  // filter what can go here
}
```

**CAH Example Slots:**

| Slot | Scope | Capacity | Visibility | Notes |
|------|-------|----------|------------|-------|
| `hand` | player | 7 (refill target) | owner | white cards only |
| `submission` | player | 1-3 | hidden → judge | ordered for multi-pick |
| `prompt` | global | 1 | public | current black card |
| `scorePile` | player | unlimited | public (count) | won black cards |

### Dice

For games that use dice. Defined by faces and can persist results in game state.

```typescript
interface DieDef {
  id: string
  name: string
  faces: DieFace[]
}

interface DieFace {
  value: number | string
  label?: string
  image?: string
}

interface DieState {
  definition: DieDef
  currentFace?: DieFace
  rolledAt?: timestamp
}
```

---

## Player Model

### Player State

```typescript
interface Player {
  id: string
  name: string
  avatarUrl?: string
  
  // Permissions
  isLead: boolean           // administrative control
  
  // Presence
  presence: PlayerPresence
  lastSeen: timestamp
  joinedAt: timestamp
  
  // Game state (populated during play)
  hand: Card[]
  slots: {
    [slotId: string]: Card[]
  }
  score: number
}

type PlayerPresence = 
  | "active"        // connected and playing
  | "away"          // temporarily unavailable, skip turns
  | "disconnected"  // connection lost, may return
  | "left"          // intentionally quit
```

### Presence Rules

| Presence | Behavior |
|----------|----------|
| `active` | Full participation |
| `away` | Skipped for submissions and judge rotation, hand preserved |
| `disconnected` | Same as away, grace period before treated as left |
| `left` | Hand discarded, removed from rotation, cannot rejoin |

### Role Separation

Two distinct roles that should not be confused:

**Game Lead** - Administrative authority
- Starts game from lobby
- Pause/resume game
- Kick players
- End game early
- Fallback decisions if judge disconnects

**Judge** - Current round role (rotates)
- Draws prompt card
- Selects winning submission

```typescript
interface GameRoles {
  lead: string              // playerId
  judge: string             // playerId (current round)
}
```

### Lead Succession

When lead disconnects or leaves, auto-assign to longest-tenured active player:

```typescript
function assignNewLead(players: Player[]): string | null {
  return players
    .filter(p => p.presence === "active")
    .sort((a, b) => a.joinedAt - b.joinedAt)
    [0]?.id ?? null
}
```

---

## Game Configuration

### Game Definition

Each game type is defined by a configuration object:

```typescript
interface GameDefinition {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  
  // Deck configuration
  decks: {
    [deckId: string]: {
      displayName: string
      cardType: string
    }
  }
  
  // Slot definitions
  slots: SlotDefinition[]
  
  // Default settings
  defaultSettings: GameSettings
  
  // Available variants
  variants: VariantDefinition[]
  
  // Phase definitions
  phases: PhaseDefinition[]
  
  // Starting phase
  initialPhase: string
}
```

### Game Settings

Runtime configuration chosen by host:

```typescript
interface GameSettings {
  handSize: number
  endCondition: "none" | "points" | "rounds"
  endValue?: number
  
  // Timing (optional, for non-VC games)
  submitTimeout?: number    // seconds
  judgeTimeout?: number
  
  // Selected card packs
  packIds: string[]
  
  // Active variants
  activeVariants: string[]
}
```

### Variant Definitions

Toggleable rule modifications:

```typescript
interface VariantDefinition {
  id: string
  name: string
  description: string
  default: boolean
}
```

**CAH Variants:**

| Variant | Description |
|---------|-------------|
| `judgeRotate` | Judge passes clockwise (default) |
| `judgeWinner` | Round winner becomes next judge |
| `judgeRandom` | Random judge each round |
| `rando` | Random card plays each round as fake player |
| `gambling` | Players can bet additional cards |

---

## Game State

### State Structure

```typescript
interface GameState {
  // Metadata
  gameId: string
  definitionId: string
  status: "lobby" | "playing" | "paused" | "ended"
  createdAt: timestamp
  startedAt?: timestamp
  endedAt?: timestamp
  
  // Configuration (locked at game start)
  settings: GameSettings
  activeVariants: string[]
  
  // Roles
  roles: GameRoles
  
  // Players
  players: Player[]
  turnOrder: string[]       // playerIds in rotation order
  
  // Phase
  currentPhase: string
  phaseStartedAt: timestamp
  round: number
  
  // Decks
  decks: {
    [deckId: string]: Deck
  }
  
  // Global slots
  globalSlots: {
    [slotId: string]: Card[]
  }
  
  // Dice (if applicable)
  dice?: {
    [dieId: string]: DieState
  }
  
  // Round-specific state
  roundState: {
    submissions: {
      [playerId: string]: {
        cards: Card[]
        submittedAt: timestamp
      }
    }
    shuffledOrder?: string[]  // anonymized submission order for judging
    winnerId?: string
  }
  
  // History (optional, for replay/debugging)
  history?: GameEvent[]
}
```

---

## Phase System

### Phase Definition

```typescript
interface PhaseDefinition {
  id: string
  name: string
  
  // Who can act in this phase
  activeRoles: ("judge" | "submitters" | "all" | "lead")[]
  
  // Valid actions in this phase
  allowedActions: ActionType[]
  
  // Transition rules
  transitions: PhaseTransition[]
  
  // Timeout behavior (optional)
  timeout?: {
    seconds: number
    action: "auto-transition" | "skip-inactive" | "pause"
  }
}

interface PhaseTransition {
  to: string                // target phase id
  condition: TransitionCondition
  automatic: boolean        // triggered automatically or requires action
}

type TransitionCondition =
  | { type: "allSubmitted" }
  | { type: "judgeSelected" }
  | { type: "timeout" }
  | { type: "action", action: ActionType }
  | { type: "manual" }      // lead triggers manually
```

### CAH Phases

```
LOBBY
  └─→ SETUP (on game start)

SETUP
  ├── Merge selected packs into decks
  ├── Shuffle both decks
  ├── Deal handSize cards to each player
  ├── Assign first judge (random)
  └─→ PROMPT

PROMPT
  ├── Judge draws black card to `prompt` slot
  └─→ SUBMIT

SUBMIT
  ├── Each active non-judge plays to `submission` slot
  ├── Must respect `pick` count on prompt
  ├── Order matters for multi-card submissions
  └─→ REVEAL (when all active submitters have submitted)

REVEAL
  ├── Shuffle submission order (anonymize)
  ├── Expose submissions to judge (and optionally all)
  └─→ JUDGE

JUDGE
  ├── Judge reviews submissions
  ├── Judge selects winner
  └─→ RESOLVE

RESOLVE
  ├── Winner receives black card (increment score)
  ├── Discard all white submissions
  ├── All players draw back to handSize
  ├── Rotate judge (per variant rule)
  ├── Increment round counter
  ├── Check end condition
  └─→ PROMPT (continue) or END (if condition met)

END
  ├── Calculate final standings
  ├── Display results
  └── Option to rematch (→ LOBBY)
```

---

## Actions

### Action Types

Every game interaction is an action. The engine validates actions against current phase rules.

```typescript
type Action =
  | { type: "draw", deckId: string, count: number, toZone: "hand" | string }
  | { type: "play", cardId: string, fromZone: string, toSlot: string, position?: number }
  | { type: "discard", cardId: string, fromZone: string, toDeckId?: string }
  | { type: "reveal", cardId: string }
  | { type: "hide", cardId: string }
  | { type: "shuffle", deckId: string }
  | { type: "roll", dieId: string }
  | { type: "selectWinner", playerId: string }
  | { type: "setPhase", phaseId: string }
  | { type: "nextTurn" }
  | { type: "score", playerId: string, delta: number }
  // Administrative
  | { type: "startGame" }
  | { type: "pauseGame" }
  | { type: "resumeGame" }
  | { type: "endGame" }
  | { type: "kickPlayer", playerId: string }

interface GameAction {
  id: string
  playerId: string          // who performed the action
  action: Action
  timestamp: timestamp
}
```

### Action Validation

Before applying any action, the engine validates:

1. Is the game in a valid status? (playing, not paused)
2. Is this action allowed in the current phase?
3. Does the player have permission? (role check)
4. Is the action valid? (card exists, slot has capacity, etc.)

```typescript
interface ValidationResult {
  valid: boolean
  error?: string
}

function validateAction(state: GameState, action: GameAction): ValidationResult {
  // Implementation checks all conditions
}
```

---

## Events

### Event Types

State changes emit events for real-time sync and history:

```typescript
type GameEvent =
  | { type: "gameCreated", gameId: string, hostId: string }
  | { type: "playerJoined", player: Player }
  | { type: "playerLeft", playerId: string, reason: "left" | "kicked" | "disconnected" }
  | { type: "playerPresenceChanged", playerId: string, presence: PlayerPresence }
  | { type: "gameStarted" }
  | { type: "phaseChanged", from: string, to: string }
  | { type: "cardDrawn", playerId: string, deckId: string, count: number }
  | { type: "cardPlayed", playerId: string, cardId: string, toSlot: string }
  | { type: "cardDiscarded", cardId: string }
  | { type: "submissionsRevealed", submissions: AnonymizedSubmission[] }
  | { type: "winnerSelected", playerId: string, cardIds: string[] }
  | { type: "scoreChanged", playerId: string, newScore: number }
  | { type: "judgeChanged", playerId: string }
  | { type: "leadChanged", playerId: string }
  | { type: "roundEnded", round: number }
  | { type: "gameEnded", winner?: string, finalScores: Record<string, number> }
  | { type: "gamePaused" }
  | { type: "gameResumed" }
  | { type: "dieRolled", dieId: string, result: DieFace }

interface AnonymizedSubmission {
  index: number             // display order (shuffled)
  cards: Card[]
  // playerId intentionally omitted until winner revealed
}
```

---

## Edge Cases

### Judge Disconnection

| Phase | Behavior |
|-------|----------|
| LOBBY | No impact |
| SETUP | No impact (not assigned yet) |
| PROMPT | If disconnected before draw, grace period then reassign |
| SUBMIT | No impact, wait for submissions |
| REVEAL | No impact |
| JUDGE | Grace period (30s), then lead can reassign or auto-reassign to next in rotation |
| RESOLVE | Should complete automatically |

### Lead Disconnection

1. Start grace period (configurable, e.g., 60s)
2. If not reconnected, auto-assign to next longest-tenured active player
3. Notify all players of lead change

### Insufficient Players

| Scenario | Action |
|----------|--------|
| Players drop below minPlayers during LOBBY | Wait for more |
| Players drop below minPlayers during play | Pause game, wait for reconnect or new players |
| All players leave except one | End game, declare winner or no contest |

### Card Exhaustion

| Deck | Behavior |
|------|----------|
| Draw deck empty | Shuffle discard pile into draw deck |
| Both empty | Game cannot continue, end or pause |

---

## Real-Time Architecture

### Recommended Stack

- **Server:** Node.js with Colyseus (purpose-built multiplayer game server)
- **Alternative:** Next.js API routes + Socket.io or Ably for managed WebSockets
- **State Storage:** Redis for active games, Postgres for persistence
- **Client:** React with state sync hooks

### Connection Flow

```
1. Player opens game link
2. Authenticate (or anonymous with display name)
3. Connect WebSocket to game room
4. Receive full current state
5. Subscribe to events
6. Send actions via WebSocket
7. Receive state patches / events
```

### State Synchronization

Two approaches (choose based on complexity):

**Event Sourcing:** Client maintains local state, applies events as they arrive. Good for debugging, replay, undo.

**State Patches:** Server sends minimal diffs after each action. Simpler client logic.

For CAH, **event sourcing** is likely overkill. State patches with full state available on reconnect is sufficient.

### Message Format

```typescript
// Client → Server
interface ClientMessage {
  type: "action"
  action: Action
  requestId: string         // for ack/error correlation
}

// Server → Client
interface ServerMessage =
  | { type: "state", state: GameState }
  | { type: "event", event: GameEvent }
  | { type: "error", requestId: string, error: string }
  | { type: "ack", requestId: string }
```

---

## CAH-Specific Implementation Notes

### Card Text Interpolation

Black cards have blanks (`_____`). For display during judging, interpolate white card text:

```typescript
function interpolatePrompt(blackCard: Card, whiteCards: Card[]): string {
  let result = blackCard.properties.text
  const blanks = blackCard.properties.blanks ?? blackCard.properties.pick ?? 1
  
  for (let i = 0; i < blanks && i < whiteCards.length; i++) {
    result = result.replace("_____", `**${whiteCards[i].properties.text}**`)
  }
  
  // If pick > blanks, append remaining cards
  if (whiteCards.length > blanks) {
    const extras = whiteCards.slice(blanks).map(c => c.properties.text)
    result += " " + extras.join(" ")
  }
  
  return result
}
```

### Multi-Card Submission UI

When `pick > 1`:
- Show numbered drop zones or ordered list
- Allow drag-to-reorder
- Validate correct count before enabling submit
- Display order clearly during judging

### Anonymized Judging

During REVEAL/JUDGE phases:
1. Shuffle submission order
2. Assign display indices (1, 2, 3...)
3. Store mapping server-side: `{ index: playerId }`
4. Send only indices and cards to clients
5. On winner selection, resolve index to playerId

---

## Data Storage Schema

### Postgres Tables

```sql
-- Game definitions (static, loaded at startup)
CREATE TABLE game_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Card packs
CREATE TABLE card_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  official BOOLEAN DEFAULT FALSE,
  cards JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Active/completed games
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  definition_id TEXT REFERENCES game_definitions(id),
  status TEXT NOT NULL,
  settings JSONB NOT NULL,
  state JSONB,              -- null for ended games (archived separately)
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Game history (for replay/analytics)
CREATE TABLE game_events (
  id SERIAL PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  event JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players (if using accounts)
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Next Steps

1. **Implement TypeScript types** - Codify all interfaces in `types.ts`
2. **Build state machine** - Pure functions for state transitions
3. **Create CAH game definition** - JSON config using the schema
4. **Set up Colyseus server** - Room management, state sync
5. **Build React client** - Lobby, game board, card interactions
6. **Import card data** - Parse CAH card lists into pack format
7. **Playtest and iterate**

---

## Open Questions

- [ ] How to handle custom cards created by players mid-game? (CAH "make a haiku" variant)
- [ ] Spectator mode?
- [ ] Text-to-speech integration for reading cards?
- [ ] Mobile-first or desktop-first UI?
- [ ] Integrate with Discord for auth/presence?
