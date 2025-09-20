'use client';

import { useState } from 'react';

export default function FixUsersPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const fixUser = async (email: string) => {
    setLoading(true);
    setStatus(`Fixing user: ${email}...`);

    try {
      const response = await fetch('/api/admin/fix-user-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`✅ Fixed ${email}: ${result.user.role} role`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async (email: string) => {
    setLoading(true);
    setStatus(`Checking user: ${email}...`);

    try {
      const response = await fetch(`/api/admin/fix-user-sync?email=${email}`);
      const result = await response.json();

      setStatus(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fde68a',
      padding: '2rem'
    }}>
      <h1 style={{ color: '#f97316', marginBottom: '2rem' }}>Fix User Sync Issues</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Fix Specific Users:</h2>
        <button
          onClick={() => fixUser('info@fulluproar.com')}
          disabled={loading}
          style={{
            padding: '1rem',
            margin: '0.5rem',
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            fontWeight: 'bold'
          }}
        >
          Fix info@fulluproar.com (Grant GOD Role)
        </button>

        <button
          onClick={() => fixUser('apollock.clarinet@gmail.com')}
          disabled={loading}
          style={{
            padding: '1rem',
            margin: '0.5rem',
            background: '#f97316',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Fix apollock.clarinet@gmail.com
        </button>

        <button
          onClick={() => fixUser('annika@fulluproar.com')}
          disabled={loading}
          style={{
            padding: '1rem',
            margin: '0.5rem',
            background: '#f97316',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Fix annika@fulluproar.com (Grant Admin)
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Check User Status:</h2>
        <button
          onClick={() => checkUser('apollock.clarinet@gmail.com')}
          disabled={loading}
          style={{
            padding: '1rem',
            margin: '0.5rem',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Check apollock.clarinet@gmail.com
        </button>

        <button
          onClick={() => checkUser('annika@fulluproar.com')}
          disabled={loading}
          style={{
            padding: '1rem',
            margin: '0.5rem',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Check annika@fulluproar.com
        </button>
      </div>

      {status && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #f97316',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginTop: '2rem',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}