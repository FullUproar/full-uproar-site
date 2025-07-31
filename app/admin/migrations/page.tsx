'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function MigrationsPage() {
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      padding: '40px 20px'
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '40px'
    },
    title: {
      fontSize: '36px',
      fontWeight: '900',
      color: '#fdba74',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#94a3b8',
      fontSize: '16px'
    },
    migrationGrid: {
      display: 'grid',
      gap: '20px'
    },
    migrationCard: {
      background: 'rgba(30, 41, 59, 0.8)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '24px',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.2s'
    },
    migrationTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '8px'
    },
    migrationDescription: {
      color: '#e2e8f0',
      marginBottom: '16px',
      fontSize: '14px',
      lineHeight: '1.6'
    },
    migrationStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px'
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%'
    },
    statusText: {
      fontSize: '13px',
      color: '#94a3b8'
    },
    runButton: {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      fontSize: '14px'
    },
    backButton: {
      display: 'inline-block',
      color: '#fdba74',
      textDecoration: 'none',
      marginBottom: '20px',
      padding: '8px 16px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      transition: 'all 0.2s'
    },
    result: {
      marginTop: '16px',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '13px'
    },
    successResult: {
      background: 'rgba(134, 239, 172, 0.1)',
      border: '1px solid rgba(134, 239, 172, 0.3)',
      color: '#86efac'
    },
    errorResult: {
      background: 'rgba(252, 165, 165, 0.1)',
      border: '1px solid rgba(252, 165, 165, 0.3)',
      color: '#fca5a5'
    }
  };

  const migrations = [
    {
      id: 'migrate-add-enum-columns',
      title: '🚨 URGENT: Add Enum Columns',
      description: 'Adds playerCount, playTime enum columns and migrates existing data. Required for site to function properly.',
      endpoint: '/api/migrate-add-enum-columns'
    },
    {
      id: 'migrate-launch-date',
      title: 'Add Launch Date Field',
      description: 'Adds launchDate field to Game table for pre-order and release tracking.',
      endpoint: '/api/migrate-launch-date'
    },
    {
      id: 'migrate-enhanced-schema',
      title: 'Enhanced Schema Migration',
      description: 'Converts existing game and merch data to use new enum fields. Adds player count, play time, age rating enums, and additional product details.',
      endpoint: '/api/migrate-enhanced-schema'
    },
    {
      id: 'migrate-game-inventory',
      title: 'Game Inventory Migration',
      description: 'Creates GameInventory records for existing games based on their stock field.',
      endpoint: '/api/migrate-game-inventory'
    },
    {
      id: 'migrate-slugs',
      title: 'Generate Slugs',
      description: 'Generates URL-friendly slugs for games and merch that are missing them.',
      endpoint: '/api/migrate-slugs'
    },
    {
      id: 'migrate-missing-fields',
      title: 'Add Missing Fields',
      description: 'Adds any missing optional fields with default values.',
      endpoint: '/api/migrate-missing-fields'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Link href="/admin/dashboard" style={styles.backButton}>
          ← Back to Dashboard
        </Link>
        
        <div style={styles.header}>
          <h1 style={styles.title}>Database Migrations</h1>
          <p style={styles.subtitle}>
            Run these migrations to update your database schema and data
          </p>
        </div>

        <div style={styles.migrationGrid}>
          {migrations.map(migration => (
            <MigrationCard key={migration.id} migration={migration} styles={styles} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MigrationCard({ migration, styles }: any) {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const runMigration = async () => {
    setStatus('running');
    setResult(null);
    
    try {
      const response = await fetch(migration.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus('success');
        setResult(data);
      } else {
        setStatus('error');
        setResult(data);
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: error instanceof Error ? error.message : 'Migration failed' });
    }
  };

  return (
    <div 
      style={{
        ...styles.migrationCard,
        borderColor: status === 'success' ? 'rgba(134, 239, 172, 0.3)' : 
                     status === 'error' ? 'rgba(252, 165, 165, 0.3)' : 
                     'rgba(249, 115, 22, 0.3)'
      }}
    >
      <h3 style={styles.migrationTitle}>{migration.title}</h3>
      <p style={styles.migrationDescription}>{migration.description}</p>
      
      <div style={styles.migrationStatus}>
        <div style={{
          ...styles.statusDot,
          background: status === 'idle' ? '#64748b' :
                     status === 'running' ? '#f97316' :
                     status === 'success' ? '#10b981' :
                     '#ef4444'
        }} />
        <span style={styles.statusText}>
          {status === 'idle' && 'Not run'}
          {status === 'running' && 'Running...'}
          {status === 'success' && 'Completed successfully'}
          {status === 'error' && 'Failed'}
        </span>
      </div>
      
      <button
        onClick={runMigration}
        disabled={status === 'running'}
        style={{
          ...styles.runButton,
          opacity: status === 'running' ? 0.5 : 1,
          cursor: status === 'running' ? 'not-allowed' : 'pointer'
        }}
        onMouseEnter={(e) => {
          if (status !== 'running') {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {status === 'running' ? 'Running...' : 'Run Migration'}
      </button>
      
      {result && (
        <div style={{
          ...styles.result,
          ...(status === 'success' ? styles.successResult : styles.errorResult)
        }}>
          <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}