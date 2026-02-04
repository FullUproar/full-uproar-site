'use client';

import { useState, useEffect } from 'react';
import {
  Tag, Plus, Edit2, Trash2, Copy, Check, X, Search,
  Calendar, Users, DollarSign, Percent, ChevronLeft, ChevronRight,
  AlertCircle, Clock, Eye, EyeOff, Gift
} from 'lucide-react';
import Navigation from '@/app/components/Navigation';

interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderCents: number | null;
  maxDiscountCents: number | null;
  maxUses: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  applicableToGames: boolean;
  applicableToMerch: boolean;
  newCustomersOnly: boolean;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isTest: boolean;
  createdBy: string | null;
  createdAt: string;
  _count: {
    orders: number;
    usageHistory: number;
  };
}

interface PromoCodesResponse {
  promoCodes: PromoCode[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    totalActive: number;
    totalExpired: number;
    totalUsageToday: number;
  };
}

export default function AdminPromoCodesPage() {
  const [data, setData] = useState<PromoCodesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderCents: '',
    maxDiscountCents: '',
    maxUses: '',
    maxUsesPerUser: 1,
    applicableToGames: true,
    applicableToMerch: true,
    newCustomersOnly: false,
    startsAt: '',
    expiresAt: '',
    isTest: false
  });

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/admin/promo-codes?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPromoCodes();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderCents: '',
      maxDiscountCents: '',
      maxUses: '',
      maxUsesPerUser: 1,
      applicableToGames: true,
      applicableToMerch: true,
      newCustomersOnly: false,
      startsAt: '',
      expiresAt: '',
      isTest: false
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minOrderCents: formData.minOrderCents ? parseInt(formData.minOrderCents) * 100 : null,
          maxDiscountCents: formData.maxDiscountCents ? parseInt(formData.maxDiscountCents) * 100 : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert('Failed to create promo code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPromo.id,
          ...formData,
          minOrderCents: formData.minOrderCents ? parseInt(formData.minOrderCents) * 100 : null,
          maxDiscountCents: formData.maxDiscountCents ? parseInt(formData.maxDiscountCents) * 100 : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });

      if (response.ok) {
        setEditingPromo(null);
        resetForm();
        fetchPromoCodes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update promo code');
      }
    } catch (error) {
      console.error('Error updating promo code:', error);
      alert('Failed to update promo code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    setActionLoading(true);

    try {
      const response = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPromoCodes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Failed to delete promo code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    setActionLoading(true);

    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promo.id,
          isActive: !promo.isActive,
        }),
      });

      if (response.ok) {
        fetchPromoCodes();
      }
    } catch (error) {
      console.error('Error toggling promo code:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderCents: promo.minOrderCents ? (promo.minOrderCents / 100).toString() : '',
      maxDiscountCents: promo.maxDiscountCents ? (promo.maxDiscountCents / 100).toString() : '',
      maxUses: promo.maxUses ? promo.maxUses.toString() : '',
      maxUsesPerUser: promo.maxUsesPerUser,
      applicableToGames: promo.applicableToGames,
      applicableToMerch: promo.applicableToMerch,
      newCustomersOnly: promo.newCustomersOnly,
      startsAt: promo.startsAt ? new Date(promo.startsAt).toISOString().slice(0, 16) : '',
      expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 16) : '',
      isTest: promo.isTest
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (promo: PromoCode) => {
    return promo.expiresAt && new Date(promo.expiresAt) < new Date();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderForm = () => (
    <form onSubmit={editingPromo ? handleUpdate : handleCreate}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Code */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Promo Code *
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            placeholder="CHAOS20"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '1rem',
              textTransform: 'uppercase'
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Summer sale 20% off"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Discount Type */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Discount Type *
          </label>
          <select
            value={formData.discountType}
            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {formData.discountType === 'percentage' ? 'Percentage Off *' : 'Amount Off (cents) *'}
          </label>
          <input
            type="number"
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
            required
            min={1}
            max={formData.discountType === 'percentage' ? 100 : undefined}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Min Order */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Min Order ($)
          </label>
          <input
            type="number"
            value={formData.minOrderCents}
            onChange={(e) => setFormData({ ...formData, minOrderCents: e.target.value })}
            placeholder="0"
            min={0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Max Discount */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Max Discount ($)
          </label>
          <input
            type="number"
            value={formData.maxDiscountCents}
            onChange={(e) => setFormData({ ...formData, maxDiscountCents: e.target.value })}
            placeholder="No limit"
            min={0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Max Uses */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Total Uses Limit
          </label>
          <input
            type="number"
            value={formData.maxUses}
            onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            placeholder="Unlimited"
            min={1}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Max Uses Per User */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Uses Per Customer
          </label>
          <input
            type="number"
            value={formData.maxUsesPerUser}
            onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
            min={1}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Start Date */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Start Date
          </label>
          <input
            type="datetime-local"
            value={formData.startsAt}
            onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Expiry Date
          </label>
          <input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.applicableToGames}
            onChange={(e) => setFormData({ ...formData, applicableToGames: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: '#FF8200' }}
          />
          Apply to Games
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.applicableToMerch}
            onChange={(e) => setFormData({ ...formData, applicableToMerch: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: '#FF8200' }}
          />
          Apply to Merch
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.newCustomersOnly}
            onChange={(e) => setFormData({ ...formData, newCustomersOnly: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: '#FF8200' }}
          />
          New Customers Only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.isTest}
            onChange={(e) => setFormData({ ...formData, isTest: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: '#7D55C7' }}
          />
          Test Mode
        </label>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => {
            setShowCreateModal(false);
            setEditingPromo(null);
            resetForm();
          }}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px solid #374151',
            borderRadius: '0.5rem',
            color: '#94a3b8',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={actionLoading}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: actionLoading ? '#374151' : '#FF8200',
            border: 'none',
            borderRadius: '0.5rem',
            color: actionLoading ? '#6b7280' : '#111827',
            fontWeight: 'bold',
            cursor: actionLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {actionLoading ? 'Saving...' : editingPromo ? 'Update Code' : 'Create Code'}
        </button>
      </div>
    </form>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      color: '#e2e8f0'
    }}>
      <Navigation />
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Tag size={32} style={{ color: '#FF8200' }} />
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200' }}>
                Promo Codes
              </h1>
            </div>
            <p style={{ color: '#94a3b8' }}>
              Create and manage discount codes for your store
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#FF8200',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#111827',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            <Plus size={20} />
            New Promo Code
          </button>
        </div>

        {/* Stats */}
        {data?.stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid #10b981',
              borderRadius: '0.75rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>
                {data.stats.totalActive}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Active Codes</div>
            </div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
              borderRadius: '0.75rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>
                {data.stats.totalExpired}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Expired</div>
            </div>
            <div style={{
              background: 'rgba(255, 130, 0, 0.1)',
              border: '2px solid #FF8200',
              borderRadius: '0.75rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200' }}>
                {data.stats.totalUsageToday}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Used Today</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'active', 'expired', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: statusFilter === status ? '#FF8200' : 'rgba(255, 255, 255, 0.05)',
                  border: statusFilter === status ? 'none' : '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: statusFilter === status ? '#111827' : '#94a3b8',
                  fontWeight: statusFilter === status ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codes..."
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '0.875rem'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                background: '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#111827',
                cursor: 'pointer'
              }}
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Promo Codes List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading promo codes...
          </div>
        ) : !data || data.promoCodes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            border: '1px dashed #374151'
          }}>
            <Gift size={48} style={{ color: '#6b7280', margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>No promo codes found</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#111827',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Create Your First Code
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.promoCodes.map((promo) => (
              <div
                key={promo.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
                  borderRadius: '0.75rem',
                  border: `2px solid ${!promo.isActive ? '#6b7280' : isExpired(promo) ? '#ef4444' : '#10b981'}`,
                  padding: '1.5rem',
                  opacity: promo.isTest ? 0.7 : 1
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <code style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: '#FBDB65',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem'
                      }}>
                        {promo.code}
                      </code>
                      <button
                        onClick={() => copyCode(promo.code)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedCode === promo.code ? '#10b981' : '#94a3b8',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                        title="Copy code"
                      >
                        {copiedCode === promo.code ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                      {!promo.isActive && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(107, 114, 128, 0.2)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: '#6b7280'
                        }}>
                          INACTIVE
                        </span>
                      )}
                      {isExpired(promo) && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: '#ef4444'
                        }}>
                          EXPIRED
                        </span>
                      )}
                      {promo.isTest && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(139, 92, 246, 0.2)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: '#7D55C7'
                        }}>
                          TEST
                        </span>
                      )}
                    </div>
                    {promo.description && (
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                        {promo.description}
                      </p>
                    )}
                  </div>

                  <div style={{
                    textAlign: 'right',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#FF8200'
                  }}>
                    {promo.discountType === 'percentage' ? (
                      <>{promo.discountValue}% <span style={{ fontSize: '1rem', color: '#94a3b8' }}>OFF</span></>
                    ) : (
                      <>${(promo.discountValue / 100).toFixed(2)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>OFF</span></>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  fontSize: '0.875rem',
                  color: '#94a3b8'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} />
                    {promo.currentUses}{promo.maxUses ? `/${promo.maxUses}` : ''} uses
                  </span>
                  {promo.minOrderCents && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DollarSign size={16} />
                      Min ${(promo.minOrderCents / 100).toFixed(2)}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} />
                    {promo.expiresAt ? `Expires ${formatDate(promo.expiresAt)}` : 'No expiry'}
                  </span>
                  <span>
                    {promo.applicableToGames && promo.applicableToMerch ? 'All products' :
                     promo.applicableToGames ? 'Games only' : 'Merch only'}
                  </span>
                  {promo.newCustomersOnly && (
                    <span style={{ color: '#FF8200' }}>New customers only</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleToggleActive(promo)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.5rem 1rem',
                      background: promo.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid ${promo.isActive ? '#ef4444' : '#10b981'}`,
                      borderRadius: '0.5rem',
                      color: promo.isActive ? '#ef4444' : '#10b981',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {promo.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    {promo.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => startEdit(promo)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: '0.5rem',
                      color: '#ef4444',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.5rem 1rem',
                background: page === 1 ? '#374151' : '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: page === 1 ? '#6b7280' : '#111827',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span style={{ color: '#94a3b8' }}>
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              style={{
                padding: '0.5rem 1rem',
                background: page === data.totalPages ? '#374151' : '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: page === data.totalPages ? '#6b7280' : '#111827',
                cursor: page === data.totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingPromo) && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 1000,
              overflow: 'auto'
            }}
            onClick={() => {
              setShowCreateModal(false);
              setEditingPromo(null);
              resetForm();
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '700px',
                background: '#111827',
                borderRadius: '1rem',
                border: '2px solid #FF8200',
                padding: '1.5rem',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#FF8200', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>
                {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
              </h2>
              {renderForm()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
