'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Eye, Search, Filter, Package, CheckSquare, Square, Archive, ArchiveRestore } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import ConfirmationModal from './ConfirmationModal';

interface GameImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

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
  images?: GameImage[];
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
  archived?: boolean;
}

// Helper to get the display image URL (legacy imageUrl or primary from gallery)
function getDisplayImage(game: Game): string | null {
  // First try legacy imageUrl
  if (game.imageUrl) return game.imageUrl;

  // Then try primary image from gallery
  if (game.images && game.images.length > 0) {
    const primaryImage = game.images.find(img => img.isPrimary);
    if (primaryImage) return primaryImage.imageUrl;
    // Fallback to first image if no primary set
    return game.images[0].imageUrl;
  }

  return null;
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
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchGames();
    
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [showArchived]);

  const fetchGames = async () => {
    try {
      const url = showArchived ? '/api/admin/games?showArchived=true' : '/api/admin/games';
      const response = await fetch(url);
      const data = await response.json();
      
      // Ensure we have an array
      if (Array.isArray(data)) {
        setGames(data);
      } else {
        console.error('Invalid response format:', data);
        setGames([]);
        if (data.error) {
          alert(data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: number, archive: boolean) => {
    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: archive ? 'archive' : 'unarchive' })
      });
      
      if (response.ok) {
        await fetchGames();
      } else {
        const errorData = await response.json();
        alert(errorData.error || `Failed to ${archive ? 'archive' : 'unarchive'} game`);
      }
    } catch (error) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} game:`, error);
      alert(`Failed to ${archive ? 'archive' : 'unarchive'} game. Please try again.`);
    }
  };

  const handleDelete = async (id: number) => {
    const game = games.find(g => g.id === id);
    const message = game?.archived 
      ? 'This game is archived. Are you sure you want to permanently delete it? This action cannot be undone.'
      : 'Are you sure you want to permanently delete this game? This will remove all related data including inventory, images, and reviews. Consider archiving instead if you want to keep the data but hide it from the store.';
    
    if (!confirm(message)) return;

    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchGames();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete game');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete each selected game
      const deletePromises = Array.from(selectedGames).map(async (id) => {
        const response = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete game ${id}`);
        }
        return response;
      });
      
      const results = await Promise.allSettled(deletePromises);
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        const errorMessages = failures.map((f: any) => f.reason?.message || 'Unknown error').join('\n');
        alert(`Failed to delete some games:\n${errorMessages}`);
      }
      
      // Refresh the list and clear selection
      await fetchGames();
      setSelectedGames(new Set());
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting games:', error);
      alert('Failed to delete games. Please try again.');
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#94a3b8',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Show Archived
          </label>
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
                    {(() => {
                      const displayImage = getDisplayImage(game);
                      return displayImage ? (
                        <Image
                          src={displayImage}
                          alt={game.title}
                          width={60}
                          height={60}
                          unoptimized
                          style={{
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
                      );
                    })()}
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
                      {game.archived && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(107, 114, 128, 0.2)',
                          borderColor: '#6b7280',
                          color: '#d1d5db',
                        }}>
                          Archived
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
                        onClick={() => handleArchive(game.id, !game.archived)}
                        style={{
                          ...adminStyles.iconButton,
                          color: game.archived ? '#86efac' : '#fbbf24',
                        }}
                        title={game.archived ? 'Unarchive' : 'Archive'}
                      >
                        {game.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
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
        message={`Are you sure you want to permanently delete ${selectedCount} ${selectedCount === 1 ? 'game' : 'games'}? This action cannot be undone and will remove all related data including inventory, images, and reviews.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
      />
    </>
  );
}