'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Gamepad2,
  Check,
  HelpCircle,
  X,
  Flame,
  Heart,
  PartyPopper,
  Coffee,
  Zap,
  Loader2,
  Gift,
  ExternalLink,
} from 'lucide-react';

interface InviteData {
  gameNight: {
    id: string;
    title: string;
    description: string | null;
    date: string;
    startTime: string | null;
    location: string | null;
    vibe: string;
    theme: string | null;
    host: {
      displayName: string | null;
      username: string;
      avatarUrl: string | null;
    };
    confirmedGuests: Array<{
      name: string;
      avatarUrl: string | null;
    }>;
    gamesPlanned: Array<{
      name: string;
      imageUrl: string | null;
    }>;
    totalInvited: number;
  };
  guest: {
    id: string;
    status: string;
    guestName: string | null;
    respondedAt: string | null;
  };
  inviteToken: string;
}

const vibeConfig: Record<string, { icon: any; color: string; label: string; bg: string; emoji: string }> = {
  CHILL: { icon: Coffee, color: '#60a5fa', label: 'Chill', bg: 'rgba(96, 165, 250, 0.15)', emoji: '😌' },
  COMPETITIVE: { icon: Flame, color: '#f97316', label: 'Competitive', bg: 'rgba(249, 115, 22, 0.15)', emoji: '🔥' },
  CHAOS: { icon: Zap, color: '#a855f7', label: 'Chaos', bg: 'rgba(168, 85, 247, 0.15)', emoji: '⚡' },
  PARTY: { icon: PartyPopper, color: '#ec4899', label: 'Party', bg: 'rgba(236, 72, 153, 0.15)', emoji: '🎉' },
  COZY: { icon: Heart, color: '#f472b6', label: 'Cozy', bg: 'rgba(244, 114, 182, 0.15)', emoji: '🧡' },
};

export default function JoinGameNightPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [bringing, setBringing] = useState('');

  useEffect(() => {
    fetchInvite();
  }, [resolvedParams.token]);

  const fetchInvite = async () => {
    try {
      const response = await fetch(`/api/game-nights/join/${resolvedParams.token}`);
      if (response.ok) {
        const data = await response.json();
        setInviteData(data);
        setRsvpStatus(data.guest.status);
        setGuestName(data.guest.guestName || '');
        if (data.guest.status !== 'PENDING') {
          setSubmitted(true);
        }
      } else if (response.status === 404) {
        setError('This invite link is invalid or has expired');
      } else {
        setError('Failed to load invite');
      }
    } catch (err) {
      setError('Failed to load invite');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: string) => {
    if (!inviteData || submitting) return;

    setSubmitting(true);
    setRsvpStatus(status);

    try {
      const response = await fetch(`/api/game-nights/join/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          guestName: guestName.trim() || undefined,
          bringing: bringing.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('RSVP failed:', err);
      setRsvpStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel = '';
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today, ';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = 'Tomorrow, ';
    }

    return dayLabel + date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#fdba74' }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>Loading invite...</p>
        </div>
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '3rem',
          background: 'rgba(31, 41, 55, 0.9)',
          borderRadius: '1.5rem',
          border: '2px solid #374151',
        }}>
          <X size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Oops!
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{error}</p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: '0.5rem',
              color: '#fff',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            Go to Full Uproar
          </Link>
        </div>
      </div>
    );
  }

  const { gameNight, guest } = inviteData;
  const vibe = vibeConfig[gameNight.vibe] || vibeConfig.CHILL;
  const VibeIcon = vibe.icon;
  const hostName = gameNight.host.displayName || gameNight.host.username;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #f97316, #fbbf24)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.1em',
            }}>
              FULL UPROAR
            </h1>
          </Link>
        </div>

        {/* Invite Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.98))',
          borderRadius: '1.5rem',
          border: `3px solid ${vibe.color}`,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px ${vibe.color}20`,
        }}>
          {/* Header with Vibe */}
          <div style={{
            padding: '2rem',
            background: vibe.bg,
            borderBottom: `2px solid ${vibe.color}33`,
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${vibe.color}, ${vibe.color}aa)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 30px ${vibe.color}40`,
            }}>
              <VibeIcon size={40} style={{ color: '#fff' }} />
            </div>

            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 0.5rem',
            }}>
              {gameNight.title}
            </h2>

            <p style={{ color: '#94a3b8', margin: 0 }}>
              {hostName} invited you to a <span style={{ color: vibe.color }}>{vibe.label}</span> game night!
            </p>
          </div>

          {/* Details */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Calendar size={24} style={{ color: vibe.color, flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{formatDate(gameNight.date)}</div>
                  {gameNight.startTime && (
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Starting at {gameNight.startTime}</div>
                  )}
                </div>
              </div>

              {gameNight.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <MapPin size={24} style={{ color: vibe.color, flexShrink: 0 }} />
                  <div style={{ color: '#fff' }}>{gameNight.location}</div>
                </div>
              )}

              {gameNight.confirmedGuests.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Users size={24} style={{ color: vibe.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#fff' }}>
                      {gameNight.confirmedGuests.length + 1} confirmed
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {[hostName, ...gameNight.confirmedGuests.map(g => g.name)].slice(0, 3).join(', ')}
                      {gameNight.confirmedGuests.length > 2 && ` +${gameNight.confirmedGuests.length - 2} more`}
                    </div>
                  </div>
                </div>
              )}

              {gameNight.gamesPlanned.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Gamepad2 size={24} style={{ color: vibe.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#fff' }}>Games lined up</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {gameNight.gamesPlanned.map(g => g.name).slice(0, 3).join(', ')}
                      {gameNight.gamesPlanned.length > 3 && ` +${gameNight.gamesPlanned.length - 3} more`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RSVP Section */}
            {submitted ? (
              <div style={{
                padding: '1.5rem',
                background: rsvpStatus === 'IN' ? 'rgba(16, 185, 129, 0.1)' : rsvpStatus === 'MAYBE' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '1rem',
                textAlign: 'center',
                border: `2px solid ${rsvpStatus === 'IN' ? '#10b981' : rsvpStatus === 'MAYBE' ? '#fbbf24' : '#ef4444'}`,
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {rsvpStatus === 'IN' && '🎉'}
                  {rsvpStatus === 'MAYBE' && '🤔'}
                  {rsvpStatus === 'OUT' && '👋'}
                </div>
                <h3 style={{
                  color: rsvpStatus === 'IN' ? '#10b981' : rsvpStatus === 'MAYBE' ? '#fbbf24' : '#ef4444',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: '0 0 0.5rem',
                }}>
                  {rsvpStatus === 'IN' && "You're In!"}
                  {rsvpStatus === 'MAYBE' && "Maybe - We'll Hope to See You!"}
                  {rsvpStatus === 'OUT' && "No Worries!"}
                </h3>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>
                  {rsvpStatus === 'IN' && 'Get ready for an epic game night!'}
                  {rsvpStatus === 'MAYBE' && "We'll keep a spot warm for you."}
                  {rsvpStatus === 'OUT' && "Maybe next time! Game nights happen often."}
                </p>

                {/* Change RSVP */}
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Change Response
                </button>
              </div>
            ) : (
              <>
                {/* Name Input (if not set) */}
                {!guest.guestName && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="So we know who's coming!"
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
                )}

                {/* Bringing Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <Gift size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Bringing anything? (optional)
                  </label>
                  <input
                    type="text"
                    value={bringing}
                    onChange={(e) => setBringing(e.target.value)}
                    placeholder="Snacks, drinks, extra controllers..."
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

                {/* RSVP Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleRSVP('IN')}
                    disabled={submitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      cursor: submitting ? 'wait' : 'pointer',
                      boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Check size={24} />
                    I'm In!
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleRSVP('MAYBE')}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(251, 191, 36, 0.2)',
                        border: '2px solid #fbbf24',
                        borderRadius: '0.75rem',
                        color: '#fbbf24',
                        fontWeight: 'bold',
                        cursor: submitting ? 'wait' : 'pointer',
                      }}
                    >
                      <HelpCircle size={20} />
                      Maybe
                    </button>

                    <button
                      onClick={() => handleRSVP('OUT')}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '2px solid #ef4444',
                        borderRadius: '0.75rem',
                        color: '#ef4444',
                        fontWeight: 'bold',
                        cursor: submitting ? 'wait' : 'pointer',
                      }}
                    >
                      <X size={20} />
                      Can't Make It
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
          <p style={{ margin: '0 0 1rem' }}>
            Game nights powered by{' '}
            <Link href="/" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 'bold' }}>
              Full Uproar
            </Link>
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#94a3b8',
              textDecoration: 'none',
            }}
          >
            Learn more <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
