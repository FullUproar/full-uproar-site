'use client';

import { useState, useEffect } from 'react';
import { adminStyles } from '../styles/adminStyles';
import { useToast } from '@/lib/toastStore';

interface WebhookInfo {
  webhookConfig: {
    hasSecret: boolean;
    secretLength: number;
    secretPrefix: string;
  };
  database: {
    totalUsers: number;
    recentUsers: Array<{
      email: string;
      clerkId: string;
      createdAt: string;
      role: string;
    }>;
  };
  endpoints: Record<string, string>;
}

export default function WebhookTestPage() {
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clerkId, setClerkId] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWebhookInfo();
  }, []);

  const fetchWebhookInfo = async () => {
    try {
      const response = await fetch('/api/test-webhook');
      if (response.ok) {
        const data = await response.json();
        setWebhookInfo(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch webhook info',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching webhook info:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch webhook info',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!clerkId || !email) {
      toast({
        title: 'Error',
        description: 'Please enter both Clerk ID and email',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkId, email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'User created successfully',
        });
        setClerkId('');
        setEmail('');
        fetchWebhookInfo(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const testSyncMe = async () => {
    try {
      const response = await fetch('/api/sync-me');
      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Synced: ${data.user.email} (${data.user.role})`,
        });
        fetchWebhookInfo();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to sync',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync current user',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div style={adminStyles.container}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '20px', color: '#fdba74' }}>Loading webhook info...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Webhook Test & Debug</h1>
      </div>

      {/* Webhook Configuration Status */}
      <div style={adminStyles.card}>
        <h2 style={adminStyles.cardTitle}>Webhook Configuration</h2>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ marginBottom: '10px' }}>
            <strong>Secret Configured:</strong>{' '}
            <span style={{
              color: webhookInfo?.webhookConfig.hasSecret ? '#10b981' : '#ef4444'
            }}>
              {webhookInfo?.webhookConfig.hasSecret ? 'Yes' : 'No'}
            </span>
          </p>
          {webhookInfo?.webhookConfig.hasSecret && (
            <>
              <p style={{ marginBottom: '10px' }}>
                <strong>Secret Length:</strong> {webhookInfo.webhookConfig.secretLength} characters
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>Secret Preview:</strong> {webhookInfo.webhookConfig.secretPrefix}
              </p>
            </>
          )}
        </div>

        <h3 style={{ ...adminStyles.cardTitle, fontSize: '18px', marginTop: '20px' }}>
          Webhook Endpoints
        </h3>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {webhookInfo?.endpoints && Object.entries(webhookInfo.endpoints).map(([name, path]) => (
            <div key={name} style={{ marginBottom: '8px' }}>
              <strong>{name}:</strong> {path}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
          <p style={{ marginBottom: '10px', color: '#fdba74' }}>
            <strong>Instructions:</strong>
          </p>
          <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
            <li>Go to Clerk Dashboard → Webhooks</li>
            <li>Make sure webhook URL is: <code>https://fulluproar.com/api/webhooks/clerk</code></li>
            <li>Ensure these events are subscribed: user.created, user.updated, user.deleted</li>
            <li>Copy the Signing Secret and add to Vercel env as CLERK_WEBHOOK_SECRET</li>
          </ol>
        </div>
      </div>

      {/* Database Status */}
      <div style={adminStyles.card}>
        <h2 style={adminStyles.cardTitle}>Database Users</h2>
        <p style={{ marginBottom: '20px' }}>
          <strong>Total Users:</strong> {webhookInfo?.database.totalUsers || 0}
        </p>

        <h3 style={{ ...adminStyles.cardTitle, fontSize: '18px' }}>Recent Users</h3>
        <div style={adminStyles.tableContainer}>
          <table style={adminStyles.table}>
            <thead>
              <tr>
                <th style={adminStyles.tableHeader}>Email</th>
                <th style={adminStyles.tableHeader}>Role</th>
                <th style={adminStyles.tableHeader}>Clerk ID</th>
                <th style={adminStyles.tableHeader}>Created</th>
              </tr>
            </thead>
            <tbody>
              {webhookInfo?.database.recentUsers.map((user, index) => (
                <tr key={index} style={adminStyles.tableRow}>
                  <td style={adminStyles.tableCell}>{user.email}</td>
                  <td style={adminStyles.tableCell}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: user.role === 'GOD' ? '#8b5cf6' :
                                     user.role === 'ADMIN' ? '#f97316' : '#4b5563',
                      color: '#fff'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <code style={{ fontSize: '12px' }}>{user.clerkId}</code>
                  </td>
                  <td style={adminStyles.tableCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual User Creation */}
      <div style={adminStyles.card}>
        <h2 style={adminStyles.cardTitle}>Manual User Creation</h2>
        <p style={{ marginBottom: '20px', color: '#9ca3af' }}>
          Create a user manually if webhook failed
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Clerk User ID"
            value={clerkId}
            onChange={(e) => setClerkId(e.target.value)}
            style={adminStyles.input}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={adminStyles.input}
          />
          <button
            onClick={createUser}
            disabled={creating}
            style={{
              ...adminStyles.button,
              backgroundColor: '#f97316',
              opacity: creating ? 0.5 : 1,
            }}
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid #374151', paddingTop: '20px', marginTop: '20px' }}>
          <h3 style={{ ...adminStyles.cardTitle, fontSize: '18px' }}>Quick Actions</h3>
          <button
            onClick={testSyncMe}
            style={{
              ...adminStyles.button,
              backgroundColor: '#10b981',
              marginRight: '10px'
            }}
          >
            Sync Current User
          </button>
          <button
            onClick={() => window.open('/api/sync-me', '_blank')}
            style={{
              ...adminStyles.button,
              backgroundColor: '#6366f1',
            }}
          >
            View Sync Status
          </button>
        </div>
      </div>
    </div>
  );
}