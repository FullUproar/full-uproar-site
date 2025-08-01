'use client';

import { useState, useEffect } from 'react';
import { Database, Heart, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import Navigation from '../components/Navigation';

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

export default function DiagnosticsPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937)' }}>
      <Navigation />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f97316' }}>
            System Diagnostics
          </h1>
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            style={{
              background: '#f97316',
              color: '#111827',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.5 : 1
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#ef4444'
          }}>
            Error: {error}
          </div>
        )}

        {loading && !healthData && !debugData ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: '#f97316', margin: '0 auto' }} />
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Loading diagnostics...</p>
          </div>
        ) : (
          <>
            {/* Health Status */}
            {healthData && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.95)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid rgba(249, 115, 22, 0.3)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fdba74' }}>
                  <Heart size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Health Status
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: getStatusColor(healthData.status) }}>
                        {getStatusIcon(healthData.status)}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>Overall Status</span>
                    </div>
                    <p style={{ color: getStatusColor(healthData.status), fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {healthData.status.toUpperCase()}
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}>
                    <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Environment</p>
                    <p style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{healthData.environment}</p>
                  </div>

                  <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}>
                    <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Uptime</p>
                    <p style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{formatUptime(healthData.system.uptime)}</p>
                  </div>

                  <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}>
                    <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Memory Usage</p>
                    <p style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                      {healthData.system.memory.used}MB / {healthData.system.memory.total}MB ({healthData.system.memory.percentage}%)
                    </p>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '1rem', color: '#fdba74' }}>
                  Services
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {Object.entries(healthData.services).map(([service, data]) => {
                    if (!data) return null;
                    return (
                      <div
                        key={service}
                        style={{
                          background: 'rgba(17, 24, 39, 0.8)',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: `1px solid ${data.status === 'up' ? '#10b981' : '#ef4444'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', color: '#e2e8f0', textTransform: 'capitalize' }}>
                            {service}
                          </span>
                          <span style={{ color: getStatusColor(data.status) }}>
                            {getStatusIcon(data.status)}
                          </span>
                        </div>
                        {data.responseTime && (
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

            {/* Debug Information */}
            {debugData && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.95)',
                borderRadius: '12px',
                padding: '2rem',
                border: '2px solid rgba(249, 115, 22, 0.3)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fdba74' }}>
                  <Database size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Database Information
                </h2>

                {debugData.database.status === 'error' ? (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '1rem',
                    color: '#ef4444'
                  }}>
                    Database Error: {debugData.database.error}
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fdba74' }}>
                      Table Counts
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {Object.entries(debugData.tables || {}).map(([table, count]) => (
                        <div
                          key={table}
                          style={{
                            background: 'rgba(17, 24, 39, 0.8)',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span style={{ color: '#94a3b8' }}>{table}</span>
                          <span style={{ color: '#fdba74', fontWeight: 'bold' }}>{count}</span>
                        </div>
                      ))}
                    </div>

                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '1rem', color: '#fdba74' }}>
                      Feature Flags
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                      {Object.entries(debugData.features?.flags || {}).map(([feature, enabled]) => (
                        <div
                          key={feature}
                          style={{
                            background: 'rgba(17, 24, 39, 0.8)',
                            padding: '0.75rem',
                            borderRadius: '6px',
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
    </div>
  );
}