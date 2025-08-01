'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const ensureAdminUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/ensure-admin-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to ensure admin user');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-user-role');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check user role');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      color: '#e2e8f0',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#1f2937',
        padding: '2rem',
        borderRadius: '1rem',
        border: '2px solid #374151'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: '#f97316'
        }}>
          Admin Setup Helper
        </h1>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: '#9ca3af' }}>
            This page helps set up admin access for info@fulluproar.com
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={checkUserRole}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Check User Status
          </button>

          <button
            onClick={ensureAdminUser}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Create/Update Admin User
          </button>

          <button
            onClick={() => router.push('/admin')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Go to Admin Panel
          </button>
        </div>

        {loading && (
          <div style={{
            padding: '1rem',
            background: '#374151',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            Loading...
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            background: '#7f1d1d',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#fca5a5'
          }}>
            Error: {error}
          </div>
        )}

        {result && (
          <div style={{
            padding: '1rem',
            background: '#064e3b',
            borderRadius: '0.5rem',
            color: '#a7f3d0'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Result:</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#374151',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#9ca3af'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Instructions:</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>First, click "Check User Status" to see if info@fulluproar.com exists in the database</li>
            <li>If the user doesn't exist or doesn't have admin role, click "Create/Update Admin User"</li>
            <li>Once successful, click "Go to Admin Panel" and try accessing the Users section</li>
          </ol>
        </div>
      </div>
    </div>
  );
}