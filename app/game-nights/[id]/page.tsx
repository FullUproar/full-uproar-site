'use client';

import { useState, useEffect, use, useRef } from 'react';
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
  Mail,
  RefreshCw,
  UtensilsCrossed,
  Pizza,
  Wine,
  Cookie,
  Soup,
  ThumbsUp,
  ThumbsDown,
  ScrollText,
  MessageCircle,
  Send as SendIcon,
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
  houseRules: string | null;
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
  chaosSession?: {
    id: string;
    roomCode: string;
    status: string;
  } | null;
  _count: {
    guests: number;
    games: number;
  };
}

interface Guest {
  id: string;
  guestName: string | null;
  guestEmail: string | null;
  status: string;
  role: string;
  bringing: string | null;
  respondedAt: string | null;
  inviteToken: string;
  inviteSentAt: string | null;
  inviteMethod: string | null;
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
  // Voting
  voteCount?: number;
  upvotes?: number;
  downvotes?: number;
  userVote?: number;
  voterCount?: number;
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

interface ChatMessage {
  id: number;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  isEdited: boolean;
}

const vibeConfig: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  CHILL: { icon: Coffee, color: '#60a5fa', label: 'Chill', bg: 'rgba(96, 165, 250, 0.15)' },
  COMPETITIVE: { icon: Flame, color: '#FF8200', label: 'Competitive', bg: 'rgba(255, 130, 0, 0.15)' },
  CHAOS: { icon: Zap, color: '#a855f7', label: 'Chaos', bg: 'rgba(168, 85, 247, 0.15)' },
  PARTY: { icon: PartyPopper, color: '#ec4899', label: 'Party', bg: 'rgba(236, 72, 153, 0.15)' },
  COZY: { icon: Heart, color: '#f472b6', label: 'Cozy', bg: 'rgba(244, 114, 182, 0.15)' },
};

const statusConfig: Record<string, { color: string; label: string; actions: string[] }> = {
  PLANNING: { color: '#fbbf24', label: 'Planning', actions: ['LOCKED_IN', 'CANCELLED'] },
  LOCKED_IN: { color: '#10b981', label: 'Locked In!', actions: ['IN_PROGRESS', 'PLANNING', 'CANCELLED'] },
  IN_PROGRESS: { color: '#FF8200', label: 'Happening Now!', actions: ['COMPLETED'] },
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
  const [showSnackSignupModal, setShowSnackSignupModal] = useState(false);
  const [editingHouseRules, setEditingHouseRules] = useState(false);
  const [houseRulesText, setHouseRulesText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [chaosSession, setChaosSession] = useState<{ id: string; roomCode: string; status: string } | null>(null);
  const [activatingChaos, setActivatingChaos] = useState(false);

  useEffect(() => {
    fetchGameNight();
  }, [resolvedParams.id]);

  const fetchGameNight = async () => {
    try {
      const response = await fetch(`/api/game-nights/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setGameNight(data);

        // Check for existing chaos session
        if (data.chaosSession) {
          setChaosSession({
            id: data.chaosSession.id,
            roomCode: data.chaosSession.roomCode,
            status: data.chaosSession.status,
          });
        }
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

  const activateChaosAgent = async () => {
    if (!gameNight || activatingChaos) return;

    setActivatingChaos(true);
    try {
      const response = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameNightId: gameNight.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setChaosSession({
          id: data.session.id,
          roomCode: data.session.roomCode,
          status: data.session.status,
        });
      }
    } catch (err) {
      console.error('Failed to activate Chaos Agent:', err);
    } finally {
      setActivatingChaos(false);
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
          <div style={{ textAlign: 'center', color: '#FBDB65' }}>
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
            <Link href="/game-nights" style={{ color: '#FF8200' }}>← Back to Game Nights</Link>
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
                    background: 'rgba(255, 130, 0, 0.2)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: '#FF8200',
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
                <Users size={24} style={{ color: '#FF8200' }} />
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
                    background: 'rgba(255, 130, 0, 0.2)',
                    border: '2px solid #FF8200',
                    borderRadius: '0.5rem',
                    color: '#FF8200',
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
                background: 'rgba(255, 130, 0, 0.1)',
                borderRadius: '0.75rem',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF8200, #ea580c)',
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
                  <div style={{ color: '#FF8200', fontSize: '0.75rem' }}>Host</div>
                </div>
                <span style={{ color: '#10b981' }}>✅</span>
              </div>

              {/* Guests */}
              {gameNight.guests.map((guest) => {
                const guestStatus = guestStatusConfig[guest.status] || guestStatusConfig.PENDING;
                const name = guest.user?.displayName || guest.user?.username || guest.guestName || 'Guest';

                return (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    name={name}
                    guestStatus={guestStatus}
                    gameNightId={gameNight.id}
                    isHost={gameNight.isHost}
                    onUpdate={fetchGameNight}
                  />
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
                {gameNight.games
                  .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)) // Sort by votes
                  .map((game, index) => (
                  <GameLineupItem
                    key={game.id}
                    game={game}
                    index={index}
                    gameNightId={gameNight.id}
                    onVote={fetchGameNight}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Snack Roster Section */}
        <div style={{
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))',
          borderRadius: '1rem',
          border: '2px solid rgba(251, 191, 36, 0.3)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#fbbf24',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              margin: 0,
            }}>
              <UtensilsCrossed size={24} />
              Snack Roster
            </h2>
            <button
              onClick={() => setShowSnackSignupModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(251, 191, 36, 0.2)',
                border: '2px solid #fbbf24',
                borderRadius: '0.5rem',
                color: '#fbbf24',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              Sign Up
            </button>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Coordinate who's bringing what so nobody shows up with 5 bags of chips and no drinks
          </p>

          <SnackRosterDisplay guests={gameNight.guests} hostName={gameNight.host.displayName || gameNight.host.username} />
        </div>

        {/* House Rules Section */}
        <HouseRulesSection
          gameNightId={gameNight.id}
          houseRules={gameNight.houseRules}
          isHost={gameNight.isHost}
          onUpdate={fetchGameNight}
        />

        {/* Team Chat Section */}
        <TeamChatSection gameNightId={gameNight.id} />

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

        {/* Chaos Agent Section */}
        {gameNight.status === 'IN_PROGRESS' && gameNight.isHost && (
          <div style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.15), rgba(139, 92, 246, 0.15))',
            borderRadius: '1rem',
            border: '2px solid #FF8200',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: 0,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🎭</span>
                  Chaos Agent
                </h2>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                  {chaosSession
                    ? 'Add secret objectives, random events, and betting to your game night!'
                    : 'Activate Fugly\'s Chaos Agent to spice up your game night!'
                  }
                </p>
              </div>
              {chaosSession ? (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '0.7rem', textTransform: 'uppercase' }}>Room Code</div>
                    <div style={{ color: '#FBDB65', fontWeight: 'bold', fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
                      {chaosSession.roomCode}
                    </div>
                  </div>
                  <Link
                    href={`/chaos/${chaosSession.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: '#FF8200',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#000',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Zap size={18} />
                    Open Chaos
                  </Link>
                </div>
              ) : (
                <button
                  onClick={activateChaosAgent}
                  disabled={activatingChaos}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: activatingChaos ? '#6b7280' : '#FF8200',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: activatingChaos ? 'wait' : 'pointer',
                  }}
                >
                  {activatingChaos ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Activate Chaos!
                    </>
                  )}
                </button>
              )}
            </div>
            {chaosSession && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#9ca3af',
              }}>
                <strong style={{ color: '#FBDB65' }}>How it works:</strong> Share the room code with your guests. They can join at{' '}
                <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                  fulluproar.com/chaos
                </code>
                {' '}and enter the code to get secret objectives, participate in betting, and more!
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

      {/* Snack Signup Modal */}
      {showSnackSignupModal && (
        <SnackSignupModal
          gameNightId={gameNight.id}
          guests={gameNight.guests}
          isHost={gameNight.isHost}
          onClose={() => setShowSnackSignupModal(false)}
          onUpdated={() => {
            setShowSnackSignupModal(false);
            fetchGameNight();
          }}
        />
      )}

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Team Chat Section Component
function TeamChatSection({ gameNightId }: { gameNightId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/chat`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds when expanded
    let interval: NodeJS.Timeout;
    if (expanded) {
      interval = setInterval(fetchMessages, 10000);
    }
    return () => clearInterval(interval);
  }, [gameNightId, expanded]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div style={{
      marginTop: '1.5rem',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
      borderRadius: '1rem',
      border: '2px solid rgba(59, 130, 246, 0.3)',
      overflow: 'hidden',
    }}>
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#3b82f6',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          margin: 0,
        }}>
          <MessageCircle size={24} />
          Team Chat
          {messages.length > 0 && (
            <span style={{
              marginLeft: '0.5rem',
              padding: '0.125rem 0.5rem',
              background: 'rgba(59, 130, 246, 0.3)',
              borderRadius: '50px',
              fontSize: '0.75rem',
              color: '#60a5fa',
            }}>
              {messages.length}
            </span>
          )}
        </h2>
        <ChevronDown
          size={20}
          style={{
            color: '#3b82f6',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Chat content - Expandable */}
      {expanded && (
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Coordinate with your squad before and during game night
          </p>

          {/* Messages */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '0.75rem',
            padding: '1rem',
            height: '300px',
            overflowY: 'auto',
            marginBottom: '1rem',
          }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <MessageCircle size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No messages yet</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>Start the conversation!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}>
                      {msg.authorName[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {msg.authorName}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.875rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              style={{
                padding: '0.75rem 1.25rem',
                background: newMessage.trim() && !sending ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff',
                fontWeight: 'bold',
                cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {sending ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <SendIcon size={18} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// House Rules Section Component
function HouseRulesSection({
  gameNightId,
  houseRules,
  isHost,
  onUpdate,
}: {
  gameNightId: string;
  houseRules: string | null;
  isHost: boolean;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rulesText, setRulesText] = useState(houseRules || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseRules: rulesText || null }),
      });

      if (response.ok) {
        setEditing(false);
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to save house rules:', err);
    } finally {
      setSaving(false);
    }
  };

  // Default house rules suggestions
  const suggestionTemplates = [
    '- No phones during gameplay',
    '- Loser picks the next game',
    '- Winner does a victory dance',
    '- Snacks must be shared equally',
    '- No rage quitting!',
  ];

  return (
    <div style={{
      marginTop: '1.5rem',
      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.05))',
      borderRadius: '1rem',
      border: '2px solid rgba(236, 72, 153, 0.3)',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#ec4899',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          margin: 0,
        }}>
          <ScrollText size={24} />
          House Rules
        </h2>
        {isHost && !editing && (
          <button
            onClick={() => {
              setRulesText(houseRules || '');
              setEditing(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(236, 72, 153, 0.2)',
              border: '2px solid #ec4899',
              borderRadius: '0.5rem',
              color: '#ec4899',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Edit3 size={16} />
            {houseRules ? 'Edit' : 'Add Rules'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Quick ideas:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {suggestionTemplates.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setRulesText((prev) => prev ? `${prev}\n${suggestion}` : suggestion)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid transparent',
                  borderRadius: '0.375rem',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                + {suggestion.replace('- ', '')}
              </button>
            ))}
          </div>
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder="Add your house rules here...&#10;&#10;- Rule 1&#10;- Rule 2&#10;- etc."
            rows={6}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '0.75rem',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              resize: 'vertical',
              marginBottom: '1rem',
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: saving ? '#374151' : 'linear-gradient(135deg, #ec4899, #db2777)',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#fff',
                fontWeight: 'bold',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Rules
                </>
              )}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: '2px solid #6b7280',
                borderRadius: '0.5rem',
                color: '#94a3b8',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : houseRules ? (
        <div style={{
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.75rem',
          whiteSpace: 'pre-wrap',
          color: '#e2e8f0',
          fontSize: '0.9rem',
          lineHeight: '1.8',
        }}>
          {houseRules}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
          <ScrollText size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>No house rules set yet</p>
          {isHost && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>
              Click "Add Rules" to set expectations for the night
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Game Lineup Item with Voting
function GameLineupItem({
  game,
  index,
  gameNightId,
  onVote,
}: {
  game: GameNightGame;
  index: number;
  gameNightId: string;
  onVote: () => void;
}) {
  const [voting, setVoting] = useState(false);
  const [localVote, setLocalVote] = useState(game.userVote || 0);
  const [localVoteCount, setLocalVoteCount] = useState(game.voteCount || 0);

  const handleVote = async (voteValue: number) => {
    const newVote = localVote === voteValue ? 0 : voteValue; // Toggle off if same vote
    setVoting(true);

    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/games`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameNightGameId: game.id,
          vote: newVote,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalVote(data.userVote);
        setLocalVoteCount(data.voteCount);
        onVote(); // Refresh the full data
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.75rem',
        border: game.status === 'PLAYING' ? '2px solid #FF8200' : '2px solid transparent',
      }}
    >
      {/* Vote Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        minWidth: '40px',
      }}>
        <button
          onClick={() => handleVote(1)}
          disabled={voting}
          style={{
            background: localVote === 1 ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
            border: localVote === 1 ? '2px solid #10b981' : '2px solid transparent',
            borderRadius: '0.375rem',
            padding: '0.25rem',
            cursor: voting ? 'wait' : 'pointer',
            color: localVote === 1 ? '#10b981' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Vote up"
        >
          <ThumbsUp size={16} fill={localVote === 1 ? '#10b981' : 'transparent'} />
        </button>
        <span style={{
          color: localVoteCount > 0 ? '#10b981' : localVoteCount < 0 ? '#ef4444' : '#6b7280',
          fontWeight: 'bold',
          fontSize: '0.875rem',
        }}>
          {localVoteCount}
        </span>
        <button
          onClick={() => handleVote(-1)}
          disabled={voting}
          style={{
            background: localVote === -1 ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
            border: localVote === -1 ? '2px solid #ef4444' : '2px solid transparent',
            borderRadius: '0.375rem',
            padding: '0.25rem',
            cursor: voting ? 'wait' : 'pointer',
            color: localVote === -1 ? '#ef4444' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Vote down"
        >
          <ThumbsDown size={16} fill={localVote === -1 ? '#ef4444' : 'transparent'} />
        </button>
      </div>

      {/* Game Number */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '0.5rem',
        background: game.status === 'COMPLETED' ? '#10b981' : game.status === 'PLAYING' ? '#FF8200' : '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.875rem',
        flexShrink: 0,
      }}>
        {game.status === 'COMPLETED' ? '✓' : index + 1}
      </div>

      {/* Game Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {game.game?.title || game.customGameName}
        </div>
        {game.winnerName && (
          <div style={{ color: '#fbbf24', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Trophy size={12} />
            {game.winnerName}
          </div>
        )}
        {(game.voterCount || 0) > 0 && (
          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
            {game.voterCount} vote{game.voterCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Chaos Level */}
      {game.chaosLevel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', color: '#a855f7' }}>
          {[...Array(Math.min(game.chaosLevel, 5))].map((_, i) => (
            <Zap key={i} size={12} fill="#a855f7" />
          ))}
        </div>
      )}
    </div>
  );
}

// Snack categories for the roster
const snackCategories = [
  { key: 'snacks', label: 'Snacks', icon: Pizza, color: '#FF8200', emoji: '🍿' },
  { key: 'drinks', label: 'Drinks', icon: Wine, color: '#3b82f6', emoji: '🥤' },
  { key: 'desserts', label: 'Desserts', icon: Cookie, color: '#ec4899', emoji: '🍪' },
  { key: 'main', label: 'Main Dishes', icon: Soup, color: '#10b981', emoji: '🍕' },
  { key: 'other', label: 'Other', icon: UtensilsCrossed, color: '#a855f7', emoji: '🎁' },
];

// Snack Roster Display Component
function SnackRosterDisplay({ guests, hostName }: { guests: Guest[]; hostName: string }) {
  // Parse and categorize what people are bringing
  const categorizedItems: Record<string, { name: string; item: string }[]> = {
    snacks: [],
    drinks: [],
    desserts: [],
    main: [],
    other: [],
  };

  // Simple categorization based on keywords
  const categorizeItem = (item: string): string => {
    const lower = item.toLowerCase();
    if (lower.includes('drink') || lower.includes('soda') || lower.includes('beer') || lower.includes('wine') || lower.includes('juice') || lower.includes('water')) {
      return 'drinks';
    }
    if (lower.includes('dessert') || lower.includes('cake') || lower.includes('cookie') || lower.includes('brownie') || lower.includes('ice cream') || lower.includes('candy')) {
      return 'desserts';
    }
    if (lower.includes('pizza') || lower.includes('wings') || lower.includes('sandwich') || lower.includes('tacos') || lower.includes('dinner') || lower.includes('main')) {
      return 'main';
    }
    if (lower.includes('chips') || lower.includes('snack') || lower.includes('popcorn') || lower.includes('dip') || lower.includes('pretzels') || lower.includes('nuts')) {
      return 'snacks';
    }
    return 'other';
  };

  guests.forEach((guest) => {
    if (guest.bringing) {
      const name = guest.user?.displayName || guest.user?.username || guest.guestName || 'Guest';
      const category = categorizeItem(guest.bringing);
      categorizedItems[category].push({ name, item: guest.bringing });
    }
  });

  const totalItems = Object.values(categorizedItems).flat().length;

  if (totalItems === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        <UtensilsCrossed size={40} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Nobody has signed up to bring anything yet</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem' }}>Be the first to claim something!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {snackCategories.map((category) => {
        const items = categorizedItems[category.key];
        if (items.length === 0) return null;

        const Icon = category.icon;
        return (
          <div
            key={category.key}
            style={{
              background: `${category.color}10`,
              borderRadius: '0.75rem',
              border: `2px solid ${category.color}30`,
              padding: '1rem',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: category.color,
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}>
              <Icon size={18} />
              {category.label}
              <span style={{
                marginLeft: 'auto',
                background: `${category.color}30`,
                padding: '0.125rem 0.5rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
              }}>
                {items.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{category.emoji}</span>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{item.item}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>by {item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Snack Signup Modal
function SnackSignupModal({
  gameNightId,
  guests,
  isHost,
  onClose,
  onUpdated,
}: {
  gameNightId: string;
  guests: Guest[];
  isHost: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('snacks');
  const [customItem, setCustomItem] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Preset suggestions per category
  const suggestions: Record<string, string[]> = {
    snacks: ['Chips & Dip', 'Popcorn', 'Pretzels', 'Mixed Nuts', 'Veggie Tray', 'Cheese Board'],
    drinks: ['Soda Variety Pack', 'Beer', 'Wine', 'Sparkling Water', 'Juice Boxes', 'Energy Drinks'],
    desserts: ['Cookies', 'Brownies', 'Cupcakes', 'Ice Cream', 'Candy', 'Fruit Platter'],
    main: ['Pizza', 'Wings', 'Sandwiches', 'Tacos', 'Sliders', 'Hot Dogs'],
    other: ['Napkins & Plates', 'Utensils', 'Ice', 'Cups', 'Decorations', 'Games'],
  };

  const handleSignUp = async () => {
    if (!customItem.trim() || !selectedGuestId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/guests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuestId,
          bringing: customItem,
        }),
      });

      if (response.ok) {
        onUpdated();
      }
    } catch (err) {
      console.error('Failed to sign up:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentCategory = snackCategories.find(c => c.key === selectedCategory) || snackCategories[0];
  const CategoryIcon = currentCategory.icon;

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
          maxWidth: '500px',
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          borderRadius: '1rem',
          border: '2px solid #374151',
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UtensilsCrossed size={24} style={{ color: '#fbbf24' }} />
            Sign Up to Bring Something
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Who's signing up */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Who's bringing this?
          </label>
          <select
            value={selectedGuestId || ''}
            onChange={(e) => setSelectedGuestId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '1rem',
            }}
          >
            <option value="">Select a guest...</option>
            {guests.map((guest) => {
              const name = guest.user?.displayName || guest.user?.username || guest.guestName || 'Guest';
              return (
                <option key={guest.id} value={guest.id}>
                  {name} {guest.bringing ? `(already bringing: ${guest.bringing})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Category Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Category
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {snackCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: isSelected ? `${cat.color}30` : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${isSelected ? cat.color : 'transparent'}`,
                    borderRadius: '0.5rem',
                    color: isSelected ? cat.color : '#94a3b8',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Suggestions */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            Quick picks:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {suggestions[selectedCategory].map((item) => (
              <button
                key={item}
                onClick={() => setCustomItem(item)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: customItem === item ? `${currentCategory.color}30` : 'rgba(255, 255, 255, 0.05)',
                  border: customItem === item ? `1px solid ${currentCategory.color}` : '1px solid transparent',
                  borderRadius: '0.375rem',
                  color: customItem === item ? currentCategory.color : '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Item */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            What are you bringing?
          </label>
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="e.g., Homemade guacamole"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${currentCategory.color}50`,
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSignUp}
          disabled={!customItem.trim() || !selectedGuestId || saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: customItem.trim() && selectedGuestId && !saving
              ? `linear-gradient(135deg, ${currentCategory.color}, ${currentCategory.color}cc)`
              : '#374151',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            fontWeight: 'bold',
            cursor: customItem.trim() && selectedGuestId && !saving ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {saving ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Signing Up...
            </>
          ) : (
            <>
              <CategoryIcon size={18} />
              I'm Bringing This!
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Guest Row Component with email status and resend functionality
function GuestRow({
  guest,
  name,
  guestStatus,
  gameNightId,
  isHost,
  onUpdate,
}: {
  guest: Guest;
  name: string;
  guestStatus: { color: string; label: string; icon: string };
  gameNightId: string;
  isHost: boolean;
  onUpdate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<boolean | null>(null);

  const handleResendInvite = async () => {
    if (!guest.guestEmail) return;

    setResending(true);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/guests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guest.id,
          action: 'resend_invite',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResendResult(data.emailSent);
        setTimeout(() => {
          setResendResult(null);
          setShowMenu(false);
          onUpdate();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to resend invite:', err);
    } finally {
      setResending(false);
    }
  };

  const hasEmail = !!guest.guestEmail;
  const wasInvitedByEmail = guest.inviteMethod === 'email' && guest.inviteSentAt;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '0.75rem',
        position: 'relative',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{name}</span>
          {wasInvitedByEmail && (
            <span title="Invited via email" style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>
              <Mail size={12} />
            </span>
          )}
        </div>
        {guest.bringing && (
          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Bringing: {guest.bringing}</div>
        )}
        {hasEmail && !wasInvitedByEmail && guest.status === 'PENDING' && (
          <div style={{ color: '#fbbf24', fontSize: '0.7rem' }}>
            No email sent yet
          </div>
        )}
      </div>
      <span style={{ fontSize: '1.25rem' }}>{guestStatus.icon}</span>

      {/* Menu for hosts */}
      {isHost && hasEmail && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.25rem',
                background: '#1f2937',
                border: '2px solid #374151',
                borderRadius: '0.5rem',
                padding: '0.25rem',
                minWidth: '160px',
                zIndex: 50,
              }}
            >
              {resendResult !== null ? (
                <div style={{
                  padding: '0.75rem',
                  color: resendResult ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  {resendResult ? <Check size={16} /> : <X size={16} />}
                  {resendResult ? 'Sent!' : 'Failed'}
                </div>
              ) : (
                <button
                  onClick={handleResendInvite}
                  disabled={resending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.25rem',
                    color: '#e2e8f0',
                    cursor: resending ? 'wait' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {resending ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      {wasInvitedByEmail ? 'Resend Invite' : 'Send Invite'}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
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
  const [sendEmail, setSendEmail] = useState(true);
  const [personalMessage, setPersonalMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; emailSent?: boolean } | null>(null);

  const handleAdd = async () => {
    if (!guestName.trim()) return;

    setAdding(true);
    setResult(null);
    try {
      const response = await fetch(`/api/game-nights/${gameNightId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestEmail: guestEmail || null,
          sendEmail: sendEmail && !!guestEmail,
          personalMessage: personalMessage || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (sendEmail && guestEmail) {
          setResult({ success: true, emailSent: data.emailSent });
          // Wait a moment to show the result before closing
          setTimeout(() => onAdded(), 1500);
        } else {
          onAdded();
        }
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
          maxWidth: '450px',
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          borderRadius: '1rem',
          border: '2px solid #374151',
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={24} style={{ color: '#FF8200' }} />
            Invite Guest
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {result && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '0.5rem',
            background: result.emailSent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
            border: `2px solid ${result.emailSent ? '#10b981' : '#fbbf24'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: result.emailSent ? '#10b981' : '#fbbf24' }}>
              {result.emailSent ? <Mail size={18} /> : <Check size={18} />}
              <span style={{ fontWeight: 'bold' }}>
                {result.emailSent ? 'Invitation sent!' : 'Guest added (email not sent)'}
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="For sending invitation"
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

        {guestEmail && (
          <>
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: sendEmail ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              borderRadius: '0.5rem',
              border: sendEmail ? '2px solid rgba(16, 185, 129, 0.3)' : '2px solid transparent',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#10b981',
                  }}
                />
                <div>
                  <div style={{ color: sendEmail ? '#10b981' : '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} />
                    Send Email Invitation
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    They'll get a beautiful invite with all the details
                  </div>
                </div>
              </label>
            </div>

            {sendEmail && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Personal Message (optional)
                </label>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Add a personal touch to your invitation..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '2px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </>
        )}

        <button
          onClick={handleAdd}
          disabled={!guestName.trim() || adding || !!result}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: guestName.trim() && !adding && !result ? 'linear-gradient(135deg, #FF8200, #ea580c)' : '#374151',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            fontWeight: 'bold',
            cursor: guestName.trim() && !adding && !result ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {adding ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              {sendEmail && guestEmail ? 'Sending Invite...' : 'Adding...'}
            </>
          ) : result ? (
            'Done!'
          ) : sendEmail && guestEmail ? (
            <>
              <Mail size={18} />
              Send Invitation
            </>
          ) : (
            'Add to Squad'
          )}
        </button>

        {!guestEmail && (
          <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
            Tip: Add an email to send them a direct invitation
          </p>
        )}
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
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
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
