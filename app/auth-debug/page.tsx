'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowLeft, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DebugInfo {
  // Clerk Info
  clerkUserId: string | null;
  clerkEmail: string | null;
  clerkUsername: string | null;
  clerkEmailVerified: boolean;
  
  // Database Info
  dbUserExists: boolean;
  dbUser: {
    id: string;
    clerkId: string;
    email: string;
    username: string | null;
    role: string;
    emailVerified: boolean;
    isBanned: boolean;
    cultDevotion: number;
  } | null;
  
  // Permission Checks
  permissionChecks: {
    hasUser: boolean;
    hasAdmin: boolean;
    hasSuperAdmin: boolean;
    canAccessAdmin: boolean;
    canCreateGames: boolean;
    canSeedForum: boolean;
  };
  
  // Auth Function Tests
  authTests: {
    getCurrentUserWorks: boolean;
    checkPermissionWorks: boolean;
    requirePermissionWorks: boolean;
    error?: string;
  };
  
  // Database Stats
  totalUsers: number;
  totalAdmins: number;
  clerkIdMismatches: number;
}

export default function AuthDebugPage() {
  const { userId: clerkUserId, isLoaded: authLoaded } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchDebugInfo = async () => {
    if (!authLoaded || !userLoaded) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/debug-comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPermissions: true })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debug info');
      console.error('Debug fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoaded && userLoaded) {
      fetchDebugInfo();
    }
  }, [authLoaded, userLoaded]);

  const handleFixUserSync = async () => {
    try {
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert('User synced successfully!');
        fetchDebugInfo();
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to sync user');
    }
  };

  const handleGrantAdmin = async () => {
    try {
      const response = await fetch('/api/admin/grant-admin', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert('Admin access granted!');
        fetchDebugInfo();
      } else {
        alert(`Grant failed: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to grant admin');
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) => {
    return success ? 
      <Check size={16} style={{ color: '#10b981' }} /> : 
      <X size={16} style={{ color: '#ef4444' }} />;
  };

  if (!authLoaded || !userLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom right, #1a1a1a, #2d3748)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p style={{ color: '#f97316' }}>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #111827, #1f2937)', 
      color: '#e2e8f0',
      padding: '2rem' 
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <Link href="/" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: '#f97316', 
          marginBottom: '1.5rem',
          textDecoration: 'none'
        }}>
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#f97316', 
          marginBottom: '2rem' 
        }}>Authentication Debug</h1>

        {error && (
          <div style={{ 
            background: 'rgba(127, 29, 29, 0.5)', 
            border: '1px solid #ef4444', 
            borderRadius: '0.5rem', 
            padding: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} style={{ color: '#fca5a5' }} />
              <p style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '3rem' 
          }}>
            <RefreshCw size={24} style={{ 
              color: '#fb923c',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : debugInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Clerk Information */}
            <div style={{ 
              background: 'rgba(31, 41, 59, 0.5)', 
              border: '1px solid rgba(251, 146, 60, 0.3)', 
              borderRadius: '0.5rem', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                color: '#fb923c' 
              }}>Clerk Authentication</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Clerk User ID:</span>
                  <span style={{ fontFamily: 'monospace' }}>{debugInfo.clerkUserId || 'Not logged in'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Email:</span>
                  <span>{debugInfo.clerkEmail || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Username:</span>
                  <span>{debugInfo.clerkUsername || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Email Verified:</span>
                  <StatusIcon success={debugInfo.clerkEmailVerified} />
                </div>
              </div>
            </div>

            {/* Database User */}
            <div style={{ 
              background: 'rgba(31, 41, 59, 0.5)', 
              border: '1px solid rgba(251, 146, 60, 0.3)', 
              borderRadius: '0.5rem', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                color: '#fb923c' 
              }}>Database User</h2>
              {debugInfo.dbUserExists ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                    <span style={{ color: '#9ca3af' }}>Database ID:</span>
                    <span style={{ fontFamily: 'monospace' }}>{debugInfo.dbUser?.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                    <span style={{ color: '#9ca3af' }}>Clerk ID:</span>
                    <span style={{ fontFamily: 'monospace' }}>{debugInfo.dbUser?.clerkId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                    <span style={{ color: '#9ca3af' }}>IDs Match:</span>
                    <StatusIcon success={debugInfo.clerkUserId === debugInfo.dbUser?.clerkId} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                    <span style={{ color: '#9ca3af' }}>Role:</span>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: debugInfo.dbUser?.role === 'SUPER_ADMIN' ? '#c084fc' :
                             debugInfo.dbUser?.role === 'ADMIN' ? '#ef4444' :
                             '#60a5fa'
                    }}>{debugInfo.dbUser?.role}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                    <span style={{ color: '#9ca3af' }}>Cult Devotion:</span>
                    <span>{debugInfo.dbUser?.cultDevotion}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                    <span style={{ color: '#9ca3af' }}>Banned:</span>
                    <StatusIcon success={!debugInfo.dbUser?.isBanned} />
                  </div>
                </div>
              ) : (
                <div style={{ color: '#ef4444' }}>
                  <p>⚠️ User not found in database!</p>
                  <button
                    onClick={handleFixUserSync}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: '#f97316',
                      color: '#111827',
                      borderRadius: '0.25rem',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Sync User from Clerk
                  </button>
                </div>
              )}
            </div>

            {/* Permission Checks */}
            <div style={{ 
              background: 'rgba(31, 41, 59, 0.5)', 
              border: '1px solid rgba(251, 146, 60, 0.3)', 
              borderRadius: '0.5rem', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                color: '#fb923c' 
              }}>Permission Checks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Has User Record:</span>
                  <StatusIcon success={debugInfo.permissionChecks.hasUser} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Has Admin Role:</span>
                  <StatusIcon success={debugInfo.permissionChecks.hasAdmin} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Has Super Admin:</span>
                  <StatusIcon success={debugInfo.permissionChecks.hasSuperAdmin} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Can Access Admin Panel:</span>
                  <StatusIcon success={debugInfo.permissionChecks.canAccessAdmin} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Can Create Games:</span>
                  <StatusIcon success={debugInfo.permissionChecks.canCreateGames} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Can Seed Forum:</span>
                  <StatusIcon success={debugInfo.permissionChecks.canSeedForum} />
                </div>
              </div>
              
              {!debugInfo.permissionChecks.hasAdmin && (
                <button
                  onClick={handleGrantAdmin}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#f97316',
                    color: '#111827',
                    borderRadius: '0.25rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Grant Admin Access
                </button>
              )}
            </div>

            {/* Auth Function Tests */}
            <div style={{ 
              background: 'rgba(31, 41, 59, 0.5)', 
              border: '1px solid rgba(251, 146, 60, 0.3)', 
              borderRadius: '0.5rem', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                color: '#fb923c' 
              }}>Auth Function Tests</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>getCurrentUser() works:</span>
                  <StatusIcon success={debugInfo.authTests.getCurrentUserWorks} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>checkPermission() works:</span>
                  <StatusIcon success={debugInfo.authTests.checkPermissionWorks} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>requirePermission() works:</span>
                  <StatusIcon success={debugInfo.authTests.requirePermissionWorks} />
                </div>
                {debugInfo.authTests.error && (
                  <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.75rem' }}>
                    Error: {debugInfo.authTests.error}
                  </div>
                )}
              </div>
            </div>

            {/* Database Stats */}
            <div style={{ 
              background: 'rgba(31, 41, 59, 0.5)', 
              border: '1px solid rgba(251, 146, 60, 0.3)', 
              borderRadius: '0.5rem', 
              padding: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                color: '#fb923c' 
              }}>Database Stats</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Total Users:</span>
                  <span>{debugInfo.totalUsers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Total Admins:</span>
                  <span>{debugInfo.totalAdmins}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                  <span style={{ color: '#9ca3af' }}>Clerk ID Mismatches:</span>
                  <span style={{ color: debugInfo.clerkIdMismatches > 0 ? '#ef4444' : '#e2e8f0' }}>
                    {debugInfo.clerkIdMismatches}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={fetchDebugInfo}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#374151',
                  color: '#e5e7eb',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
              <Link
                href="/admin"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f97316',
                  color: '#111827',
                  borderRadius: '0.25rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Go to Admin Panel
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}