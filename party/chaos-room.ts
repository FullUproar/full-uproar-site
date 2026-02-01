import type * as Party from "partykit/server";

// =============================================================================
// TYPES
// =============================================================================

interface ChaosParticipant {
  id: string;
  participantId: string; // Database ID
  displayName: string;
  pronouns?: string; // Optional pronouns (e.g., "they/them")
  avatarColor?: string; // Hex color for avatar
  isHost: boolean;
  isConnected: boolean;
  chaosPoints: number;
  setupComplete: boolean;
  userId?: string;
  guestId?: string;
}

type ScoringMode = 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE';

interface ChaosObjective {
  id: string;
  title: string;
  description: string;
  chaosPointsReward: number;
  status: 'ACTIVE' | 'CLAIMED' | 'VERIFIED' | 'FAILED';
  assignedTo: string; // participantId
}

interface ChaosEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  durationMinutes?: number;
  startedAt?: number;
  endsAt?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SKIPPED';
}

interface ChaosBet {
  id: string;
  creatorId: string;
  creatorName: string;
  betType: string;
  description: string;
  targetPlayerId?: string;
  wagerAmount: number;
  odds: number;
  status: 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
  participants: Array<{
    participantId: string;
    displayName: string;
    prediction: string;
    wager: number;
  }>;
  resolution?: {
    winningSide: string;
    resolvedBy: string;
    resolvedAt: number;
  };
}

interface ChaosMiniGame {
  id: string;
  type: string;
  title: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  state?: any;
  participants: string[];
  winnerId?: string;
  reward: number;
}

interface ChaosSessionState {
  roomCode: string;
  sessionId: string;
  gameNightTitle: string;
  status: 'SETUP' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  scoringMode: ScoringMode;
  eventFrequencyMinutes: number;
  participants: Record<string, ChaosParticipant>;
  objectives: Record<string, ChaosObjective>;
  currentEvent?: ChaosEvent;
  eventHistory: ChaosEvent[];
  bets: Record<string, ChaosBet>;
  currentMiniGame?: ChaosMiniGame;
  lastEventAt?: number;
  startedAt?: number;
  createdAt: number;
}

// Client -> Server messages
type ClientMessage =
  | { type: 'join'; participantId: string; displayName: string; isHost: boolean; userId?: string; guestId?: string; pronouns?: string; avatarColor?: string }
  | { type: 'setup_complete'; answers: Record<string, any> }
  | { type: 'claim_objective'; objectiveId: string }
  | { type: 'vote_objective'; objectiveId: string; approve: boolean }
  | { type: 'place_bet'; betId: string; prediction: string; wager: number }
  | { type: 'create_bet'; description: string; betType: string; wagerAmount: number; targetPlayerId?: string }
  | { type: 'mini_game_action'; action: string; data?: any }
  | { type: 'chat'; message: string }
  | { type: 'reaction'; emoji: string }
  // Host-only messages
  | { type: 'host_start' }
  | { type: 'host_pause' }
  | { type: 'host_resume' }
  | { type: 'host_end' }
  | { type: 'host_trigger_event'; eventType?: string }
  | { type: 'host_skip_event' }
  | { type: 'host_complete_event' }
  | { type: 'host_start_mini_game'; miniGameType: string }
  | { type: 'host_resolve_bet'; betId: string; winningSide: string }
  | { type: 'host_transfer'; newHostId: string }
  | { type: 'host_assign_objective'; participantId: string; objectiveId: string }
  | { type: 'host_verify_objective'; objectiveId: string; verified: boolean }
  | { type: 'host_update_settings'; intensity?: string; eventFrequencyMinutes?: number }
  | { type: 'host_relax_mode' }; // One-way mode relaxation (Competitive→Party→Private)

// Server -> Client messages
type ServerMessage =
  | { type: 'session_state'; state: Partial<ChaosSessionState> }
  | { type: 'participant_joined'; participant: ChaosParticipant }
  | { type: 'participant_left'; participantId: string }
  | { type: 'participant_updated'; participant: Partial<ChaosParticipant> & { id: string } }
  | { type: 'session_started' }
  | { type: 'session_paused' }
  | { type: 'session_resumed' }
  | { type: 'session_ended' }
  | { type: 'event_started'; event: ChaosEvent }
  | { type: 'event_completed'; eventId: string }
  | { type: 'event_skipped'; eventId: string }
  | { type: 'objective_assigned'; objective: ChaosObjective }
  | { type: 'objective_claimed'; objectiveId: string; participantId: string }
  | { type: 'objective_verified'; objectiveId: string; verified: boolean; reward?: number }
  | { type: 'bet_created'; bet: ChaosBet }
  | { type: 'bet_joined'; betId: string; participantId: string; prediction: string; wager: number }
  | { type: 'bet_resolved'; betId: string; winningSide: string; winners: Array<{ participantId: string; payout: number }> }
  | { type: 'mini_game_started'; miniGame: ChaosMiniGame }
  | { type: 'mini_game_update'; state: any }
  | { type: 'mini_game_ended'; winnerId: string; reward: number }
  | { type: 'points_updated'; participantId: string; points: number; delta: number; reason: string }
  | { type: 'host_transferred'; newHostId: string }
  | { type: 'chat'; participantId: string; displayName: string; message: string }
  | { type: 'reaction'; participantId: string; emoji: string }
  | { type: 'error'; message: string }
  | { type: 'mode_changed'; scoringMode: ScoringMode }
  // Private messages (sent only to specific player)
  | { type: 'your_objectives'; objectives: ChaosObjective[] };

// =============================================================================
// CHAOS EVENTS LIBRARY
// =============================================================================

const CHAOS_EVENTS = {
  LOW: [
    { type: 'SILENCE', title: 'Silence is Golden', description: 'No talking for 2 minutes!', durationMinutes: 2 },
    { type: 'COMPLIMENT', title: 'Compliment Round', description: 'Everyone must give the person to their left a genuine compliment.', durationMinutes: 3 },
    { type: 'ACCENT', title: 'Accent Time', description: 'Everyone must speak in an accent for the next 5 minutes.', durationMinutes: 5 },
  ],
  MEDIUM: [
    { type: 'SWAP_SEATS', title: 'Musical Chairs', description: 'Everyone swap seats with the person across from you!', durationMinutes: 1 },
    { type: 'OPPOSITE_HAND', title: 'Opposite Hand', description: 'Play with your non-dominant hand for 10 minutes.', durationMinutes: 10 },
    { type: 'NARRATOR', title: 'The Narrator', description: 'One player must narrate everyone\'s actions in third person.', durationMinutes: 5 },
    { type: 'NO_NAMES', title: 'No Names', description: 'Cannot use anyone\'s name! Use descriptors instead.', durationMinutes: 10 },
  ],
  HIGH: [
    { type: 'STAND_UP', title: 'Stand Up!', description: 'Everyone must stand for the next 10 minutes.', durationMinutes: 10 },
    { type: 'BLINDFOLD', title: 'Blind Play', description: 'One player must close their eyes for their next turn.', durationMinutes: 5 },
    { type: 'REVERSE', title: 'Reverse Psychology', description: 'Say the opposite of what you mean for 5 minutes.', durationMinutes: 5 },
    { type: 'PHONE_STACK', title: 'Phone Stack', description: 'Everyone stack your phones in the middle. First to grab theirs loses 50 points!', durationMinutes: 15 },
  ],
};

// =============================================================================
// CHAOS ROOM SERVER
// =============================================================================

export default class ChaosRoom implements Party.Server {
  private state: ChaosSessionState;
  private eventTimer?: ReturnType<typeof setTimeout>;
  private saveTimer?: ReturnType<typeof setTimeout>;
  private stateLoaded: boolean = false;
  private apiBaseUrl: string;

  constructor(readonly room: Party.Room) {
    this.state = {
      roomCode: room.id,
      sessionId: '',
      gameNightTitle: '',
      status: 'SETUP',
      intensity: 'MEDIUM',
      scoringMode: 'PARTY', // Default to Party mode
      eventFrequencyMinutes: 15,
      participants: {},
      objectives: {},
      eventHistory: [],
      bets: {},
      createdAt: Date.now(),
    };

    // Get API base URL from environment
    this.apiBaseUrl = process.env.SITE_URL || 'http://localhost:3000';
  }

  // Load persisted state from database when room starts
  async onStart() {
    if (this.state.sessionId) {
      await this.loadPersistedState();
    }
  }

  private async loadPersistedState() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/chaos/${this.state.sessionId}/state`, {
        headers: {
          'x-partykit-secret': process.env.PARTYKIT_SECRET || 'development-secret',
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Merge persisted state with current state
        this.state = {
          ...this.state,
          ...data,
          // Keep current connection states
          participants: Object.entries(data.participants || {}).reduce((acc, [id, p]: [string, any]) => {
            acc[id] = {
              ...p,
              isConnected: this.state.participants[id]?.isConnected || false,
            };
            return acc;
          }, {} as Record<string, ChaosParticipant>),
        };
        this.stateLoaded = true;
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  // Debounced save to database
  private scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.persistState();
    }, 5000); // Save after 5 seconds of inactivity
  }

  private async persistState(completedEvent?: ChaosEvent) {
    if (!this.state.sessionId) return;

    try {
      await fetch(`${this.apiBaseUrl}/api/chaos/${this.state.sessionId}/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partykit-secret': process.env.PARTYKIT_SECRET || 'development-secret',
        },
        body: JSON.stringify({
          status: this.state.status,
          intensity: this.state.intensity,
          scoringMode: this.state.scoringMode,
          eventFrequencyMinutes: this.state.eventFrequencyMinutes,
          lastEventAt: this.state.lastEventAt,
          startedAt: this.state.startedAt,
          participants: this.state.participants,
          bets: this.state.bets,
          completedEvent,
        }),
      });
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current state to new connection
    conn.send(JSON.stringify({
      type: 'session_state',
      state: this.getPublicState(),
    } as ServerMessage));
  }

  onClose(conn: Party.Connection) {
    const participantId = conn.id;
    const participant = this.state.participants[participantId];

    if (participant) {
      participant.isConnected = false;

      this.broadcast({
        type: 'participant_left',
        participantId,
      });

      // If host disconnected, transfer to another participant
      if (participant.isHost) {
        const connectedParticipants = Object.values(this.state.participants)
          .filter(p => p.isConnected && p.id !== participantId);

        if (connectedParticipants.length > 0) {
          const newHost = connectedParticipants[0];
          newHost.isHost = true;
          this.state.participants[participantId].isHost = false;

          this.broadcast({
            type: 'host_transferred',
            newHostId: newHost.id,
          });

          this.broadcast({
            type: 'session_state',
            state: this.getPublicState(),
          });
        }
      }
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as ClientMessage;

      switch (data.type) {
        case 'join':
          this.handleJoin(sender, data);
          break;
        case 'setup_complete':
          this.handleSetupComplete(sender, data.answers);
          break;
        case 'claim_objective':
          this.handleClaimObjective(sender, data.objectiveId);
          break;
        case 'vote_objective':
          this.handleVoteObjective(sender, data.objectiveId, data.approve);
          break;
        case 'place_bet':
          this.handlePlaceBet(sender, data.betId, data.prediction, data.wager);
          break;
        case 'create_bet':
          this.handleCreateBet(sender, data);
          break;
        case 'mini_game_action':
          this.handleMiniGameAction(sender, data.action, data.data);
          break;
        case 'chat':
          this.handleChat(sender, data.message);
          break;
        case 'reaction':
          this.handleReaction(sender, data.emoji);
          break;
        // Host commands
        case 'host_start':
          this.handleHostStart(sender);
          break;
        case 'host_pause':
          this.handleHostPause(sender);
          break;
        case 'host_resume':
          this.handleHostResume(sender);
          break;
        case 'host_end':
          this.handleHostEnd(sender);
          break;
        case 'host_trigger_event':
          this.handleHostTriggerEvent(sender, data.eventType);
          break;
        case 'host_skip_event':
          this.handleHostSkipEvent(sender);
          break;
        case 'host_complete_event':
          this.handleHostCompleteEvent(sender);
          break;
        case 'host_start_mini_game':
          this.handleHostStartMiniGame(sender, data.miniGameType);
          break;
        case 'host_resolve_bet':
          this.handleHostResolveBet(sender, data.betId, data.winningSide);
          break;
        case 'host_transfer':
          this.handleHostTransfer(sender, data.newHostId);
          break;
        case 'host_verify_objective':
          this.handleHostVerifyObjective(sender, data.objectiveId, data.verified);
          break;
        case 'host_update_settings':
          this.handleHostUpdateSettings(sender, data);
          break;
        case 'host_relax_mode':
          this.handleHostRelaxMode(sender);
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

  private handleJoin(conn: Party.Connection, data: { participantId: string; displayName: string; isHost: boolean; userId?: string; guestId?: string; pronouns?: string; avatarColor?: string }) {
    const { participantId, displayName, isHost, userId, guestId, pronouns, avatarColor } = data;

    // Check if already joined
    if (this.state.participants[conn.id]) {
      // Reconnecting - update connection status
      this.state.participants[conn.id].isConnected = true;
      conn.send(JSON.stringify({
        type: 'session_state',
        state: this.getPublicState(conn.id),
      } as ServerMessage));

      // Send private objectives
      this.sendPrivateObjectives(conn);
      return;
    }

    const participant: ChaosParticipant = {
      id: conn.id,
      participantId,
      displayName,
      pronouns,
      avatarColor,
      isHost,
      isConnected: true,
      chaosPoints: 100, // Starting pool
      setupComplete: false,
      userId,
      guestId,
    };

    this.state.participants[conn.id] = participant;

    this.broadcast({
      type: 'participant_joined',
      participant,
    });

    // Send full state to new participant
    conn.send(JSON.stringify({
      type: 'session_state',
      state: this.getPublicState(),
    } as ServerMessage));
  }

  private handleSetupComplete(conn: Party.Connection, answers: Record<string, any>) {
    const participant = this.state.participants[conn.id];
    if (!participant) return;

    participant.setupComplete = true;

    this.broadcast({
      type: 'participant_updated',
      participant: { id: conn.id, setupComplete: true },
    });

    // TODO: Use answers to personalize objectives
  }

  private handleClaimObjective(conn: Party.Connection, objectiveId: string) {
    const objective = this.state.objectives[objectiveId];
    if (!objective) return;

    if (objective.assignedTo !== this.state.participants[conn.id]?.participantId) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'This objective is not assigned to you',
      } as ServerMessage));
      return;
    }

    if (objective.status !== 'ACTIVE') {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Objective is not active',
      } as ServerMessage));
      return;
    }

    objective.status = 'CLAIMED';

    this.broadcast({
      type: 'objective_claimed',
      objectiveId,
      participantId: conn.id,
    });
  }

  private handleVoteObjective(conn: Party.Connection, objectiveId: string, approve: boolean) {
    // TODO: Implement voting system for objective verification
  }

  private handlePlaceBet(conn: Party.Connection, betId: string, prediction: string, wager: number) {
    const bet = this.state.bets[betId];
    const participant = this.state.participants[conn.id];

    if (!bet || !participant) return;

    if (bet.status !== 'OPEN') {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'This bet is no longer open',
      } as ServerMessage));
      return;
    }

    if (wager > participant.chaosPoints) {
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Insufficient chaos points',
      } as ServerMessage));
      return;
    }

    // Deduct wager
    participant.chaosPoints -= wager;

    bet.participants.push({
      participantId: participant.participantId,
      displayName: participant.displayName,
      prediction,
      wager,
    });

    this.broadcast({
      type: 'bet_joined',
      betId,
      participantId: conn.id,
      prediction,
      wager,
    });

    this.broadcast({
      type: 'points_updated',
      participantId: conn.id,
      points: participant.chaosPoints,
      delta: -wager,
      reason: 'Placed bet',
    });
  }

  private handleCreateBet(conn: Party.Connection, data: { description: string; betType: string; wagerAmount: number; targetPlayerId?: string }) {
    const participant = this.state.participants[conn.id];
    if (!participant) return;

    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const bet: ChaosBet = {
      id: betId,
      creatorId: conn.id,
      creatorName: participant.displayName,
      betType: data.betType,
      description: data.description,
      targetPlayerId: data.targetPlayerId,
      wagerAmount: data.wagerAmount,
      odds: 1, // Simple 1:1 odds for now
      status: 'OPEN',
      participants: [],
    };

    this.state.bets[betId] = bet;

    this.broadcast({
      type: 'bet_created',
      bet,
    });
  }

  private handleMiniGameAction(conn: Party.Connection, action: string, data?: any) {
    if (!this.state.currentMiniGame || this.state.currentMiniGame.status !== 'ACTIVE') {
      return;
    }

    // Handle different mini-game types
    switch (this.state.currentMiniGame.type) {
      case 'QUICK_DRAW':
        this.handleQuickDrawAction(conn, action, data);
        break;
      case 'VOTING':
        this.handleVotingAction(conn, action, data);
        break;
      case 'TRIVIA':
        this.handleTriviaAction(conn, action, data);
        break;
    }
  }

  private handleQuickDrawAction(conn: Party.Connection, action: string, data?: any) {
    if (action === 'tap' && this.state.currentMiniGame?.status === 'ACTIVE') {
      // First to tap wins
      const participant = this.state.participants[conn.id];
      if (!participant) return;

      this.state.currentMiniGame.status = 'COMPLETED';
      this.state.currentMiniGame.winnerId = conn.id;

      const reward = this.state.currentMiniGame.reward;
      participant.chaosPoints += reward;

      this.broadcast({
        type: 'mini_game_ended',
        winnerId: conn.id,
        reward,
      });

      this.broadcast({
        type: 'points_updated',
        participantId: conn.id,
        points: participant.chaosPoints,
        delta: reward,
        reason: 'Quick Draw winner!',
      });

      this.state.currentMiniGame = undefined;
    }
  }

  private handleVotingAction(conn: Party.Connection, action: string, data?: any) {
    // TODO: Implement voting mini-game
  }

  private handleTriviaAction(conn: Party.Connection, action: string, data?: any) {
    // TODO: Implement trivia mini-game
  }

  private handleChat(conn: Party.Connection, message: string) {
    const participant = this.state.participants[conn.id];
    if (!participant) return;

    const sanitizedMessage = message.slice(0, 500);

    this.broadcast({
      type: 'chat',
      participantId: conn.id,
      displayName: participant.displayName,
      message: sanitizedMessage,
    });
  }

  private handleReaction(conn: Party.Connection, emoji: string) {
    const participant = this.state.participants[conn.id];
    if (!participant) return;

    this.broadcast({
      type: 'reaction',
      participantId: conn.id,
      emoji: emoji.slice(0, 4), // Limit emoji length
    });
  }

  // ==========================================================================
  // HOST COMMANDS
  // ==========================================================================

  private isHost(conn: Party.Connection): boolean {
    return this.state.participants[conn.id]?.isHost === true;
  }

  private handleHostStart(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can start' } as ServerMessage));
      return;
    }

    this.state.status = 'ACTIVE';
    this.state.startedAt = Date.now();
    this.state.lastEventAt = Date.now();

    // Start event timer
    this.scheduleNextEvent();

    this.broadcast({ type: 'session_started' });
    this.broadcast({ type: 'session_state', state: this.getPublicState() });
    this.scheduleSave();
  }

  private handleHostPause(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can pause' } as ServerMessage));
      return;
    }

    this.state.status = 'PAUSED';
    if (this.eventTimer) {
      clearTimeout(this.eventTimer);
      this.eventTimer = undefined;
    }

    this.broadcast({ type: 'session_paused' });
  }

  private handleHostResume(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can resume' } as ServerMessage));
      return;
    }

    this.state.status = 'ACTIVE';
    this.scheduleNextEvent();

    this.broadcast({ type: 'session_resumed' });
  }

  private handleHostEnd(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can end' } as ServerMessage));
      return;
    }

    this.state.status = 'ENDED';
    if (this.eventTimer) {
      clearTimeout(this.eventTimer);
      this.eventTimer = undefined;
    }

    this.broadcast({ type: 'session_ended' });
    this.persistState(); // Immediately persist end state
  }

  private handleHostTriggerEvent(conn: Party.Connection, eventType?: string) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can trigger events' } as ServerMessage));
      return;
    }

    this.triggerEvent(eventType);
  }

  private handleHostSkipEvent(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can skip events' } as ServerMessage));
      return;
    }

    if (this.state.currentEvent) {
      this.state.currentEvent.status = 'SKIPPED';
      this.state.eventHistory.push(this.state.currentEvent);

      this.broadcast({
        type: 'event_skipped',
        eventId: this.state.currentEvent.id,
      });

      this.state.currentEvent = undefined;
    }
  }

  private handleHostCompleteEvent(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can complete events' } as ServerMessage));
      return;
    }

    if (this.state.currentEvent) {
      const completedEvent = { ...this.state.currentEvent, status: 'COMPLETED' as const };
      this.state.currentEvent.status = 'COMPLETED';
      this.state.eventHistory.push(this.state.currentEvent);

      this.broadcast({
        type: 'event_completed',
        eventId: this.state.currentEvent.id,
      });

      this.state.currentEvent = undefined;
      this.persistState(completedEvent); // Persist completed event
    }
  }

  private handleHostStartMiniGame(conn: Party.Connection, miniGameType: string) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can start mini-games' } as ServerMessage));
      return;
    }

    if (this.state.currentMiniGame) {
      conn.send(JSON.stringify({ type: 'error', message: 'A mini-game is already in progress' } as ServerMessage));
      return;
    }

    const miniGame: ChaosMiniGame = {
      id: `mini_${Date.now()}`,
      type: miniGameType,
      title: this.getMiniGameTitle(miniGameType),
      status: 'ACTIVE',
      participants: Object.keys(this.state.participants),
      reward: 25,
    };

    this.state.currentMiniGame = miniGame;

    this.broadcast({
      type: 'mini_game_started',
      miniGame,
    });
  }

  private handleHostResolveBet(conn: Party.Connection, betId: string, winningSide: string) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can resolve bets' } as ServerMessage));
      return;
    }

    const bet = this.state.bets[betId];
    if (!bet || bet.status !== 'OPEN') return;

    bet.status = 'RESOLVED';
    bet.resolution = {
      winningSide,
      resolvedBy: conn.id,
      resolvedAt: Date.now(),
    };

    // Calculate payouts
    const winners: Array<{ participantId: string; payout: number }> = [];
    const losers: Array<{ participantId: string; loss: number }> = [];

    for (const p of bet.participants) {
      const participant = Object.values(this.state.participants).find(
        part => part.participantId === p.participantId
      );
      if (!participant) continue;

      if (p.prediction === winningSide) {
        const payout = p.wager * 2; // Simple 2x payout
        participant.chaosPoints += payout;
        winners.push({ participantId: participant.id, payout });

        this.broadcast({
          type: 'points_updated',
          participantId: participant.id,
          points: participant.chaosPoints,
          delta: payout,
          reason: 'Won bet!',
        });
      }
    }

    this.broadcast({
      type: 'bet_resolved',
      betId,
      winningSide,
      winners,
    });
  }

  private handleHostTransfer(conn: Party.Connection, newHostId: string) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can transfer host' } as ServerMessage));
      return;
    }

    const newHost = this.state.participants[newHostId];
    if (!newHost) {
      conn.send(JSON.stringify({ type: 'error', message: 'Participant not found' } as ServerMessage));
      return;
    }

    // Transfer host role
    this.state.participants[conn.id].isHost = false;
    newHost.isHost = true;

    this.broadcast({
      type: 'host_transferred',
      newHostId,
    });

    this.broadcast({
      type: 'session_state',
      state: this.getPublicState(),
    });
  }

  private handleHostVerifyObjective(conn: Party.Connection, objectiveId: string, verified: boolean) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can verify objectives' } as ServerMessage));
      return;
    }

    const objective = this.state.objectives[objectiveId];
    if (!objective || objective.status !== 'CLAIMED') return;

    if (verified) {
      objective.status = 'VERIFIED';

      // Award points
      const participantId = objective.assignedTo;
      const participant = Object.values(this.state.participants).find(
        p => p.participantId === participantId
      );

      if (participant) {
        participant.chaosPoints += objective.chaosPointsReward;

        this.broadcast({
          type: 'points_updated',
          participantId: participant.id,
          points: participant.chaosPoints,
          delta: objective.chaosPointsReward,
          reason: `Completed: ${objective.title}`,
        });
      }
    } else {
      objective.status = 'FAILED';
    }

    this.broadcast({
      type: 'objective_verified',
      objectiveId,
      verified,
      reward: verified ? objective.chaosPointsReward : undefined,
    });
    this.scheduleSave();
  }

  private handleHostUpdateSettings(conn: Party.Connection, data: { intensity?: string; eventFrequencyMinutes?: number }) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can update settings' } as ServerMessage));
      return;
    }

    if (data.intensity) {
      this.state.intensity = data.intensity as 'LOW' | 'MEDIUM' | 'HIGH';
    }
    if (data.eventFrequencyMinutes) {
      this.state.eventFrequencyMinutes = data.eventFrequencyMinutes;
    }

    this.broadcast({
      type: 'session_state',
      state: this.getPublicState(),
    });
  }

  private handleHostRelaxMode(conn: Party.Connection) {
    if (!this.isHost(conn)) {
      conn.send(JSON.stringify({ type: 'error', message: 'Only the host can change mode' } as ServerMessage));
      return;
    }

    // One-way relaxation: COMPETITIVE → PARTY → PRIVATE_BINGO
    // Cannot escalate competition mid-session
    const currentMode = this.state.scoringMode;
    let newMode: ScoringMode;

    if (currentMode === 'COMPETITIVE') {
      newMode = 'PARTY';
    } else if (currentMode === 'PARTY') {
      newMode = 'PRIVATE_BINGO';
    } else {
      // Already at most relaxed mode
      conn.send(JSON.stringify({ type: 'error', message: 'Already at most relaxed mode' } as ServerMessage));
      return;
    }

    this.state.scoringMode = newMode;

    this.broadcast({
      type: 'mode_changed',
      scoringMode: newMode,
    });

    // Send updated state to all participants (each gets their own view for Private Bingo)
    for (const [id, participant] of Object.entries(this.state.participants)) {
      if (participant.isConnected) {
        const conn = this.room.getConnection(id);
        if (conn) {
          conn.send(JSON.stringify({
            type: 'session_state',
            state: this.getPublicState(id),
          } as ServerMessage));
        }
      }
    }

    this.scheduleSave();
  }

  // ==========================================================================
  // EVENT SYSTEM
  // ==========================================================================

  private scheduleNextEvent() {
    if (this.eventTimer) {
      clearTimeout(this.eventTimer);
    }

    if (this.state.status !== 'ACTIVE') return;

    const delay = this.state.eventFrequencyMinutes * 60 * 1000;

    this.eventTimer = setTimeout(() => {
      this.triggerEvent();
      this.scheduleNextEvent();
    }, delay);
  }

  private triggerEvent(eventType?: string) {
    // Complete current event if any
    if (this.state.currentEvent) {
      this.state.currentEvent.status = 'COMPLETED';
      this.state.eventHistory.push(this.state.currentEvent);
    }

    // Get events for current intensity
    const availableEvents = [
      ...CHAOS_EVENTS.LOW,
      ...(this.state.intensity !== 'LOW' ? CHAOS_EVENTS.MEDIUM : []),
      ...(this.state.intensity === 'HIGH' ? CHAOS_EVENTS.HIGH : []),
    ];

    // Pick event (specific type or random)
    let eventTemplate;
    if (eventType) {
      eventTemplate = availableEvents.find(e => e.type === eventType);
    }
    if (!eventTemplate) {
      eventTemplate = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    }

    const event: ChaosEvent = {
      id: `event_${Date.now()}`,
      type: eventTemplate.type,
      title: eventTemplate.title,
      description: eventTemplate.description,
      durationMinutes: eventTemplate.durationMinutes,
      startedAt: Date.now(),
      endsAt: eventTemplate.durationMinutes
        ? Date.now() + eventTemplate.durationMinutes * 60 * 1000
        : undefined,
      status: 'ACTIVE',
    };

    this.state.currentEvent = event;
    this.state.lastEventAt = Date.now();

    this.broadcast({
      type: 'event_started',
      event,
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getMiniGameTitle(type: string): string {
    switch (type) {
      case 'QUICK_DRAW': return 'Quick Draw!';
      case 'VOTING': return 'Who Would...?';
      case 'TRIVIA': return 'Trivia Time';
      default: return 'Mini Game';
    }
  }

  private sendPrivateObjectives(conn: Party.Connection) {
    const participant = this.state.participants[conn.id];
    if (!participant) return;

    const myObjectives = Object.values(this.state.objectives)
      .filter(o => o.assignedTo === participant.participantId);

    conn.send(JSON.stringify({
      type: 'your_objectives',
      objectives: myObjectives,
    } as ServerMessage));
  }

  private getPublicState(forParticipantId?: string): Partial<ChaosSessionState> {
    // Handle scoring mode visibility
    let participants = this.state.participants;

    if (this.state.scoringMode === 'PRIVATE_BINGO') {
      // In Private Bingo mode, only show the requesting player's points
      participants = Object.entries(this.state.participants).reduce((acc, [id, p]) => {
        acc[id] = {
          ...p,
          // Hide other players' points (show as 0 or undefined)
          chaosPoints: id === forParticipantId ? p.chaosPoints : 0,
        };
        return acc;
      }, {} as Record<string, ChaosParticipant>);
    }

    return {
      roomCode: this.state.roomCode,
      sessionId: this.state.sessionId,
      gameNightTitle: this.state.gameNightTitle,
      status: this.state.status,
      intensity: this.state.intensity,
      scoringMode: this.state.scoringMode,
      eventFrequencyMinutes: this.state.eventFrequencyMinutes,
      participants,
      currentEvent: this.state.currentEvent,
      eventHistory: this.state.eventHistory.slice(-10), // Last 10 events
      bets: this.state.bets,
      currentMiniGame: this.state.currentMiniGame,
      startedAt: this.state.startedAt,
      createdAt: this.state.createdAt,
      // Note: objectives are NOT included publicly - sent privately
    };
  }

  private broadcast(message: ServerMessage) {
    this.room.broadcast(JSON.stringify(message));
  }

  // ==========================================================================
  // HTTP REQUEST HANDLER
  // ==========================================================================

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "GET") {
      return new Response(JSON.stringify({
        roomCode: this.state.roomCode,
        participantCount: Object.keys(this.state.participants).length,
        status: this.state.status,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json() as Partial<ChaosSessionState> & { objectives?: ChaosObjective[]; loadFromDb?: boolean };

      // If sessionId is being set, try to load persisted state first
      if (body.sessionId && body.sessionId !== this.state.sessionId) {
        this.state.sessionId = body.sessionId;
        if (body.loadFromDb !== false) {
          await this.loadPersistedState();
        }
      }

      // Apply any additional overrides from the request
      if (body.gameNightTitle) {
        this.state.gameNightTitle = body.gameNightTitle;
      }
      if (body.intensity) {
        this.state.intensity = body.intensity;
      }
      if (body.scoringMode) {
        this.state.scoringMode = body.scoringMode as ScoringMode;
      }
      if (body.eventFrequencyMinutes) {
        this.state.eventFrequencyMinutes = body.eventFrequencyMinutes;
      }
      if (body.objectives) {
        for (const obj of body.objectives) {
          this.state.objectives[obj.id] = obj;
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
