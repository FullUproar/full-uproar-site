'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Gamepad2,
  Plus,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Trophy,
  Zap,
  Star,
  Edit3,
  Trash2,
  UserPlus,
  Send,
  Flame,
  Heart,
  PartyPopper,
  Coffee,
  ArrowLeft,
  MoreVertical,
  X,
  Loader2,
} from 'lucide-react';

interface GameNight {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  vibe: string;
  theme: string | null;
  status: string;
  maxGuests: number | null;
  host: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
  };
  guests: Guest[];
  games: GameNightGame[];
  moments: Moment[];
  recap: Recap | null;
  isHost: boolean;
  userGuestStatus: string | null;
  _count: {
    guests: number;
    games: number;
  };
}

interface Guest {
  id: string;
  guestName: string | null;
  status: string;
  role: string;
  bringing: string | null;
  respondedAt: string | null;
  inviteToken: string;
  user: {
    id: string;
    displayName: string | null;
    username: string;
    avatarUrl: string | null;
  } | null;
}

interface GameNightGame {
  id: string;
  status: string;
  playOrder: number;
  winnerName: string | null;
  chaosLevel: number | null;
  notes: string | null;
  customGameName: string | null;
  game: {
    id: string;
    title: string;
    imageUrl: string | null;
    players: string | null;
  } | null;
}

interface Moment {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  createdBy: {
    displayName: string | null;
    username: string;
  } | null;
}

interface Recap {
  id: string;
  aiSummary: string | null;
  generatedAt: string;
}

const vibeConfig: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  CHILL: { icon: Coffee, color: '#60a5fa', label: 'Chill', bg: 'rgba(96, 165, 250, 0.15)' },
  COMPETITIVE: { icon: Flame, color: '#f97316', label: 'Competitive', bg: 'rgba(249, 115, 22, 0.15)' },
  CHAOS: { icon: Zap, color: '#a855f7', label: 'Chaos', bg: 'rgba(168, 85, 247, 0.15)' },
  PARTY: { icon: PartyPopper, color: '#ec4899', label: 'Party', bg: 'rgba(236, 72, 153, 0.15)' },
  COZY: { icon: Heart, color: '#f472b6', label: 'Cozy', bg: 'rgba(244, 114, 182, 0.15)' },
};

const statusConfig: Record<string, { color: string; label: string; actions: string[] }> = {
  PLANNING: { color: '#fbbf24', label: 'Planning', actions: ['LOCKED_IN', 'CANCELLED'] },
  LOCKED_IN: { color: '#10b981', label: 'Locked In!', actions: ['IN_PROGRESS', 'PLANNING', 'CANCELLED'] },
  IN_PROGRESS: { color: '#f97316', label: 'Happening Now!', actions: ['COMPLETED'] },
  COMPLETED: { color: '#6b7280', label: 'Completed', actions: [] },
  CANCELLED: { color: '#ef4444', label: 'Cancelled', actions: ['PLANNING'] },
};

const guestStatusConfig: Record<string, { color: string; label: string; icon: string }> = {
  PENDING: { color: '#6b7280', label: 'Pending', icon: '⏳' },
  IN: { color: '#10b981', label: "I'm In!", icon: '✅' },
  MAYBE: { color: '#fbbf24', label: 'Maybe', icon: '🤔' },
  OUT: { color: '#ef4444', label: "Can't Make It", icon: '❌' },
};

export default function GameNightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [gameNight, setGameNight] = useState<GameNight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  useEffect(() => {
    fetchGameNight();
  }, [resolvedParams.id]);

  const fetchGameNight = async () => {
    try {
      const response = await fetch(`/api/game-nights/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setGameNight(data);
      } else if (response.status === 404) {
        setError('Game night not found');
      } else {
        setError('Failed to load game night');
      }
    } catch (err) {
      setError('Failed to load game night');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!gameNight) return;

    try {
      const response = await fetch(`/api/game-nights/${gameNight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setGameNight(updated);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setShowStatusMenu(false);
  };

  const copyInviteLink = async () => {
    if (!gameNight) return;

    const guest = gameNight.guests[0];
    if (guest) {
      const link = `${window.location.origin}/join/${guest.inviteToken}`;
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getAISuggestions = async (type: string) => {
    if (!gameNight) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/game-nights/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          context: {
            vibe: gameNight.vibe,
            playerCount: gameNight.guests.filter(g => g.status === 'IN').length + 1,
            theme: gameNight.theme,
            gamesOwned: gameNight.games.map(g => g.game?.title || g.customGameName).filter(Boolean),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions({ type, ...data });
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <Navigation />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center', color: '#fdba74' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Loading game night...</p>
          </div>
        </div>
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !gameNight) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <Navigation />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <Gamepad2 size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{error || 'Something went wrong'}</h2>
            <Link href="/game-nights" style={{ color: '#f97316' }}>← Back to Game Nights</Link>
          </div>
        </div>
      </div>
    );
  }

  const vibe = vibeConfig[gameNight.vibe] || vibeConfig.CHILL;
  const status = statusConfig[gameNight.status] || statusConfig.PLANNING;
  const VibeIcon = vibe.icon;

  const confirmedGuests = gameNight.guests.filter(g => g.status === 'IN');
  const maybeGuests = gameNight.guests.filter(g => g.status === 'MAYBE');
  const pendingGuests = gameNight.guests.filter(g => g.status === 'PENDING');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Back Link */}
        <Link
          href="/game-nights"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#94a3b8',
            textDecoration: 'none',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft size={16} />
          Back to Game Nights
        </Link>

        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.95))',
          borderRadius: '1.5rem',
          border: `3px solid ${vibe.color}`,
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Vibe accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle at top right, ${vibe.color}30, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Vibe Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '1.5rem',
              background: vibe.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <VibeIcon size={40} style={{ color: vibe.color }} />
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  fontWeight: 900,
                  color: '#fff',
                  margin: 0,
                }}>
                  {gameNight.title}
                </h1>
                {gameNight.isHost && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(249, 115, 22, 0.2)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: '#f97316',
                  }}>
                    HOST
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#94a3b8', marginBottom: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} />
                  {formatDate(gameNight.date)}
                </span>
                {gameNight.startTime && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} />
                    {gameNight.startTime}
                  </span>
                )}
                {gameNight.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} />
                    {gameNight.location}
                  </span>
                )}
              </div>

              {/* Vibe Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: vibe.bg,
                borderRadius: '50px',
                color: vibe.color,
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}>
                <VibeIcon size={16} />
                {vibe.label} Vibes
              </div>
            </div>

            {/* Status & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
              {/* Status Badge with Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => gameNight.isHost && setShowStatusMenu(!showStatusMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    background: `${status.color}20`,
                    border: `2px solid ${status.color}`,
                    borderRadius: '50px',
                    color: status.color,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: gameNight.isHost ? 'pointer' : 'default',
                  }}
                >
                  {status.label}
                  {gameNight.isHost && status.actions.length > 0 && (
                    showStatusMenu ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                  )}
                </button>

                {showStatusMenu && status.actions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: '#1f2937',
                    border: '2px solid #374151',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    minWidth: '180px',
                    zIndex: 100,
                  }}>
                    {status.actions.map((action) => {
                      const actionStatus = statusConfig[action];
                      return (
                        <button
                          key={action}
                          onClick={() => updateStatus(action)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: actionStatus.color,
                            fontWeight: 'bold',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {action === 'LOCKED_IN' && '🔒 '}
                          {action === 'IN_PROGRESS' && '🎮 '}
                          {action === 'COMPLETED' && '🎉 '}
                          {action === 'CANCELLED' && '❌ '}
                          {action === 'PLANNING' && '📝 '}
                          {actionStatus.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Share Button */}
              {gameNight.isHost && gameNight.guests.length > 0 && (
                <button
                  onClick={copyInviteLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    background: copiedLink ? '#10b981' : 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '50px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                  {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Guest List */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
            borderRadius: '1rem',
            border: '2px solid #374151',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                <Users size={24} style={{ color: '#f97316' }} />
                The Squad
              </h2>
              {gameNight.isHost && (
                <button
                  onClick={() => setShowAddGuestModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(249, 115, 22, 0.2)',
                    border: '2px solid #f97316',
                    borderRadius: '0.5rem',
                    color: '#f97316',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <UserPlus size={16} />
                  Add
                </button>
              )}
            </div>

            {/* RSVP Summary */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{confirmedGuests.length + 1}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Confirmed</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '0.75rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{maybeGuests.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Maybe</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '1rem', background: 'rgba(107, 114, 128, 0.1)', borderRadius: '0.75rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>{pendingGuests.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Waiting</div>
              </div>
            </div>

            {/* Guest List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Host */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                background: 'rgba(249, 115, 22, 0.1)',
                borderRadius: '0.75rem',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                }}>
                  {gameNight.host.displayName?.[0] || gameNight.host.username[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{gameNight.host.displayName || gameNight.host.username}</div>
                  <div style={{ color: '#f97316', fontSize: '0.75rem' }}>Host</div>
                </div>
                <span style={{ color: '#10b981' }}>✅</span>
              </div>

              {/* Guests */}
              {gameNight.guests.map((guest) => {
                const guestStatus = guestStatusConfig[guest.status] || guestStatusConfig.PENDING;
                const name = guest.user?.displayName || guest.user?.username || guest.guestName || 'Guest';

                return (
                  <div
                    key={guest.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                    }}>
                      {name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{name}</div>
                      {guest.bringing && (
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Bringing: {guest.bringing}</div>
                      )}
                    </div>
                    <span style={{ fontSize: '1.25rem' }}>{guestStatus.icon}</span>
                  </div>
                );
              })}

              {gameNight.guests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No guests invited yet</p>
                  {gameNight.isHost && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>Add guests to get the party started!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game Lineup */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
            borderRadius: '1rem',
            border: '2px solid #374151',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                <Gamepad2 size={24} style={{ color: '#a855f7' }} />
                Game Lineup
              </h2>
              {gameNight.isHost && (
                <button
                  onClick={() => setShowAddGameModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '2px solid #a855f7',
                    borderRadius: '0.5rem',
                    color: '#a855f7',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
              )}
            </div>

            {gameNight.games.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Gamepad2 size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No games added yet</p>
                {gameNight.isHost && (
                  <>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>Add games or let AI suggest some!</p>
                    <button
                      onClick={() => {
                        setShowAISuggestions(true);
                        getAISuggestions('suggest_games');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        marginTop: '1rem',
                        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={18} />
                      Get AI Suggestions
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gameNight.games.map((game, index) => (
                  <div
                    key={game.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.75rem',
                      border: game.status === 'PLAYING' ? '2px solid #f97316' : '2px solid transparent',
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '0.5rem',
                      background: game.status === 'COMPLETED' ? '#10b981' : game.status === 'PLAYING' ? '#f97316' : '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                    }}>
                      {game.status === 'COMPLETED' ? '✓' : index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>
                        {game.game?.title || game.customGameName}
                      </div>
                      {game.winnerName && (
                        <div style={{ color: '#fbbf24', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Trophy size={14} />
                          {game.winnerName}
                        </div>
                      )}
                    </div>
                    {game.chaosLevel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#a855f7' }}>
                        {[...Array(game.chaosLevel)].map((_, i) => (
                          <Zap key={i} size={14} fill="#a855f7" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Section */}
        {gameNight.isHost && (
          <div style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.05))',
            borderRadius: '1rem',
            border: '2px solid rgba(168, 85, 247, 0.3)',
            padding: '1.5rem',
          }}>
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#a855f7',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              margin: '0 0 1rem',
            }}>
              <Sparkles size={24} />
              Chaos Coordinator
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Your AI assistant for epic game night planning
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowAISuggestions(true);
                  getAISuggestions('suggest_games');
                }}
                disabled={aiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '2px solid #a855f7',
                  borderRadius: '0.75rem',
                  color: '#a855f7',
                  fontWeight: 'bold',
                  cursor: aiLoading ? 'wait' : 'pointer',
                }}
              >
                <Gamepad2 size={18} />
                Suggest Games
              </button>
              <button
                onClick={() => {
                  setShowAISuggestions(true);
                  getAISuggestions('generate_invite');
                }}
                disabled={aiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(236, 72, 153, 0.2)',
                  border: '2px solid #ec4899',
                  borderRadius: '0.75rem',
                  color: '#ec4899',
                  fontWeight: 'bold',
                  cursor: aiLoading ? 'wait' : 'pointer',
                }}
              >
                <MessageSquare size={18} />
                Generate Invite
              </button>
              <button
                onClick={() => {
                  setShowAISuggestions(true);
                  getAISuggestions('suggest_snacks');
                }}
                disabled={aiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '2px solid #fbbf24',
                  borderRadius: '0.75rem',
                  color: '#fbbf24',
                  fontWeight: 'bold',
                  cursor: aiLoading ? 'wait' : 'pointer',
                }}
              >
                🍕 Snack Ideas
              </button>
              <button
                onClick={() => {
                  setShowAISuggestions(true);
                  getAISuggestions('generate_theme');
                }}
                disabled={aiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '2px solid #10b981',
                  borderRadius: '0.75rem',
                  color: '#10b981',
                  fontWeight: 'bold',
                  cursor: aiLoading ? 'wait' : 'pointer',
                }}
              >
                <Star size={18} />
                Theme Ideas
              </button>
            </div>

            {/* AI Suggestions Display */}
            {showAISuggestions && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
              }}>
                {aiLoading ? (
                  <div style={{ textAlign: 'center', color: '#a855f7' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '0.5rem' }}>The Chaos Coordinator is thinking...</p>
                  </div>
                ) : aiSuggestions ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ color: '#fff', margin: 0 }}>
                        {aiSuggestions.type === 'suggest_games' && '🎮 Game Suggestions'}
                        {aiSuggestions.type === 'generate_invite' && '✉️ Invite Message'}
                        {aiSuggestions.type === 'suggest_snacks' && '🍕 Snack Ideas'}
                        {aiSuggestions.type === 'generate_theme' && '🎭 Theme Ideas'}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: aiSuggestions.source === 'ai' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                        borderRadius: '0.25rem',
                        color: aiSuggestions.source === 'ai' ? '#a855f7' : '#6b7280',
                        fontSize: '0.75rem',
                      }}>
                        {aiSuggestions.source === 'ai' ? '✨ AI Generated' : '📋 Preset'}
                      </span>
                    </div>

                    {/* Games */}
                    {aiSuggestions.games && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Array.isArray(aiSuggestions.games) && aiSuggestions.games.map((game: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '0.5rem',
                            }}
                          >
                            <div>
                              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                                {typeof game === 'string' ? game : game.name}
                              </div>
                              {game.reason && (
                                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{game.reason}</div>
                              )}
                            </div>
                            <button
                              onClick={() => {/* TODO: Add game to lineup */}}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(168, 85, 247, 0.2)',
                                border: '1px solid #a855f7',
                                borderRadius: '0.5rem',
                                color: '#a855f7',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invite */}
                    {aiSuggestions.invite && (
                      <div style={{
                        padding: '1.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.5rem',
                      }}>
                        <p style={{ color: '#fff', whiteSpace: 'pre-wrap', margin: 0 }}>{aiSuggestions.invite}</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(aiSuggestions.invite);
                          }}
                          style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(168, 85, 247, 0.2)',
                            border: '1px solid #a855f7',
                            borderRadius: '0.5rem',
                            color: '#a855f7',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          <Copy size={14} style={{ marginRight: '0.5rem' }} />
                          Copy Message
                        </button>
                      </div>
                    )}

                    {/* Snacks */}
                    {aiSuggestions.snacks && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        {Array.isArray(aiSuggestions.snacks) && aiSuggestions.snacks.map((snack: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              padding: '1rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '0.5rem',
                            }}
                          >
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>
                              {typeof snack === 'string' ? snack : snack.item}
                            </div>
                            {snack.description && (
                              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{snack.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Themes */}
                    {aiSuggestions.themes && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Array.isArray(aiSuggestions.themes) && aiSuggestions.themes.map((theme: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              padding: '1rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '0.5rem',
                            }}
                          >
                            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                              {theme.name}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{theme.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Chaos Moments Section (shown during/after event) */}
        {['IN_PROGRESS', 'COMPLETED'].includes(gameNight.status) && (
          <div style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
            borderRadius: '1rem',
            border: '2px solid #374151',
            padding: '1.5rem',
          }}>
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              margin: '0 0 1rem',
            }}>
              <Zap size={24} style={{ color: '#fbbf24' }} />
              Chaos Moments
            </h2>

            {gameNight.moments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <MessageSquare size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No moments captured yet</p>
                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>Add memorable quotes, epic wins, or chaotic disasters!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gameNight.moments.map((moment) => (
                  <div
                    key={moment.id}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      borderLeft: `4px solid ${moment.type === 'QUOTE' ? '#fbbf24' : moment.type === 'CHAOS' ? '#ef4444' : '#a855f7'}`,
                    }}
                  >
                    <p style={{ color: '#fff', margin: 0 }}>{moment.content}</p>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      {moment.createdBy?.displayName || moment.createdBy?.username || 'Anonymous'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {showAddGuestModal && (
        <AddGuestModal
          gameNightId={gameNight.id}
          onClose={() => setShowAddGuestModal(false)}
          onAdded={() => {
            setShowAddGuestModal(false);
            fetchGameNight();
          }}
        />
      )}

      {/* Add Game Modal */}
      {showAddGameModal && (
        <AddGameModal
          gameNightId={gameNight.id}
          onClose={() => setShowAddGameModal(false)}
          onAdded={() => {
            setShowAddGameModal(false);
            fetchGameNight();
          }}
        />
      )}

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Add Guest Modal Component
function AddGuestModal({
  gameNightId,
  onClose,
  onAdded,
}: {
  gameNightId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!guestName.trim()) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName, guestEmail }),
      });

      if (response.ok) {
        onAdded();
      }
    } catch (err) {
      console.error('Failed to add guest:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          borderRadius: '1rem',
          border: '2px solid #374151',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={24} style={{ color: '#f97316' }} />
            Add Guest
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Name *
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Who's coming?"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Email (optional)
          </label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="For sending invite link"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '1rem',
            }}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!guestName.trim() || adding}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: guestName.trim() && !adding ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#374151',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            fontWeight: 'bold',
            cursor: guestName.trim() && !adding ? 'pointer' : 'not-allowed',
          }}
        >
          {adding ? 'Adding...' : 'Add to Squad'}
        </button>
      </div>
    </div>
  );
}

// Add Game Modal Component
function AddGameModal({
  gameNightId,
  onClose,
  onAdded,
}: {
  gameNightId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [gameName, setGameName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!gameName.trim()) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customGameName: gameName }),
      });

      if (response.ok) {
        onAdded();
      }
    } catch (err) {
      console.error('Failed to add game:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          borderRadius: '1rem',
          border: '2px solid #374151',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gamepad2 size={24} style={{ color: '#a855f7' }} />
            Add Game
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Game Name
          </label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="What are we playing?"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '1rem',
            }}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!gameName.trim() || adding}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: gameName.trim() && !adding ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : '#374151',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            fontWeight: 'bold',
            cursor: gameName.trim() && !adding ? 'pointer' : 'not-allowed',
          }}
        >
          {adding ? 'Adding...' : 'Add to Lineup'}
        </button>
      </div>
    </div>
  );
}
