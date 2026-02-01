'use client';

import { useState } from 'react';

interface DebugParticipant {
  id: string;
  displayName: string;
  pronouns?: string;
  avatarColor: string;
  chaosPoints: number;
  isHost: boolean;
  isConnected: boolean;
}

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParticipant: (participant: DebugParticipant) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdatePoints: (id: string, points: number) => void;
  onTriggerEvent: (event: { title: string; description: string; durationMinutes?: number }) => void;
  onChangeScoringMode: (mode: 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE') => void;
  onAddObjective: (objective: { title: string; description: string; reward: number }) => void;
  onSimulateBet: (bet: { description: string; creator: string; amount: number }) => void;
  participants: Record<string, DebugParticipant>;
  currentScoringMode: string;
}

const SAMPLE_NAMES = ['Alex', 'Jordan', 'Riley', 'Morgan', 'Casey', 'Quinn', 'Sage', 'Dakota'];
const SAMPLE_COLORS = ['#f97316', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444', '#3b82f6'];
const SAMPLE_PRONOUNS = ['he/him', 'she/her', 'they/them', ''];

const SAMPLE_EVENTS = [
  { title: '🤫 Silence is Golden', description: 'No talking for 2 minutes! Violators lose 10 points.', durationMinutes: 2 },
  { title: '🎭 Accent Challenge', description: 'Everyone must speak in an accent until the next event.', durationMinutes: 5 },
  { title: '🔄 Seat Shuffle', description: 'Everyone rotate seats clockwise. GO!', durationMinutes: 0 },
  { title: '🤝 Compliment Circle', description: 'Each player must compliment the person on their left.', durationMinutes: 3 },
  { title: '🎲 Random Task', description: 'The host assigns a secret task to a random player.', durationMinutes: 0 },
];

const SAMPLE_OBJECTIVES = [
  { title: 'Secret Word', description: 'Get someone to say "banana" without saying it yourself', reward: 15 },
  { title: 'Alliance Builder', description: 'Form a secret alliance with another player', reward: 20 },
  { title: 'Drama Queen', description: 'Cause a dramatic reaction from another player', reward: 10 },
  { title: 'The Whisperer', description: 'Successfully whisper to 3 different players', reward: 15 },
  { title: 'Game Changer', description: 'Make a play that completely shifts the game', reward: 25 },
];

export default function DebugPanel({
  isOpen,
  onClose,
  onAddParticipant,
  onRemoveParticipant,
  onUpdatePoints,
  onTriggerEvent,
  onChangeScoringMode,
  onAddObjective,
  onSimulateBet,
  participants,
  currentScoringMode,
}: DebugPanelProps) {
  const [activeSection, setActiveSection] = useState<'participants' | 'events' | 'objectives' | 'bets' | 'settings'>('participants');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [customEventDesc, setCustomEventDesc] = useState('');
  const [customEventDuration, setCustomEventDuration] = useState(2);

  if (!isOpen) return null;

  const addRandomParticipant = () => {
    const usedNames = Object.values(participants).map(p => p.displayName);
    const availableNames = SAMPLE_NAMES.filter(n => !usedNames.includes(n));
    const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `Player${Object.keys(participants).length + 1}`;

    const participant: DebugParticipant = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      displayName: name,
      pronouns: SAMPLE_PRONOUNS[Math.floor(Math.random() * SAMPLE_PRONOUNS.length)],
      avatarColor: SAMPLE_COLORS[Math.floor(Math.random() * SAMPLE_COLORS.length)],
      chaosPoints: 100,
      isHost: false,
      isConnected: true,
    };

    onAddParticipant(participant);
  };

  const triggerRandomEvent = () => {
    const event = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
    onTriggerEvent(event);
  };

  const addRandomObjective = () => {
    const objective = SAMPLE_OBJECTIVES[Math.floor(Math.random() * SAMPLE_OBJECTIVES.length)];
    onAddObjective(objective);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      borderLeft: '2px solid #f97316',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px' }}>
            🧪 Debug Panel
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>
            Solo Test Mode
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#9ca3af',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Section Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #2a2a2a',
        overflowX: 'auto',
      }}>
        {[
          { id: 'participants', icon: '👥' },
          { id: 'events', icon: '🎲' },
          { id: 'objectives', icon: '🎯' },
          { id: 'bets', icon: '💰' },
          { id: 'settings', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            style={{
              flex: 1,
              padding: '12px 8px',
              backgroundColor: activeSection === tab.id ? '#2a2a2a' : 'transparent',
              border: 'none',
              borderBottom: activeSection === tab.id ? '2px solid #f97316' : '2px solid transparent',
              color: activeSection === tab.id ? '#f97316' : '#6b7280',
              fontSize: '20px',
              cursor: 'pointer',
            }}
            title={tab.id}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Participants Section */}
        {activeSection === 'participants' && (
          <div>
            <button
              onClick={addRandomParticipant}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f97316',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              + Add Random Player
            </button>

            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '12px' }}>
              Active Participants ({Object.keys(participants).length})
            </h4>

            {Object.values(participants).map(p => (
              <div key={p.id} style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: p.avatarColor,
                  }} />
                  <span style={{ color: '#e2e8f0', flex: 1, fontSize: '14px' }}>
                    {p.displayName}
                    {p.isHost && <span style={{ color: '#f97316' }}> 👑</span>}
                  </span>
                  {!p.isHost && (
                    <button
                      onClick={() => onRemoveParticipant(p.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Points:</span>
                  <input
                    type="number"
                    value={p.chaosPoints}
                    onChange={(e) => onUpdatePoints(p.id, Number(e.target.value))}
                    style={{
                      width: '60px',
                      padding: '4px 8px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      color: '#fde68a',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    onClick={() => onUpdatePoints(p.id, p.chaosPoints + 10)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    +10
                  </button>
                  <button
                    onClick={() => onUpdatePoints(p.id, Math.max(0, p.chaosPoints - 10))}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    -10
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events Section */}
        {activeSection === 'events' && (
          <div>
            <button
              onClick={triggerRandomEvent}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              🎲 Trigger Random Event
            </button>

            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '12px' }}>
              Quick Events
            </h4>
            {SAMPLE_EVENTS.map((event, i) => (
              <button
                key={i}
                onClick={() => onTriggerEvent(event)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                {event.title}
              </button>
            ))}

            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginTop: '20px', marginBottom: '12px' }}>
              Custom Event
            </h4>
            <input
              type="text"
              placeholder="Event title..."
              value={customEventTitle}
              onChange={(e) => setCustomEventTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#e2e8f0',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              placeholder="Description..."
              value={customEventDesc}
              onChange={(e) => setCustomEventDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#e2e8f0',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="number"
                value={customEventDuration}
                onChange={(e) => setCustomEventDuration(Number(e.target.value))}
                min={0}
                max={30}
                style={{
                  width: '60px',
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <span style={{ color: '#6b7280', alignSelf: 'center', fontSize: '12px' }}>minutes</span>
            </div>
            <button
              onClick={() => {
                if (customEventTitle) {
                  onTriggerEvent({
                    title: customEventTitle,
                    description: customEventDesc || 'Custom event',
                    durationMinutes: customEventDuration,
                  });
                  setCustomEventTitle('');
                  setCustomEventDesc('');
                }
              }}
              disabled={!customEventTitle}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: customEventTitle ? '#f97316' : '#3a3a3a',
                color: customEventTitle ? '#000' : '#666',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: customEventTitle ? 'pointer' : 'not-allowed',
              }}
            >
              Trigger Custom Event
            </button>
          </div>
        )}

        {/* Objectives Section */}
        {activeSection === 'objectives' && (
          <div>
            <button
              onClick={addRandomObjective}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f97316',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              + Add Random Objective
            </button>

            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '12px' }}>
              Quick Objectives
            </h4>
            {SAMPLE_OBJECTIVES.map((obj, i) => (
              <button
                key={i}
                onClick={() => onAddObjective(obj)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                <div>{obj.title}</div>
                <div style={{ color: '#fde68a', fontSize: '11px' }}>+{obj.reward} pts</div>
              </button>
            ))}
          </div>
        )}

        {/* Bets Section */}
        {activeSection === 'bets' && (
          <div>
            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '12px' }}>
              Simulate Bets
            </h4>
            {[
              { description: 'Will someone flip the table tonight?', amount: 20 },
              { description: 'Next player to lose will rage quit', amount: 15 },
              { description: 'Host will make a rule change', amount: 10 },
            ].map((bet, i) => (
              <button
                key={i}
                onClick={() => {
                  const players = Object.values(participants).filter(p => !p.isHost);
                  const creator = players[Math.floor(Math.random() * players.length)]?.displayName || 'Player';
                  onSimulateBet({ ...bet, creator });
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                <div>{bet.description}</div>
                <div style={{ color: '#10b981', fontSize: '11px' }}>{bet.amount} pts wager</div>
              </button>
            ))}
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div>
            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginBottom: '12px' }}>
              Scoring Mode
            </h4>
            {[
              { id: 'PRIVATE_BINGO', label: 'Private Bingo', icon: '🎯', desc: 'Only you see your score' },
              { id: 'PARTY', label: 'Party Mode', icon: '🎉', desc: 'Scores visible, ties OK' },
              { id: 'COMPETITIVE', label: 'Competitive', icon: '🏆', desc: 'Leaderboard & winner' },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => onChangeScoringMode(mode.id as 'PRIVATE_BINGO' | 'PARTY' | 'COMPETITIVE')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: currentScoringMode === mode.id ? '#f97316' : '#1a1a1a',
                  color: currentScoringMode === mode.id ? '#000' : '#e2e8f0',
                  border: currentScoringMode === mode.id ? '2px solid #f97316' : '1px solid #2a2a2a',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{mode.icon}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{mode.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{mode.desc}</div>
                  </div>
                </div>
              </button>
            ))}

            <h4 style={{ color: '#e2e8f0', fontSize: '13px', marginTop: '20px', marginBottom: '12px' }}>
              Quick Actions
            </h4>
            <button
              onClick={() => {
                // Add 5 random participants
                for (let i = 0; i < 5; i++) {
                  setTimeout(() => addRandomParticipant(), i * 100);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2a2a2a',
                color: '#e2e8f0',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Add 5 Random Players
            </button>
            <button
              onClick={() => {
                Object.values(participants).forEach(p => {
                  const randomPoints = Math.floor(Math.random() * 150) + 50;
                  onUpdatePoints(p.id, randomPoints);
                });
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2a2a2a',
                color: '#e2e8f0',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Randomize All Points
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #2a2a2a',
        fontSize: '11px',
        color: '#6b7280',
        textAlign: 'center',
      }}>
        Press <kbd style={{ backgroundColor: '#2a2a2a', padding: '2px 6px', borderRadius: '4px' }}>D</kbd> to toggle debug panel
      </div>
    </div>
  );
}
