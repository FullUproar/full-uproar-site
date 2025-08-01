'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@prisma/client';
import { 
  Search, Filter, UserPlus, Edit2, Shield, Ban, Mail, 
  MoreVertical, Check, X, AlertCircle, ChevronDown
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface UserWithProfile extends User {
  profile?: {
    location?: string | null;
    favoriteGame?: string | null;
  };
  _count?: {
    posts: number;
  };
}

interface UsersListViewProps {
  onEdit?: (user: UserWithProfile) => void;
  onNew?: () => void;
}

import PermissionGate from './PermissionGate';

export default function UsersListView({ onEdit, onNew }: UsersListViewProps) {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastLogin' | 'username'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
    setShowRoleMenu(null);
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      
      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && user.isActive) ||
        (statusFilter === 'INACTIVE' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'lastLogin':
          aVal = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          bVal = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          break;
        case 'username':
          aVal = a.username || a.email;
          bVal = b.username || b.email;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : 1;
      }
      return aVal > bVal ? -1 : 1;
    });

  const getRoleBadge = (role: UserRole) => {
    const roleStyles: Record<UserRole, React.CSSProperties> = {
      SUPER_ADMIN: { backgroundColor: '#dc2626', color: 'white' },
      ADMIN: { backgroundColor: '#f97316', color: 'white' },
      MODERATOR: { backgroundColor: '#8b5cf6', color: 'white' },
      USER: { backgroundColor: '#3b82f6', color: 'white' },
      GUEST: { backgroundColor: '#6b7280', color: 'white' }
    };

    return (
      <span style={{
        ...roleStyles[role],
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#fdba74' }}>Loading users...</p>
      </div>
    );
  }

  return (
    <PermissionGate resource="users" action="read">
      <>
        <div style={adminStyles.header}>
          <h1 style={adminStyles.title}>User Management</h1>
          <PermissionGate resource="users" action="create">
            <button
              onClick={onNew}
              style={{
                ...adminStyles.primaryButton,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UserPlus size={18} />
              Add User
            </button>
          </PermissionGate>
        </div>

      <div style={adminStyles.section}>
        {/* Search and Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap' 
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={adminStyles.searchBar}>
              <Search size={20} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={adminStyles.searchInput}
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
            style={adminStyles.select}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="USER">User</option>
            <option value="GUEST">Guest</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            style={adminStyles.select}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            style={adminStyles.select}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="lastLogin-desc">Recently Active</option>
            <option value="username-asc">Username A-Z</option>
            <option value="username-desc">Username Z-A</option>
          </select>
        </div>

        {/* Results Summary */}
        <div style={{ 
          marginBottom: '16px', 
          color: '#94a3b8',
          fontSize: '14px' 
        }}>
          Showing {filteredUsers.length} of {users.length} users
        </div>

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={adminStyles.table}>
            <thead>
              <tr>
                <th style={adminStyles.tableHeader}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th style={adminStyles.tableHeader}>User</th>
                <th style={adminStyles.tableHeader}>Role</th>
                <th style={adminStyles.tableHeader}>Status</th>
                <th style={adminStyles.tableHeader}>Posts</th>
                <th style={adminStyles.tableHeader}>Joined</th>
                <th style={adminStyles.tableHeader}>Last Login</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={adminStyles.tableRow}>
                  <td style={adminStyles.tableCell}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName || user.username || ''}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #334155'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontWeight: 'bold'
                        }}>
                          {(user.displayName || user.username || user.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                          {user.displayName || user.username || 'Unnamed User'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {user.email}
                        </div>
                        {user.profile?.location && (
                          <div style={{ color: '#64748b', fontSize: '11px' }}>
                            📍 {user.profile.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ position: 'relative' }}>
                      {getRoleBadge(user.role)}
                      <button
                        onClick={() => setShowRoleMenu(showRoleMenu === user.id ? null : user.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle'
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {showRoleMenu === user.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          padding: '8px',
                          zIndex: 10,
                          minWidth: '150px',
                          marginTop: '4px'
                        }}>
                          {Object.values(UserRole).map(role => (
                            <button
                              key={role}
                              onClick={() => updateUserRole(user.id, role)}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                background: user.role === role ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                                border: 'none',
                                color: user.role === role ? '#fdba74' : '#e2e8f0',
                                cursor: 'pointer',
                                textAlign: 'left',
                                borderRadius: '4px',
                                fontSize: '14px',
                                marginBottom: '4px'
                              }}
                              onMouseEnter={(e) => {
                                if (user.role !== role) {
                                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (user.role !== role) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              {role.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <button
                      onClick={() => toggleUserStatus(user.id, !user.isActive)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: user.isActive ? '#10b981' : '#ef4444'
                      }}
                    >
                      {user.isActive ? <Check size={16} /> : <X size={16} />}
                      <span style={{ fontSize: '14px' }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ color: '#94a3b8' }}>
                      {user._count?.posts || 0}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <PermissionGate resource="users" action="update">
                        <button
                          onClick={() => onEdit?.(user)}
                          style={adminStyles.iconButton}
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                      </PermissionGate>
                      <button
                        style={adminStyles.iconButton}
                        title="Send email"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        style={adminStyles.iconButton}
                        title="More actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#94a3b8'
          }}>
            <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No users found matching your criteria</p>
          </div>
        )}
      </div>
      </>
    </PermissionGate>
  );
}