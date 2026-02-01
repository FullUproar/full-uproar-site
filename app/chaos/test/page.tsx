'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import DebugPanel from '../components/DebugPanel';

type ScoringMode = 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE';
type TabType = 'events' | 'bets' | 'games' | 'you';

interface Participant {
  id: string;
  participantId: string;
  displayName: string;
  pronouns?: string;
  avatarColor: string;
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
  status: 'ACTIVE' | 'COMPLETED' | 'SKIPPED';
}

interface ChaosBet {
  id: string;
  creatorId: string;
  creatorName: string;
  description: string;
  wagerAmount: number;
  status: 'OPEN' | 'RESOLVED';
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
  status: 'ACTIVE' | 'CLAIMED' | 'VERIFIED' | 'FAILED';
}

// Generate a unique ID
const generateId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function ChaosTestPage() {
  // Debug panel state
  const [showDebug, setShowDebug] = useState(true);

  // Session state (simulated)
  const [scoringMode, setScoringMode] = useState<ScoringMode>('PARTY');
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [currentEvent, setCurrentEvent] = useState<ChaosEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<ChaosEvent[]>([]);
  const [bets, setBets] = useState<Record<string, ChaosBet>>({});
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [eventTimeRemaining, setEventTimeRemaining] = useState<number | null>(null);

  // My participant ID (the host/tester)
  const [myId] = useState(() => generateId());

  // Initialize with host participant
  useEffect(() => {
    setParticipants({
      [myId]: {
        id: myId,
        participantId: myId,
        displayName: 'You (Tester)',
        pronouns: '',
        avatarColor: '#f97316',
        isHost: true,
        isConnected: true,
        chaosPoints: 100,
        setupComplete: true,
      },
    });
  }, [myId]);

  // Keyboard shortcut for debug panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        // Only if not typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setShowDebug(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Event timer countdown
  useEffect(() => {
    if (currentEvent?.endsAt) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, currentEvent.endsAt! - Date.now());
        setEventTimeRemaining(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          clearInterval(timer);
          // Auto-complete when timer ends
          handleCompleteEvent();
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setEventTimeRemaining(null);
    }
  }, [currentEvent?.endsAt]);

  // Debug panel handlers
  // Note: DebugParticipant is a subset of Participant, so we cast and add missing fields
  const handleAddParticipant = useCallback((participant: {
    id: string;
    displayName: string;
    pronouns?: string;
    avatarColor: string;
    chaosPoints: number;
    isHost: boolean;
    isConnected: boolean;
  }) => {
    setParticipants(prev => ({
      ...prev,
      [participant.id]: {
        ...participant,
        participantId: participant.id,
        setupComplete: true,
      },
    }));
  }, []);

  const handleRemoveParticipant = useCallback((id: string) => {
    setParticipants(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleUpdatePoints = useCallback((id: string, points: number) => {
    setParticipants(prev => ({
      ...prev,
      [id]: { ...prev[id], chaosPoints: points },
    }));
  }, []);

  const handleTriggerEvent = useCallback((event: { title: string; description: string; durationMinutes?: number }) => {
    const newEvent: ChaosEvent = {
      id: generateId(),
      type: 'RANDOM',
      title: event.title,
      description: event.description,
      durationMinutes: event.durationMinutes,
      startedAt: Date.now(),
      endsAt: event.durationMinutes ? Date.now() + event.durationMinutes * 60 * 1000 : undefined,
      status: 'ACTIVE',
    };
    setCurrentEvent(newEvent);
  }, []);

  const handleCompleteEvent = useCallback(() => {
    if (currentEvent) {
      setEventHistory(prev => [...prev, { ...currentEvent, status: 'COMPLETED' }]);
      setCurrentEvent(null);
    }
  }, [currentEvent]);

  const handleSkipEvent = useCallback(() => {
    if (currentEvent) {
      setEventHistory(prev => [...prev, { ...currentEvent, status: 'SKIPPED' }]);
      setCurrentEvent(null);
    }
  }, [currentEvent]);

  const handleAddObjective = useCallback((obj: { title: string; description: string; reward: number }) => {
    const newObjective: Objective = {
      id: generateId(),
      title: obj.title,
      description: obj.description,
      chaosPointsReward: obj.reward,
      status: 'ACTIVE',
    };
    setObjectives(prev => [...prev, newObjective]);
  }, []);

  const handleClaimObjective = useCallback((objectiveId: string) => {
    setObjectives(prev => prev.map(o =>
      o.id === objectiveId ? { ...o, status: 'CLAIMED' as const } : o
    ));
    // Auto-verify after 2 seconds in test mode
    setTimeout(() => {
      setObjectives(prev => prev.map(o => {
        if (o.id === objectiveId && o.status === 'CLAIMED') {
          // Award points
          setParticipants(p => ({
            ...p,
            [myId]: { ...p[myId], chaosPoints: p[myId].chaosPoints + o.chaosPointsReward },
          }));
          return { ...o, status: 'VERIFIED' as const };
        }
        return o;
      }));
    }, 2000);
  }, [myId]);

  const handleSimulateBet = useCallback((bet: { description: string; creator: string; amount: number }) => {
    const newBet: ChaosBet = {
      id: generateId(),
      creatorId: 'test',
      creatorName: bet.creator,
      description: bet.description,
      wagerAmount: bet.amount,
      status: 'OPEN',
      participants: [],
    };
    setBets(prev => ({ ...prev, [newBet.id]: newBet }));
  }, []);

  const handlePlaceBet = useCallback((betId: string, prediction: string) => {
    setBets(prev => ({
      ...prev,
      [betId]: {
        ...prev[betId],
        participants: [
          ...prev[betId].participants,
          {
            participantId: myId,
            displayName: 'You (Tester)',
            prediction,
            wager: prev[betId].wagerAmount,
          },
        ],
      },
    }));
  }, [myId]);

  const handleCreateBet = useCallback((description: string, amount: number) => {
    const newBet: ChaosBet = {
      id: generateId(),
      creatorId: myId,
      creatorName: 'You (Tester)',
      description,
      wagerAmount: amount,
      status: 'OPEN',
      participants: [],
    };
    setBets(prev => ({ ...prev, [newBet.id]: newBet }));
  }, [myId]);

  // Get my points
  const myPoints = participants[myId]?.chaosPoints || 0;

  // Get sorted participants for leaderboard
  const sortedParticipants = Object.values(participants).sort((a, b) => b.chaosPoints - a.chaosPoints);

  // Scoring mode display info
  const modeInfo = {
    PRIVATE_BINGO: { label: 'Private Mode', description: 'Only you see your score', icon: '🎯' },
    PARTY: { label: 'Party Mode', description: 'Scores visible, ties OK', icon: '🎉' },
    COMPETITIVE: { label: 'Competitive', description: 'Leaderboard & winner', icon: '🏆' },
  }[scoringMode];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                color: '#f97316',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Chaos Agent
              </span>
              <span style={{
                backgroundColor: '#8b5cf6',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
              }}>
                TEST MODE
              </span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
              Solo Testing Sandbox
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowDebug(prev => !prev)}
            style={{
              padding: '8px 12px',
              backgroundColor: showDebug ? '#f97316' : '#2a2a2a',
              color: showDebug ? '#000' : '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🧪 Debug
          </button>
          <div style={{
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

      {/* Test Mode Banner */}
      <div style={{
        backgroundColor: '#8b5cf620',
        padding: '8px 16px',
        borderBottom: '1px solid #8b5cf6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#c4b5fd', fontSize: '12px' }}>
          This is a sandbox for solo testing. No database or real-time connection.
        </span>
      </div>

      {/* Current Event Banner */}
      {currentEvent && (
        <div style={{
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
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
                {currentEvent.title}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: '14px', marginTop: '4px' }}>
                {currentEvent.description}
              </div>
            </div>
            {eventTimeRemaining !== null && eventTimeRemaining > 0 && (
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontFamily: 'monospace',
              }}>
                <span style={{
                  color: eventTimeRemaining <= 10 ? '#ef4444' : eventTimeRemaining <= 30 ? '#f59e0b' : '#fff',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}>
                  {Math.floor(eventTimeRemaining / 60)}:{(eventTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          {/* Host controls for event */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleCompleteEvent}
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
              Complete
            </button>
            <button
              onClick={handleSkipEvent}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', marginRight: showDebug ? '320px' : 0, transition: 'margin-right 0.3s ease' }}>
        {activeTab === 'events' && (
          <div>
            {!currentEvent && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>😴</div>
                <p style={{ color: '#9ca3af' }}>No active event</p>
                <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                  Use the Debug Panel to trigger events
                </p>
              </div>
            )}

            <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '12px' }}>
              Event History
            </h3>
            {eventHistory.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>No events yet</p>
            ) : (
              eventHistory.slice().reverse().map((event) => (
                <div key={event.id} style={{
                  backgroundColor: '#1a1a1a',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  borderLeft: `3px solid ${event.status === 'COMPLETED' ? '#10b981' : '#6b7280'}`,
                }}>
                  <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{event.title}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                    {event.status === 'COMPLETED' ? '✓ Completed' : '⏭ Skipped'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'bets' && (
          <BetsSection
            bets={bets}
            myPoints={myPoints}
            onCreateBet={handleCreateBet}
            onPlaceBet={handlePlaceBet}
          />
        )}

        {activeTab === 'games' && (
          <div>
            <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '16px' }}>
              Mini Games
            </h3>
            {[
              { type: 'QUICK_DRAW', title: 'Quick Draw', description: 'First to tap wins!', icon: '👆' },
              { type: 'VOTING', title: 'Who Would...?', description: 'Vote on fun questions', icon: '🗳️' },
              { type: 'TRIVIA', title: 'Trivia', description: 'Test your knowledge', icon: '🧠' },
            ].map(game => (
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
                <button
                  onClick={() => alert(`Mini game "${game.title}" would start here!`)}
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
              </div>
            ))}
          </div>
        )}

        {activeTab === 'you' && (
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
                  No objectives yet. Use the Debug Panel to add some!
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
                      onClick={() => handleClaimObjective(obj.id)}
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
                      Verifying... (auto-approves in test mode)
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

            {/* Leaderboard */}
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
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: p.avatarColor || '#3a3a3a',
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
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #2a2a2a',
        display: 'flex',
        padding: '8px 0',
        marginRight: showDebug ? '320px' : 0,
        transition: 'margin-right 0.3s ease',
      }}>
        {(['events', 'bets', 'games', 'you'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
            }}
          >
            <span style={{ fontSize: '24px' }}>
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

      {/* Debug Panel */}
      <DebugPanel
        isOpen={showDebug}
        onClose={() => setShowDebug(false)}
        onAddParticipant={handleAddParticipant}
        onRemoveParticipant={handleRemoveParticipant}
        onUpdatePoints={handleUpdatePoints}
        onTriggerEvent={handleTriggerEvent}
        onChangeScoringMode={setScoringMode}
        onAddObjective={handleAddObjective}
        onSimulateBet={handleSimulateBet}
        participants={participants}
        currentScoringMode={scoringMode}
      />
    </div>
  );
}

// Bets Section Component
function BetsSection({
  bets,
  myPoints,
  onCreateBet,
  onPlaceBet,
}: {
  bets: Record<string, ChaosBet>;
  myPoints: number;
  onCreateBet: (description: string, amount: number) => void;
  onPlaceBet: (betId: string, prediction: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newBetDesc, setNewBetDesc] = useState('');
  const [newBetAmount, setNewBetAmount] = useState(10);

  const openBets = Object.values(bets).filter(b => b.status === 'OPEN');

  const createBet = () => {
    if (!newBetDesc.trim()) return;
    onCreateBet(newBetDesc, newBetAmount);
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
          No open bets. Create one or use the Debug Panel!
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
                onClick={() => onPlaceBet(bet.id, 'YES')}
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
                onClick={() => onPlaceBet(bet.id, 'NO')}
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
