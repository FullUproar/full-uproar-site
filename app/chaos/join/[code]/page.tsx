'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function JoinChaosPage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [avatarColor, setAvatarColor] = useState('#f97316');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const AVATAR_COLORS = ['#f97316', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f59e0b'];
  const PRONOUN_OPTIONS = ['', 'he/him', 'she/her', 'they/them'];
  const [sessionInfo, setSessionInfo] = useState<{
    gameNightTitle: string;
    hostName: string;
    participantCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate or retrieve guest ID for anonymous users
  const getGuestId = () => {
    if (typeof window === 'undefined') return null;
    let guestId = localStorage.getItem('chaosGuestId');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chaosGuestId', guestId);
    }
    return guestId;
  };

  // Fetch session info
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/chaos/lookup/${code.toUpperCase()}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Session not found. Check your room code.');
          } else {
            setError('Failed to load session');
          }
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setSessionInfo({
          gameNightTitle: data.gameNightTitle,
          hostName: data.hostName,
          participantCount: data.participantCount,
        });
      } catch {
        setError('Failed to connect. Please try again.');
      }
      setIsLoading(false);
    }

    fetchSession();
  }, [code]);

  // Pre-fill display name from user profile
  useEffect(() => {
    if (user) {
      const name = user.firstName || user.username || '';
      setDisplayName(name);
    }
  }, [user]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    setIsJoining(true);

    try {
      const guestId = !user ? getGuestId() : null;

      const res = await fetch(`/api/chaos/lookup/${code.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          pronouns: pronouns || undefined,
          avatarColor,
          guestId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to join session');
        setIsJoining(false);
        return;
      }

      const data = await res.json();

      // Store participant info for reconnection
      localStorage.setItem(`chaos_${code}`, JSON.stringify({
        participantId: data.participant.id,
        sessionId: data.session.id,
      }));

      // Redirect to main chaos interface
      router.push(`/chaos/${data.session.id}`);
    } catch {
      setError('Failed to join. Please try again.');
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            margin: '0 auto',
          }}>
            <Image
              src="/FuglyLogo.png"
              alt="Loading..."
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p style={{ color: '#9ca3af', marginTop: '16px' }}>
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (error && !sessionInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '24px',
        }}>
          😵
        </div>
        <h1 style={{
          color: '#ef4444',
          fontSize: '24px',
          marginBottom: '16px',
        }}>
          Session Not Found
        </h1>
        <p style={{
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          {error}
        </p>
        <button
          onClick={() => router.push('/chaos')}
          style={{
            padding: '12px 32px',
            backgroundColor: '#f97316',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #3a3a3a',
          marginBottom: '16px',
        }}>
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>ROOM CODE</span>
          <div style={{
            color: '#f97316',
            fontSize: '24px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '4px',
          }}>
            {code.toUpperCase()}
          </div>
        </div>

        {sessionInfo && (
          <>
            <h1 style={{
              color: '#fde68a',
              fontSize: '24px',
              margin: '0 0 8px 0',
            }}>
              {sessionInfo.gameNightTitle}
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
              Hosted by {sessionInfo.hostName} • {sessionInfo.participantCount} joined
            </p>
          </>
        )}
      </div>

      {/* Join Form */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        border: '2px solid #2a2a2a',
      }}>
        <form onSubmit={handleJoin}>
          <label style={{
            display: 'block',
            color: '#e2e8f0',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            Your Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              backgroundColor: '#0a0a0a',
              border: '2px solid #3a3a3a',
              borderRadius: '12px',
              color: '#fde68a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Pronouns (optional) */}
          <label style={{
            display: 'block',
            color: '#e2e8f0',
            marginTop: '16px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            Pronouns <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(optional)</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRONOUN_OPTIONS.map((p) => (
              <button
                key={p || 'none'}
                type="button"
                onClick={() => setPronouns(p)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: pronouns === p ? '#f97316' : '#0a0a0a',
                  color: pronouns === p ? '#000' : '#e2e8f0',
                  border: '1px solid #3a3a3a',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {p || 'None'}
              </button>
            ))}
          </div>

          {/* Avatar Color */}
          <label style={{
            display: 'block',
            color: '#e2e8f0',
            marginTop: '16px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            Your Color
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAvatarColor(color)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: avatarColor === color ? '3px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: avatarColor === color ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '14px',
              marginTop: '8px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!displayName.trim() || isJoining}
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '16px',
              backgroundColor: displayName.trim() ? '#f97316' : '#3a3a3a',
              color: displayName.trim() ? '#000' : '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: displayName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {isJoining ? 'Joining the Chaos...' : 'Join the Chaos!'}
          </button>
        </form>

        {!isLoaded && (
          <p style={{
            color: '#6b7280',
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '16px',
          }}>
            Sign in to save your stats across sessions
          </p>
        )}
      </div>
    </div>
  );
}
