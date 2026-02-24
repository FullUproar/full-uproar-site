'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Edit3, Check, X, ArrowLeft, Shield } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { adminStyles } from '../../styles/adminStyles';
import Link from 'next/link';

interface Credential {
  id: string;
  nickname: string | null;
  createdAt: string;
  deviceType: string | null;
}

export default function SecurityKeysPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/webauthn/credentials');
      if (!res.ok) throw new Error('Failed to load credentials');
      const data = await res.json();
      setCredentials(data.credentials);
    } catch (err) {
      setError('Failed to load security keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleRegister = async () => {
    setRegistering(true);
    setError('');
    setSuccess('');

    try {
      // Get registration options
      const optionsRes = await fetch('/api/admin/webauthn/register');
      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.detail || data.error || data.message || 'Failed to get registration options');
      }
      const options = await optionsRes.json();

      // Trigger browser registration (user inserts + taps key)
      const regResponse = await startRegistration(options);

      // Verify with server
      const verifyRes = await fetch('/api/admin/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: regResponse,
          nickname: nickname || null,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.detail || data.error || data.message || 'Registration failed');
      }

      setSuccess('Security key registered successfully!');
      setNickname('');
      setShowNicknameInput(false);
      await fetchCredentials();
    } catch (err: any) {
      const message = err?.message || 'Registration failed';
      if (message.includes('cancelled') || message.includes('canceled') || message.includes('abort') || message.includes('NotAllowedError')) {
        // User cancelled — don't show error
      } else {
        setError(message);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/webauthn/credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to delete');
      }

      setSuccess('Security key removed');
      setDeleteConfirm(null);
      await fetchCredentials();
    } catch (err: any) {
      setError(err.message || 'Failed to delete security key');
    }
  };

  const handleRename = async (id: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin/webauthn/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: id, nickname: editNickname }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to rename');
      }

      setEditingId(null);
      await fetchCredentials();
    } catch (err: any) {
      setError(err.message || 'Failed to rename security key');
    }
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        {/* Header */}
        <div style={{ ...adminStyles.header, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/admin"
            style={{
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={adminStyles.title}>Security Keys</h1>
            <p style={adminStyles.subtitle}>Manage your YubiKey and other FIDO2 security keys for admin access</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#ef4444',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#22c55e',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {success}
          </div>
        )}

        {/* Register New Key Section */}
        <div style={{ ...adminStyles.section, marginBottom: '24px' }}>
          <h2 style={adminStyles.sectionTitle}>Register a New Security Key</h2>

          {showNicknameInput ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                  Key Nickname (optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 50))}
                  placeholder='e.g., "Home YubiKey" or "Work YubiKey"'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={registering}
                style={{
                  ...adminStyles.primaryButton,
                  background: registering ? '#6b7280' : '#FF8200',
                  cursor: registering ? 'not-allowed' : 'pointer',
                }}
              >
                <Key size={16} />
                {registering ? 'Tap your key...' : 'Register Key'}
              </button>
              <button
                onClick={() => { setShowNicknameInput(false); setNickname(''); }}
                style={adminStyles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNicknameInput(true)}
              style={{ ...adminStyles.primaryButton, background: '#FF8200' }}
            >
              <Plus size={16} />
              Add Security Key
            </button>
          )}
        </div>

        {/* Registered Keys */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Registered Keys</h2>

          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</p>
          ) : credentials.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#64748b',
            }}>
              <Shield size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No security keys registered yet.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Add a YubiKey or other FIDO2 security key to use it for admin elevation.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #222',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <Key size={20} style={{ color: '#FF8200', flexShrink: 0 }} />
                    <div>
                      {editingId === cred.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value.slice(0, 50))}
                            style={{
                              padding: '4px 8px',
                              background: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              color: '#e2e8f0',
                              fontSize: '14px',
                              outline: 'none',
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(cred.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleRename(cred.id)}
                            style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '4px' }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>
                          {cred.nickname || 'Security Key'}
                        </span>
                      )}
                      <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                        Added {new Date(cred.createdAt).toLocaleDateString()}
                        {cred.deviceType && ` \u00B7 ${cred.deviceType}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {editingId !== cred.id && (
                      <button
                        onClick={() => {
                          setEditingId(cred.id);
                          setEditNickname(cred.nickname || '');
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Rename"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    {deleteConfirm === cred.id ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ color: '#ef4444', fontSize: '12px' }}>Delete?</span>
                        <button
                          onClick={() => handleDelete(cred.id)}
                          style={{
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '12px',
                          }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            background: 'none',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '12px',
                          }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(cred.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{
          ...adminStyles.section,
          background: 'rgba(255, 130, 0, 0.05)',
          border: '1px solid rgba(255, 130, 0, 0.2)',
        }}>
          <h3 style={{ ...adminStyles.sectionTitle, color: '#FF8200', fontSize: '14px' }}>
            About Security Keys
          </h3>
          <ul style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', paddingLeft: '16px', margin: 0 }}>
            <li>Security keys (like YubiKey) provide the strongest form of two-factor authentication.</li>
            <li>You can register multiple keys — one for each computer you use.</li>
            <li>When logging into admin, just tap your key instead of entering a 6-digit code.</li>
            <li>Your authenticator app still works as a backup if you don&apos;t have your key handy.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
