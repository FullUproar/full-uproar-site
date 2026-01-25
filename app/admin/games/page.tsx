'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Eye, Search, Filter,
  Package, DollarSign, Users, Clock, Tag, Image as ImageIcon
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  priceCents: number;
  playerCount: string;
  playTime: string;
  ageRating: string;
  category: string;
  featured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  stock: number;
  imageUrl: string | null;
}

export default function GamesAdminPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchGames();
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
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGames(games.filter(game => game.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.tagline?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || game.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPlayerCount = (count: string): string => {
    const mapping: Record<string, string> = {
      'SINGLE': '1 Player',
      'TWO': '2 Players',
      'TWO_PLUS': '2+ Players',
      'TWO_TO_FOUR': '2-4 Players',
      'TWO_TO_SIX': '2-6 Players',
      'THREE_TO_FIVE': '3-5 Players',
      'THREE_TO_SIX': '3-6 Players',
      'FOUR_TO_EIGHT': '4-8 Players',
      'PARTY': '6+ Players',
      'CUSTOM': 'Custom',
      'VARIES': 'Varies'
    };
    return mapping[count] || count;
  };

  const formatPlayTime = (time: string): string => {
    const mapping: Record<string, string> = {
      'QUICK': '< 30 min',
      'SHORT': '30-60 min',
      'MEDIUM': '60-90 min',
      'LONG': '90-120 min',
      'EXTENDED': '2+ hours',
      'VARIES': 'Varies'
    };
    return mapping[time] || time;
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <Link 
          href="/admin/dashboard" 
          style={adminStyles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={adminStyles.title}>Games Management</h1>
            <p style={adminStyles.subtitle}>
              Manage your game catalog and inventory
            </p>
          </div>
          <Link
            href="/admin/games/new"
            style={adminStyles.button}
            {...adminStyles.hoverEffects.button}
          >
            <Plus size={16} />
            Add New Game
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div style={adminStyles.section}>
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              flex: 1,
              minWidth: '200px',
              position: 'relative' 
            }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} 
              />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...adminStyles.input,
                  paddingLeft: '44px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                }}
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                ...adminStyles.input,
                width: 'auto',
                minWidth: '150px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              <option value="GAME">Games</option>
              <option value="MOD">Mods</option>
              <option value="EXPANSION">Expansions</option>
            </select>
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            Loading games...
          </div>
        ) : filteredGames.length === 0 ? (
          <div style={adminStyles.section}>
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Package size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No games found</h3>
              <p style={{ color: '#94a3b8' }}>
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first game'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                style={adminStyles.card}
                {...adminStyles.hoverEffects.card}
              >
                {/* Game Image */}
                <div style={{ 
                  height: '200px',
                  background: game.imageUrl 
                    ? `url(${game.imageUrl}) center/cover`
                    : 'rgba(249, 115, 22, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {!game.imageUrl && <ImageIcon size={40} style={{ color: '#94a3b8' }} />}
                  
                  {/* Badges */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    {game.featured && (
                      <span style={{
                        ...adminStyles.badge,
                        background: 'rgba(251, 191, 36, 0.9)',
                        borderColor: '#fbbf24',
                        color: '#111827',
                      }}>
                        Featured
                      </span>
                    )}
                    {game.isNew && (
                      <span style={{
                        ...adminStyles.badge,
                        background: 'rgba(16, 185, 129, 0.9)',
                        borderColor: '#10b981',
                        color: 'white',
                      }}>
                        New
                      </span>
                    )}
                    {game.isBestseller && (
                      <span style={{
                        ...adminStyles.badge,
                        background: 'rgba(239, 68, 68, 0.9)',
                        borderColor: '#ef4444',
                        color: 'white',
                      }}>
                        Bestseller
                      </span>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#fde68a',
                  marginBottom: '4px',
                }}>
                  {game.title}
                </h3>
                {game.tagline && (
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#94a3b8',
                    marginBottom: '12px',
                    fontStyle: 'italic',
                  }}>
                    {game.tagline}
                  </p>
                )}

                {/* Game Details */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
                    <DollarSign size={14} style={{ color: '#fdba74' }} />
                    ${(game.priceCents / 100).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
                    <Package size={14} style={{ color: '#fdba74' }} />
                    {game.stock} in stock
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
                    <Users size={14} style={{ color: '#fdba74' }} />
                    {formatPlayerCount(game.playerCount)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
                    <Clock size={14} style={{ color: '#fdba74' }} />
                    {formatPlayTime(game.playTime)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(249, 115, 22, 0.2)',
                }}>
                  <Link
                    href={`/shop/games/${game.slug}`}
                    style={{
                      ...adminStyles.outlineButton,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      padding: '6px 12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Eye size={14} />
                    View
                  </Link>
                  <Link
                    href={`/admin/games/${game.id}/edit`}
                    style={{
                      ...adminStyles.button,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      padding: '6px 12px',
                    }}
                    {...adminStyles.hoverEffects.button}
                  >
                    <Edit2 size={14} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(game.id)}
                    style={{
                      ...adminStyles.dangerButton,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      padding: '6px 12px',
                    }}
                    {...adminStyles.hoverEffects.button}
                  >
                    <Trash2 size={14} />
                    {deleteConfirm === game.id ? 'Confirm' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}