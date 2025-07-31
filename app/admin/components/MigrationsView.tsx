'use client';

import React, { useState, useEffect } from 'react';
import { Database, Check, AlertCircle, Loader2, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Migration {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completedAt?: string;
  error?: string;
}

export default function MigrationsView() {
  const [migrations, setMigrations] = useState<Migration[]>([
    {
      id: 'add-game-enums',
      name: 'Add Game Enums',
      description: 'Add AgeRating, GameCategory, PlayerCount, and PlayTime enums to database',
      status: 'completed',
      completedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'add-merch-fields',
      name: 'Add Merchandise Fields',
      description: 'Add category enum and additional fields for merchandise',
      status: 'completed',
      completedAt: '2024-01-15T11:00:00Z',
    },
    {
      id: 'add-game-credits',
      name: 'Add Game Credits',
      description: 'Add lead designer/artist and additional credits fields',
      status: 'completed',
      completedAt: '2024-01-16T09:00:00Z',
    },
    {
      id: 'add-launch-date',
      name: 'Add Launch Date',
      description: 'Add launch date field for games and merchandise',
      status: 'pending',
    },
  ]);

  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedMigrations, setExpandedMigrations] = useState<string[]>([]);

  useEffect(() => {
    const savedShowCompleted = localStorage.getItem('admin_migrations_showCompleted');
    if (savedShowCompleted !== null) {
      setShowCompleted(JSON.parse(savedShowCompleted));
    }
  }, []);

  const toggleShowCompleted = () => {
    const newValue = !showCompleted;
    setShowCompleted(newValue);
    localStorage.setItem('admin_migrations_showCompleted', JSON.stringify(newValue));
  };

  const toggleExpanded = (id: string) => {
    setExpandedMigrations(prev =>
      prev.includes(id)
        ? prev.filter(mid => mid !== id)
        : [...prev, id]
    );
  };

  const runMigration = async (id: string) => {
    setMigrations(prev =>
      prev.map(m => m.id === id ? { ...m, status: 'running' } : m)
    );

    // Simulate migration execution
    setTimeout(() => {
      setMigrations(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, status: 'completed', completedAt: new Date().toISOString() }
            : m
        )
      );
    }, 2000);
  };

  const getStatusIcon = (status: Migration['status']) => {
    switch (status) {
      case 'completed':
        return <Check size={16} style={{ color: '#86efac' }} />;
      case 'running':
        return <Loader2 size={16} style={{ color: '#fdba74', animation: 'spin 1s linear infinite' }} />;
      case 'failed':
        return <AlertCircle size={16} style={{ color: '#fca5a5' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Migration['status']) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'running':
        return '#f97316';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const visibleMigrations = showCompleted
    ? migrations
    : migrations.filter(m => m.status !== 'completed');

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Database Migrations</h1>
        <p style={adminStyles.subtitle}>Manage and run database schema updates</p>
      </div>

      {/* Controls */}
      <div style={{
        ...adminStyles.section,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Database size={20} style={{ color: '#fdba74' }} />
          <span style={{ color: '#e2e8f0' }}>
            {migrations.filter(m => m.status === 'pending').length} pending migrations
          </span>
        </div>

        <button
          onClick={toggleShowCompleted}
          style={adminStyles.outlineButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
          <span style={{ marginLeft: '8px' }}>
            {showCompleted ? 'Hide' : 'Show'} Completed
          </span>
        </button>
      </div>

      {/* Migrations List */}
      <div style={adminStyles.section}>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        {visibleMigrations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
          }}>
            <Check size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>All migrations have been completed!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleMigrations.map((migration) => (
              <div
                key={migration.id}
                style={{
                  ...adminStyles.card,
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Migration Header */}
                <div
                  style={{
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpanded(migration.id)}
                >
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {expandedMigrations.includes(migration.id) ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>

                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#fde68a',
                      marginBottom: '4px',
                    }}>
                      {migration.name}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#94a3b8',
                    }}>
                      {migration.description}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {getStatusIcon(migration.status)}
                    <span style={{
                      ...adminStyles.badge,
                      background: `${getStatusColor(migration.status)}20`,
                      borderColor: getStatusColor(migration.status),
                      color: getStatusColor(migration.status),
                    }}>
                      {migration.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedMigrations.includes(migration.id) && (
                  <div style={{
                    padding: '20px',
                    borderTop: '2px solid rgba(249, 115, 22, 0.2)',
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <strong style={{ color: '#fdba74' }}>Migration ID:</strong>{' '}
                        <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                          {migration.id}
                        </span>
                      </div>

                      {migration.completedAt && (
                        <div>
                          <strong style={{ color: '#fdba74' }}>Completed:</strong>{' '}
                          <span style={{ color: '#94a3b8' }}>
                            {new Date(migration.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {migration.error && (
                        <div style={{
                          padding: '12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                        }}>
                          <strong style={{ color: '#fca5a5' }}>Error:</strong>
                          <pre style={{
                            marginTop: '8px',
                            color: '#fca5a5',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                          }}>
                            {migration.error}
                          </pre>
                        </div>
                      )}

                      {migration.status === 'pending' && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              runMigration(migration.id);
                            }}
                            style={adminStyles.button}
                            {...adminStyles.hoverEffects.button}
                          >
                            Run Migration
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}