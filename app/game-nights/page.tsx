'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
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
  Coffee
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
  const [gameNights, setGameNights] = useState<{ hosted: GameNight[]; attending: GameNight[] }>({
    hosted: [],
    attending: [],
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchGameNights();
  }, []);

  const fetchGameNights = async () => {
    try {
      const response = await fetch('/api/game-nights?attending=true');
      if (response.ok) {
        const data = await response.json();
        setGameNights(data);
      }
    } catch (error) {
      console.error('Failed to fetch game nights:', error);
    } finally {
      setLoading(false);
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
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Game Night HQ
          </h1>
          <p style={{ color: '#fdba74', fontSize: '1.25rem', marginBottom: '2rem' }}>
            Rally the squad. Roll the dice. Create the chaos.
          </p>

          <button
            onClick={() => setShowCreateModal(true)}
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

              {upcomingHosted.length === 0 && gameNights.attending.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  background: 'rgba(249, 115, 22, 0.1)',
                  borderRadius: '1rem',
                  border: '2px dashed rgba(249, 115, 22, 0.3)',
                  textAlign: 'center',
                }}>
                  <Gamepad2 size={48} style={{ color: '#f97316', marginBottom: '1rem' }} />
                  <h3 style={{ color: '#fdba74', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    No game nights planned... yet
                  </h3>
                  <p style={{ color: '#94a3b8' }}>
                    Your calendar is looking empty. Time to fix that!
                  </p>
                </div>
              ) : (
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
              )}
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '500px',
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          borderRadius: '1.5rem',
          border: '3px solid #f97316',
          padding: '2rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {step === 1 && (
          <>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}>
              Rally the Squad! 🎲
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
              When's the chaos happening?
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                When?
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1.125rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                What time? (optional)
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1.125rem',
                }}
              />
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
                color: '#fff',
                fontWeight: 900,
                fontSize: '1.125rem',
                cursor: formData.date ? 'pointer' : 'not-allowed',
              }}
            >
              Next: Set the Vibe →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}>
              What's the Vibe? 🎭
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
              Sets the tone for suggestions
            </p>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
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
                      padding: '1rem',
                      background: isSelected ? config.bg : 'rgba(0, 0, 0, 0.3)',
                      border: `2px solid ${isSelected ? config.color : '#374151'}`,
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={28} style={{ color: config.color }} />
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{v.label}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{v.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
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
                onClick={() => setStep(3)}
                style={{
                  flex: 2,
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  cursor: 'pointer',
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
              fontSize: '2rem',
              fontWeight: 900,
              color: '#f97316',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}>
              Final Details 📍
            </h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
              Optional but helpful
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Give it a name?
              </label>
              <input
                type="text"
                placeholder="Game Night"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1.125rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Where at?
              </label>
              <input
                type="text"
                placeholder="My place, Discord, etc."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '2px solid #374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '1.125rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'transparent',
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
                  padding: '1rem',
                  background: creating ? '#374151' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  cursor: creating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {creating ? 'Creating...' : (
                  <>
                    <Sparkles size={20} />
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
