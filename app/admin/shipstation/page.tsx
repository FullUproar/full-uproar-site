'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Truck, CheckCircle, XCircle, RefreshCw,
  AlertCircle, Webhook, Package, Settings
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface ShipStationStatus {
  configured: boolean;
  webhookUrl?: string;
  webhookRegistered?: boolean;
  existingWebhooks?: any[];
  availableCarriers?: any[];
  setupInstructions?: string[];
  message?: string;
  envVarsNeeded?: string[];
}

export default function ShipStationSetupPage() {
  const [status, setStatus] = useState<ShipStationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/shipstation/setup');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ShipStation status');
    } finally {
      setLoading(false);
    }
  };

  const registerWebhook = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/admin/shipstation/setup', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccessMessage(data.message || 'Webhook registered!');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to register webhook');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteWebhook = async () => {
    if (!confirm('Are you sure you want to delete the webhook?')) return;

    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/admin/shipstation/setup', {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccessMessage(data.message || 'Webhook deleted!');
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to delete webhook');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#fdba74',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={16} />
          Back to Admin
        </Link>
        <h1 style={{ ...adminStyles.title, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={32} />
          ShipStation Setup
        </h1>
        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
          Configure ShipStation integration for shipping and fulfillment
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} style={{ color: '#ef4444' }} />
          <span style={{ color: '#fca5a5' }}>{error}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <span style={{ color: '#6ee7b7' }}>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#9ca3af', marginTop: '1rem' }}>Checking ShipStation status...</p>
        </div>
      ) : status ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Configuration Status Card */}
          <div style={adminStyles.section}>
            <h2 style={{ ...adminStyles.sectionTitle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} />
              Configuration Status
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {/* API Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: status.configured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {status.configured ? (
                    <CheckCircle size={24} style={{ color: '#10b981' }} />
                  ) : (
                    <XCircle size={24} style={{ color: '#ef4444' }} />
                  )}
                  <div>
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>API Credentials</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      {status.configured ? 'Connected to ShipStation' : 'Not configured'}
                    </p>
                  </div>
                </div>
              </div>

              {!status.configured && status.envVarsNeeded && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(249, 115, 22, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                }}>
                  <p style={{ color: '#fdba74', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Required Environment Variables:
                  </p>
                  <code style={{
                    display: 'block',
                    padding: '0.75rem',
                    background: '#1f2937',
                    borderRadius: '0.25rem',
                    color: '#fde68a',
                    fontSize: '0.875rem',
                  }}>
                    {status.envVarsNeeded.join('\n')}
                  </code>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                    Get your API credentials from{' '}
                    <a
                      href="https://ss.shipstation.com/#/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#f97316' }}
                    >
                      ShipStation Settings → API
                    </a>
                  </p>
                </div>
              )}

              {/* Webhook Status */}
              {status.configured && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: status.webhookRegistered ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                  borderRadius: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Webhook size={24} style={{ color: status.webhookRegistered ? '#10b981' : '#f97316' }} />
                    <div>
                      <p style={{ color: '#fff', fontWeight: 'bold' }}>Shipping Webhook</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        {status.webhookRegistered
                          ? 'Registered - will receive shipping notifications'
                          : 'Not registered - click below to set up'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={status.webhookRegistered ? deleteWebhook : registerWebhook}
                    disabled={actionLoading}
                    style={{
                      ...adminStyles.button,
                      background: status.webhookRegistered ? '#ef4444' : '#f97316',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? 'Working...' : status.webhookRegistered ? 'Remove' : 'Register'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Webhook URL Card */}
          {status.configured && status.webhookUrl && (
            <div style={adminStyles.section}>
              <h2 style={{ ...adminStyles.sectionTitle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Webhook size={20} />
                Webhook URL
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
                This is the URL that ShipStation will call when orders are shipped:
              </p>
              <code style={{
                display: 'block',
                padding: '1rem',
                background: '#1f2937',
                borderRadius: '0.5rem',
                color: '#10b981',
                wordBreak: 'break-all',
              }}>
                {status.webhookUrl}
              </code>
            </div>
          )}

          {/* Available Carriers */}
          {status.availableCarriers && status.availableCarriers.length > 0 && (
            <div style={adminStyles.section}>
              <h2 style={{ ...adminStyles.sectionTitle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} />
                Connected Carriers ({status.availableCarriers.length})
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}>
                {status.availableCarriers.map((carrier: any) => (
                  <div
                    key={carrier.code}
                    style={{
                      padding: '1rem',
                      background: '#1f2937',
                      borderRadius: '0.5rem',
                      border: carrier.primary ? '2px solid #f97316' : '1px solid #374151',
                    }}
                  >
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>{carrier.name}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Code: {carrier.code}</p>
                    {carrier.primary && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(249, 115, 22, 0.2)',
                        color: '#f97316',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                      }}>
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {status.setupInstructions && status.setupInstructions.length > 0 && (
            <div style={adminStyles.section}>
              <h2 style={adminStyles.sectionTitle}>Setup Instructions</h2>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {status.setupInstructions.map((instruction, i) => (
                  <li key={i} style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Links */}
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>Quick Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
              <Link
                href="/admin/fulfillment"
                style={{
                  ...adminStyles.button,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Package size={16} />
                Fulfillment Center
              </Link>
              <a
                href="https://ss.shipstation.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...adminStyles.button,
                  background: '#374151',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Truck size={16} />
                Open ShipStation
              </a>
              <button
                onClick={fetchStatus}
                disabled={loading}
                style={{
                  ...adminStyles.button,
                  background: '#374151',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw size={16} />
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
