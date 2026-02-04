'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Play, Edit, Trash2, Copy, Share2, ArrowLeft, Gamepad2 } from 'lucide-react';
import { adminStyles } from '@/app/admin/styles/adminStyles';
import { gameKitResponsiveCSS } from '@/lib/game-kit/responsive-styles';

interface GameDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'DRAFT' | 'TESTING' | 'PUBLISHED' | 'ARCHIVED';
  shareToken: string;
  playCount: number;
  cardCount: number;
  updatedAt: string;
  template: {
    name: string;
    iconEmoji: string | null;
  };
}

const styles = {
  ...adminStyles,
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  gameCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(255, 130, 0, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  gameCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  gameTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
  },
  gameStats: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  gameActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  iconButton: {
    padding: '8px',
    background: 'rgba(255, 130, 0, 0.1)',
    border: '1px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '6px',
    color: '#FBDB65',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    ...adminStyles.button,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '16px',
  },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
  TESTING: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' },
  PUBLISHED: { bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' },
  ARCHIVED: { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171' },
};

export default function GameKitDashboard() {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/game-kit/definitions');
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async (shareToken: string, gameId: string) => {
    const url = `${window.location.origin}/game-kit/play/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(gameId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteGame = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/game-kit/definitions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGames(games.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.title}>Game Kit</h1>
            <p style={styles.subtitle}>Loading your games...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="gk-container">
      <style jsx global>{gameKitResponsiveCSS}</style>
      <div style={styles.content}>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            <ArrowLeft size={18} />
            Home
          </Link>
          <Link
            href="/join"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FBDB65',
              textDecoration: 'none',
              fontSize: '14px',
              padding: '8px 16px',
              background: 'rgba(255, 130, 0, 0.1)',
              border: '1px solid rgba(255, 130, 0, 0.3)',
              borderRadius: '8px',
            }}
          >
            <Gamepad2 size={16} />
            Join a Game
          </Link>
        </div>

        <div style={styles.header}>
          <h1 style={styles.title}>🎮 Game Kit</h1>
          <p style={styles.subtitle}>Create and share your own card games</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '20px' }}>My Games</h2>
          <Link href="/game-kit/new" style={{ textDecoration: 'none' }}>
            <button style={styles.createButton}>
              <Plus size={20} />
              Create New Game
            </button>
          </Link>
        </div>

        {games.length === 0 ? (
          <div style={styles.section}>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎲</div>
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No games yet</h3>
              <p style={{ marginBottom: '24px' }}>Create your first custom card game in minutes!</p>
              <Link href="/game-kit/new" style={{ textDecoration: 'none' }}>
                <button style={styles.createButton}>
                  <Plus size={20} />
                  Create Your First Game
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div style={styles.grid} className="gk-game-grid">
            {games.map((game) => (
              <div
                key={game.id}
                style={styles.gameCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={styles.gameCardHeader}>
                  <div style={styles.gameTitle}>
                    <span>{game.template.iconEmoji || '🎴'}</span>
                    {game.name}
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: statusColors[game.status].bg,
                      color: statusColors[game.status].color,
                    }}
                  >
                    {game.status}
                  </span>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                  {game.description || `Based on ${game.template.name}`}
                </p>

                <div style={styles.gameStats}>
                  <span>🃏 {game.cardCount} cards</span>
                  <span>▶️ {game.playCount} plays</span>
                </div>

                <div style={styles.gameActions}>
                  <Link href={`/game-kit/edit/${game.id}`} style={{ textDecoration: 'none' }}>
                    <button style={styles.iconButton} title="Edit">
                      <Edit size={16} />
                    </button>
                  </Link>
                  <button
                    style={styles.iconButton}
                    title="Copy share link"
                    onClick={() => copyShareLink(game.shareToken, game.id)}
                  >
                    {copiedId === game.id ? '✓' : <Copy size={16} />}
                  </button>
                  <Link href={`/game-kit/play/${game.shareToken}`} style={{ textDecoration: 'none' }}>
                    <button style={styles.iconButton} title="Play">
                      <Play size={16} />
                    </button>
                  </Link>
                  <button
                    style={{ ...styles.iconButton, marginLeft: 'auto' }}
                    title="Delete"
                    onClick={() => deleteGame(game.id, game.name)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
