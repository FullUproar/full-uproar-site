'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ChaosLandingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = roomCode.toUpperCase().trim();
    if (code.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    setIsJoining(true);
    router.push(`/chaos/join/${code}`);
  };

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
      {/* Logo/Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          margin: '0 auto 16px',
        }}>
          <Image
            src="/FuglyLogo.png"
            alt="Fugly - Chaos Agent"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#f97316',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '3px',
        }}>
          Chaos Agent
        </h1>
        <p style={{
          color: '#fde68a',
          marginTop: '8px',
          fontSize: '14px',
          fontStyle: 'italic',
        }}>
          "Let me add some spice to your game night!"
        </p>
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
            Enter Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABCD12"
            maxLength={6}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '24px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '8px',
              backgroundColor: '#0a0a0a',
              border: '2px solid #3a3a3a',
              borderRadius: '12px',
              color: '#fde68a',
              outline: 'none',
              boxSizing: 'border-box',
              textTransform: 'uppercase',
            }}
          />

          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '14px',
              marginTop: '8px',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={roomCode.length !== 6 || isJoining}
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '16px',
              backgroundColor: roomCode.length === 6 ? '#f97316' : '#3a3a3a',
              color: roomCode.length === 6 ? '#000' : '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: roomCode.length === 6 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
        maxWidth: '320px',
      }}>
        <p style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          Get the room code from your host and prepare for chaos!
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}>
          {[
            { icon: '🎯', label: 'Secret Missions', color: '#f97316' },
            { icon: '🎲', label: 'Random Events', color: '#8b5cf6' },
            { icon: '💰', label: 'Betting', color: '#10b981' },
            { icon: '🎮', label: 'Mini Games', color: '#ec4899' },
          ].map((item) => (
            <div key={item.label} style={{
              backgroundColor: '#1a1a1a',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${item.color}30`,
            }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ color: item.color, fontSize: '12px', fontWeight: '500' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(transparent, #0a0a0a 50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Dev Test Mode Link */}
        <Link
          href="/chaos/test"
          style={{
            color: '#8b5cf6',
            fontSize: '11px',
            textDecoration: 'none',
            padding: '4px 12px',
            backgroundColor: '#8b5cf620',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          🧪 Solo Test Mode
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image
            src="/logo.png"
            alt="Full Uproar"
            width={24}
            height={24}
            style={{ borderRadius: '4px' }}
          />
          <Link
            href="/"
            style={{
              color: '#6b7280',
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            Full Uproar Games
          </Link>
        </div>
      </div>
    </div>
  );
}
