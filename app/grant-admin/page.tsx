'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function GrantAdminPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      fetchDebugInfo();
    }
  }, [userId]);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug-user');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
    }
  };

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
        
        {debugInfo && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'left',
            fontSize: '14px',
            color: '#94a3b8'
          }}>
            <p><strong>Debug Info:</strong></p>
            <p>Clerk User ID: {debugInfo.clerkUserId || 'Not found'}</p>
            <p>Clerk Email: {debugInfo.clerkEmail || 'Not found'}</p>
            <p>DB User Exists: {debugInfo.dbUserExists ? 'Yes' : 'No'}</p>
            {debugInfo.dbUser && (
              <>
                <p>DB Role: {debugInfo.dbUser.role}</p>
                <p>DB Created: {new Date(debugInfo.dbUser.createdAt).toLocaleDateString()}</p>
              </>
            )}
            <p>Total Users in DB: {debugInfo.totalUsersInDb}</p>
          </div>
        )}
        
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