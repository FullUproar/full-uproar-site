'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Users, Loader2, ArrowLeft } from 'lucide-react';
import { adminStyles } from '@/app/admin/styles/adminStyles';
import { gameKitResponsiveCSS } from '@/lib/game-kit/responsive-styles';

interface GameMeta {
  gameId: string;
  gameName: string;
  creatorName: string;
  playCount: number;
}

interface GameInfo {
  definition: {
    name: string;
    description?: string;
    minPlayers: number;
    maxPlayers: number;
  };
  packs: {
    cards: {
      [key: string]: unknown[];
    };
  }[];
  meta: GameMeta;
}

const styles = {
  ...adminStyles,
  playContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  gameCard: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '500px',
    width: '100%',
    backdropFilter: 'blur(10px)',
  },
  gameIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  gameName: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FBDB65',
    marginBottom: '8px',
  },
  gameDescription: {
    color: '#94a3b8',
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '32px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  playButton: {
    ...adminStyles.button,
    padding: '16px 48px',
    fontSize: '18px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
  },
  creatorTag: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '24px',
  },
};

export default function PlayGamePage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const router = useRouter();
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchGameInfo();
  }, [shareToken]);

  const fetchGameInfo = async () => {
    try {
      const res = await fetch(`/api/game-kit/play/${shareToken}`);
      if (res.ok) {
        const data = await res.json();
        setGameInfo(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Game not found');
      }
    } catch (err) {
      console.error('Failed to fetch game:', err);
      setError('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    setStarting(true);
    // Generate a room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Redirect to play-online with the custom game
    router.push(`/play-online/${roomCode}?game=${shareToken}`);
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, ...styles.playContainer }}>
        <Loader2 size={48} style={{ color: '#FBDB65', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading game...</p>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !gameInfo) {
    return (
      <div style={{ ...styles.container, ...styles.playContainer }}>
        <div style={styles.gameCard}>
          <div style={styles.gameIcon}>😕</div>
          <h1 style={styles.gameName}>Game Not Found</h1>
          <p style={styles.gameDescription}>
            {error || 'This game may have been deleted or the link is incorrect.'}
          </p>
          <Link href="/game-kit" style={{ textDecoration: 'none' }}>
            <button style={styles.playButton}>
              Browse Games
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Count total cards
  const totalCards = gameInfo.packs.reduce((sum, pack) => {
    return sum + Object.values(pack.cards).reduce((packSum, cards) => packSum + cards.length, 0);
  }, 0);

  return (
    <div style={{ ...styles.container, ...styles.playContainer }} className="gk-container">
      <style jsx global>{gameKitResponsiveCSS}</style>
      {/* Back navigation */}
      <Link
        href="/game-kit"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: '14px',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s',
        }}
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      <div style={styles.gameCard}>
        <div style={styles.gameIcon}>🎮</div>
        <h1 style={styles.gameName} className="gk-title">{gameInfo.definition.name}</h1>
        <p style={styles.gameDescription}>
          {gameInfo.definition.description || 'A custom card game created with Game Kit'}
        </p>

        <div style={styles.statsRow} className="gk-stats-row">
          <div style={styles.stat}>
            <span style={styles.statValue}>
              {gameInfo.definition.minPlayers}-{gameInfo.definition.maxPlayers}
            </span>
            <span><Users size={14} style={{ marginRight: '4px' }} />Players</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{totalCards}</span>
            <span>🃏 Cards</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{gameInfo.meta.playCount}</span>
            <span>▶️ Plays</span>
          </div>
        </div>

        <button
          style={{
            ...styles.playButton,
            opacity: starting ? 0.7 : 1,
            cursor: starting ? 'wait' : 'pointer',
          }}
          onClick={startGame}
          disabled={starting}
        >
          {starting ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Creating Room...
            </>
          ) : (
            <>
              <Play size={20} />
              Start Game
            </>
          )}
        </button>

        <p style={styles.creatorTag}>
          Created by {gameInfo.meta.creatorName}
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
