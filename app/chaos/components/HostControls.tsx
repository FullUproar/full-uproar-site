'use client';

import { useState } from 'react';

type ScoringMode = 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE';

interface HostControlsProps {
  sessionStatus: 'SETUP' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  hasCurrentEvent: boolean;
  scoringMode: ScoringMode;
  socket: any;
  onShowShare: () => void;
}

export default function HostControls({
  sessionStatus,
  hasCurrentEvent,
  scoringMode,
  socket,
  onShowShare,
}: HostControlsProps) {
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleEndSession = () => {
    socket.send(JSON.stringify({ type: 'host_end_session' }));
    setShowConfirmEnd(false);
  };

  const handlePauseResume = () => {
    socket.send(JSON.stringify({
      type: sessionStatus === 'PAUSED' ? 'host_resume_session' : 'host_pause_session'
    }));
  };

  const handleRelaxMode = () => {
    socket.send(JSON.stringify({ type: 'host_relax_mode' }));
  };

  // Get next relaxed mode label
  const getNextModeLabel = (): string | null => {
    if (scoringMode === 'COMPETITIVE') return 'Party Mode';
    if (scoringMode === 'PARTY') return 'Private Mode';
    return null; // Already at most relaxed
  };

  const nextModeLabel = getNextModeLabel();

  return (
    <>
      {/* Floating Host Controls */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '16px',
          zIndex: 50,
        }}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-chaos"
          style={{
            position: 'absolute',
            top: '-40px',
            right: 0,
            padding: '8px 12px',
            backgroundColor: '#FF8200',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          👑 Host {isExpanded ? '▼' : '▲'}
        </button>

        {isExpanded && (
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '16px',
              border: '2px solid #FF8200',
              boxShadow: '0 4px 20px rgba(255, 130, 0, 0.3)',
              minWidth: '200px',
            }}
          >
            <div style={{
              color: '#9ca3af',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}>
              Host Controls
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Trigger Event */}
              {!hasCurrentEvent && (
                <button
                  onClick={() => socket.send(JSON.stringify({ type: 'host_trigger_event' }))}
                  className="btn-chaos animate-glow"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  🎲 Random Event
                </button>
              )}

              {/* Event Controls */}
              {hasCurrentEvent && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => socket.send(JSON.stringify({ type: 'host_complete_event' }))}
                    className="btn-chaos"
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Done
                  </button>
                  <button
                    onClick={() => socket.send(JSON.stringify({ type: 'host_skip_event' }))}
                    className="btn-chaos"
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ⏭ Skip
                  </button>
                </div>
              )}

              {/* Start Mini Game */}
              <button
                onClick={() => socket.send(JSON.stringify({
                  type: 'host_start_mini_game',
                  miniGameType: 'QUICK_DRAW',
                }))}
                className="btn-chaos"
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#ec4899',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                🎮 Quick Game
              </button>

              {/* Share Button */}
              <button
                onClick={onShowShare}
                className="btn-chaos"
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#2a2a2a',
                  color: '#e2e8f0',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                📤 Share Code
              </button>

              {/* Mode Relaxation - only show if can relax further */}
              {nextModeLabel && (
                <button
                  onClick={handleRelaxMode}
                  className="btn-chaos"
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#7D55C7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  😌 Switch to {nextModeLabel}
                </button>
              )}

              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: '#3a3a3a',
                margin: '4px 0',
              }} />

              {/* Pause/Resume */}
              <button
                onClick={handlePauseResume}
                className="btn-chaos"
                style={{
                  padding: '10px 16px',
                  backgroundColor: sessionStatus === 'PAUSED' ? '#10b981' : '#f59e0b',
                  color: sessionStatus === 'PAUSED' ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {sessionStatus === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
              </button>

              {/* End Session */}
              <button
                onClick={() => setShowConfirmEnd(true)}
                className="btn-chaos"
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🏁 End Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* End Session Confirmation Modal */}
      {showConfirmEnd && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setShowConfirmEnd(false)}
        >
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              textAlign: 'center',
              border: '2px solid #ef4444',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏁</div>
            <h3 style={{
              color: '#e2e8f0',
              fontSize: '20px',
              marginBottom: '8px',
            }}>
              End Session?
            </h3>
            <p style={{
              color: '#9ca3af',
              fontSize: '14px',
              marginBottom: '24px',
            }}>
              This will end the chaos session and show final scores. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="btn-chaos"
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2a2a2a',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                className="btn-chaos"
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                End It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
