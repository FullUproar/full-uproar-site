'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { useUser } from '@clerk/nextjs';
import {
  Calendar,
  Plus,
  Users,
  Gamepad2,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Flame,
  Zap,
  Heart,
  PartyPopper,
  Coffee,
  CheckCircle2,
  ArrowRight,
  Crown,
  X as CloseIcon
} from 'lucide-react';

interface GameNight {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  location: string | null;
  vibe: string;
  status: string;
  _count: {
    guests: number;
    games: number;
  };
  guestCounts?: {
    in: number;
    maybe: number;
  };
}

const vibeConfig: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  CHILL: { icon: Coffee, color: '#60a5fa', label: 'Chill', bg: 'rgba(96, 165, 250, 0.15)' },
  COMPETITIVE: { icon: Flame, color: '#f97316', label: 'Competitive', bg: 'rgba(249, 115, 22, 0.15)' },
  CHAOS: { icon: Zap, color: '#a855f7', label: 'Chaos', bg: 'rgba(168, 85, 247, 0.15)' },
  PARTY: { icon: PartyPopper, color: '#ec4899', label: 'Party', bg: 'rgba(236, 72, 153, 0.15)' },
  COZY: { icon: Heart, color: '#f472b6', label: 'Cozy', bg: 'rgba(244, 114, 182, 0.15)' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  PLANNING: { color: '#fbbf24', label: 'Planning' },
  LOCKED_IN: { color: '#10b981', label: 'Locked In!' },
  IN_PROGRESS: { color: '#f97316', label: 'Happening Now!' },
  COMPLETED: { color: '#6b7280', label: 'Completed' },
  CANCELLED: { color: '#ef4444', label: 'Cancelled' },
};

export default function GameNightsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [gameNights, setGameNights] = useState<{ hosted: GameNight[]; attending: GameNight[] }>({
    hosted: [],
    attending: [],
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [canCreateGameNight, setCanCreateGameNight] = useState(false);

  useEffect(() => {
    fetchGameNights();
  }, []);

  const fetchGameNights = async () => {
    try {
      const response = await fetch('/api/game-nights?attending=true');
      if (response.ok) {
        const data = await response.json();
        setGameNights(data);
        setCanCreateGameNight(data.canCreateGameNight ?? false);
      }
    } catch (error) {
      console.error('Failed to fetch game nights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (canCreateGameNight) {
      setShowCreateModal(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const upcomingHosted = gameNights.hosted.filter(gn =>
    ['PLANNING', 'LOCKED_IN', 'IN_PROGRESS'].includes(gn.status)
  );
  const pastHosted = gameNights.hosted.filter(gn =>
    ['COMPLETED', 'CANCELLED'].includes(gn.status)
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Orientation Hero - Show when logged out or no game nights */}
        {(!user || (isLoaded && upcomingHosted.length === 0 && gameNights.attending.length === 0 && !loading)) && (
          <div style={{ marginBottom: '4rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '1rem',
              }}>
                Game Nights
              </h1>
              <p style={{
                color: '#fdba74',
                fontSize: '1.5rem',
                marginBottom: '2rem',
                maxWidth: '48rem',
                margin: '0 auto 2rem',
                lineHeight: 1.6
              }}>
                Simple tools that make hosting easier—pick dates, choose games, track RSVPs.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '1.125rem', marginBottom: '3rem' }}>
                Use them once for a single night, or build something that sticks.
              </p>
            </div>

            {/* Three-step visual */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem',
            }}>
              {[
                { icon: Calendar, title: 'Pick Dates', desc: 'Vote on when works best for everyone' },
                { icon: Gamepad2, title: 'Choose Games', desc: 'Build a shared list and let people vote' },
                { icon: Users, title: 'Track RSVPs', desc: 'Know who\'s in, who\'s maybe, who\'s out' },
              ].map((step, i) => (
                <div key={i} style={{
                  padding: '2rem',
                  background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
                  borderRadius: '1rem',
                  border: '2px solid rgba(249, 115, 22, 0.2)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '1rem',
                    background: 'rgba(249, 115, 22, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    <step.icon size={32} style={{ color: '#f97316' }} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Value props */}
            <div style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: '2px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '3rem',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
              }}>
                {[
                  'Free for one-off events',
                  'Invite via simple link',
                  'No app required for guests',
                  'Build recurring rituals'
                ].map((benefit, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ color: '#fdba74', fontSize: '1rem' }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              {user ? (
                <button
                  onClick={handleCreateClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2.5rem',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none',
                    borderRadius: '50px',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 10px 40px rgba(249, 115, 22, 0.4)',
                    transition: 'all 0.3s',
                  }}
                >
                  <Plus size={24} />
                  Start Your First Game Night
                </button>
              ) : (
                <Link href="/sign-up">
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2.5rem',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    border: 'none',
                    borderRadius: '50px',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 10px 40px rgba(249, 115, 22, 0.4)',
                    transition: 'all 0.3s',
                  }}>
                    Try a Free Game Night
                    <ArrowRight size={24} />
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Existing dashboard view for users with events */}
        {user && (upcomingHosted.length > 0 || gameNights.attending.length > 0 || loading) && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Game Night HQ
              </h1>
              <p style={{ color: '#fdba74', fontSize: '1.25rem', marginBottom: '2rem' }}>
                Rally the squad. Roll the dice. Create the chaos.
              </p>

              <button
                onClick={handleCreateClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none',
                  borderRadius: '50px',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 40px rgba(249, 115, 22, 0.4)',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Plus size={24} />
                Rally the Squad
              </button>
            </div>
          </>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#fdba74' }}>
            <Sparkles size={48} style={{ animation: 'spin 2s linear infinite' }} />
            <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Loading your game nights...</p>
          </div>
        ) : (
          <>
            {/* Upcoming Game Nights */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#f97316',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Calendar size={24} />
                Upcoming
              </h2>

              {upcomingHosted.length > 0 || gameNights.attending.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Hosted game nights */}
                  {upcomingHosted.map((gn) => (
                    <GameNightCard key={gn.id} gameNight={gn} isHost={true} onClick={() => router.push(`/game-nights/${gn.id}`)} />
                  ))}

                  {/* Attending game nights */}
                  {gameNights.attending.map((gn) => (
                    <GameNightCard key={gn.id} gameNight={gn} isHost={false} onClick={() => router.push(`/game-nights/${gn.id}`)} />
                  ))}
                </div>
              ) : null}
            </section>

            {/* Past Game Nights */}
            {pastHosted.length > 0 && (
              <section>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#6b7280',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Clock size={24} />
                  Past Game Nights
                </h2>

                <div style={{ display: 'grid', gap: '1rem', opacity: 0.7 }}>
                  {pastHosted.slice(0, 5).map((gn) => (
                    <GameNightCard key={gn.id} gameNight={gn} isHost={true} onClick={() => router.push(`/game-nights/${gn.id}`)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGameNightModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            router.push(`/game-nights/${id}`);
          }}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function GameNightCard({
  gameNight,
  isHost,
  onClick,
}: {
  gameNight: GameNight;
  isHost: boolean;
  onClick: () => void;
}) {
  const vibe = vibeConfig[gameNight.vibe] || vibeConfig.CHILL;
  const status = statusConfig[gameNight.status] || statusConfig.PLANNING;
  const VibeIcon = vibe.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
        borderRadius: '1rem',
        border: `2px solid ${vibe.color}33`,
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateX(8px)';
        e.currentTarget.style.borderColor = vibe.color;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.borderColor = `${vibe.color}33`;
      }}
    >
      {/* Vibe Icon */}
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '1rem',
        background: vibe.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <VibeIcon size={32} style={{ color: vibe.color }} />
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#fff',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {gameNight.title}
          </h3>
          {isHost && (
            <span style={{
              padding: '0.25rem 0.5rem',
              background: 'rgba(249, 115, 22, 0.2)',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#f97316',
            }}>
              HOST
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.875rem',
          color: '#94a3b8',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} />
            {formatDate(gameNight.date)}
            {gameNight.startTime && ` @ ${gameNight.startTime}`}
          </span>
          {gameNight.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={14} />
              {gameNight.location}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Users size={14} />
            {gameNight._count.guests} invited
          </span>
          {gameNight._count.games > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Gamepad2 size={14} />
              {gameNight._count.games} games
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: `${status.color}20`,
        borderRadius: '50px',
        color: status.color,
        fontWeight: 'bold',
        fontSize: '0.875rem',
        flexShrink: 0,
      }}>
        {status.label}
        <ChevronRight size={18} />
      </div>
    </div>
  );
}

function CreateGameNightModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    location: '',
    vibe: 'CHILL',
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const handleCreate = async () => {
    if (!formData.date) return;

    setCreating(true);
    try {
      const response = await fetch('/api/game-nights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onCreated(data.id);
      }
    } catch (error) {
      console.error('Failed to create game night:', error);
    } finally {
      setCreating(false);
    }
  };

  const vibes = [
    { id: 'CHILL', icon: Coffee, label: 'Chill', desc: 'Relaxed vibes, casual games' },
    { id: 'COMPETITIVE', icon: Flame, label: 'Competitive', desc: 'Bring your A-game' },
    { id: 'CHAOS', icon: Zap, label: 'Chaos', desc: 'Full Uproar mode' },
    { id: 'PARTY', icon: PartyPopper, label: 'Party', desc: 'High energy, lots of people' },
    { id: 'COZY', icon: Heart, label: 'Cozy', desc: 'Intimate, story-driven' },
  ];

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isPastDate = (year: number, month: number, day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(calendarMonth);
  const monthYear = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const timeOptions = [
    { value: '', label: 'Flexible' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(145deg, #1a1f2e 0%, #0f1219 100%)',
          borderRadius: '1.5rem',
          border: '3px solid #f97316',
          padding: '1.5rem',
          boxShadow: '0 25px 80px rgba(249, 115, 22, 0.25), 0 0 60px rgba(249, 115, 22, 0.1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? '2rem' : '0.75rem',
                height: '0.75rem',
                borderRadius: '0.5rem',
                background: s <= step ? '#f97316' : '#374151',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.25rem',
              textAlign: 'center',
            }}>
              Rally the Squad! 🎲
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Pick your date and time
            </p>

            {/* Calendar */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '1rem',
              padding: '1rem',
              marginBottom: '1rem',
              border: '2px solid #374151',
            }}>
              {/* Month navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  style={{
                    background: 'rgba(249, 115, 22, 0.2)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    color: '#f97316',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ←
                </button>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{monthYear}</span>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  style={{
                    background: 'rgba(249, 115, 22, 0.2)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    color: '#f97316',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  →
                </button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const dateStr = formatDateString(year, month, day);
                  const selected = formData.date === dateStr;
                  const today = isToday(year, month, day);
                  const past = isPastDate(year, month, day);

                  return (
                    <button
                      key={day}
                      onClick={() => !past && setFormData({ ...formData, date: dateStr })}
                      disabled={past}
                      style={{
                        aspectRatio: '1',
                        border: selected ? '2px solid #f97316' : today ? '2px solid #fbbf24' : '2px solid transparent',
                        borderRadius: '0.5rem',
                        background: selected
                          ? 'linear-gradient(135deg, #f97316, #ea580c)'
                          : today
                          ? 'rgba(251, 191, 36, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: past ? '#4b5563' : selected ? '#fff' : '#fff',
                        fontWeight: selected || today ? 'bold' : 'normal',
                        cursor: past ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected date display */}
            {formData.date && (
              <div style={{
                background: 'rgba(249, 115, 22, 0.15)',
                border: '2px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <Calendar size={20} style={{ color: '#f97316' }} />
                <span style={{ color: '#fdba74', fontWeight: 'bold' }}>
                  {new Date(formData.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Time selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Start Time
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {timeOptions.map((time) => (
                  <button
                    key={time.value}
                    onClick={() => setFormData({ ...formData, startTime: time.value })}
                    style={{
                      padding: '0.6rem 0.5rem',
                      background: formData.startTime === time.value
                        ? 'rgba(249, 115, 22, 0.3)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: formData.startTime === time.value
                        ? '2px solid #f97316'
                        : '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: formData.startTime === time.value ? '#f97316' : '#94a3b8',
                      fontWeight: formData.startTime === time.value ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.date}
              style={{
                width: '100%',
                padding: '1rem',
                background: formData.date ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#374151',
                border: 'none',
                borderRadius: '0.75rem',
                color: formData.date ? '#fff' : '#6b7280',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: formData.date ? 'pointer' : 'not-allowed',
                boxShadow: formData.date ? '0 10px 30px rgba(249, 115, 22, 0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Next: Set the Vibe →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.25rem',
              textAlign: 'center',
            }}>
              What's the Vibe? 🎭
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              This helps with suggestions
            </p>

            <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {vibes.map((v) => {
                const Icon = v.icon;
                const isSelected = formData.vibe === v.id;
                const config = vibeConfig[v.id];
                return (
                  <button
                    key={v.id}
                    onClick={() => setFormData({ ...formData, vibe: v.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.875rem 1rem',
                      background: isSelected ? config.bg : 'rgba(0, 0, 0, 0.3)',
                      border: `2px solid ${isSelected ? config.color : '#374151'}`,
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? `0 5px 20px ${config.color}30` : 'none',
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '0.75rem',
                      background: isSelected ? config.color : `${config.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      <Icon size={24} style={{ color: isSelected ? '#fff' : config.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{v.label}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{v.desc}</div>
                    </div>
                    {isSelected && (
                      <div style={{ color: config.color, fontSize: '1.25rem' }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 2,
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)',
                }}
              >
                Almost There! →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.25rem',
              textAlign: 'center',
            }}>
              Final Details 📍
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Add some extra info (optional)
            </p>

            {/* Summary card */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.25rem',
              border: '2px solid #374151',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Calendar size={18} style={{ color: '#f97316' }} />
                <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                  {formData.date && new Date(formData.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {formData.startTime && ` at ${timeOptions.find(t => t.value === formData.startTime)?.label || formData.startTime}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(() => {
                  const vibe = vibeConfig[formData.vibe];
                  const Icon = vibes.find(v => v.id === formData.vibe)?.icon || Coffee;
                  return (
                    <>
                      <Icon size={18} style={{ color: vibe?.color || '#60a5fa' }} />
                      <span style={{ color: vibe?.color || '#60a5fa', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {vibe?.label || 'Chill'} Vibes
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Give it a name
              </label>
              <input
                type="text"
                placeholder="Game Night"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Where at?
              </label>
              <input
                type="text"
                placeholder="My place, Discord, etc."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 2,
                  padding: '0.875rem',
                  background: creating ? '#374151' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: creating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: creating ? 'none' : '0 10px 30px rgba(16, 185, 129, 0.3)',
                }}
              >
                {creating ? 'Creating...' : (
                  <>
                    <Sparkles size={18} />
                    Let's Go!
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '480px',
          background: 'linear-gradient(145deg, #1a1f2e 0%, #0f1219 100%)',
          borderRadius: '1.5rem',
          border: '3px solid #a855f7',
          padding: '2rem',
          boxShadow: '0 25px 80px rgba(168, 85, 247, 0.25), 0 0 60px rgba(168, 85, 247, 0.1)',
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          <CloseIcon size={24} />
        </button>

        {/* Crown icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.3))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px solid #a855f7',
          }}
        >
          <Crown size={40} style={{ color: '#a855f7' }} />
        </div>

        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '0.75rem',
          }}
        >
          Unlock Game Nights
        </h2>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '1rem',
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          Creating game nights is an Afterroar+ exclusive feature. Upgrade to host unlimited game nights with all the premium tools.
        </p>

        {/* Features list */}
        <div
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#a855f7', marginBottom: '0.75rem' }}>
            What you get with Afterroar+:
          </div>
          {[
            'Create unlimited game nights',
            'Email invitations from the app',
            'Game voting & snack sign-ups',
            'Team chat & house rules',
            'Full event management tools',
          ].map((feature, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid #374151',
              borderRadius: '0.75rem',
              color: '#94a3b8',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Maybe Later
          </button>
          <Link href="/afterroar" style={{ flex: 2, textDecoration: 'none' }}>
            <button
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#fff',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 30px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Crown size={18} />
              View Afterroar+
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
