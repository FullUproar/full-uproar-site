'use client';

import { useState, useEffect } from 'react';
import { Database, Heart, AlertCircle, CheckCircle, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: string;
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: string;
      responseTime?: number;
      error?: string;
    };
    printify?: {
      status: string;
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

interface DebugData {
  environment: any;
  database: any;
  tables: any;
  features: any;
}

export default function DiagnosticsView() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch health data
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setHealthData(health);
      }

      // Fetch debug data
      const debugResponse = await fetch('/api/debug');
      if (debugResponse.ok) {
        const debug = await debugResponse.json();
        setDebugData(debug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const copyDiagnosticData = async () => {
    const diagnosticData = {
      health: healthData,
      debug: debugData,
      timestamp: new Date().toISOString()
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'down':
      case 'unhealthy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return <CheckCircle size={20} />;
      case 'down':
      case 'unhealthy':
        return <AlertCircle size={20} />;
      default:
        return <Loader2 size={20} className="animate-spin" />;
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={adminStyles.title}>System Diagnostics</h2>
        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          style={{
            ...adminStyles.button,
            background: loading ? '#6b7280' : '#f97316',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          ...adminStyles.card,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #ef4444',
          color: '#ef4444',
          marginBottom: '2rem'
        }}>
          Error: {error}
        </div>
      )}

      {loading && !healthData && !debugData ? (
        <div style={adminStyles.card}>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: '#f97316', margin: '0 auto' }} />
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Loading diagnostics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Health Status */}
          {healthData && (
            <div style={adminStyles.card}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fdba74', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={24} />
                Health Status
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{...adminStyles.card, padding: '1rem'}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: getStatusColor(healthData?.status || 'unknown') }}>
                      {getStatusIcon(healthData?.status || 'unknown')}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>Overall Status</span>
                  </div>
                  <p style={{ color: getStatusColor(healthData?.status || 'unknown'), fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {(healthData?.status || 'unknown').toUpperCase()}
                  </p>
                </div>

                <div style={{...adminStyles.card, padding: '1rem'}}>
                  <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Environment</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{healthData?.environment || 'N/A'}</p>
                </div>

                <div style={{...adminStyles.card, padding: '1rem'}}>
                  <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Uptime</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatUptime(healthData?.system?.uptime || 0)}</p>
                </div>

                <div style={{...adminStyles.card, padding: '1rem'}}>
                  <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Memory Usage</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {healthData?.system?.memory?.percentage || 0}%
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {healthData?.system?.memory?.used || 0}MB / {healthData?.system?.memory?.total || 0}MB
                  </p>
                </div>
              </div>

              <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fdba74' }}>
                Services
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {Object.entries(healthData?.services || {}).map(([service, data]) => {
                  if (!data) return null;
                  return (
                    <div
                      key={service}
                      style={{
                        ...adminStyles.tableRow,
                        border: `1px solid ${data.status === 'up' ? '#10b981' : '#ef4444'}`,
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {service}
                        </span>
                        <span style={{ color: getStatusColor(data.status) }}>
                          {getStatusIcon(data.status)}
                        </span>
                      </div>
                      {data.responseTime !== undefined && (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          Response time: {data.responseTime}ms
                        </p>
                      )}
                      {data.error && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          Error: {data.error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Database Information */}
          {debugData && (
            <div style={{ ...adminStyles.card, marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fdba74', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Database size={24} />
                  Database Information
                </h3>
                <button
                  onClick={copyDiagnosticData}
                  style={{
                    ...adminStyles.button,
                    background: copied ? '#10b981' : '#6b7280',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Data
                    </>
                  )}
                </button>
              </div>

              {debugData?.database?.status === 'error' ? (
                <div style={{
                  ...adminStyles.tableRow,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '1rem'
                }}>
                  Database Error: {debugData?.database?.error || 'Unknown error'}
                </div>
              ) : (
                <>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fdba74' }}>
                    Table Counts
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                    {Object.entries(debugData?.tables || {}).map(([table, count]) => (
                      <div
                        key={table}
                        style={{
                          ...adminStyles.tableRow,
                          padding: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>{table}</span>
                        <span style={{ color: '#fdba74', fontWeight: 'bold' }}>{String(count)}</span>
                      </div>
                    ))}
                  </div>

                  <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fdba74' }}>
                    Feature Flags
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    {Object.entries(debugData?.features?.flags || {}).map(([feature, enabled]) => (
                      <div
                        key={feature}
                        style={{
                          ...adminStyles.tableRow,
                          padding: '0.75rem',
                          border: `1px solid ${enabled ? '#10b981' : '#6b7280'}`,
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>{feature}</span>
                        <span style={{ color: enabled ? '#10b981' : '#6b7280', fontWeight: 'bold' }}>
                          {enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}