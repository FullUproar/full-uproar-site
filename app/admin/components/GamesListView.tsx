'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, Package, CheckSquare, Square } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import ConfirmationModal from './ConfirmationModal';

interface Game {
  id: number;
  title: string;
  tagline: string;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  imageUrl?: string;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo?: string;
  slug: string;
  leadDesigner?: string;
  leadArtist?: string;
  publisher?: string;
  isNew?: boolean;
  isBestseller?: boolean;
}

interface GamesListViewProps {
  onEdit: (game: Game) => void;
  onNew: () => void;
}

export default function GamesListView({ onEdit, onNew }: GamesListViewProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'bundle' | 'preorder'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGames();
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchGames();
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete each selected game
      const deletePromises = Array.from(selectedGames).map(id => 
        fetch(`/api/admin/games/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh the list and clear selection
      await fetchGames();
      setSelectedGames(new Set());
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting games:', error);
      alert('Failed to delete some games. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectGame = (id: number) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGames(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedGames.size === filteredGames.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(filteredGames.map(g => g.id)));
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'featured' && game.featured) ||
                         (filterType === 'bundle' && game.isBundle) ||
                         (filterType === 'preorder' && game.isPreorder);
    
    return matchesSearch && matchesFilter;
  });

  const selectedCount = selectedGames.size;
  const allSelected = filteredGames.length > 0 && selectedGames.size === filteredGames.length;
  const someSelected = selectedGames.size > 0 && selectedGames.size < filteredGames.length;

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#fdba74' }}>Loading games...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Games</h1>
        <p style={adminStyles.subtitle}>Manage your game catalog</p>
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
              placeholder="Search games..."
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

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{
              ...adminStyles.select,
              minWidth: isMobile ? '100%' : '150px',
              margin: 0,
            }}
          >
            <option value="all">All Games</option>
            <option value="featured">Featured</option>
            <option value="bundle">Bundles</option>
            <option value="preorder">Pre-orders</option>
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
            New Game
          </button>
        </div>
      </div>

      {/* Games Table */}
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
                <th style={adminStyles.tableHeader}>Title</th>
                <th style={adminStyles.tableHeader}>Price</th>
                <th style={adminStyles.tableHeader}>Designer</th>
                <th style={adminStyles.tableHeader}>Status</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => (
                <tr
                  key={game.id}
                  style={{
                    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
                    transition: 'background 0.2s',
                    background: selectedGames.has(game.id) ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedGames.has(game.id)) {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedGames.has(game.id)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <td style={adminStyles.tableCell}>
                    <button
                      onClick={() => toggleSelectGame(game.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fdba74',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {selectedGames.has(game.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td style={adminStyles.tableCell}>
                    {game.imageUrl ? (
                      <img
                        src={game.imageUrl}
                        alt={game.title}
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
                        <Package size={24} style={{ color: '#94a3b8' }} />
                      </div>
                    )}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#fde68a' }}>
                        {game.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {game.tagline}
                      </div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    ${(game.priceCents / 100).toFixed(2)}
                  </td>
                  <td style={adminStyles.tableCell}>
                    {game.leadDesigner || 'N/A'}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {game.featured && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(249, 115, 22, 0.2)',
                          borderColor: '#f97316',
                          color: '#fdba74',
                        }}>
                          Featured
                        </span>
                      )}
                      {game.isNew && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(59, 130, 246, 0.2)',
                          borderColor: '#3b82f6',
                          color: '#93bbfc',
                        }}>
                          New
                        </span>
                      )}
                      {game.isBestseller && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderColor: '#10b981',
                          color: '#86efac',
                        }}>
                          Bestseller
                        </span>
                      )}
                      {game.isPreorder && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(139, 92, 246, 0.2)',
                          borderColor: '#8b5cf6',
                          color: '#c4b5fd',
                        }}>
                          Pre-order
                        </span>
                      )}
                      {game.isBundle && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(236, 72, 153, 0.2)',
                          borderColor: '#ec4899',
                          color: '#f9a8d4',
                        }}>
                          Bundle
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => window.open(`/games/${game.slug}`, '_blank')}
                        style={adminStyles.iconButton}
                        title="View on site"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(game)}
                        style={adminStyles.iconButton}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(game.id)}
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

        {filteredGames.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
          }}>
            <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>{searchTerm || filterType !== 'all' ? 'No games found matching your criteria' : 'No games added yet'}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Games"
        message={`Are you sure you want to permanently delete ${selectedCount} ${selectedCount === 1 ? 'game' : 'games'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
      />
    </>
  );
}