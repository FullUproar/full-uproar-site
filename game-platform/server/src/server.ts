import type * as Party from 'partykit/server';
import type {
  GameState,
  GameAction,
  GameEvent,
  ClientMessage,
  ServerMessage,
  Player,
  SanitizedDeck,
  ClientGameState,
  GameDefinition,
  CardPack,
  GameContext,
} from '@full-uproar/game-platform-core';
import {
  createGame,
  addPlayer,
  removePlayer,
  applyAction,
  CAH_DEFINITION,
  getAllPacks,
  combinePacks,
  generateId,
  now,
} from '@full-uproar/game-platform-core';

// Site URL for loading custom games
const SITE_URL = process.env.SITE_URL || 'https://fulluproar.com';

// =============================================================================
// TYPES
// =============================================================================

interface ConnectionState {
  playerId: string | null;
  playerName: string | null;
}

interface RoomState {
  gameState: GameState | null;
  connections: Map<string, ConnectionState>;
}

// =============================================================================
// GAME ROOM SERVER
// =============================================================================

export default class GameRoom implements Party.Server {
  private state: RoomState = {
    gameState: null,
    connections: new Map(),
  };

  // Game context - can be loaded dynamically for custom games
  private gameContext: GameContext = {
    definition: CAH_DEFINITION,
    packs: [combinePacks(getAllPacks())],
  };

  // Track which custom game is loaded (if any)
  private customGameId: string | null = null;

  constructor(readonly room: Party.Room) {}

  /**
   * Load a custom game definition from the Full Uproar API
   */
  private async loadCustomGame(gameId: string): Promise<GameContext | null> {
    try {
      console.log(`[${this.room.id}] Loading custom game: ${gameId}`);
      const response = await fetch(`${SITE_URL}/api/game-kit/play/${gameId}`);

      if (!response.ok) {
        console.error(`[${this.room.id}] Failed to load custom game: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Convert API response to GameContext format
      const definition = data.definition as GameDefinition;
      const packs = data.packs as CardPack[];

      console.log(`[${this.room.id}] Loaded custom game: ${definition.name} with ${packs.length} packs`);

      return {
        definition,
        packs,
      };
    } catch (error) {
      console.error(`[${this.room.id}] Error loading custom game:`, error);
      return null;
    }
  }

  // Called when the party starts (room is created)
  async onStart() {
    // Load any persisted state
    const stored = await this.room.storage.get<GameState>('gameState');
    if (stored) {
      this.state.gameState = stored;
    }
  }

  // Called when a client connects
  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    // Initialize connection state
    this.state.connections.set(connection.id, {
      playerId: null,
      playerName: null,
    });

    // Send current game state to the new connection (sanitized to reduce payload)
    this.sendToConnection(connection, {
      type: 'gameState',
      state: this.sanitizeStateForClient(this.state.gameState),
    });

    console.log(`[${this.room.id}] Client connected: ${connection.id}`);
  }

  // Called when a client disconnects
  onClose(connection: Party.Connection) {
    const connState = this.state.connections.get(connection.id);

    if (connState?.playerId && this.state.gameState) {
      // Mark player as disconnected (but don't remove them immediately)
      const player = this.state.gameState.players.find(
        (p) => p.id === connState.playerId
      );

      if (player) {
        // Update player presence
        const result = this.applyGameAction(connState.playerId, {
          type: 'setPresence',
          presence: 'disconnected',
        });

        if (result) {
          this.broadcastGameState();
        }
      }
    }

    this.state.connections.delete(connection.id);
    console.log(`[${this.room.id}] Client disconnected: ${connection.id}`);
  }

  // Called when a message is received from a client
  async onMessage(message: string, sender: Party.Connection) {
    try {
      let parsed: ClientMessage;

      try {
        parsed = JSON.parse(message);
      } catch {
        this.sendError(sender, 'Invalid message format');
        return;
      }

      const connState = this.state.connections.get(sender.id);
      if (!connState) {
        this.sendError(sender, 'Connection not found');
        return;
      }

      console.log(`[${this.room.id}] Message from ${sender.id}:`, parsed.type);

      switch (parsed.type) {
        case 'createGame':
          await this.handleCreateGame(sender, connState, parsed.playerName, parsed.gameId);
          break;

        case 'joinGame':
          await this.handleJoinGame(sender, connState, parsed.playerName);
          break;

        case 'rejoinGame':
          await this.handleRejoinGame(sender, connState, parsed.playerId, parsed.playerName);
          break;

        case 'leaveGame':
          await this.handleLeaveGame(sender, connState);
          break;

        case 'action':
          await this.handleAction(sender, connState, parsed.action);
          break;

        // Proxy player handlers (lead only)
        case 'addProxy':
          await this.handleAddProxy(sender, connState, parsed.playerName);
          break;

        case 'removeProxy':
          await this.handleRemoveProxy(sender, connState, parsed.playerId);
          break;

        case 'proxyAction':
          await this.handleProxyAction(sender, connState, parsed.playerId, parsed.action);
          break;

        default:
          this.sendError(sender, `Unknown message type: ${(parsed as any).type}`);
      }
    } catch (err) {
      console.error(`[${this.room.id}] onMessage error:`, err);
      this.sendError(sender, `Server error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // MESSAGE HANDLERS
  // =============================================================================

  private async handleCreateGame(
    connection: Party.Connection,
    connState: ConnectionState,
    playerName: string,
    customGameId?: string
  ) {
    if (this.state.gameState) {
      this.sendError(connection, 'Game already exists in this room');
      return;
    }

    // Load custom game if specified
    if (customGameId) {
      const customContext = await this.loadCustomGame(customGameId);
      if (!customContext) {
        this.sendError(connection, 'Failed to load custom game');
        return;
      }
      this.gameContext = customContext;
      this.customGameId = customGameId;
      console.log(`[${this.room.id}] Using custom game: ${customContext.definition.name}`);
    } else {
      // Reset to default CAH
      this.gameContext = {
        definition: CAH_DEFINITION,
        packs: [combinePacks(getAllPacks())],
      };
      this.customGameId = null;
      console.log(`[${this.room.id}] Using default CAH game`);
    }

    const playerId = generateId();
    const gameId = this.room.id;

    // Create the game with the appropriate definition
    let gameState = createGame(gameId, playerId, this.gameContext.definition);

    // Add the host as a player
    const result = addPlayer(gameState, {
      id: playerId,
      name: playerName,
      isLead: true,
      presence: 'active',
      joinedAt: now(),
    });

    gameState = result.state;

    // Update connection state
    connState.playerId = playerId;
    connState.playerName = playerName;

    // Save and broadcast
    this.state.gameState = gameState;
    await this.persistState();

    this.sendToConnection(connection, {
      type: 'joined',
      playerId,
      gameState: this.sanitizeStateForClient(gameState)!,
    });

    this.broadcastEvents(result.events);
  }

  private async handleJoinGame(
    connection: Party.Connection,
    connState: ConnectionState,
    playerName: string
  ) {
    if (!this.state.gameState) {
      this.sendError(connection, 'No game exists in this room');
      return;
    }

    if (this.state.gameState.status !== 'lobby') {
      this.sendError(connection, 'Game has already started');
      return;
    }

    const playerId = generateId();

    // Add player to the game
    const result = addPlayer(this.state.gameState, {
      id: playerId,
      name: playerName,
      isLead: false,
      presence: 'active',
      joinedAt: now(),
    });

    // Update connection state
    connState.playerId = playerId;
    connState.playerName = playerName;

    // Save and broadcast
    this.state.gameState = result.state;
    await this.persistState();

    this.sendToConnection(connection, {
      type: 'joined',
      playerId,
      gameState: this.sanitizeStateForClient(result.state)!,
    });

    this.broadcastGameState();
    this.broadcastEvents(result.events);
  }

  private async handleRejoinGame(
    connection: Party.Connection,
    connState: ConnectionState,
    playerId: string,
    playerName: string
  ) {
    if (!this.state.gameState) {
      this.sendError(connection, 'No game exists in this room');
      return;
    }

    // Find the player in the game
    const player = this.state.gameState.players.find(p => p.id === playerId);

    if (!player) {
      // Player not found, fall back to regular join if in lobby
      if (this.state.gameState.status === 'lobby') {
        await this.handleJoinGame(connection, connState, playerName);
      } else {
        this.sendError(connection, 'Player not found and game has already started');
      }
      return;
    }

    // Check if player name matches (security check)
    if (player.name !== playerName) {
      this.sendError(connection, 'Player name mismatch');
      return;
    }

    // Update player presence back to active
    const result = this.applyGameAction(playerId, {
      type: 'setPresence',
      presence: 'active',
    });

    // Update connection state
    connState.playerId = playerId;
    connState.playerName = playerName;

    // Save and broadcast
    await this.persistState();

    this.sendToConnection(connection, {
      type: 'joined',
      playerId,
      gameState: this.sanitizeStateForClient(this.state.gameState)!,
    });

    this.broadcastGameState();
    if (result) {
      this.broadcastEvents(result.events);
    }

    console.log(`[${this.room.id}] Player ${playerName} rejoined the game`);
  }

  private async handleLeaveGame(
    connection: Party.Connection,
    connState: ConnectionState
  ) {
    if (!connState.playerId || !this.state.gameState) {
      return;
    }

    const result = removePlayer(this.state.gameState, connState.playerId, 'left');

    // Update connection state
    connState.playerId = null;
    connState.playerName = null;

    // Save and broadcast
    this.state.gameState = result.state;
    await this.persistState();

    this.sendToConnection(connection, {
      type: 'left',
    });

    this.broadcastGameState();
    this.broadcastEvents(result.events);
  }

  private async handleAction(
    connection: Party.Connection,
    connState: ConnectionState,
    action: GameAction['action']
  ) {
    try {
      console.log(`[${this.room.id}] handleAction called, playerId: ${connState.playerId}, hasGameState: ${!!this.state.gameState}`);

      if (!connState.playerId || !this.state.gameState) {
        console.log(`[${this.room.id}] Not in a game - playerId: ${connState.playerId}`);
        this.sendError(connection, 'Not in a game');
        return;
      }

      console.log(`[${this.room.id}] Processing action: ${action.type}`);
      const startTime = Date.now();

      const result = this.applyGameAction(connState.playerId, action);

      if (!result) {
        console.log(`[${this.room.id}] Action failed - applyGameAction returned null`);
        this.sendError(connection, 'Action failed');
        return;
      }

      console.log(`[${this.room.id}] Action applied in ${Date.now() - startTime}ms`);

      await this.persistState();
      console.log(`[${this.room.id}] State persisted in ${Date.now() - startTime}ms`);

      this.broadcastGameState();
      console.log(`[${this.room.id}] State broadcast in ${Date.now() - startTime}ms`);

      this.broadcastEvents(result.events);
    } catch (err) {
      console.error(`[${this.room.id}] handleAction error:`, err);
      this.sendError(connection, `Action error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // =============================================================================
  // PROXY PLAYER HANDLERS (IRL players managed by lead)
  // =============================================================================

  private async handleAddProxy(
    connection: Party.Connection,
    connState: ConnectionState,
    playerName: string
  ) {
    if (!this.state.gameState) {
      this.sendError(connection, 'No game exists');
      return;
    }

    // Only lead can add proxy players
    const leadPlayer = this.state.gameState.players.find(p => p.id === connState.playerId);
    if (!leadPlayer?.isLead) {
      this.sendError(connection, 'Only the host can add IRL players');
      return;
    }

    // Check if name is already taken
    const nameTaken = this.state.gameState.players.some(
      p => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameTaken) {
      this.sendError(connection, 'Name already taken');
      return;
    }

    // Create proxy player
    const proxyId = generateId();
    const result = addPlayer(this.state.gameState, {
      id: proxyId,
      name: playerName,
      isLead: false,
      presence: 'active',
      joinedAt: now(),
      isProxy: true,
      proxyManagedBy: connState.playerId!,
    });

    this.state.gameState = result.state;
    await this.persistState();
    this.broadcastGameState();
    this.broadcastEvents(result.events);

    console.log(`[${this.room.id}] Proxy player added: ${playerName} (${proxyId})`);
  }

  private async handleRemoveProxy(
    connection: Party.Connection,
    connState: ConnectionState,
    proxyId: string
  ) {
    if (!this.state.gameState) {
      this.sendError(connection, 'No game exists');
      return;
    }

    // Only lead can remove proxy players
    const leadPlayer = this.state.gameState.players.find(p => p.id === connState.playerId);
    if (!leadPlayer?.isLead) {
      this.sendError(connection, 'Only the host can remove IRL players');
      return;
    }

    // Find the proxy player
    const proxyPlayer = this.state.gameState.players.find(p => p.id === proxyId);
    if (!proxyPlayer || !proxyPlayer.isProxy) {
      this.sendError(connection, 'Player not found or not an IRL player');
      return;
    }

    // Remove proxy player
    const result = removePlayer(this.state.gameState, proxyId);

    this.state.gameState = result.state;
    await this.persistState();
    this.broadcastGameState();
    this.broadcastEvents(result.events);

    console.log(`[${this.room.id}] Proxy player removed: ${proxyPlayer.name} (${proxyId})`);
  }

  private async handleProxyAction(
    connection: Party.Connection,
    connState: ConnectionState,
    proxyId: string,
    action: GameAction['action']
  ) {
    if (!this.state.gameState) {
      this.sendError(connection, 'No game exists');
      return;
    }

    // Only lead can perform actions for proxy players
    const leadPlayer = this.state.gameState.players.find(p => p.id === connState.playerId);
    if (!leadPlayer?.isLead) {
      this.sendError(connection, 'Only the host can control IRL players');
      return;
    }

    // Verify proxy player exists and is managed by this lead
    const proxyPlayer = this.state.gameState.players.find(p => p.id === proxyId);
    if (!proxyPlayer || !proxyPlayer.isProxy || proxyPlayer.proxyManagedBy !== connState.playerId) {
      this.sendError(connection, 'Invalid proxy player');
      return;
    }

    // Apply the action on behalf of the proxy player
    const result = this.applyGameAction(proxyId, action);
    if (!result) {
      this.sendError(connection, 'Action failed');
      return;
    }

    await this.persistState();
    this.broadcastGameState();
    this.broadcastEvents(result.events);

    console.log(`[${this.room.id}] Proxy action: ${action.type} for ${proxyPlayer.name}`);
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  /**
   * Sanitize game state for client consumption
   * Strips full deck contents (4,000+ cards) to prevent massive JSON payloads
   * that would freeze browsers during parsing
   */
  private sanitizeStateForClient(state: GameState | null): ClientGameState | null {
    if (!state) return null;

    // Convert decks to sanitized version (just counts, not contents)
    const sanitizedDecks: { [deckId: string]: SanitizedDeck } = {};
    for (const [deckId, deck] of Object.entries(state.decks)) {
      sanitizedDecks[deckId] = {
        id: deck.id,
        cardsRemaining: deck.cards.length,
        discardCount: deck.discardPile.length,
      };
    }

    // Return state with sanitized decks
    const sanitized = {
      ...state,
      decks: sanitizedDecks,
    } as ClientGameState;

    // Debug: Log payload size
    const jsonSize = JSON.stringify(sanitized).length;
    console.log(`[${this.room.id}] Sanitized state size: ${jsonSize} bytes`);

    return sanitized;
  }

  private applyGameAction(
    playerId: string,
    action: GameAction['action']
  ): { state: GameState; events: GameEvent[] } | null {
    if (!this.state.gameState) return null;

    try {
      const gameAction: GameAction = {
        id: generateId(),
        playerId,
        action,
        timestamp: now(),
      };

      const result = applyAction(this.state.gameState, gameAction, this.gameContext);
      this.state.gameState = result.state;
      return result;
    } catch (error) {
      console.error(`[${this.room.id}] Action failed:`, error);
      return null;
    }
  }

  private sendToConnection(connection: Party.Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message));
  }

  private sendError(connection: Party.Connection, error: string) {
    this.sendToConnection(connection, { type: 'error', message: error });
  }

  private broadcastGameState() {
    if (!this.state.gameState) return;

    // Sanitize state to remove deck contents (prevents 2-5MB JSON payloads)
    const message: ServerMessage = {
      type: 'gameState',
      state: this.sanitizeStateForClient(this.state.gameState),
    };

    this.room.broadcast(JSON.stringify(message));
  }

  private broadcastEvents(events: GameEvent[]) {
    for (const event of events) {
      const message: ServerMessage = { type: 'event', event };
      this.room.broadcast(JSON.stringify(message));
    }
  }

  private async persistState() {
    // Skip persistence - game state lives in memory during active session
    // If needed later, host can persist to our backend
  }
}
