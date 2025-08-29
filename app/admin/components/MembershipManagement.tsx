'use client';

import React, { useState, useEffect } from 'react';
import { 
  Crown, Star, Users, Palette, Beaker, 
  DollarSign, Package, HeadphonesIcon, 
  Calendar, TrendingUp, Gift, Shield,
  Edit, Save, X, Check, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import { MembershipTier, MEMBERSHIP_BENEFITS, getMembershipBadge, calculateMembershipPrice } from '@/lib/membership/config';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  membershipTier: string;
  membershipExpiry: string | null;
  membershipStarted: string | null;
  employeeDiscount: number;
  lifetimeValue: number;
  role: string;
  createdAt: string;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  FREE: <Users size={16} style={{ color: '#64748b' }} />,
  FUGLY_PRIME: <Crown size={16} style={{ color: '#f97316' }} />,
  VIP: <Star size={16} style={{ color: '#fbbf24' }} />,
  CREATOR: <Palette size={16} style={{ color: '#8b5cf6' }} />,
  BETA_TESTER: <Beaker size={16} style={{ color: '#10b981' }} />
};

export default function MembershipManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<MembershipTier>(MembershipTier.FREE);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [employeeDiscount, setEmployeeDiscount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [showStats, setShowStats] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEditMembership = (user: User) => {
    setEditingUserId(user.id);
    setSelectedTier(user.membershipTier as MembershipTier);
    setExpiryDate(user.membershipExpiry ? new Date(user.membershipExpiry).toISOString().split('T')[0] : '');
    setEmployeeDiscount(user.employeeDiscount);
  };

  const handleSaveMembership = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipTier: selectedTier,
          membershipExpiry: expiryDate || null,
          employeeDiscount
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Membership updated successfully' });
        await fetchUsers();
        setEditingUserId(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to update membership' });
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      setMessage({ type: 'error', text: 'Failed to update membership' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = tierFilter === 'ALL' || user.membershipTier === tierFilter;
    
    return matchesSearch && matchesTier;
  });

  const stats = {
    totalMembers: users.length,
    primeMembers: users.filter(u => u.membershipTier === 'FUGLY_PRIME').length,
    vipMembers: users.filter(u => u.membershipTier === 'VIP').length,
    totalLifetimeValue: users.reduce((sum, u) => sum + u.lifetimeValue, 0)
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>
          <Crown size={32} style={{ marginRight: '1rem' }} />
          Customer Membership Management
        </h1>
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

      {/* Statistics Dashboard */}
      {showStats && (
        <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
          <h2 style={{ ...adminStyles.subtitle, marginBottom: '1rem' }}>Membership Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users size={20} style={{ color: '#fdba74' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total Members</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fde68a' }}>
                {stats.totalMembers}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(249, 115, 22, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Crown size={20} style={{ color: '#f97316' }} />
                <span style={{ color: '#fdba74', fontSize: '0.875rem' }}>Fugly Prime</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f97316' }}>
                {stats.primeMembers}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Star size={20} style={{ color: '#fbbf24' }} />
                <span style={{ color: '#fde68a', fontSize: '0.875rem' }}>VIP Members</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {stats.vipMembers}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <DollarSign size={20} style={{ color: '#10b981' }} />
                <span style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>Lifetime Value</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                ${(stats.totalLifetimeValue / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Membership Tiers Overview */}
      <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
        <h2 style={{ ...adminStyles.subtitle, marginBottom: '1rem' }}>Membership Tiers & Benefits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {Object.entries(MEMBERSHIP_BENEFITS).map(([tier, benefits]) => (
            <div
              key={tier}
              style={{
                padding: '1rem',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                border: `1px solid ${benefits.color}33`,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {TIER_ICONS[tier]}
                <strong style={{ color: benefits.color }}>{benefits.displayName}</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {benefits.description}
              </p>
              <div style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
                <div>• {benefits.benefits.discountPercent}% discount</div>
                {benefits.benefits.freeShipping && <div>• Free shipping</div>}
                {benefits.benefits.earlyAccess && <div>• Early access</div>}
                {benefits.benefits.monthlyCredits > 0 && (
                  <div>• ${(benefits.benefits.monthlyCredits / 100).toFixed(2)} monthly credits</div>
                )}
              </div>
              {benefits.pricing && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  paddingTop: '0.5rem', 
                  borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                  fontSize: '0.75rem',
                  color: '#fdba74'
                }}>
                  ${(benefits.pricing.monthly / 100).toFixed(2)}/mo
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User List */}
      <div style={adminStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={adminStyles.subtitle}>Member List</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...adminStyles.input,
                width: '250px'
              }}
            />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={adminStyles.select}
            >
              <option value="ALL">All Tiers</option>
              <option value="FREE">Free</option>
              <option value="FUGLY_PRIME">Fugly Prime</option>
              <option value="VIP">VIP</option>
              <option value="CREATOR">Creator</option>
              <option value="BETA_TESTER">Beta Tester</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading members...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={adminStyles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Current Tier</th>
                  <th>Expires</th>
                  <th>Employee Discount</th>
                  <th>Lifetime Value</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                          {user.displayName || user.email}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      {editingUserId === user.id ? (
                        <select
                          value={selectedTier}
                          onChange={(e) => setSelectedTier(e.target.value as MembershipTier)}
                          style={{ ...adminStyles.select, width: '150px' }}
                        >
                          {Object.values(MembershipTier).map(tier => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {TIER_ICONS[user.membershipTier]}
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: `${MEMBERSHIP_BENEFITS[user.membershipTier as MembershipTier]?.color}33`,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: MEMBERSHIP_BENEFITS[user.membershipTier as MembershipTier]?.color || '#94a3b8'
                          }}>
                            {user.membershipTier}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingUserId === user.id ? (
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          style={{ ...adminStyles.input, width: '150px' }}
                        />
                      ) : (
                        <span style={{ color: user.membershipExpiry ? '#fdba74' : '#64748b', fontSize: '0.875rem' }}>
                          {user.membershipExpiry 
                            ? new Date(user.membershipExpiry).toLocaleDateString()
                            : 'Never'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingUserId === user.id ? (
                        <input
                          type="number"
                          value={employeeDiscount}
                          onChange={(e) => setEmployeeDiscount(Number(e.target.value))}
                          min="0"
                          max="100"
                          style={{ ...adminStyles.input, width: '80px' }}
                        />
                      ) : (
                        <span style={{ color: user.employeeDiscount > 0 ? '#10b981' : '#64748b' }}>
                          {user.employeeDiscount > 0 ? `${user.employeeDiscount}%` : '-'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#10b981', fontWeight: 'bold' }}>
                      ${(user.lifetimeValue / 100).toFixed(2)}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {editingUserId === user.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSaveMembership(user.id)}
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
                          onClick={() => handleEditMembership(user)}
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
    </div>
  );
}