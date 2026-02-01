'use client';

import { useMemo } from 'react';

interface Participant {
  id: string;
  displayName: string;
  pronouns?: string;
  avatarColor?: string;
  isHost: boolean;
  chaosPoints: number;
}

interface ChaosEvent {
  id: string;
  type: string;
  title: string;
  status: string;
}

interface ChaosBet {
  id: string;
  creatorId: string;
  creatorName: string;
  status: string;
  participants: Array<{
    participantId: string;
    displayName: string;
    prediction: string;
  }>;
}

interface EndOfNightHighlightsProps {
  participants: Record<string, Participant>;
  eventHistory: ChaosEvent[];
  bets: Record<string, ChaosBet>;
  gameNightTitle: string;
  scoringMode: string;
}

// Fun superlative titles with icons
const SUPERLATIVES = [
  { id: 'most_chaotic', title: 'Most Chaotic', icon: '🌪️', description: 'Highest chaos points' },
  { id: 'big_spender', title: 'High Roller', icon: '🎰', description: 'Bet on the most games' },
  { id: 'silent_observer', title: 'Silent Observer', icon: '👀', description: 'Kept it low-key' },
  { id: 'consistent', title: 'Steady Player', icon: '📈', description: 'Reliable performance' },
  { id: 'host_mvp', title: 'Host MVP', icon: '🎪', description: 'Ran the show' },
];

export default function EndOfNightHighlights({
  participants,
  eventHistory,
  bets,
  gameNightTitle,
  scoringMode,
}: EndOfNightHighlightsProps) {
  // Calculate all the fun stats
  const highlights = useMemo(() => {
    const participantList = Object.values(participants);
    const sortedByPoints = [...participantList].sort((a, b) => b.chaosPoints - a.chaosPoints);
    const betList = Object.values(bets);

    // Winner
    const winner = sortedByPoints[0];
    const runnerUp = sortedByPoints[1];
    const lastPlace = sortedByPoints[sortedByPoints.length - 1];

    // Bet stats
    const betParticipation: Record<string, number> = {};
    betList.forEach(bet => {
      bet.participants.forEach(p => {
        betParticipation[p.displayName] = (betParticipation[p.displayName] || 0) + 1;
      });
    });
    const topBettor = Object.entries(betParticipation)
      .sort((a, b) => b[1] - a[1])[0];

    // Event stats
    const completedEvents = eventHistory.filter(e => e.status === 'COMPLETED').length;
    const skippedEvents = eventHistory.filter(e => e.status === 'SKIPPED').length;

    // Closest race
    const pointGaps = sortedByPoints.slice(0, -1).map((p, i) => ({
      player: p,
      gap: p.chaosPoints - sortedByPoints[i + 1].chaosPoints,
    }));
    const closestRace = pointGaps.find(g => g.gap < 10);

    // Total chaos points in economy
    const totalPoints = participantList.reduce((sum, p) => sum + p.chaosPoints, 0);
    const avgPoints = Math.round(totalPoints / participantList.length);

    // Point spread (difference between first and last)
    const pointSpread = winner && lastPlace ? winner.chaosPoints - lastPlace.chaosPoints : 0;

    // Fun awards
    const awards: Array<{ recipient: string; title: string; icon: string; reason: string }> = [];

    // Champion
    if (winner) {
      awards.push({
        recipient: winner.displayName,
        title: 'Chaos Champion',
        icon: '🏆',
        reason: `Dominated with ${winner.chaosPoints} points`,
      });
    }

    // High Roller (most bets)
    if (topBettor && topBettor[1] >= 2) {
      awards.push({
        recipient: topBettor[0],
        title: 'High Roller',
        icon: '🎰',
        reason: `Placed ${topBettor[1]} bets`,
      });
    }

    // Underdog (most improved or came from behind)
    if (lastPlace && lastPlace.chaosPoints > 0 && lastPlace !== winner) {
      awards.push({
        recipient: lastPlace.displayName,
        title: 'Lovable Underdog',
        icon: '🐕',
        reason: 'Kept fighting to the end',
      });
    }

    // Close Call (if there was a close race)
    if (closestRace) {
      awards.push({
        recipient: closestRace.player.displayName,
        title: 'Nail-Biter',
        icon: '😰',
        reason: `Won by just ${closestRace.gap} points`,
      });
    }

    // Host award
    const host = participantList.find(p => p.isHost);
    if (host) {
      awards.push({
        recipient: host.displayName,
        title: 'Ringmaster',
        icon: '🎪',
        reason: 'Hosted the chaos',
      });
    }

    return {
      winner,
      runnerUp,
      lastPlace,
      sortedByPoints,
      totalEvents: eventHistory.length,
      completedEvents,
      skippedEvents,
      totalBets: betList.length,
      topBettor,
      totalPoints,
      avgPoints,
      pointSpread,
      participantCount: participantList.length,
      awards,
    };
  }, [participants, eventHistory, bets]);

  // Generate a fun memory/quote about the night
  const funMemory = useMemo(() => {
    const memories = [
      highlights.totalEvents > 5 ? `A wild night with ${highlights.totalEvents} chaotic events!` : null,
      highlights.pointSpread > 100 ? `${highlights.winner?.displayName} absolutely crushed it!` : null,
      highlights.totalBets > 3 ? `The betting was fierce with ${highlights.totalBets} bets placed!` : null,
      highlights.pointSpread < 20 && highlights.participantCount > 2 ? 'What a close game! Every point mattered!' : null,
      highlights.completedEvents === highlights.totalEvents ? 'You completed every single event - legends!' : null,
      highlights.skippedEvents > highlights.completedEvents ? 'Some events were too chaotic to handle...' : null,
    ].filter(Boolean);

    return memories[Math.floor(Math.random() * memories.length)] || 'An unforgettable night of chaos!';
  }, [highlights]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
    }}>
      {/* Fun Memory Banner */}
      <div style={{
        backgroundColor: '#8b5cf620',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        textAlign: 'center',
        border: '1px solid #8b5cf6',
      }}>
        <span style={{ fontSize: '24px', marginRight: '8px' }}>✨</span>
        <span style={{ color: '#c4b5fd', fontSize: '14px', fontStyle: 'italic' }}>
          {funMemory}
        </span>
      </div>

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '24px',
      }}>
        <StatBox value={highlights.participantCount} label="Players" color="#f97316" />
        <StatBox value={highlights.totalEvents} label="Events" color="#8b5cf6" />
        <StatBox value={highlights.totalBets} label="Bets" color="#10b981" />
        <StatBox value={highlights.totalPoints} label="Total Pts" color="#fde68a" />
      </div>

      {/* Awards Section */}
      {highlights.awards.length > 0 && (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            color: '#fde68a',
            fontSize: '16px',
            marginBottom: '16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <span>🎖️</span> Night's Honors <span>🎖️</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {highlights.awards.map((award, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '10px',
                  animation: 'slideIn 0.3s ease-out',
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <span style={{ fontSize: '28px' }}>{award.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f97316', fontWeight: 'bold', fontSize: '13px' }}>
                    {award.title}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                    {award.recipient}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '11px' }}>
                    {award.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Leaderboard */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h3 style={{
          color: '#f97316',
          fontSize: '16px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          Final Standings
        </h3>

        {highlights.sortedByPoints.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: i === 0 ? 'rgba(253, 230, 138, 0.1)' : '#0a0a0a',
              borderRadius: '10px',
              border: i === 0 ? '2px solid #fde68a' : '1px solid #2a2a2a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Rank */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: i === 0 ? '#fde68a' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : p.avatarColor || '#3a3a3a',
                color: i < 3 ? '#000' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}>
                {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>

              {/* Name & Pronouns */}
              <div>
                <div style={{
                  color: i === 0 ? '#fde68a' : '#e2e8f0',
                  fontWeight: i === 0 ? 'bold' : 'normal',
                }}>
                  {p.displayName}
                  {p.isHost && <span style={{ color: '#f97316', fontSize: '11px', marginLeft: '6px' }}>HOST</span>}
                </div>
                {p.pronouns && (
                  <div style={{ color: '#6b7280', fontSize: '11px' }}>{p.pronouns}</div>
                )}
              </div>
            </div>

            {/* Points */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                color: '#fde68a',
                fontWeight: 'bold',
                fontSize: '18px',
              }}>
                {p.chaosPoints}
              </div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>points</div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Breakdown */}
      {highlights.totalEvents > 0 && (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h4 style={{ color: '#8b5cf6', fontSize: '14px', marginBottom: '12px' }}>
            Event Breakdown
          </h4>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
                {highlights.completedEvents}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Completed</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#6b7280', fontSize: '20px', fontWeight: 'bold' }}>
                {highlights.skippedEvents}
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Skipped</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fde68a', fontSize: '20px', fontWeight: 'bold' }}>
                {Math.round((highlights.completedEvents / highlights.totalEvents) * 100)}%
              </div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Completion</div>
            </div>
          </div>
        </div>
      )}

      {/* Game Night Title */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
      }}>
        <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Game Night
        </div>
        <div style={{ color: '#e2e8f0', fontSize: '16px', marginTop: '4px' }}>
          {gameNightTitle}
        </div>
        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

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
      `}</style>
    </div>
  );
}

// Simple stat box component
function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '12px 8px',
      borderRadius: '10px',
      textAlign: 'center',
    }}>
      <div style={{ color, fontSize: '20px', fontWeight: 'bold' }}>
        {value}
      </div>
      <div style={{ color: '#6b7280', fontSize: '9px', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}
