import type * as Party from "partykit/server";

// =============================================================================
// TYPES
// =============================================================================

interface Player {
  id: string;
  nickname: string;
  avatarEmoji?: string;
  isHost: boolean;
  isSpectator: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
  hand?: any[]; // Cards in hand (hidden from others)
  turnOrder?: number;
  // Proxy player support (IRL players managed by host)
  isProxy: boolean;
  proxyManagedBy?: string; // Player ID of who manages this proxy
}

interface GameState {
  phase: 'lobby' | 'playing' | 'round_end' | 'game_end';
  currentRound: number;
  currentTurn: number;
  currentPlayerId?: string;
  currentPhase?: string;
  judgeId?: string; // For CAH-style games
  deck?: any[];
  discard?: any[];
  table?: any[];
  submissions?: any[];
  proxySubmissions?: string[]; // Player IDs of proxy players who have "submitted"
  roundWinner?: string;
  gameWinner?: string;
  customState?: Record<string, any>;
}

interface RoomState {
  roomCode: string;
  gameConfig?: any;
  templateSlug?: string;
  players: Record<string, Player>;
  spectators: Record<string, Player>;
  gameState: GameState;
  settings: {
    maxPlayers: number;
    turnTimeLimit?: number;
    allowSpectators: boolean;
    isPrivate: boolean;
  };
  createdAt: number;
  startedAt?: number;
}

// Message types
type ClientMessage =
  | { type: 'join'; nickname: string; avatarEmoji?: string; isSpectator?: boolean }
  | { type: 'ready'; ready: boolean }
  | { type: 'start_game' }
  | { type: 'play_card'; cardIndex: number; targetZone?: string }
  | { type: 'submit_cards'; cardIndices: number[] }
  | { type: 'vote'; targetPlayerId: string }
  | { type: 'action'; action: string; data?: any }
  | { type: 'chat'; message: string }
  | { type: 'leave' }
  // Proxy player messages (host only)
  | { type: 'add_proxy'; nickname: string; avatarEmoji?: string }
  | { type: 'remove_proxy'; playerId: string }
  | { type: 'proxy_submit'; playerIds: string[] } // Mark IRL players as having submitted
  | { type: 'mark_winner'; playerId: string } // Host picks round winner
  | { type: 'proxy_ready'; playerId: string; ready: boolean };

type ServerMessage =
  | { type: 'room_state'; state: Partial<RoomState> }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: string }
  | { type: 'player_ready'; playerId: string; ready: boolean }
  | { type: 'game_started'; gameState: GameState }
  | { type: 'game_state_update'; gameState: Partial<GameState> }
  | { type: 'your_hand'; hand: any[] }
  | { type: 'turn_change'; playerId: string; timeLimit?: number }
  | { type: 'card_played'; playerId: string; card?: any }
  | { type: 'round_end'; winner?: string; winnerNickname?: string; scores: Record<string, number> }
  | { type: 'game_end'; winner: string; finalScores: Record<string, number> }
  | { type: 'chat'; playerId: string; nickname: string; message: string }
  | { type: 'error'; message: string }
  // Proxy player events
  | { type: 'proxy_added'; player: Player }
  | { type: 'proxy_removed'; playerId: string }
  | { type: 'proxy_submitted'; playerIds: string[] };

// =============================================================================
// GAME ROOM SERVER
// =============================================================================

export default class GameRoom implements Party.Server {
  private state: RoomState;

  constructor(readonly room: Party.Room) {
    this.state = {
      roomCode: room.id,
      players: {},
      spectators: {},
      gameState: {
        phase: 'lobby',
        currentRound: 0,
        currentTurn: 0,
      },
      settings: {
        maxPlayers: 16,
        allowSpectators: true,
        isPrivate: false,
      },
      createdAt: Date.now(),
    };
  }

  // Called when a new connection is established
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current room state to the new connection
    conn.send(JSON.stringify({
      type: 'room_state',
      state: this.getPublicState(),
    } as ServerMessage));
  }

  // Called when a connection is closed
  onClose(conn: Party.Connection) {
    const playerId = conn.id;

    // Mark player as disconnected (don't remove immediately for reconnection)
    if (this.state.players[playerId]) {
      this.state.players[playerId].isConnected = false;

      this.broadcast({
        type: 'player_left',
        playerId,
      });

      // If host disconnected, transfer host to next player
      if (this.state.players[playerId].isHost) {
        const connectedPlayers = Object.values(this.state.players)
          .filter(p => p.isConnected && p.id !== playerId);

        if (connectedPlayers.length > 0) {
          const newHost = connectedPlayers[0];
          newHost.isHost = true;
          this.broadcast({
            type: 'room_state',
            state: this.getPublicState(),
          });
        }
      }
    }

    if (this.state.spectators[playerId]) {
      delete this.state.spectators[playerId];
    }
  }

  // Called when a message is received
  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as ClientMessage;

      switch (data.type) {
        case 'join':
          this.handleJoin(sender, data);
          break;
        case 'ready':
          this.handleReady(sender, data.ready);
          break;
        case 'start_game':
          this.handleStartGame(sender);
          break;
        case 'play_card':
          this.handlePlayCard(sender, data.cardIndex, data.targetZone);
          break;
        case 'submit_cards':
          this.handleSubmitCards(sender, data.cardIndices);
          break;
        case 'vote':
          this.handleVote(sender, data.targetPlayerId);
          break;
        case 'action':
          this.handleAction(sender, data.action, data.data);
          break;
        case 'chat':
          this.handleChat(sender, data.message);
          break;
        case 'leave':
          this.handleLeave(sender);
          break;
        // Proxy player handlers
        case 'add_proxy':
          this.handleAddProxy(sender, data.nickname, data.avatarEmoji);
          break;
        case 'remove_proxy':
          this.handleRemoveProxy(sender, data.playerId);
          break;
        case 'proxy_submit':
          this.handleProxySubmit(sender, data.playerIds);
          break;
        case 'mark_winner':
          this.handleMarkWinner(sender, data.playerId);
          break;
        case 'proxy_ready':
          this.handleProxyReady(sender, data.playerId, data.ready);
          break;
      }
    } catch (error) {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      } as ServerMessage));
    }
  }

  // ==========================================================================
  // MESSAGE HANDLERS
  // ==========================================================================

  private handleJoin(conn: Party.Connection, data: { nickname: string; avatarEmoji?: string; isSpectator?: boolean }) {
    const playerId = conn.id;
    const { nickname, avatarEmoji, isSpectator } = data;

    // Check if room is full
    const playerCount = Object.keys(this.state.players).length;
    if (!isSpectator && playerCount >= this.state.settings.maxPlayers) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Room is full',
      } as ServerMessage));
      return;
    }

    // Check for duplicate nickname
    const existingNicknames = [
      ...Object.values(this.state.players).map(p => p.nickname.toLowerCase()),
      ...Object.values(this.state.spectators).map(p => p.nickname.toLowerCase()),
    ];
    if (existingNicknames.includes(nickname.toLowerCase())) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Nickname already taken',
      } as ServerMessage));
      return;
    }

    // Create player
    const player: Player = {
      id: playerId,
      nickname,
      avatarEmoji: avatarEmoji || this.getRandomEmoji(),
      isHost: playerCount === 0 && !isSpectator, // First non-spectator is host
      isSpectator: !!isSpectator,
      isReady: false,
      isConnected: true,
      score: 0,
      isProxy: false,
    };

    if (isSpectator) {
      this.state.spectators[playerId] = player;
    } else {
      player.turnOrder = playerCount;
      this.state.players[playerId] = player;
    }

    // Notify everyone
    this.broadcast({
      type: 'player_joined',
      player: this.getPublicPlayer(player),
    });

    // Send full state to the new player
    conn.send(JSON.stringify({
      type: 'room_state',
      state: this.getPublicState(),
    } as ServerMessage));
  }

  private handleReady(conn: Party.Connection, ready: boolean) {
    const player = this.state.players[conn.id];
    if (!player) return;

    player.isReady = ready;

    this.broadcast({
      type: 'player_ready',
      playerId: conn.id,
      ready,
    });
  }

  private handleStartGame(conn: Party.Connection) {
    const player = this.state.players[conn.id];
    if (!player?.isHost) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Only the host can start the game',
      } as ServerMessage));
      return;
    }

    const players = Object.values(this.state.players);
    if (players.length < 2) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Need at least 2 players to start',
      } as ServerMessage));
      return;
    }

    // Initialize game state based on game config
    this.state.gameState = {
      phase: 'playing',
      currentRound: 1,
      currentTurn: 0,
      currentPlayerId: players[0].id,
    };
    this.state.startedAt = Date.now();

    // Deal cards if game config exists
    if (this.state.gameConfig) {
      this.initializeGameFromConfig();
    }

    this.broadcast({
      type: 'game_started',
      gameState: this.state.gameState,
    });

    // Send each player their hand privately
    for (const p of players) {
      if (p.hand) {
        const conn = this.room.getConnection(p.id);
        if (conn) {
          conn.send(JSON.stringify({
            type: 'your_hand',
            hand: p.hand,
          } as ServerMessage));
        }
      }
    }
  }

  private handlePlayCard(conn: Party.Connection, cardIndex: number, targetZone?: string) {
    const player = this.state.players[conn.id];
    if (!player || !player.hand) return;

    // Validate it's this player's turn
    if (this.state.gameState.currentPlayerId !== conn.id) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Not your turn',
      } as ServerMessage));
      return;
    }

    // Remove card from hand
    const card = player.hand.splice(cardIndex, 1)[0];
    if (!card) return;

    // Add to target zone (table by default)
    if (!this.state.gameState.table) {
      this.state.gameState.table = [];
    }
    this.state.gameState.table.push({ ...card, playedBy: conn.id });

    // Broadcast the play (hide card details for hidden information games)
    this.broadcast({
      type: 'card_played',
      playerId: conn.id,
      card: card, // In some games, this should be hidden
    });

    // Update player's hand privately
    conn.send(JSON.stringify({
      type: 'your_hand',
      hand: player.hand,
    } as ServerMessage));

    // Advance turn
    this.advanceTurn();
  }

  private handleSubmitCards(conn: Party.Connection, cardIndices: number[]) {
    const player = this.state.players[conn.id];
    if (!player || !player.hand) return;

    // Collect submitted cards
    const submittedCards = cardIndices
      .sort((a, b) => b - a) // Sort descending to remove from end first
      .map(index => player.hand!.splice(index, 1)[0])
      .filter(Boolean)
      .reverse();

    // Add to submissions
    if (!this.state.gameState.submissions) {
      this.state.gameState.submissions = [];
    }
    this.state.gameState.submissions.push({
      playerId: conn.id,
      cards: submittedCards,
    });

    // Update player's hand privately
    conn.send(JSON.stringify({
      type: 'your_hand',
      hand: player.hand,
    } as ServerMessage));

    // Notify others that player submitted (without revealing cards)
    this.broadcast({
      type: 'game_state_update',
      gameState: {
        submissions: this.state.gameState.submissions.map(s => ({
          playerId: s.playerId,
          cardCount: s.cards.length,
        })),
      },
    });
  }

  private handleVote(conn: Party.Connection, targetPlayerId: string) {
    // Implement voting logic for games that need it
    this.broadcast({
      type: 'game_state_update',
      gameState: {
        customState: {
          ...this.state.gameState.customState,
          votes: {
            ...(this.state.gameState.customState?.votes || {}),
            [conn.id]: targetPlayerId,
          },
        },
      },
    });
  }

  private handleAction(conn: Party.Connection, action: string, data?: any) {
    // Generic action handler for game-specific actions
    const player = this.state.players[conn.id];
    if (!player) return;

    // Process action based on game config
    // This is where game-specific logic would be implemented
    this.broadcast({
      type: 'game_state_update',
      gameState: {
        customState: {
          ...this.state.gameState.customState,
          lastAction: { playerId: conn.id, action, data, timestamp: Date.now() },
        },
      },
    });
  }

  private handleChat(conn: Party.Connection, message: string) {
    const player = this.state.players[conn.id] || this.state.spectators[conn.id];
    if (!player) return;

    // Sanitize message
    const sanitizedMessage = message.slice(0, 500);

    this.broadcast({
      type: 'chat',
      playerId: conn.id,
      nickname: player.nickname,
      message: sanitizedMessage,
    });
  }

  private handleLeave(conn: Party.Connection) {
    const playerId = conn.id;

    if (this.state.players[playerId]) {
      delete this.state.players[playerId];
    }
    if (this.state.spectators[playerId]) {
      delete this.state.spectators[playerId];
    }

    this.broadcast({
      type: 'player_left',
      playerId,
    });

    conn.close();
  }

  // ==========================================================================
  // PROXY PLAYER HANDLERS (IRL players managed by host)
  // ==========================================================================

  private handleAddProxy(conn: Party.Connection, nickname: string, avatarEmoji?: string) {
    const sender = this.state.players[conn.id];
    if (!sender?.isHost) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Only the host can add proxy players',
      } as ServerMessage));
      return;
    }

    // Check room capacity
    const playerCount = Object.keys(this.state.players).length;
    if (playerCount >= this.state.settings.maxPlayers) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Room is full',
      } as ServerMessage));
      return;
    }

    // Check for duplicate nickname
    const existingNicknames = [
      ...Object.values(this.state.players).map(p => p.nickname.toLowerCase()),
      ...Object.values(this.state.spectators).map(p => p.nickname.toLowerCase()),
    ];
    if (existingNicknames.includes(nickname.toLowerCase())) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Nickname already taken',
      } as ServerMessage));
      return;
    }

    // Generate unique ID for proxy player
    const proxyId = `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const proxyPlayer: Player = {
      id: proxyId,
      nickname,
      avatarEmoji: avatarEmoji || this.getRandomEmoji(),
      isHost: false,
      isSpectator: false,
      isReady: true, // Proxy players are always "ready" (managed by host)
      isConnected: true, // They're "connected" via the host
      score: 0,
      isProxy: true,
      proxyManagedBy: conn.id,
      turnOrder: playerCount,
    };

    this.state.players[proxyId] = proxyPlayer;

    // Notify everyone
    this.broadcast({
      type: 'proxy_added',
      player: this.getPublicPlayer(proxyPlayer),
    });

    this.broadcast({
      type: 'player_joined',
      player: this.getPublicPlayer(proxyPlayer),
    });
  }

  private handleRemoveProxy(conn: Party.Connection, proxyId: string) {
    const sender = this.state.players[conn.id];
    if (!sender?.isHost) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Only the host can remove proxy players',
      } as ServerMessage));
      return;
    }

    const proxyPlayer = this.state.players[proxyId];
    if (!proxyPlayer || !proxyPlayer.isProxy) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Player not found or not a proxy',
      } as ServerMessage));
      return;
    }

    delete this.state.players[proxyId];

    this.broadcast({
      type: 'proxy_removed',
      playerId: proxyId,
    });

    this.broadcast({
      type: 'player_left',
      playerId: proxyId,
    });
  }

  private handleProxySubmit(conn: Party.Connection, playerIds: string[]) {
    const sender = this.state.players[conn.id];
    if (!sender?.isHost) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Only the host can mark proxy submissions',
      } as ServerMessage));
      return;
    }

    // Validate all playerIds are proxies managed by this host
    for (const playerId of playerIds) {
      const player = this.state.players[playerId];
      if (!player || !player.isProxy || player.proxyManagedBy !== conn.id) {
        conn.send(JSON.stringify({
          type: 'error',
          message: `Invalid proxy player: ${playerId}`,
        } as ServerMessage));
        return;
      }
    }

    // Initialize proxySubmissions if needed
    if (!this.state.gameState.proxySubmissions) {
      this.state.gameState.proxySubmissions = [];
    }

    // Add to proxy submissions (avoid duplicates)
    for (const playerId of playerIds) {
      if (!this.state.gameState.proxySubmissions.includes(playerId)) {
        this.state.gameState.proxySubmissions.push(playerId);
      }
    }

    // Notify everyone that proxy players have submitted
    this.broadcast({
      type: 'proxy_submitted',
      playerIds,
    });

    // Also send game state update
    this.broadcast({
      type: 'game_state_update',
      gameState: {
        proxySubmissions: this.state.gameState.proxySubmissions,
      },
    });
  }

  private handleMarkWinner(conn: Party.Connection, winnerId: string) {
    const sender = this.state.players[conn.id];
    if (!sender?.isHost) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Only the host can mark winners',
      } as ServerMessage));
      return;
    }

    const winner = this.state.players[winnerId];
    if (!winner) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Player not found',
      } as ServerMessage));
      return;
    }

    // Award point to winner
    winner.score += 1;

    // Record round winner
    this.state.gameState.roundWinner = winnerId;

    // Get all scores
    const scores: Record<string, number> = {};
    for (const [id, player] of Object.entries(this.state.players)) {
      scores[id] = player.score;
    }

    // Broadcast round end
    this.broadcast({
      type: 'round_end',
      winner: winnerId,
      winnerNickname: winner.nickname,
      scores,
    });

    // Clear submissions for next round
    this.state.gameState.submissions = [];
    this.state.gameState.proxySubmissions = [];

    // Advance round
    this.state.gameState.currentRound += 1;

    // Check for game end (could be configurable)
    const winningScore = this.state.gameConfig?.winningScore || 10;
    if (winner.score >= winningScore) {
      this.state.gameState.phase = 'game_end';
      this.state.gameState.gameWinner = winnerId;
      this.broadcast({
        type: 'game_end',
        winner: winnerId,
        finalScores: scores,
      });
    } else {
      // Rotate judge if applicable
      this.rotateJudge();

      // Broadcast updated game state
      this.broadcast({
        type: 'game_state_update',
        gameState: {
          currentRound: this.state.gameState.currentRound,
          judgeId: this.state.gameState.judgeId,
          roundWinner: undefined, // Clear for next round
          submissions: [],
          proxySubmissions: [],
        },
      });
    }
  }

  private handleProxyReady(conn: Party.Connection, proxyId: string, ready: boolean) {
    const sender = this.state.players[conn.id];
    if (!sender?.isHost) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Only the host can set proxy ready status',
      } as ServerMessage));
      return;
    }

    const proxyPlayer = this.state.players[proxyId];
    if (!proxyPlayer || !proxyPlayer.isProxy) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Player not found or not a proxy',
      } as ServerMessage));
      return;
    }

    proxyPlayer.isReady = ready;

    this.broadcast({
      type: 'player_ready',
      playerId: proxyId,
      ready,
    });
  }

  private rotateJudge() {
    const players = Object.values(this.state.players)
      .filter(p => !p.isSpectator)
      .sort((a, b) => (a.turnOrder || 0) - (b.turnOrder || 0));

    if (players.length === 0) return;

    const currentJudgeIndex = players.findIndex(p => p.id === this.state.gameState.judgeId);
    const nextJudgeIndex = (currentJudgeIndex + 1) % players.length;
    this.state.gameState.judgeId = players[nextJudgeIndex].id;
  }

  // ==========================================================================
  // GAME LOGIC HELPERS
  // ==========================================================================

  private initializeGameFromConfig() {
    const config = this.state.gameConfig;
    if (!config) return;

    const players = Object.values(this.state.players);

    // Initialize deck from config
    if (config.decks) {
      this.state.gameState.deck = this.shuffleArray([...config.decks.flatMap((d: any) => d.cards)]);
    }

    // Deal starting hands
    const handSize = config.startingHandSize || 7;
    for (const player of players) {
      player.hand = this.state.gameState.deck?.splice(0, handSize) || [];
    }

    // Initialize zones
    this.state.gameState.discard = [];
    this.state.gameState.table = [];
  }

  private advanceTurn() {
    const players = Object.values(this.state.players).filter(p => p.isConnected);
    const currentIndex = players.findIndex(p => p.id === this.state.gameState.currentPlayerId);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];

    // Check for round end (all players have played)
    if (nextIndex === 0) {
      this.state.gameState.currentTurn++;
      // Could trigger round end logic here
    }

    this.state.gameState.currentPlayerId = nextPlayer.id;

    this.broadcast({
      type: 'turn_change',
      playerId: nextPlayer.id,
      timeLimit: this.state.settings.turnTimeLimit,
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getRandomEmoji(): string {
    const emojis = ['🎮', '🎲', '🃏', '🎯', '🏆', '⭐', '🔥', '💎', '🎪', '🎨', '🚀', '🌟'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  // ==========================================================================
  // STATE HELPERS
  // ==========================================================================

  private getPublicState(): Partial<RoomState> {
    return {
      roomCode: this.state.roomCode,
      templateSlug: this.state.templateSlug,
      players: Object.fromEntries(
        Object.entries(this.state.players).map(([id, p]) => [id, this.getPublicPlayer(p)])
      ),
      spectators: Object.fromEntries(
        Object.entries(this.state.spectators).map(([id, p]) => [id, this.getPublicPlayer(p)])
      ),
      gameState: {
        ...this.state.gameState,
        deck: undefined, // Don't expose deck
        submissions: this.state.gameState.submissions?.map(s => ({
          playerId: s.playerId,
          cardCount: s.cards?.length || 0,
        })),
        proxySubmissions: this.state.gameState.proxySubmissions || [],
      },
      settings: this.state.settings,
      createdAt: this.state.createdAt,
      startedAt: this.state.startedAt,
    };
  }

  private getPublicPlayer(player: Player): Omit<Player, 'hand'> & { hand?: undefined } {
    return {
      id: player.id,
      nickname: player.nickname,
      avatarEmoji: player.avatarEmoji,
      isHost: player.isHost,
      isSpectator: player.isSpectator,
      isReady: player.isReady,
      isConnected: player.isConnected,
      score: player.score,
      turnOrder: player.turnOrder,
      isProxy: player.isProxy,
      proxyManagedBy: player.proxyManagedBy,
      hand: undefined, // Never expose hands publicly
    };
  }

  private broadcast(message: ServerMessage) {
    this.room.broadcast(JSON.stringify(message));
  }

  // HTTP request handler for room management
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "GET") {
      // Return room info
      return new Response(JSON.stringify({
        roomCode: this.state.roomCode,
        playerCount: Object.keys(this.state.players).length,
        spectatorCount: Object.keys(this.state.spectators).length,
        status: this.state.gameState.phase,
        maxPlayers: this.state.settings.maxPlayers,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // Configure room
      const body = await req.json() as Partial<RoomState>;

      if (body.gameConfig) {
        this.state.gameConfig = body.gameConfig;
      }
      if (body.templateSlug) {
        this.state.templateSlug = body.templateSlug;
      }
      if (body.settings) {
        this.state.settings = { ...this.state.settings, ...body.settings };
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
