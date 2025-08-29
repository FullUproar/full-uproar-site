'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, UserPlus, Edit, Trash2, Save, X, 
  Crown, Users, Package, TrendingUp, HeadphonesIcon,
  Warehouse, Calculator, Palette, UserCheck, Coffee,
  AlertCircle, Check
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import { Role, ROLE_PERMISSIONS, Resource, ADMIN_SECTIONS } from '@/lib/permissions/config';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  roles?: { role: string; assignedAt: string; expiresAt?: string; notes?: string }[];
  createdAt: string;
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  [Role.GOD]: <Crown size={16} style={{ color: '#fbbf24' }} />,
  [Role.SUPER_ADMIN]: <Shield size={16} style={{ color: '#ef4444' }} />,
  [Role.ADMIN]: <Shield size={16} style={{ color: '#f97316' }} />,
  [Role.HR]: <Users size={16} style={{ color: '#3b82f6' }} />,
  [Role.PRODUCT_MANAGER]: <Package size={16} style={{ color: '#8b5cf6' }} />,
  [Role.MARKETING]: <TrendingUp size={16} style={{ color: '#10b981' }} />,
  [Role.CUSTOMER_SERVICE]: <HeadphonesIcon size={16} style={{ color: '#06b6d4' }} />,
  [Role.WAREHOUSE]: <Warehouse size={16} style={{ color: '#6366f1' }} />,
  [Role.ACCOUNTING]: <Calculator size={16} style={{ color: '#f59e0b' }} />,
  [Role.CONTENT_CREATOR]: <Palette size={16} style={{ color: '#ec4899' }} />,
  [Role.MODERATOR]: <UserCheck size={16} style={{ color: '#14b8a6' }} />,
  [Role.INTERN]: <Coffee size={16} style={{ color: '#94a3b8' }} />,
  [Role.USER]: <Users size={16} style={{ color: '#64748b' }} />,
  [Role.GUEST]: <Users size={16} style={{ color: '#475569' }} />
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.GOD]: 'Absolute power - All permissions without restriction',
  [Role.SUPER_ADMIN]: 'Full system access except critical operations',
  [Role.ADMIN]: 'Standard admin with most operational permissions',
  [Role.HR]: 'Human resources - Employee and user management',
  [Role.PRODUCT_MANAGER]: 'Product catalog and inventory management',
  [Role.MARKETING]: 'Marketing campaigns, content, and analytics',
  [Role.CUSTOMER_SERVICE]: 'Order support and customer communication',
  [Role.WAREHOUSE]: 'Inventory and order fulfillment',
  [Role.ACCOUNTING]: 'Financial data and reporting',
  [Role.CONTENT_CREATOR]: 'Blog, comics, artwork, and news',
  [Role.MODERATOR]: 'Forum and community moderation',
  [Role.INTERN]: 'Limited access - mostly read-only',
  [Role.USER]: 'Regular customer with basic permissions',
  [Role.GUEST]: 'Not logged in - public access only'
};

export default function RolesManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [showRoleDetails, setShowRoleDetails] = useState<Role | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoles = (user: User) => {
    setEditingUserId(user.id);
    const currentRoles: Role[] = [];
    
    // Add primary role
    if (user.role) {
      currentRoles.push(user.role as Role);
    }
    
    // Add additional roles
    if (user.roles) {
      user.roles.forEach(r => {
        if (!currentRoles.includes(r.role as Role)) {
          currentRoles.push(r.role as Role);
        }
      });
    }
    
    setSelectedRoles(currentRoles);
  };

  const handleSaveRoles = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: selectedRoles })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Roles updated successfully' });
        await fetchUsers();
        setEditingUserId(null);
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update roles' });
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      setMessage({ type: 'error', text: 'Failed to update roles' });
    }
  };

  const handleEnsureGod = async () => {
    if (!confirm('This will grant God mode to info@fulluproar.com. Continue?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/ensure-god-user', {
        method: 'POST'
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.user.message });
        await fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Error ensuring God user:', error);
      setMessage({ type: 'error', text: 'Failed to ensure God user' });
    }
  };

  const toggleRole = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>
          <Shield size={32} style={{ marginRight: '1rem' }} />
          Roles & Permissions Management
        </h1>
        <button
          onClick={handleEnsureGod}
          style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#000'
          }}
        >
          <Crown size={20} />
          Ensure God User
        </button>
      </div>

      {message && (
        <div style={{
          ...adminStyles.card,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: message.type === 'success' ? '#10b981' : '#ef4444',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        </div>
      )}

      {/* Role Descriptions */}
      <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
        <h2 style={{ ...adminStyles.subtitle, marginBottom: '1rem' }}>Available Roles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {Object.entries(Role).map(([key, role]) => (
            <div
              key={role}
              style={{
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setShowRoleDetails(showRoleDetails === role ? null : role)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {ROLE_ICONS[role]}
                <strong style={{ color: '#fdba74' }}>{role}</strong>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {ROLE_DESCRIPTIONS[role]}
              </p>
              {showRoleDetails === role && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <strong style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>Permissions:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {ROLE_PERMISSIONS[role].slice(0, 5).map((perm, idx) => (
                      <li key={idx}>{perm.resource}:{perm.action}</li>
                    ))}
                    {ROLE_PERMISSIONS[role].length > 5 && (
                      <li>...and {ROLE_PERMISSIONS[role].length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div style={adminStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={adminStyles.subtitle}>User Roles</h2>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...adminStyles.input,
              width: '300px'
            }}
          />
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading users...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={adminStyles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Primary Role</th>
                  <th>Additional Roles</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {user.email === 'info@fulluproar.com' && <Crown size={16} style={{ color: '#fbbf24' }} />}
                        {user.displayName || 'N/A'}
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{user.email}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {ROLE_ICONS[user.role as Role]}
                        <span style={{ 
                          padding: '0.25rem 0.5rem',
                          background: user.role === 'GOD' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: user.role === 'GOD' ? '#fbbf24' : '#fdba74'
                        }}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td>
                      {editingUserId === user.id ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {Object.values(Role).map(role => (
                            <button
                              key={role}
                              onClick={() => toggleRole(role)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: selectedRoles.includes(role) 
                                  ? 'rgba(249, 115, 22, 0.3)' 
                                  : 'rgba(148, 163, 184, 0.1)',
                                border: `1px solid ${selectedRoles.includes(role) ? '#f97316' : 'transparent'}`,
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: selectedRoles.includes(role) ? '#fdba74' : '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {user.roles?.map((r, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(148, 163, 184, 0.2)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: '#94a3b8'
                              }}
                            >
                              {r.role}
                            </span>
                          ))}
                          {(!user.roles || user.roles.length === 0) && (
                            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>None</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {editingUserId === user.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSaveRoles(user.id)}
                            style={{
                              ...adminStyles.button,
                              padding: '0.5rem',
                              background: '#10b981'
                            }}
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            style={{
                              ...adminStyles.button,
                              padding: '0.5rem',
                              background: '#ef4444'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditRoles(user)}
                          style={{
                            ...adminStyles.button,
                            padding: '0.5rem'
                          }}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Sections Access Matrix */}
      <div style={{ ...adminStyles.card, marginTop: '2rem' }}>
        <h2 style={{ ...adminStyles.subtitle, marginBottom: '1rem' }}>Admin Section Access Matrix</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...adminStyles.table, fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>Section</th>
                {Object.values(Role).slice(0, 10).map(role => (
                  <th key={role} style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      {ROLE_ICONS[role]}
                      <span style={{ fontSize: '0.75rem' }}>{role.substring(0, 3)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(ADMIN_SECTIONS).map(([section, _]) => (
                <tr key={section}>
                  <td style={{ fontWeight: 'bold', color: '#fdba74' }}>{section}</td>
                  {Object.values(Role).slice(0, 10).map(role => {
                    const hasAccess = ROLE_PERMISSIONS[role]?.some(p => 
                      section.includes('products') ? p.resource.includes('products') :
                      section.includes('orders') ? p.resource.includes('orders') :
                      section.includes('users') ? p.resource.includes('users') :
                      section.includes('marketing') ? p.resource.includes('marketing') :
                      section.includes('finance') ? p.resource.includes('finance') :
                      p.resource.includes('admin')
                    );
                    
                    return (
                      <td key={role} style={{ textAlign: 'center' }}>
                        {hasAccess ? (
                          <Check size={16} style={{ color: '#10b981', margin: '0 auto' }} />
                        ) : (
                          <X size={16} style={{ color: '#ef4444', margin: '0 auto' }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}