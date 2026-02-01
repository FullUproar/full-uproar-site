'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import usePartySocket from 'partysocket/react';
import Image from 'next/image';
import QRCodeShare from '../components/QRCodeShare';
import HostControls from '../components/HostControls';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

interface Participant {
  id: string;
  participantId: string;
  displayName: string;
  pronouns?: string;
  avatarColor?: string;
  isHost: boolean;
  isConnected: boolean;
  chaosPoints: number;
  setupComplete: boolean;
}

interface ChaosEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  durationMinutes?: number;
  startedAt?: number;
  endsAt?: number;
  status: string;
}

interface ChaosBet {
  id: string;
  creatorId: string;
  creatorName: string;
  description: string;
  wagerAmount: number;
  status: string;
  participants: Array<{
    participantId: string;
    displayName: string;
    prediction: string;
    wager: number;
  }>;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  chaosPointsReward: number;
  status: string;
}

type ScoringMode = 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE';

interface SessionState {
  roomCode: string;
  sessionId: string;
  gameNightTitle: string;
  status: 'SETUP' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  intensity: 'LOW' | 'MEDIUM' | 'HIGH';
  scoringMode: ScoringMode;
  participants: Record<string, Participant>;
  currentEvent?: ChaosEvent;
  eventHistory: ChaosEvent[];
  bets: Record<string, ChaosBet>;
}

type TabType = 'events' | 'bets' | 'games' | 'you';

export default function ChaosSessionPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [state, setState] = useState<SessionState | null>(null);
  const [myObjectives, setMyObjectives] = useState<Objective[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantInfo, setParticipantInfo] = useState<{ participantId: string; displayName: string } | null>(null);
  const [eventTimeRemaining, setEventTimeRemaining] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [showShareModal, setShowShareModal] = useState(false);

  const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

  // Load participant info from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`chaos_session_${sessionId}`);
    if (stored) {
      try {
        setParticipantInfo(JSON.parse(stored));
      } catch {
        // Invalid stored data
      }
    }
  }, [sessionId]);

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/chaos/${sessionId}`);
        if (!res.ok) {
          setError('Session not found');
          setIsLoading(false);
          return;
        }
        const data = await res.json();

        // Store participant info if we're in the session
        if (data.myParticipant) {
          const info = {
            participantId: data.myParticipant.id,
            displayName: data.myParticipant.displayName,
          };
          setParticipantInfo(info);
          localStorage.setItem(`chaos_session_${sessionId}`, JSON.stringify(info));
        }

        setState({
          roomCode: data.roomCode,
          sessionId: data.id,
          gameNightTitle: data.gameNight?.title || 'Game Night',
          status: data.status,
          intensity: data.intensity,
          scoringMode: data.scoringMode || 'PARTY',
          participants: data.participants?.reduce((acc: Record<string, Participant>, p: Participant) => {
            acc[p.id] = p;
            return acc;
          }, {}) || {},
          currentEvent: data.currentEvent,
          eventHistory: data.eventHistory || [],
          bets: data.bets?.reduce((acc: Record<string, ChaosBet>, b: ChaosBet) => {
            acc[b.id] = b;
            return acc;
          }, {}) || {},
        });

        if (data.myObjectives) {
          setMyObjectives(data.myObjectives);
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load session');
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  // Connect to PartyKit
  const socket = usePartySocket({
    host: partyHost,
    party: 'chaos',
    room: state?.roomCode || '',
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    },
    onOpen: () => {
      setConnectionStatus('connected');
      // Join the room
      if (participantInfo && state) {
        socket.send(JSON.stringify({
          type: 'join',
          participantId: participantInfo.participantId,
          displayName: participantInfo.displayName,
          isHost: false,
        }));
      }
    },
    onClose: () => {
      setConnectionStatus('disconnected');
    },
    onError: () => {
      setConnectionStatus('disconnected');
    },
  });

  const handleServerMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'session_state':
        setState(prev => prev ? { ...prev, ...message.state } : message.state);
        break;
      case 'participant_joined':
        setState(prev => prev ? {
          ...prev,
          participants: { ...prev.participants, [message.participant.id]: message.participant }
        } : prev);
        break;
      case 'participant_left':
        setState(prev => {
          if (!prev) return prev;
          const { [message.participantId]: _, ...rest } = prev.participants;
          return { ...prev, participants: rest };
        });
        break;
      case 'event_started':
        setState(prev => prev ? { ...prev, currentEvent: message.event } : prev);
        break;
      case 'event_completed':
      case 'event_skipped':
        setState(prev => prev ? { ...prev, currentEvent: undefined } : prev);
        break;
      case 'your_objectives':
        setMyObjectives(message.objectives);
        break;
      case 'points_updated':
        setState(prev => {
          if (!prev) return prev;
          const participant = prev.participants[message.participantId];
          if (participant) {
            return {
              ...prev,
              participants: {
                ...prev.participants,
                [message.participantId]: { ...participant, chaosPoints: message.points }
              }
            };
          }
          return prev;
        });
        break;
      case 'bet_created':
        setState(prev => prev ? {
          ...prev,
          bets: { ...prev.bets, [message.bet.id]: message.bet }
        } : prev);
        break;
      case 'session_ended':
        setState(prev => prev ? { ...prev, status: 'ENDED' } : prev);
        break;
      case 'mode_changed':
        setState(prev => prev ? { ...prev, scoringMode: message.scoringMode } : prev);
        break;
    }
  }, []);

  // Event timer countdown
  useEffect(() => {
    if (state?.currentEvent?.endsAt) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, state.currentEvent!.endsAt! - Date.now());
        setEventTimeRemaining(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setEventTimeRemaining(null);
    }
  }, [state?.currentEvent?.endsAt]);

  // Get my points
  const myPoints = participantInfo
    ? Object.values(state?.participants || {}).find(p => p.participantId === participantInfo.participantId)?.chaosPoints || 0
    : 0;

  // Check if I'm the host
  const isHost = participantInfo
    ? Object.values(state?.participants || {}).find(p => p.participantId === participantInfo.participantId)?.isHost
    : false;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <div className="animate-bounce" style={{ fontSize: '48px' }}>🎭</div>
          <p className="animate-pulse" style={{ color: '#9ca3af', marginTop: '16px' }}>Loading chaos...</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>😵</div>
        <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>
          {error || 'Something went wrong'}
        </h1>
        <button
          onClick={() => router.push('/chaos')}
          style={{
            padding: '12px 32px',
            backgroundColor: '#f97316',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Back to Chaos
        </button>
      </div>
    );
  }

  if (state.status === 'ENDED') {
    const sortedParticipants = Object.values(state.participants)
      .sort((a, b) => b.chaosPoints - a.chaosPoints);
    const winner = sortedParticipants[0];
    const totalEvents = state.eventHistory.length;
    const totalBets = Object.keys(state.bets).length;
    const totalPoints = sortedParticipants.reduce((sum, p) => sum + p.chaosPoints, 0);

    return (
      <div className="animate-fade-in" style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        paddingTop: '40px',
        paddingBottom: '100px',
        overflowY: 'auto',
      }}>
        {/* Winner Celebration */}
        <div className="animate-slide-down" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="animate-bounce" style={{ fontSize: '80px', marginBottom: '16px' }}>🏆</div>
          <h1 className="animate-glow" style={{
            color: '#fde68a',
            fontSize: '32px',
            marginBottom: '8px',
            textShadow: '0 0 20px rgba(253, 230, 138, 0.5)',
          }}>
            Chaos Complete!
          </h1>
          {winner && (
            <p style={{ color: '#f97316', fontSize: '20px', fontWeight: 'bold' }}>
              👑 {winner.displayName} wins with {winner.chaosPoints} points!
            </p>
          )}
        </div>

        {/* Session Stats */}
        <div className="animate-slide-up" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '24px',
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}>
              {totalEvents}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' }}>
              Events
            </div>
          </div>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
              {totalBets}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' }}>
              Bets
            </div>
          </div>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#f97316', fontSize: '24px', fontWeight: 'bold' }}>
              {totalPoints}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' }}>
              Total Pts
            </div>
          </div>
        </div>

        {/* Final Leaderboard */}
        <div className="animate-slide-up" style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '24px',
        }}>
          <h2 style={{
            color: '#f97316',
            fontSize: '18px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            Final Standings
          </h2>
          {sortedParticipants.map((p, i) => (
            <div
              key={p.id}
              className="leaderboard-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: i === 0 ? 'rgba(253, 230, 138, 0.1)' : '#0a0a0a',
                borderRadius: '8px',
                border: i === 0 ? '2px solid #fde68a' : '1px solid #2a2a2a',
                ['--index' as string]: i,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: i === 0 ? '#fde68a' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : '#3a3a3a',
                  color: i < 3 ? '#000' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}>
                  {i === 0 ? '👑' : i + 1}
                </span>
                <span style={{
                  color: i === 0 ? '#fde68a' : '#e2e8f0',
                  fontWeight: i === 0 ? 'bold' : 'normal',
                }}>
                  {p.displayName}
                </span>
              </div>
              <span style={{
                color: '#fde68a',
                fontWeight: 'bold',
                fontSize: '18px',
              }}>
                {p.chaosPoints}
              </span>
            </div>
          ))}
        </div>

        {/* Game Night Title */}
        <p style={{
          color: '#6b7280',
          fontSize: '12px',
          marginBottom: '24px',
        }}>
          {state.gameNightTitle}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => router.push('/chaos')}
            className="btn-chaos"
            style={{
              padding: '14px 28px',
              backgroundColor: '#f97316',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Play Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-chaos"
            style={{
              padding: '14px 28px',
              backgroundColor: '#2a2a2a',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div className="safe-area-top" style={{
        backgroundColor: '#1a1a1a',
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            flexShrink: 0,
          }}>
            <Image
              src="/FuglyLogo.png"
              alt="Fugly"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                color: '#f97316',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Chaos Agent
              </span>
              {/* Connection Status Indicator */}
              <span
                className={`connection-dot ${
                  connectionStatus === 'connected' ? 'connection-connected' :
                  connectionStatus === 'connecting' ? 'connection-connecting' :
                  'connection-disconnected'
                }`}
                title={connectionStatus === 'connected' ? 'Connected' :
                       connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              />
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
              {state.gameNightTitle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isHost && (
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-chaos"
              style={{
                padding: '8px 12px',
                backgroundColor: '#2a2a2a',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
              title="Share room code"
            >
              📤
            </button>
          )}
          <div className="animate-pulse-border" style={{
            backgroundColor: '#0a0a0a',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '2px solid #f97316',
          }}>
            <span style={{ color: '#fde68a', fontWeight: 'bold', fontSize: '18px' }}>
              {myPoints}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '4px' }}>pts</span>
          </div>
        </div>
      </div>

      {/* Current Event Banner */}
      {state.currentEvent && (
        <div className="event-card-urgent animate-slide-down" style={{
          backgroundColor: '#7c3aed',
          padding: '16px 20px',
          borderBottom: '2px solid #8b5cf6',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div>
              <div style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
              }}>
                {state.currentEvent.title}
              </div>
              <div style={{
                color: '#e2e8f0',
                fontSize: '14px',
                marginTop: '4px',
              }}>
                {state.currentEvent.description}
              </div>
            </div>
            {eventTimeRemaining !== null && eventTimeRemaining > 0 && (
              <div className={eventTimeRemaining <= 10 ? 'animate-countdown' : ''} style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontFamily: 'monospace',
              }}>
                <span className={eventTimeRemaining <= 10 ? 'timer-critical' : eventTimeRemaining <= 30 ? 'timer-warning' : 'timer-normal'} style={{ fontWeight: 'bold', fontSize: '20px' }}>
                  {Math.floor(eventTimeRemaining / 60)}:{(eventTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="tab-content" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {activeTab === 'events' && (
          <EventsTab
            currentEvent={state.currentEvent}
            eventHistory={state.eventHistory}
            isHost={isHost || false}
            socket={socket}
          />
        )}
        {activeTab === 'bets' && (
          <BetsTab
            bets={state.bets}
            myPoints={myPoints}
            participantInfo={participantInfo}
            socket={socket}
          />
        )}
        {activeTab === 'games' && (
          <GamesTab
            isHost={isHost || false}
            socket={socket}
          />
        )}
        {activeTab === 'you' && (
          <YouTab
            objectives={myObjectives}
            participants={state.participants}
            socket={socket}
            scoringMode={state.scoringMode || 'PARTY'}
            myPoints={myPoints}
          />
        )}
      </div>

      {/* Host Controls */}
      {isHost && (
        <HostControls
          sessionStatus={state?.status || 'ACTIVE'}
          hasCurrentEvent={!!state?.currentEvent}
          scoringMode={state?.scoringMode || 'PARTY'}
          socket={socket}
          onShowShare={() => setShowShareModal(true)}
        />
      )}

      {/* Bottom Tab Bar */}
      <div className="safe-area-bottom" style={{
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #2a2a2a',
        display: 'flex',
        padding: '8px 0',
      }}>
        {(['events', 'bets', 'games', 'you'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'btn-chaos' : ''}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: activeTab === tab ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
              border: 'none',
              borderTop: activeTab === tab ? '2px solid #f97316' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              fontSize: '24px',
              transform: activeTab === tab ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}>
              {tab === 'events' && '🎲'}
              {tab === 'bets' && '💰'}
              {tab === 'games' && '🎮'}
              {tab === 'you' && '🎯'}
            </span>
            <span style={{
              fontSize: '10px',
              marginTop: '4px',
              color: activeTab === tab ? '#f97316' : '#6b7280',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize',
            }}>
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* Share Modal */}
      {state?.roomCode && (
        <QRCodeShare
          roomCode={state.roomCode}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// Tab Components

function EventsTab({ currentEvent, eventHistory, isHost, socket }: {
  currentEvent?: ChaosEvent;
  eventHistory: ChaosEvent[];
  isHost: boolean;
  socket: any;
}) {
  return (
    <div className="animate-fade-in">
      {!currentEvent && (
        <div className="animate-slide-up" style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <div className="animate-pulse" style={{ fontSize: '48px', marginBottom: '16px' }}>😴</div>
          <p style={{ color: '#9ca3af' }}>No active event</p>
          {isHost && (
            <button
              onClick={() => socket.send(JSON.stringify({ type: 'host_trigger_event' }))}
              className="btn-chaos animate-glow"
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: '#f97316',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Trigger Random Event
            </button>
          )}
        </div>
      )}

      {isHost && currentEvent && (
        <div className="animate-slide-up" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => socket.send(JSON.stringify({ type: 'host_complete_event' }))}
            className="btn-chaos"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ✓ Complete
          </button>
          <button
            onClick={() => socket.send(JSON.stringify({ type: 'host_skip_event' }))}
            className="btn-chaos"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ⏭ Skip
          </button>
        </div>
      )}

      <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '12px' }}>
        Event History
      </h3>
      {eventHistory.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '14px' }}>No events yet</p>
      ) : (
        eventHistory.slice().reverse().map((event, index) => (
          <div
            key={event.id}
            className="event-card"
            style={{
              backgroundColor: '#1a1a1a',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '8px',
              borderLeft: `3px solid ${event.status === 'COMPLETED' ? '#10b981' : '#6b7280'}`,
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{event.title}</div>
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              {event.status === 'COMPLETED' ? '✓ Completed' : '⏭ Skipped'}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BetsTab({ bets, myPoints, participantInfo, socket }: {
  bets: Record<string, ChaosBet>;
  myPoints: number;
  participantInfo: { participantId: string } | null;
  socket: any;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newBetDesc, setNewBetDesc] = useState('');
  const [newBetAmount, setNewBetAmount] = useState(10);

  const openBets = Object.values(bets).filter(b => b.status === 'OPEN');
  const resolvedBets = Object.values(bets).filter(b => b.status === 'RESOLVED');

  const createBet = () => {
    if (!newBetDesc.trim()) return;
    socket.send(JSON.stringify({
      type: 'create_bet',
      description: newBetDesc,
      betType: 'CUSTOM',
      wagerAmount: newBetAmount,
    }));
    setNewBetDesc('');
    setShowCreate(false);
  };

  return (
    <div>
      <button
        onClick={() => setShowCreate(!showCreate)}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#f97316',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        + Create Bet
      </button>

      {showCreate && (
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <input
            type="text"
            placeholder="What are you betting on?"
            value={newBetDesc}
            onChange={(e) => setNewBetDesc(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              color: '#e2e8f0',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#9ca3af' }}>Minimum wager:</span>
            <input
              type="number"
              value={newBetAmount}
              onChange={(e) => setNewBetAmount(Number(e.target.value))}
              min={5}
              max={myPoints}
              style={{
                width: '80px',
                padding: '8px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#e2e8f0',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createBet}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3a3a3a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '12px' }}>
        Open Bets ({openBets.length})
      </h3>
      {openBets.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
          No open bets. Create one!
        </p>
      ) : (
        openBets.map(bet => (
          <div key={bet.id} style={{
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '12px',
          }}>
            <div style={{ color: '#e2e8f0', fontWeight: '500', marginBottom: '8px' }}>
              {bet.description}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>
              by {bet.creatorName} • Min: {bet.wagerAmount} pts
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => socket.send(JSON.stringify({
                  type: 'place_bet',
                  betId: bet.id,
                  prediction: 'YES',
                  wager: bet.wagerAmount,
                }))}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Yes ({bet.wagerAmount})
              </button>
              <button
                onClick={() => socket.send(JSON.stringify({
                  type: 'place_bet',
                  betId: bet.id,
                  prediction: 'NO',
                  wager: bet.wagerAmount,
                }))}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                No ({bet.wagerAmount})
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function GamesTab({ isHost, socket }: { isHost: boolean; socket: any }) {
  const miniGames = [
    { type: 'QUICK_DRAW', title: 'Quick Draw', description: 'First to tap wins!', icon: '👆' },
    { type: 'VOTING', title: 'Who Would...?', description: 'Vote on fun questions', icon: '🗳️' },
    { type: 'TRIVIA', title: 'Trivia', description: 'Test your knowledge', icon: '🧠' },
  ];

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '16px' }}>
        Mini Games
      </h3>
      {miniGames.map(game => (
        <div key={game.type} style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ fontSize: '32px' }}>{game.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{game.title}</div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>{game.description}</div>
          </div>
          {isHost && (
            <button
              onClick={() => socket.send(JSON.stringify({
                type: 'host_start_mini_game',
                miniGameType: game.type,
              }))}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f97316',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Start
            </button>
          )}
        </div>
      ))}
      {!isHost && (
        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginTop: '16px' }}>
          The host can start mini games
        </p>
      )}
    </div>
  );
}

function YouTab({ objectives, participants, socket, scoringMode, myPoints }: {
  objectives: Objective[];
  participants: Record<string, Participant>;
  socket: any;
  scoringMode: ScoringMode;
  myPoints: number;
}) {
  const sortedParticipants = Object.values(participants)
    .sort((a, b) => b.chaosPoints - a.chaosPoints);

  // Get scoring mode display info
  const modeInfo = {
    PRIVATE_BINGO: { label: 'Private Mode', description: 'Only you see your score', icon: '🎯' },
    PARTY: { label: 'Party Mode', description: 'Scores visible, ties OK', icon: '🎉' },
    COMPETITIVE: { label: 'Competitive', description: 'Leaderboard & winner', icon: '🏆' },
  }[scoringMode];

  return (
    <div>
      {/* Scoring Mode Indicator */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '24px' }}>{modeInfo.icon}</span>
        <div>
          <div style={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px' }}>
            {modeInfo.label}
          </div>
          <div style={{ color: '#6b7280', fontSize: '12px' }}>
            {modeInfo.description}
          </div>
        </div>
        {scoringMode === 'PRIVATE_BINGO' && (
          <div style={{
            marginLeft: 'auto',
            backgroundColor: '#0a0a0a',
            padding: '8px 16px',
            borderRadius: '8px',
          }}>
            <span style={{ color: '#fde68a', fontWeight: 'bold', fontSize: '18px' }}>
              {myPoints}
            </span>
            <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>pts</span>
          </div>
        )}
      </div>

      <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '16px' }}>
        Your Secret Objectives
      </h3>
      {objectives.length === 0 ? (
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            No objectives assigned yet. They'll appear once the host starts the session!
          </p>
        </div>
      ) : (
        objectives.map(obj => (
          <div key={obj.id} style={{
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '12px',
            borderLeft: `3px solid ${
              obj.status === 'VERIFIED' ? '#10b981' :
              obj.status === 'CLAIMED' ? '#f59e0b' :
              obj.status === 'FAILED' ? '#ef4444' : '#f97316'
            }`,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
            }}>
              <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{obj.title}</div>
              <span style={{
                backgroundColor: '#0a0a0a',
                padding: '4px 8px',
                borderRadius: '4px',
                color: '#fde68a',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                +{obj.chaosPointsReward}
              </span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>
              {obj.description}
            </div>
            {obj.status === 'ACTIVE' && (
              <button
                onClick={() => socket.send(JSON.stringify({
                  type: 'claim_objective',
                  objectiveId: obj.id,
                }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f97316',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Claim Complete!
              </button>
            )}
            {obj.status === 'CLAIMED' && (
              <div style={{
                padding: '10px',
                backgroundColor: '#f59e0b20',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#f59e0b',
                fontSize: '14px',
              }}>
                Awaiting verification...
              </div>
            )}
            {obj.status === 'VERIFIED' && (
              <div style={{
                padding: '10px',
                backgroundColor: '#10b98120',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#10b981',
                fontSize: '14px',
              }}>
                Complete! +{obj.chaosPointsReward} points
              </div>
            )}
          </div>
        ))
      )}

      {/* Leaderboard - only show in Party and Competitive modes */}
      {scoringMode !== 'PRIVATE_BINGO' && (
        <>
          <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginTop: '24px', marginBottom: '16px' }}>
            {scoringMode === 'COMPETITIVE' ? '🏆 Leaderboard' : '🎉 Party Standings'}
          </h3>
          {sortedParticipants.map((p, i) => (
            <div key={p.id} style={{
              backgroundColor: '#1a1a1a',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Avatar with color */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: p.avatarColor || (i === 0 ? '#fde68a' : '#3a3a3a'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}>
                  {scoringMode === 'COMPETITIVE' && i === 0 ? '👑' : p.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span style={{ color: '#e2e8f0' }}>
                    {p.displayName}
                    {p.isHost && <span style={{ color: '#9ca3af', fontSize: '12px' }}> (Host)</span>}
                  </span>
                  {p.pronouns && (
                    <div style={{ color: '#6b7280', fontSize: '11px' }}>{p.pronouns}</div>
                  )}
                </div>
              </div>
              <span style={{ color: '#fde68a', fontWeight: 'bold' }}>
                {p.chaosPoints} pts
              </span>
            </div>
          ))}
        </>
      )}

      {/* Private Bingo - just show players, no scores */}
      {scoringMode === 'PRIVATE_BINGO' && (
        <>
          <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginTop: '24px', marginBottom: '16px' }}>
            Players
          </h3>
          {sortedParticipants.map((p) => (
            <div key={p.id} style={{
              backgroundColor: '#1a1a1a',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: p.avatarColor || '#3a3a3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '12px',
              }}>
                {p.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ color: '#e2e8f0' }}>
                  {p.displayName}
                  {p.isHost && <span style={{ color: '#9ca3af', fontSize: '12px' }}> (Host)</span>}
                </span>
                {p.pronouns && (
                  <div style={{ color: '#6b7280', fontSize: '11px' }}>{p.pronouns}</div>
                )}
              </div>
              <span style={{
                marginLeft: 'auto',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: p.isConnected ? '#10b981' : '#6b7280',
              }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
