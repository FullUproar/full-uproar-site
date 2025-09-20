'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SyncMePage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState('');
  const [syncing, setSyncing] = useState(false);

  const syncUser = async () => {
    if (!user) {
      setStatus('❌ Not logged in');
      return;
    }

    setSyncing(true);
    setStatus('🔄 Syncing user...');

    try {
      const response = await fetch('/api/sync-me');
      const result = await response.json();

      if (response.ok) {
        setStatus(`✅ ${result.message}\n\nUser Details:\n${JSON.stringify(result.user, null, 2)}`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      syncUser();
    } else if (isLoaded && !user) {
      setStatus('❌ Not logged in. Please sign in first.');
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fde68a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fde68a',
      padding: '2rem'
    }}>
      <h1 style={{ color: '#f97316', marginBottom: '2rem' }}>Sync User Account</h1>

      {user && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #f97316',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h2>Current User:</h2>
          <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
          <p>Clerk ID: {user.id}</p>
        </div>
      )}

      <button
        onClick={syncUser}
        disabled={syncing || !user}
        style={{
          padding: '1rem 2rem',
          background: '#f97316',
          color: '#0a0a0a',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: syncing || !user ? 'not-allowed' : 'pointer',
          opacity: syncing || !user ? 0.5 : 1,
          marginBottom: '2rem'
        }}
      >
        {syncing ? 'Syncing...' : 'Sync My Account'}
      </button>

      {status && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #f97316',
          borderRadius: '0.5rem',
          padding: '1rem',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          {status}
        </div>
      )}

      {user && (
        <div style={{ marginTop: '2rem', color: '#6b7280' }}>
          <p>This will sync your Clerk account with the database and assign the appropriate role:</p>
          <ul>
            <li>info@fulluproar.com → GOD role (full access)</li>
            <li>annika@fulluproar.com → ADMIN role</li>
            <li>All others → USER role</li>
          </ul>
        </div>
      )}
    </div>
  );
}