'use client';

import { useState, useEffect } from 'react';
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
      <Check size={16} className="text-green-500" /> : 
      <X size={16} className="text-red-500" />;
  };

  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <p className="text-orange-400">Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 mb-6 hover:text-orange-300">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-orange-400 mb-8">Authentication Debug</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw size={24} className="animate-spin text-orange-400" />
          </div>
        ) : debugInfo ? (
          <div className="space-y-6">
            {/* Clerk Information */}
            <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-400">Clerk Authentication</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Clerk User ID:</span>
                  <span className="font-mono">{debugInfo.clerkUserId || 'Not logged in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span>{debugInfo.clerkEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <span>{debugInfo.clerkUsername || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Email Verified:</span>
                  <StatusIcon success={debugInfo.clerkEmailVerified} />
                </div>
              </div>
            </div>

            {/* Database User */}
            <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-400">Database User</h2>
              {debugInfo.dbUserExists ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Database ID:</span>
                    <span className="font-mono">{debugInfo.dbUser?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Clerk ID:</span>
                    <span className="font-mono">{debugInfo.dbUser?.clerkId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">IDs Match:</span>
                    <StatusIcon success={debugInfo.clerkUserId === debugInfo.dbUser?.clerkId} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role:</span>
                    <span className={`font-bold ${
                      debugInfo.dbUser?.role === 'SUPER_ADMIN' ? 'text-purple-400' :
                      debugInfo.dbUser?.role === 'ADMIN' ? 'text-red-400' :
                      'text-blue-400'
                    }`}>{debugInfo.dbUser?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cult Devotion:</span>
                    <span>{debugInfo.dbUser?.cultDevotion}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Banned:</span>
                    <StatusIcon success={!debugInfo.dbUser?.isBanned} />
                  </div>
                </div>
              ) : (
                <div className="text-red-400">
                  <p>⚠️ User not found in database!</p>
                  <button
                    onClick={handleFixUserSync}
                    className="mt-4 px-4 py-2 bg-orange-500 text-gray-900 rounded hover:bg-orange-400 font-semibold"
                  >
                    Sync User from Clerk
                  </button>
                </div>
              )}
            </div>

            {/* Permission Checks */}
            <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-400">Permission Checks</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Has User Record:</span>
                  <StatusIcon success={debugInfo.permissionChecks.hasUser} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Has Admin Role:</span>
                  <StatusIcon success={debugInfo.permissionChecks.hasAdmin} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Has Super Admin:</span>
                  <StatusIcon success={debugInfo.permissionChecks.hasSuperAdmin} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Can Access Admin Panel:</span>
                  <StatusIcon success={debugInfo.permissionChecks.canAccessAdmin} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Can Create Games:</span>
                  <StatusIcon success={debugInfo.permissionChecks.canCreateGames} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Can Seed Forum:</span>
                  <StatusIcon success={debugInfo.permissionChecks.canSeedForum} />
                </div>
              </div>
              
              {!debugInfo.permissionChecks.hasAdmin && (
                <button
                  onClick={handleGrantAdmin}
                  className="mt-4 px-4 py-2 bg-orange-500 text-gray-900 rounded hover:bg-orange-400 font-semibold"
                >
                  Grant Admin Access
                </button>
              )}
            </div>

            {/* Auth Function Tests */}
            <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-400">Auth Function Tests</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">getCurrentUser() works:</span>
                  <StatusIcon success={debugInfo.authTests.getCurrentUserWorks} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">checkPermission() works:</span>
                  <StatusIcon success={debugInfo.authTests.checkPermissionWorks} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">requirePermission() works:</span>
                  <StatusIcon success={debugInfo.authTests.requirePermissionWorks} />
                </div>
                {debugInfo.authTests.error && (
                  <div className="mt-2 text-red-400 text-xs">
                    Error: {debugInfo.authTests.error}
                  </div>
                )}
              </div>
            </div>

            {/* Database Stats */}
            <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-400">Database Stats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Users:</span>
                  <span>{debugInfo.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Admins:</span>
                  <span>{debugInfo.totalAdmins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clerk ID Mismatches:</span>
                  <span className={debugInfo.clerkIdMismatches > 0 ? 'text-red-400' : ''}>
                    {debugInfo.clerkIdMismatches}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={fetchDebugInfo}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
              >
                Refresh
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 bg-orange-500 text-gray-900 rounded hover:bg-orange-400 font-semibold"
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