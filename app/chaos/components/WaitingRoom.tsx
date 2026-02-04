'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Participant {
  id: string;
  displayName: string;
  pronouns?: string;
  avatarColor?: string;
  isHost: boolean;
  isConnected: boolean;
}

interface WaitingRoomProps {
  roomCode: string;
  gameNightTitle: string;
  participants: Record<string, Participant>;
  isHost: boolean;
  onStartSession: () => void;
  onShowShare: () => void;
}

// Fun waiting messages that rotate
const WAITING_MESSAGES = [
  "Gathering the chaos energy...",
  "Shuffling the deck of destiny...",
  "Calibrating the chaos meter...",
  "Summoning random events...",
  "Loading secret objectives...",
  "Preparing for mayhem...",
  "Charging the fun batteries...",
  "Plotting delicious chaos...",
];

// Fun facts/tips to show while waiting
const FUN_FACTS = [
  { icon: '🎯', text: "Complete secret objectives to earn bonus points!" },
  { icon: '🤫', text: "Your objectives are secret - don't let others know!" },
  { icon: '💰', text: "Bet on game outcomes to multiply your points!" },
  { icon: '🎲', text: "Random events will spice things up throughout the night!" },
  { icon: '🏆', text: "The player with the most chaos points wins!" },
  { icon: '🎮', text: "Quick mini-games can turn the tide in seconds!" },
  { icon: '📱', text: "Keep your phone handy - events can happen anytime!" },
  { icon: '🤝', text: "Form alliances... or betray them for points!" },
];

export default function WaitingRoom({
  roomCode,
  gameNightTitle,
  participants,
  isHost,
  onStartSession,
  onShowShare,
}: WaitingRoomProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Rotate waiting message
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % WAITING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rotate fun fact
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const participantList = Object.values(participants);
  const connectedCount = participantList.filter(p => p.isConnected).length;

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
        padding: '16px 20px',
        borderBottom: '1px solid #2a2a2a',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 20px',
          backgroundColor: '#0a0a0a',
          borderRadius: '8px',
          border: '2px solid #FF8200',
        }}>
          <span style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Room Code
          </span>
          <div style={{
            color: '#FF8200',
            fontSize: '28px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '6px',
          }}>
            {roomCode}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 20px',
        overflowY: 'auto',
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            margin: '0 auto 12px',
          }}>
            <Image
              src="/FuglyLogo.png"
              alt="Chaos Agent"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 style={{
            color: '#FBDB65',
            fontSize: '20px',
            margin: '0 0 4px 0',
          }}>
            {gameNightTitle}
          </h1>
          <p style={{
            color: '#9ca3af',
            fontSize: '13px',
            margin: 0,
          }}>
            {WAITING_MESSAGES[messageIndex]}{dots}
          </p>
        </div>

        {/* Participants List */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{
              color: '#e2e8f0',
              fontSize: '16px',
              margin: 0,
            }}>
              Players Ready
            </h2>
            <span style={{
              backgroundColor: '#10b981',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              {connectedCount}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {participantList.map((p, index) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '10px',
                  animation: 'slideIn 0.3s ease-out',
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: p.avatarColor || '#FF8200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  position: 'relative',
                }}>
                  {p.displayName.charAt(0).toUpperCase()}
                  {/* Host crown */}
                  {p.isHost && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-4px',
                      fontSize: '14px',
                    }}>
                      👑
                    </span>
                  )}
                </div>

                {/* Name & Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#e2e8f0',
                    fontWeight: '500',
                    fontSize: '15px',
                  }}>
                    {p.displayName}
                    {p.isHost && (
                      <span style={{
                        color: '#FF8200',
                        fontSize: '11px',
                        marginLeft: '8px',
                      }}>
                        HOST
                      </span>
                    )}
                  </div>
                  {p.pronouns && (
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      {p.pronouns}
                    </div>
                  )}
                </div>

                {/* Connection status */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: p.isConnected ? '#10b981' : '#6b7280',
                }} />
              </div>
            ))}
          </div>

          {/* Waiting for more hint */}
          {connectedCount < 3 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#FF820020',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <span style={{ color: '#FF8200', fontSize: '13px' }}>
                Waiting for more players to join...
              </span>
            </div>
          )}
        </div>

        {/* Fun Fact Card */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          borderLeft: '4px solid #7D55C7',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '28px' }}>
              {FUN_FACTS[factIndex].icon}
            </span>
            <div>
              <div style={{
                color: '#9ca3af',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px',
              }}>
                Did you know?
              </div>
              <div style={{
                color: '#e2e8f0',
                fontSize: '14px',
              }}>
                {FUN_FACTS[factIndex].text}
              </div>
            </div>
          </div>
        </div>

        {/* Share Instructions */}
        {isHost && (
          <div style={{
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <button
              onClick={onShowShare}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2a2a2a',
                color: '#e2e8f0',
                border: '1px solid #3a3a3a',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              📤 Share Room Code
            </button>
            <p style={{
              color: '#6b7280',
              fontSize: '12px',
              marginTop: '12px',
            }}>
              Share this code with your players or show the QR code
            </p>
          </div>
        )}
      </div>

      {/* Start Button (Host only) */}
      {isHost && (
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #2a2a2a',
        }}>
          <button
            onClick={onStartSession}
            disabled={connectedCount < 1}
            style={{
              width: '100%',
              padding: '18px',
              backgroundColor: connectedCount >= 1 ? '#FF8200' : '#3a3a3a',
              color: connectedCount >= 1 ? '#000' : '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: connectedCount >= 1 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            🚀 Start the Chaos!
          </button>
          {connectedCount < 2 && (
            <p style={{
              color: '#6b7280',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '8px',
            }}>
              You can start with just yourself, but it's more fun with friends!
            </p>
          )}
        </div>
      )}

      {/* Non-host waiting message */}
      {!isHost && (
        <div style={{
          padding: '20px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #2a2a2a',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#0a0a0a',
            borderRadius: '20px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#FF8200',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
              Waiting for host to start...
            </span>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
