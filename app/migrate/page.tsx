'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('emergency-init-2024');

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/migrate-missing-fields?secret=${secret}`, {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Migration failed' });
    }
    setLoading(false);
  };

  const runInitDb = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/init-db?secret=${secret}`, {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Init DB failed' });
    }
    setLoading(false);
  };

  const runSeedData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/seed-data?secret=${secret}`, {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Seed data failed' });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Database Migration Tool
        </h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Secret Key:
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '0.25rem',
              marginBottom: '1rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={runMigration}
            disabled={loading}
            style={{
              background: '#f97316',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Running...' : 'Run Migration (Add Missing Fields)'}
          </button>

          <button
            onClick={runInitDb}
            disabled={loading}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Running...' : 'Initialize Database'}
          </button>

          <button
            onClick={runSeedData}
            disabled={loading}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Running...' : 'Seed Sample Data'}
          </button>
        </div>

        {result && (
          <div style={{
            background: result.error ? '#fee2e2' : '#dcfce7',
            border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {result.error ? 'Error' : 'Success'}
            </h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}