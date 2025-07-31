'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, ShoppingBag } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

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

  useEffect(() => {
    fetchMerch();
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
      }
    } catch (error) {
      console.error('Error deleting merch:', error);
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
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '400px',
          }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
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
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={adminStyles.select}
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

        {/* New Merch Button */}
        <button
          onClick={onNew}
          style={adminStyles.button}
          {...adminStyles.hoverEffects.button}
        >
          <Plus size={16} style={{ marginRight: '4px' }} />
          New Merch
        </button>
      </div>

      {/* Merch Grid */}
      <div style={adminStyles.section}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {filteredMerch.map((item) => (
            <div
              key={item.id}
              style={{
                ...adminStyles.card,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Image */}
              <div style={{
                height: '200px',
                background: item.imageUrl 
                  ? `url(${item.imageUrl}) center/cover`
                  : 'rgba(249, 115, 22, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
              }}>
                {!item.imageUrl && (
                  <ShoppingBag size={48} style={{ color: '#94a3b8', opacity: 0.5 }} />
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#fde68a',
                  marginBottom: '8px',
                }}>
                  {item.name}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  marginBottom: '16px',
                  flex: 1,
                }}>
                  {item.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#86efac',
                  }}>
                    ${(item.priceCents / 100).toFixed(2)}
                  </span>

                  <span style={{
                    ...adminStyles.badge,
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderColor: '#8b5cf6',
                    color: '#c4b5fd',
                  }}>
                    {getCategoryDisplay(item.category)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(249, 115, 22, 0.2)',
                }}>
                  <button
                    onClick={() => window.open(`/merch/${item.slug}`, '_blank')}
                    style={{ ...adminStyles.iconButton, flex: 1 }}
                    title="View on site"
                  >
                    <Eye size={16} />
                    <span style={{ marginLeft: '4px' }}>View</span>
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    style={{ ...adminStyles.iconButton, flex: 1 }}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                    <span style={{ marginLeft: '4px' }}>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      ...adminStyles.iconButton,
                      flex: 1,
                      color: '#fca5a5',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                    <span style={{ marginLeft: '4px' }}>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
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
    </>
  );
}