'use client';

import React, { useState, useEffect } from 'react';
import { adminStyles } from '../styles/adminStyles';
import { AlertTriangle, Shield, ShieldOff, Clock, Flag, CheckCircle, XCircle } from 'lucide-react';
import { User } from '@prisma/client';

interface UserModerationViewProps {
  onBack: () => void;
}

export default function UserModerationView({ onBack }: UserModerationViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'banned' | 'muted' | 'flagged'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      
      const response = await fetch(`/api/admin/users/moderation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: string, reason?: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMute = async (userId: string, hours: number) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error muting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnmute = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/unmute`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error unmuting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTrustLevel = async (userId: string, trustLevel: number) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/trust-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trustLevel })
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating trust level:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const trustLevelNames = ['New', 'Basic', 'Member', 'Regular', 'Leader'];
  const trustLevelColors = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ width: '100%' }}>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>User Moderation</h1>
        <button onClick={onBack} style={adminStyles.primaryButton}>
          Back to Admin
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {(['all', 'banned', 'muted', 'flagged'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              ...adminStyles.secondaryButton,
              ...(filter === tab ? { 
                background: '#f97316', 
                color: '#111827',
                borderColor: '#f97316' 
              } : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'flagged' && ' (5+)'}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <div style={adminStyles.tableContainer}>
          <table style={adminStyles.table}>
            <thead>
              <tr>
                <th style={adminStyles.tableHeader}>User</th>
                <th style={adminStyles.tableHeader}>Trust Level</th>
                <th style={adminStyles.tableHeader}>Status</th>
                <th style={adminStyles.tableHeader}>Flags</th>
                <th style={adminStyles.tableHeader}>Joined</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={adminStyles.tableRow}>
                  <td style={adminStyles.tableCell}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{user.displayName || user.username || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{user.email}</div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <select
                      value={user.trustLevel}
                      onChange={(e) => handleUpdateTrustLevel(user.id, parseInt(e.target.value))}
                      disabled={actionLoading === user.id}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #374151',
                        background: '#1f2937',
                        color: trustLevelColors[user.trustLevel],
                        fontWeight: 'bold'
                      }}
                    >
                      {trustLevelNames.map((name, level) => (
                        <option key={level} value={level}>{level} - {name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {user.isBanned && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          background: '#dc2626',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <ShieldOff size={12} /> Banned
                        </span>
                      )}
                      {user.isMuted && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          background: '#f59e0b',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Clock size={12} /> Muted
                        </span>
                      )}
                      {user.emailVerified ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          background: '#10b981',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          background: '#6b7280',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <XCircle size={12} /> Unverified
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    {user.flagCount > 0 && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: user.flagCount >= 5 ? '#ef4444' : '#f59e0b'
                      }}>
                        <Flag size={16} /> {user.flagCount}
                      </span>
                    )}
                  </td>
                  <td style={adminStyles.tableCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {user.isBanned ? (
                        <button
                          onClick={() => handleUnban(user.id)}
                          disabled={actionLoading === user.id}
                          style={{
                            ...adminStyles.iconButton,
                            background: '#10b981'
                          }}
                          title="Unban user"
                        >
                          <Shield size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt('Ban reason (optional):');
                            if (reason !== null) handleBan(user.id, reason);
                          }}
                          disabled={actionLoading === user.id}
                          style={{
                            ...adminStyles.iconButton,
                            background: '#dc2626'
                          }}
                          title="Ban user"
                        >
                          <ShieldOff size={16} />
                        </button>
                      )}
                      
                      {user.isMuted ? (
                        <button
                          onClick={() => handleUnmute(user.id)}
                          disabled={actionLoading === user.id}
                          style={{
                            ...adminStyles.iconButton,
                            background: '#10b981'
                          }}
                          title="Unmute user"
                        >
                          <Clock size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const hours = prompt('Mute duration (hours):', '24');
                            if (hours) handleMute(user.id, parseInt(hours));
                          }}
                          disabled={actionLoading === user.id}
                          style={{
                            ...adminStyles.iconButton,
                            background: '#f59e0b'
                          }}
                          title="Mute user"
                        >
                          <Clock size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(31, 41, 59, 0.5)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Trust Levels:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>0 - New: Just joined, restricted posting</li>
          <li>1 - Basic: Email verified, can post normally</li>
          <li>2 - Member: Active for 7+ days, 10+ posts</li>
          <li>3 - Regular: Active for 30+ days, 25+ posts</li>
          <li>4 - Leader: Active for 60+ days, 50+ posts, community leader</li>
        </ul>
      </div>
    </div>
  );
}