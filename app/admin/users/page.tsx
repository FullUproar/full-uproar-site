'use client';

import { useState, useEffect } from 'react';
import { adminStyles } from '../styles/adminStyles';
import { useToast } from '@/lib/toastStore';
import { UserRole } from '@prisma/client';
import { Shield, X, Copy, Check } from 'lucide-react';
import { ADMIN_ROLES } from '@/lib/constants';

interface User {
  id: string;
  clerkId: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  emailVerified?: boolean;
  totpEnabled?: boolean;
  cultDevotion: number;
  cultLevel: number;
  achievementPoints: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    users: 0,
    verified: 0
  });
  const { toast } = useToast();

  // 2FA provisioning state
  const [twoFAModalOpen, setTwoFAModalOpen] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAData, setTwoFAData] = useState<{
    qrCode: string;
    secret: string;
    userEmail: string;
    userName: string;
  } | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();

        // Handle both array and object response formats
        if (Array.isArray(data)) {
          // Old format: just array of users
          setUsers(data);
          setStats({
            total: data.length,
            admins: data.filter((u: User) => (ADMIN_ROLES as readonly string[]).includes(u.role)).length,
            users: data.filter((u: User) => u.role === 'USER').length,
            verified: data.filter((u: User) => u.emailVerified).length,
          });
        } else if (data.users && Array.isArray(data.users)) {
          // New format: object with users and stats
          setUsers(data.users);
          setStats(data.stats || {
            total: data.users.length,
            admins: data.users.filter((u: User) => (ADMIN_ROLES as readonly string[]).includes(u.role)).length,
            users: data.users.filter((u: User) => u.role === 'USER').length,
            verified: data.users.filter((u: User) => u.emailVerified).length,
          });
        } else {
          console.error('Unexpected data format:', data);
          setUsers([]);
          setStats({ total: 0, admins: 0, users: 0, verified: 0 });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User role updated successfully',
        });
        fetchUsers();
        setEditModalOpen(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        fetchUsers();
        setEditModalOpen(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // Provision 2FA for a user
  const provision2FA = async (userId: string) => {
    setTwoFALoading(true);
    try {
      const response = await fetch('/api/admin/2fa/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setTwoFAData({
          qrCode: data.qrCode,
          secret: data.secret,
          userEmail: data.userEmail,
          userName: data.userName,
        });
        setTwoFAModalOpen(true);
        setEditModalOpen(false);
        toast({
          title: 'Success',
          description: '2FA provisioned. Share the QR code securely.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to provision 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error provisioning 2FA:', error);
      toast({
        title: 'Error',
        description: 'Failed to provision 2FA',
        variant: 'destructive',
      });
    } finally {
      setTwoFALoading(false);
    }
  };

  const copySecret = async () => {
    if (twoFAData?.secret) {
      await navigator.clipboard.writeText(twoFAData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  // Filter users based on search and role
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  }) : [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'GOD':
        return '#7D55C7';
      case 'SUPER_ADMIN':
        return '#ec4899';
      case 'ADMIN':
        return '#FF8200';
      case 'MODERATOR':
        return '#3b82f6';
      default:
        return '#6b7280';
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
            border: '3px solid rgba(255, 130, 0, 0.2)',
            borderTopColor: '#FF8200',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '20px', color: '#FBDB65' }}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>User Management</h1>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ ...adminStyles.card, textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FBDB65' }}>{stats.total}</h3>
          <p style={{ color: '#9ca3af', marginTop: '5px' }}>Total Users</p>
        </div>
        <div style={{ ...adminStyles.card, textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF8200' }}>{stats.admins}</h3>
          <p style={{ color: '#9ca3af', marginTop: '5px' }}>Admins</p>
        </div>
        <div style={{ ...adminStyles.card, textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>{stats.users}</h3>
          <p style={{ color: '#9ca3af', marginTop: '5px' }}>Regular Users</p>
        </div>
        <div style={{ ...adminStyles.card, textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.verified}</h3>
          <p style={{ color: '#9ca3af', marginTop: '5px' }}>Verified</p>
        </div>
      </div>

      {/* Filters */}
      <div style={adminStyles.card}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by email, username, or display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...adminStyles.input, flex: '1', minWidth: '250px' }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ ...adminStyles.input, width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">All Roles</option>
            <option value="GOD">GOD</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="USER">User</option>
          </select>
          <button
            onClick={fetchUsers}
            style={{
              ...adminStyles.button,
              backgroundColor: '#10b981',
              padding: '12px 24px'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={adminStyles.card}>
        <h2 style={adminStyles.sectionTitle}>Users ({filteredUsers.length})</h2>
        <div style={adminStyles.tableContainer}>
          <table style={adminStyles.table}>
            <thead>
              <tr>
                <th style={adminStyles.tableHeader}>User</th>
                <th style={adminStyles.tableHeader}>Email</th>
                <th style={adminStyles.tableHeader}>Role</th>
                <th style={adminStyles.tableHeader}>Stats</th>
                <th style={adminStyles.tableHeader}>Joined</th>
                <th style={adminStyles.tableHeader}>Last Login</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={adminStyles.tableRow}>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {user.avatarUrl && (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName || user.username || user.email}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '2px solid rgba(255, 130, 0, 0.3)'
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#FBDB65' }}>
                          {user.displayName || user.username || 'No name'}
                        </div>
                        {user.username && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            @{user.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div>
                      {user.email}
                      {user.emailVerified && (
                        <span style={{
                          marginLeft: '5px',
                          color: '#10b981',
                          fontSize: '12px'
                        }}>✓</span>
                      )}
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getRoleColor(user.role),
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ fontSize: '12px' }}>
                      <div>Devotion: {user.cultDevotion}</div>
                      <div>Level: {user.cultLevel}</div>
                      <div>Points: {user.achievementPoints}</div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={adminStyles.tableCell}>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td style={adminStyles.tableCell}>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setEditModalOpen(true);
                      }}
                      style={{
                        ...adminStyles.button,
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: '#6366f1'
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            ...adminStyles.card,
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedUser(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            <h2 style={adminStyles.sectionTitle}>Edit User</h2>

            <div style={{ marginTop: '20px' }}>
              {selectedUser.avatarUrl && (
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.displayName || selectedUser.email}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    display: 'block',
                    border: '3px solid rgba(255, 130, 0, 0.3)'
                  }}
                />
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={adminStyles.label}>Email</label>
                <input
                  type="text"
                  value={selectedUser.email}
                  disabled
                  style={{ ...adminStyles.input, opacity: 0.7 }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={adminStyles.label}>Display Name</label>
                <input
                  type="text"
                  value={selectedUser.displayName || ''}
                  disabled
                  style={{ ...adminStyles.input, opacity: 0.7 }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={adminStyles.label}>Username</label>
                <input
                  type="text"
                  value={selectedUser.username || ''}
                  disabled
                  style={{ ...adminStyles.input, opacity: 0.7 }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={adminStyles.label}>Clerk ID</label>
                <input
                  type="text"
                  value={selectedUser.clerkId}
                  disabled
                  style={{ ...adminStyles.input, opacity: 0.7, fontSize: '12px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={adminStyles.label}>Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })}
                  style={adminStyles.input}
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  {selectedUser.role === 'GOD' && <option value="GOD">GOD</option>}
                </select>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>
                  Changing role will affect user permissions immediately
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={adminStyles.label}>Cult Devotion</label>
                  <input
                    type="number"
                    value={selectedUser.cultDevotion}
                    disabled
                    style={{ ...adminStyles.input, opacity: 0.7 }}
                  />
                </div>
                <div>
                  <label style={adminStyles.label}>Cult Level</label>
                  <input
                    type="number"
                    value={selectedUser.cultLevel}
                    disabled
                    style={{ ...adminStyles.input, opacity: 0.7 }}
                  />
                </div>
                <div>
                  <label style={adminStyles.label}>Achievement Points</label>
                  <input
                    type="number"
                    value={selectedUser.achievementPoints}
                    disabled
                    style={{ ...adminStyles.input, opacity: 0.7 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  <strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  <strong>Updated:</strong> {new Date(selectedUser.updatedAt).toLocaleString()}
                </p>
                {selectedUser.lastLogin && (
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <strong>Last Login:</strong> {new Date(selectedUser.lastLogin).toLocaleString()}
                  </p>
                )}
              </div>

              {/* 2FA Provisioning for admin users with @fulluproar.com */}
              {(ADMIN_ROLES as readonly string[]).includes(selectedUser.role) &&
               selectedUser.email.endsWith('@fulluproar.com') &&
               !selectedUser.totpEnabled && (
                <div style={{
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid #7D55C7',
                  borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Shield size={20} style={{ color: '#7D55C7' }} />
                    <span style={{ color: '#c4b5fd', fontWeight: 'bold' }}>2FA Not Configured</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>
                    This admin needs 2FA to access the admin panel. Generate a setup QR code to share with them securely.
                  </p>
                  <button
                    onClick={() => provision2FA(selectedUser.id)}
                    disabled={twoFALoading}
                    style={{
                      ...adminStyles.button,
                      backgroundColor: '#7D55C7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Shield size={16} />
                    {twoFALoading ? 'Generating...' : 'Generate 2FA Setup'}
                  </button>
                </div>
              )}

              {selectedUser.totpEnabled && (
                <div style={{
                  marginBottom: '20px',
                  padding: '10px 15px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Shield size={18} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#86efac', fontSize: '14px' }}>2FA Enabled</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                <button
                  onClick={() => deleteUser(selectedUser.id)}
                  style={{
                    ...adminStyles.button,
                    backgroundColor: '#ef4444',
                  }}
                >
                  Delete User
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setEditModalOpen(false);
                      setSelectedUser(null);
                    }}
                    style={{
                      ...adminStyles.button,
                      backgroundColor: '#6b7280',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUserRole(selectedUser.id, selectedUser.role)}
                    style={{
                      ...adminStyles.button,
                      backgroundColor: '#10b981',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA QR Code Modal */}
      {twoFAModalOpen && twoFAData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            border: '2px solid #7D55C7',
            boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
            position: 'relative',
          }}>
            <button
              onClick={() => {
                setTwoFAModalOpen(false);
                setTwoFAData(null);
                fetchUsers();
              }}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <Shield size={48} style={{ color: '#7D55C7', marginBottom: '15px' }} />
              <h2 style={{ color: '#FBDB65', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                2FA Setup for {twoFAData.userName}
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
                Share this QR code securely with the user. This is shown only once.
              </p>

              <div style={{
                background: '#fff',
                padding: '15px',
                borderRadius: '8px',
                display: 'inline-block',
                marginBottom: '20px',
              }}>
                <img
                  src={twoFAData.qrCode}
                  alt="2FA QR Code"
                  style={{ width: '200px', height: '200px' }}
                />
              </div>

              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>
                Or share this secret manually:
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#374151',
                padding: '10px 15px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}>
                <code style={{
                  flex: 1,
                  color: '#FBDB65',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                }}>
                  {twoFAData.secret}
                </code>
                <button
                  onClick={copySecret}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: secretCopied ? '#22c55e' : '#9ca3af',
                    cursor: 'pointer',
                    padding: '5px',
                  }}
                >
                  {secretCopied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
              }}>
                <p style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 'bold' }}>
                  This QR code will NOT be shown again.
                </p>
                <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '5px' }}>
                  Make sure the user has scanned it before closing this modal.
                </p>
              </div>

              <button
                onClick={() => {
                  setTwoFAModalOpen(false);
                  setTwoFAData(null);
                  fetchUsers();
                }}
                style={{
                  ...adminStyles.button,
                  backgroundColor: '#7D55C7',
                  width: '100%',
                }}
              >
                Done - User Has Scanned It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}