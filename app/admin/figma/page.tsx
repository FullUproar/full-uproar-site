'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Check, X, Download, Upload, Palette, Type, Box, Layers } from 'lucide-react';

interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

interface DesignTokens {
  'Full Uproar': {
    colors: Record<string, unknown>;
    typography: Record<string, unknown>;
    spacing: Record<string, unknown>;
    borderRadius: Record<string, unknown>;
    shadow: Record<string, unknown>;
    breakpoints: Record<string, unknown>;
    layout: Record<string, unknown>;
  };
}

export default function FigmaAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [user, setUser] = useState<FigmaUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [activeTab, setActiveTab] = useState<'connection' | 'tokens' | 'sync'>('connection');
  const [syncResult, setSyncResult] = useState<unknown>(null);

  // Test connection on page load
  useEffect(() => {
    testConnection();
    loadTokens();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/figma?action=test');
      const data = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
        setUser(data.user);
      } else {
        setConnectionStatus('error');
        setError(data.error || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTokens = async () => {
    try {
      const response = await fetch('/api/admin/figma?action=tokens');
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (err) {
      console.error('Failed to load tokens:', err);
    }
  };

  const syncTokens = async () => {
    setIsLoading(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/admin/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync-tokens',
          fileKey: 'your-figma-file-key', // This would come from user input
        }),
      });
      const data = await response.json();
      setSyncResult(data);
    } catch (err) {
      setSyncResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTokensJson = () => {
    if (!tokens) return;
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figma-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const adminStyles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '2rem',
    },
    header: {
      maxWidth: '1200px',
      margin: '0 auto 2rem',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#9ca3af',
      textDecoration: 'none',
      marginBottom: '1rem',
      fontSize: '0.875rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 900,
      color: '#FF8200',
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: '#9ca3af',
      fontSize: '1rem',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    tabs: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      borderBottom: '1px solid #374151',
      paddingBottom: '1rem',
    },
    tab: {
      padding: '0.75rem 1.5rem',
      background: 'transparent',
      border: 'none',
      borderRadius: '0.5rem',
      color: '#9ca3af',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    activeTab: {
      background: '#FF8200',
      color: '#0a0a0a',
    },
    card: {
      background: '#1f2937',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: '#FBDB65',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '50px',
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: '#FF8200',
      color: '#0a0a0a',
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    secondaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: '#374151',
      color: '#e2e8f0',
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: '#111827',
      borderRadius: '0.5rem',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: '2px solid #FF8200',
    },
    tokenSection: {
      marginBottom: '1.5rem',
    },
    tokenGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '0.75rem',
    },
    colorSwatch: {
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #374151',
    },
    colorPreview: {
      width: '100%',
      height: '40px',
      borderRadius: '0.25rem',
      marginBottom: '0.5rem',
    },
    colorName: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginBottom: '0.25rem',
    },
    colorValue: {
      fontSize: '0.8rem',
      color: '#e2e8f0',
      fontFamily: 'monospace',
    },
    codeBlock: {
      background: '#111827',
      padding: '1rem',
      borderRadius: '0.5rem',
      overflow: 'auto',
      maxHeight: '400px',
    },
    code: {
      color: '#e2e8f0',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      whiteSpace: 'pre-wrap' as const,
    },
  };

  const renderColorTokens = (colors: Record<string, unknown>, prefix = '') => {
    const items: React.ReactElement[] = [];

    const processColors = (obj: Record<string, unknown>, path: string) => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;

        if (typeof value === 'object' && value !== null && 'value' in value) {
          const token = value as { value: string; description?: string };
          if (token.value.startsWith('#') || token.value.startsWith('rgb')) {
            items.push(
              <div key={fullPath} style={adminStyles.colorSwatch}>
                <div
                  style={{
                    ...adminStyles.colorPreview,
                    background: token.value,
                    border: token.value.includes('0a0a0a') || token.value.includes('111827') ? '1px solid #374151' : 'none',
                  }}
                />
                <div style={adminStyles.colorName}>{fullPath}</div>
                <div style={adminStyles.colorValue}>{token.value}</div>
              </div>
            );
          }
        } else if (typeof value === 'object' && value !== null) {
          processColors(value as Record<string, unknown>, fullPath);
        }
      }
    };

    processColors(colors, prefix);
    return items;
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <Link href="/admin" style={adminStyles.backLink}>
          <ArrowLeft size={16} />
          Back to Admin
        </Link>
        <h1 style={adminStyles.title}>Figma Integration</h1>
        <p style={adminStyles.subtitle}>
          Manage design tokens and sync with Figma
        </p>
      </div>

      <div style={adminStyles.content}>
        {/* Tabs */}
        <div style={adminStyles.tabs}>
          <button
            style={{
              ...adminStyles.tab,
              ...(activeTab === 'connection' ? adminStyles.activeTab : {}),
            }}
            onClick={() => setActiveTab('connection')}
          >
            Connection
          </button>
          <button
            style={{
              ...adminStyles.tab,
              ...(activeTab === 'tokens' ? adminStyles.activeTab : {}),
            }}
            onClick={() => setActiveTab('tokens')}
          >
            Design Tokens
          </button>
          <button
            style={{
              ...adminStyles.tab,
              ...(activeTab === 'sync' ? adminStyles.activeTab : {}),
            }}
            onClick={() => setActiveTab('sync')}
          >
            Sync & Export
          </button>
        </div>

        {/* Connection Tab */}
        {activeTab === 'connection' && (
          <>
            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Layers size={20} />
                API Connection Status
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <span
                  style={{
                    ...adminStyles.statusBadge,
                    background:
                      connectionStatus === 'connected'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : connectionStatus === 'error'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(156, 163, 175, 0.2)',
                    color:
                      connectionStatus === 'connected'
                        ? '#10b981'
                        : connectionStatus === 'error'
                        ? '#ef4444'
                        : '#9ca3af',
                  }}
                >
                  {connectionStatus === 'connected' && <Check size={16} />}
                  {connectionStatus === 'error' && <X size={16} />}
                  {connectionStatus === 'connected'
                    ? 'Connected'
                    : connectionStatus === 'error'
                    ? 'Connection Error'
                    : 'Checking...'}
                </span>
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    color: '#fca5a5',
                  }}
                >
                  {error}
                </div>
              )}

              {user && (
                <div style={adminStyles.userInfo}>
                  <img src={user.img_url} alt={user.handle} style={adminStyles.avatar} />
                  <div>
                    <div style={{ color: '#FBDB65', fontWeight: 600 }}>
                      {user.handle}
                    </div>
                    {user.email && (
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        {user.email}
                      </div>
                    )}
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      ID: {user.id}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  style={adminStyles.button}
                  onClick={testConnection}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>Setup Instructions</h2>
              <div style={{ color: '#9ca3af', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '1rem' }}>
                  To connect Figma, ensure you have a Personal Access Token set in your environment:
                </p>
                <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                  <li>Go to Figma → Settings → Account → Personal Access Tokens</li>
                  <li>Generate a new token with appropriate scopes</li>
                  <li>Add <code style={{ background: '#111827', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>FIGMA_ACCESS_TOKEN=your_token</code> to your .env.local</li>
                  <li>Restart your development server</li>
                </ol>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Note: Keep your token secure and never commit it to version control.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && tokens && (
          <>
            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Palette size={20} />
                Brand Colors
              </h2>
              <div style={adminStyles.tokenGrid}>
                {renderColorTokens(tokens['Full Uproar'].colors.brand as Record<string, unknown>)}
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Palette size={20} />
                Pantone Colors
              </h2>
              <div style={adminStyles.tokenGrid}>
                {renderColorTokens(tokens['Full Uproar'].colors.pantone as Record<string, unknown>)}
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Box size={20} />
                Background Colors
              </h2>
              <div style={adminStyles.tokenGrid}>
                {renderColorTokens(tokens['Full Uproar'].colors.background as Record<string, unknown>)}
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Type size={20} />
                Text Colors
              </h2>
              <div style={adminStyles.tokenGrid}>
                {renderColorTokens(tokens['Full Uproar'].colors.text as Record<string, unknown>)}
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Palette size={20} />
                Status Colors
              </h2>
              <div style={adminStyles.tokenGrid}>
                {renderColorTokens(tokens['Full Uproar'].colors.status as Record<string, unknown>)}
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Type size={20} />
                Typography
              </h2>
              <div style={adminStyles.codeBlock}>
                <pre style={adminStyles.code}>
                  {JSON.stringify(tokens['Full Uproar'].typography, null, 2)}
                </pre>
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Box size={20} />
                Spacing & Layout
              </h2>
              <div style={adminStyles.codeBlock}>
                <pre style={adminStyles.code}>
                  {JSON.stringify(
                    {
                      spacing: tokens['Full Uproar'].spacing,
                      borderRadius: tokens['Full Uproar'].borderRadius,
                      layout: tokens['Full Uproar'].layout,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Sync Tab */}
        {activeTab === 'sync' && (
          <>
            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Download size={20} />
                Export Tokens
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                Download your design tokens in JSON format compatible with Figma Tokens Studio plugin.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={adminStyles.button} onClick={downloadTokensJson}>
                  <Download size={16} />
                  Download figma-tokens.json
                </button>
              </div>
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Upload size={20} />
                Sync to Figma
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                Push your design tokens directly to a Figma file using the Variables API.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Note: This feature requires a Figma Professional/Organization plan with Variables enabled.
              </p>
              <button
                style={adminStyles.secondaryButton}
                onClick={syncTokens}
                disabled={isLoading || connectionStatus !== 'connected'}
              >
                <Upload size={16} />
                {isLoading ? 'Converting...' : 'Preview Token Conversion'}
              </button>

              {syncResult !== null ? (
                <div style={{ marginTop: '1rem' }}>
                  <div style={adminStyles.codeBlock}>
                    <pre style={adminStyles.code}>
                      {JSON.stringify(syncResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>

            <div style={adminStyles.card}>
              <h2 style={adminStyles.cardTitle}>
                <Layers size={20} />
                How to Use with Figma
              </h2>
              <div style={{ color: '#9ca3af', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#FBDB65' }}>Option 1: Tokens Studio Plugin</strong>
                </p>
                <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                  <li>Install "Tokens Studio for Figma" plugin</li>
                  <li>Download the figma-tokens.json file above</li>
                  <li>In Figma, open the Tokens Studio plugin</li>
                  <li>Import your tokens from the JSON file</li>
                  <li>Apply tokens to your designs</li>
                </ol>

                <p style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#FBDB65' }}>Option 2: Figma Variables (Native)</strong>
                </p>
                <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                  <li>Open your Figma design file</li>
                  <li>Go to Local Variables panel</li>
                  <li>Create variable collections for Colors, Typography, Spacing</li>
                  <li>Manually add variables using the hex values from your tokens</li>
                </ol>

                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  The Tokens Studio plugin is recommended for easier token management and GitHub sync capabilities.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
