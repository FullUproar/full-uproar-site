'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Box,
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

/**
 * Packaging Configuration Page
 * ============================
 * Manage packaging types for order fulfillment.
 */

interface PackagingType {
  id: number;
  sku: string;
  name: string;
  length: number;
  width: number;
  height: number;
  material: string;
  weightOz: number | null;
  maxWeightOz: number | null;
  costCents: number | null;
  isActive: boolean;
  sortOrder: number;
  notes: string | null;
}

const emptyPackaging: Omit<PackagingType, 'id'> = {
  sku: '',
  name: '',
  length: 0,
  width: 0,
  height: 0,
  material: 'Cardboard',
  weightOz: null,
  maxWeightOz: null,
  costCents: null,
  isActive: true,
  sortOrder: 0,
  notes: null,
};

export default function PackagingConfigPage() {
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PackagingType | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackagingTypes = async () => {
    try {
      const res = await fetch('/api/admin/packaging');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPackagingTypes(data);
    } catch (err) {
      setError('Failed to load packaging types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagingTypes();
  }, []);

  const handleNew = () => {
    setEditing({ id: 0, ...emptyPackaging });
    setIsNew(true);
  };

  const handleEdit = (pkg: PackagingType) => {
    setEditing({ ...pkg });
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!editing) return;

    if (!editing.sku || !editing.name || !editing.length || !editing.width || !editing.height) {
      setError('SKU, name, and dimensions are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = isNew ? '/api/admin/packaging' : `/api/admin/packaging?id=${editing.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      await fetchPackagingTypes();
      handleCancel();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this packaging type?')) return;

    try {
      const res = await fetch(`/api/admin/packaging?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      await fetchPackagingTypes();
    } catch (err) {
      setError('Failed to delete packaging type');
    }
  };

  if (loading) {
    return (
      <div style={{ ...adminStyles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={48} style={{ color: '#FF8200', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={adminStyles.title}>
          <Package size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Packaging Types
        </h1>
        <button onClick={handleNew} style={adminStyles.primaryButton}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Packaging
        </button>
      </div>

      {error && (
        <div style={{
          ...adminStyles.card,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #ef4444',
          color: '#ef4444',
          marginBottom: '1rem',
          padding: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <div style={{ ...adminStyles.card, marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#FBDB65', marginBottom: '1rem' }}>
            {isNew ? 'New Packaging Type' : 'Edit Packaging Type'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={adminStyles.label}>SKU *</label>
              <input
                type="text"
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value.toUpperCase() })}
                placeholder="FMM01"
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Name *</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Standard Game Box"
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Material</label>
              <select
                value={editing.material}
                onChange={(e) => setEditing({ ...editing, material: e.target.value })}
                style={adminStyles.select}
              >
                <option value="Cardboard">Cardboard</option>
                <option value="Corrugated">Corrugated</option>
                <option value="Padded Mailer">Padded Mailer</option>
                <option value="Poly Mailer">Poly Mailer</option>
              </select>
            </div>

            <div>
              <label style={adminStyles.label}>Length (inches) *</label>
              <input
                type="number"
                step="0.25"
                value={editing.length || ''}
                onChange={(e) => setEditing({ ...editing, length: parseFloat(e.target.value) || 0 })}
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Width (inches) *</label>
              <input
                type="number"
                step="0.25"
                value={editing.width || ''}
                onChange={(e) => setEditing({ ...editing, width: parseFloat(e.target.value) || 0 })}
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Height (inches) *</label>
              <input
                type="number"
                step="0.25"
                value={editing.height || ''}
                onChange={(e) => setEditing({ ...editing, height: parseFloat(e.target.value) || 0 })}
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Empty Weight (oz)</label>
              <input
                type="number"
                step="0.5"
                value={editing.weightOz || ''}
                onChange={(e) => setEditing({ ...editing, weightOz: parseFloat(e.target.value) || null })}
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Max Weight (oz)</label>
              <input
                type="number"
                step="0.5"
                value={editing.maxWeightOz || ''}
                onChange={(e) => setEditing({ ...editing, maxWeightOz: parseFloat(e.target.value) || null })}
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Cost per Unit ($)</label>
              <input
                type="number"
                step="0.01"
                value={editing.costCents ? (editing.costCents / 100).toFixed(2) : ''}
                onChange={(e) => setEditing({ ...editing, costCents: Math.round(parseFloat(e.target.value) * 100) || null })}
                style={adminStyles.input}
              />
            </div>

            <div>
              <label style={adminStyles.label}>Sort Order</label>
              <input
                type="number"
                value={editing.sortOrder}
                onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })}
                style={adminStyles.input}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={adminStyles.label}>Notes</label>
            <textarea
              value={editing.notes || ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value || null })}
              placeholder="Optional notes..."
              style={{ ...adminStyles.textarea, height: '80px' }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Active (available for selection)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...adminStyles.primaryButton,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? (
                <Loader2 size={18} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={18} style={{ marginRight: '0.5rem' }} />
              )}
              Save
            </button>
            <button onClick={handleCancel} style={adminStyles.outlineButton}>
              <X size={18} style={{ marginRight: '0.5rem' }} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Packaging List */}
      <div style={adminStyles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 130, 0, 0.2)' }}>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>SKU</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Name</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'center' }}>Dimensions</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'center' }}>Material</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'center' }}>Status</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packagingTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <Box size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <div>No packaging types configured</div>
                    <button onClick={handleNew} style={{ ...adminStyles.button, marginTop: '1rem' }}>
                      <Plus size={18} style={{ marginRight: '0.5rem' }} />
                      Add First Packaging Type
                    </button>
                  </td>
                </tr>
              ) : (
                packagingTypes.map((pkg) => (
                  <tr
                    key={pkg.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 130, 0, 0.1)',
                      opacity: pkg.isActive ? 1 : 0.5,
                    }}
                  >
                    <td style={{ padding: '1rem', color: '#FBDB65', fontWeight: 600 }}>
                      {pkg.sku}
                    </td>
                    <td style={{ padding: '1rem', color: '#e2e8f0' }}>
                      {pkg.name}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                      {pkg.length}" × {pkg.width}" × {pkg.height}"
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                      {pkg.material}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: pkg.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: pkg.isActive ? '#10b981' : '#ef4444',
                      }}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleEdit(pkg)}
                        style={{ ...adminStyles.iconButton, marginRight: '0.5rem' }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        style={{ ...adminStyles.iconButton, color: '#ef4444' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
