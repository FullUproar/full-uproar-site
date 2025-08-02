'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function GrantAdminPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGrantAdmin = async () => {
    if (!userId) {
      setResult({ error: 'You must be logged in' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/grant-admin', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      }
    } catch (error) {
      setResult({ error: 'Failed to grant admin access' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        border: '2px solid #f97316',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#f97316', marginBottom: '1rem' }}>
          Grant Admin Access
        </h1>
        
        {!result ? (
          <>
            <p style={{ color: '#e2e8f0', marginBottom: '2rem' }}>
              Click the button below to grant yourself admin access.
            </p>
            <button
              onClick={handleGrantAdmin}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#666' : '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? 'Granting Access...' : 'Grant Admin Access'}
            </button>
          </>
        ) : result.error ? (
          <div style={{ color: '#ef4444' }}>
            <p>Error: {result.error}</p>
          </div>
        ) : (
          <div style={{ color: '#10b981' }}>
            <p>✓ Admin access granted successfully!</p>
            <p style={{ fontSize: '14px', marginTop: '1rem', color: '#94a3b8' }}>
              Redirecting to admin panel...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}