'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Plus, Edit2, Trash2, Eye, Tag, Image, Sparkles } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Artwork {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string;
  category: string;
  tags: string | null;
  chaosMode: boolean;
  createdAt: string;
  largeUrl: string | null;
  thumbnailUrl: string | null;
}

interface ArtworkListViewProps {
  onEdit?: (artwork: Artwork) => void;
  onNew?: () => void;
}

export default function ArtworkListView({ onEdit, onNew }: ArtworkListViewProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const response = await fetch('/api/artwork');
      if (response.ok) {
        const data = await response.json();
        setArtworks(data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map((item: Artwork) => item.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;
    
    try {
      const response = await fetch(`/api/artwork/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchArtworks();
      }
    } catch (error) {
      console.error('Error deleting artwork:', error);
    }
  };

  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = 
      artwork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artwork.description && artwork.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (artwork.tags && artwork.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || artwork.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#fdba74' }}>Loading artwork...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Artwork Gallery Management</h1>
        <p style={adminStyles.subtitle}>Manage your artwork collection</p>
      </div>

      <div style={adminStyles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <input
              type="text"
              placeholder="Search artwork..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...adminStyles.input, maxWidth: '300px' }}
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ ...adminStyles.select, width: 'auto' }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={onNew}
            style={{
              ...adminStyles.primaryButton,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            New Artwork
          </button>
        </div>

        <div style={{ marginBottom: '16px', color: '#94a3b8', fontSize: '14px' }}>
          Showing {filteredArtworks.length} of {artworks.length} artworks
        </div>

        {filteredArtworks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            {searchTerm || categoryFilter !== 'all' 
              ? 'No artworks found matching your criteria.' 
              : 'No artworks yet. Upload your first artwork!'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {filteredArtworks.map((artwork) => (
              <div
                key={artwork.id}
                style={{
                  ...adminStyles.card,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                {...adminStyles.hoverEffects.card}
              >
                {artwork.chaosMode && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'linear-gradient(135deg, #f97316, #ef4444)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 1
                  }}>
                    <Sparkles size={14} />
                    CHAOS MODE
                  </div>
                )}
                
                <div style={{ 
                  aspectRatio: '1', 
                  background: '#1e293b', 
                  borderRadius: '8px', 
                  marginBottom: '16px', 
                  overflow: 'hidden' 
                }}>
                  <img
                    src={artwork.thumbnailUrl || artwork.imageUrl}
                    alt={artwork.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#fdba74', 
                  marginBottom: '8px',
                  lineHeight: '1.2'
                }}>
                  {artwork.name}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '8px' 
                }}>
                  <span style={{
                    background: 'rgba(249, 115, 22, 0.2)',
                    color: '#fdba74',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {artwork.category}
                  </span>
                </div>
                
                {artwork.description && (
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '13px', 
                    marginBottom: '12px', 
                    lineHeight: '1.4' 
                  }}>
                    {artwork.description.length > 80 
                      ? artwork.description.substring(0, 80) + '...' 
                      : artwork.description}
                  </p>
                )}
                
                {artwork.tags && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <Tag size={12} style={{ color: '#64748b' }} />
                    {JSON.parse(artwork.tags).slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          background: 'rgba(100, 116, 139, 0.2)',
                          color: '#94a3b8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => onEdit?.(artwork)}
                    style={{ ...adminStyles.iconButton, flex: 1 }}
                    title="Edit artwork"
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  <a
                    href={artwork.largeUrl || artwork.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      ...adminStyles.iconButton, 
                      flex: 1,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="View full size"
                  >
                    <Eye size={16} />
                  </a>
                  
                  <button
                    onClick={() => handleDelete(artwork.id)}
                    style={{ ...adminStyles.iconButton, flex: 1, color: '#ef4444', borderColor: '#ef4444' }}
                    title="Delete artwork"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}