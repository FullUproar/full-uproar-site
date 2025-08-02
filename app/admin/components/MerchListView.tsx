'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, ShoppingBag, CheckSquare, Square } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import ConfirmationModal from './ConfirmationModal';

interface Merch {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  imageUrl?: string;
  slug: string;
  printifyId?: string;
  sizes?: string[];
  colors?: string[];
}

interface MerchListViewProps {
  onEdit: (merch: Merch) => void;
  onNew: () => void;
}

export default function MerchListView({ onEdit, onNew }: MerchListViewProps) {
  const [merch, setMerch] = useState<Merch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMerch, setSelectedMerch] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMerch();
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchMerch = async () => {
    try {
      const response = await fetch('/api/admin/merch');
      const data = await response.json();
      setMerch(data);
    } catch (error) {
      console.error('Error fetching merch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this merchandise?')) return;

    try {
      const response = await fetch(`/api/admin/merch/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchMerch();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete merchandise');
      }
    } catch (error) {
      console.error('Error deleting merch:', error);
      alert('Failed to delete merchandise. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete each selected item
      const deletePromises = Array.from(selectedMerch).map(async (id) => {
        const response = await fetch(`/api/admin/merch/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete item ${id}`);
        }
        return response;
      });
      
      const results = await Promise.allSettled(deletePromises);
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        const errorMessages = failures.map((f: any) => f.reason?.message || 'Unknown error').join('\n');
        alert(`Failed to delete some items:\n${errorMessages}`);
      }
      
      // Refresh the list and clear selection
      await fetchMerch();
      setSelectedMerch(new Set());
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting merchandise:', error);
      alert('Failed to delete items. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectMerch = (id: number) => {
    const newSelected = new Set(selectedMerch);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMerch(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedMerch.size === filteredMerch.length) {
      setSelectedMerch(new Set());
    } else {
      setSelectedMerch(new Set(filteredMerch.map(m => m.id)));
    }
  };

  const filteredMerch = merch.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      'TSHIRT': 'T-Shirt',
      'HOODIE': 'Hoodie',
      'MUG': 'Mug',
      'POSTER': 'Poster',
      'STICKER': 'Sticker',
      'HAT': 'Hat',
      'BAG': 'Bag',
      'OTHER': 'Other',
    };
    return categoryMap[category] || category;
  };

  const selectedCount = selectedMerch.size;
  const allSelected = filteredMerch.length > 0 && selectedMerch.size === filteredMerch.length;
  const someSelected = selectedMerch.size > 0 && selectedMerch.size < filteredMerch.length;

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#fdba74' }}>Loading merchandise...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Merchandise</h1>
        <p style={adminStyles.subtitle}>Manage your merchandise catalog</p>
      </div>

      {/* Actions Bar */}
      <div style={{
        ...adminStyles.section,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px', 
          alignItems: 'stretch', 
          flex: 1,
          minWidth: 0,
        }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            flex: isMobile ? 'none' : 1,
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '100%' : '400px',
            minWidth: isMobile ? '100%' : '200px',
          }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search merchandise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...adminStyles.input,
                paddingLeft: '40px',
                width: '100%',
                margin: 0,
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              ...adminStyles.select,
              minWidth: isMobile ? '100%' : '150px',
              margin: 0,
            }}
          >
            <option value="all">All Categories</option>
            <option value="TSHIRT">T-Shirts</option>
            <option value="HOODIE">Hoodies</option>
            <option value="MUG">Mugs</option>
            <option value="POSTER">Posters</option>
            <option value="STICKER">Stickers</option>
            <option value="HAT">Hats</option>
            <option value="BAG">Bags</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedCount > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                ...adminStyles.button,
                background: '#ef4444',
              }}
            >
              <Trash2 size={16} style={{ marginRight: '4px' }} />
              Delete ({selectedCount})
            </button>
          )}
          <button
            onClick={onNew}
            style={adminStyles.button}
            {...adminStyles.hoverEffects.button}
          >
            <Plus size={16} style={{ marginRight: '4px' }} />
            New Merch
          </button>
        </div>
      </div>

      {/* Merch Table */}
      <div style={adminStyles.section}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{
                borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
              }}>
                <th style={{ ...adminStyles.tableHeader, width: '50px' }}>
                  <button
                    onClick={toggleSelectAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fdba74',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {allSelected ? <CheckSquare size={20} /> : someSelected ? <CheckSquare size={20} style={{ opacity: 0.5 }} /> : <Square size={20} />}
                  </button>
                </th>
                <th style={adminStyles.tableHeader}>Image</th>
                <th style={adminStyles.tableHeader}>Name</th>
                <th style={adminStyles.tableHeader}>Category</th>
                <th style={adminStyles.tableHeader}>Price</th>
                <th style={adminStyles.tableHeader}>Variants</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMerch.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
                    transition: 'background 0.2s',
                    background: selectedMerch.has(item.id) ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedMerch.has(item.id)) {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedMerch.has(item.id)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <td style={adminStyles.tableCell}>
                    <button
                      onClick={() => toggleSelectMerch(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fdba74',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {selectedMerch.has(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td style={adminStyles.tableCell}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid rgba(249, 115, 22, 0.3)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(249, 115, 22, 0.1)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(249, 115, 22, 0.3)',
                      }}>
                        <ShoppingBag size={24} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#fde68a' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {item.description}
                      </div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{
                      ...adminStyles.badge,
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderColor: '#8b5cf6',
                      color: '#c4b5fd',
                    }}>
                      {getCategoryDisplay(item.category)}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    ${(item.priceCents / 100).toFixed(2)}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.sizes && item.sizes.length > 0 && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(59, 130, 246, 0.2)',
                          borderColor: '#3b82f6',
                          color: '#93bbfc',
                        }}>
                          {item.sizes.length} Sizes
                        </span>
                      )}
                      {item.colors && item.colors.length > 0 && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(236, 72, 153, 0.2)',
                          borderColor: '#ec4899',
                          color: '#f9a8d4',
                        }}>
                          {item.colors.length} Colors
                        </span>
                      )}
                      {item.printifyId && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderColor: '#10b981',
                          color: '#86efac',
                        }}>
                          Printify
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => window.open(`/merch/${item.slug}`, '_blank')}
                        style={adminStyles.iconButton}
                        title="View on site"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        style={adminStyles.iconButton}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          ...adminStyles.iconButton,
                          color: '#fca5a5',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMerch.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
          }}>
            <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>{searchTerm || categoryFilter !== 'all' ? 'No merchandise found matching your criteria' : 'No merchandise added yet'}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Merchandise"
        message={`Are you sure you want to permanently delete ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
      />
    </>
  );
}