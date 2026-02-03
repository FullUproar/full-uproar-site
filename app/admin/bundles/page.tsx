'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, Search, Package,
  DollarSign, Layers, Tag
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface BundleGame {
  id: number;
  title: string;
  priceCents: number;
  imageUrl: string | null;
}

interface Bundle {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  featured: boolean;
  isNew: boolean;
  stock: number;
  bundleInfo: string | null;
  includedGames?: BundleGame[];
}

export default function BundlesAdminPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [allGames, setAllGames] = useState<BundleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchBundles();
    fetchAllGames();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/admin/bundles');
      const data = await response.json();
      setBundles(data);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGames = async () => {
    try {
      const response = await fetch('/api/admin/games?excludeBundles=true');
      const data = await response.json();
      setAllGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const response = await fetch(`/api/admin/bundles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBundles(bundles.filter(bundle => bundle.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  };

  // Parse bundleInfo and enrich with game data
  const enrichBundleWithGames = (bundle: Bundle): Bundle => {
    if (!bundle.bundleInfo) return { ...bundle, includedGames: [] };

    try {
      const gameIds: number[] = JSON.parse(bundle.bundleInfo);
      const includedGames = gameIds
        .map(id => allGames.find(g => g.id === id))
        .filter((g): g is BundleGame => g !== undefined);
      return { ...bundle, includedGames };
    } catch {
      return { ...bundle, includedGames: [] };
    }
  };

  const filteredBundles = bundles
    .map(enrichBundleWithGames)
    .filter(bundle =>
      bundle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const calculateRetailValue = (bundle: Bundle): number => {
    return bundle.includedGames?.reduce((sum, game) => sum + game.priceCents, 0) || 0;
  };

  const calculateSavings = (bundle: Bundle): number => {
    const retailValue = calculateRetailValue(bundle);
    return retailValue > 0 ? retailValue - bundle.priceCents : 0;
  };

  const calculateSavingsPercent = (bundle: Bundle): number => {
    const retailValue = calculateRetailValue(bundle);
    if (retailValue <= 0) return 0;
    return Math.round(((retailValue - bundle.priceCents) / retailValue) * 100);
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
            <h1 style={adminStyles.title}>
              <Layers size={36} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
              Bundle Manager
            </h1>
            <p style={adminStyles.subtitle}>
              Create and manage game bundles with discounted pricing
            </p>
          </div>
          <Link
            href="/admin/bundles/new"
            style={{
              ...adminStyles.button,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <Plus size={16} />
            Create Bundle
          </Link>
        </div>

        {/* Search Bar */}
        <div style={adminStyles.section}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
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
              placeholder="Search bundles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...adminStyles.input,
                paddingLeft: '44px',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Bundles Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            Loading bundles...
          </div>
        ) : filteredBundles.length === 0 ? (
          <div style={adminStyles.section}>
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Layers size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No bundles found</h3>
              <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Create your first bundle to offer customers great deals'}
              </p>
              <Link
                href="/admin/bundles/new"
                style={{
                  ...adminStyles.button,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                }}
              >
                <Plus size={16} />
                Create Your First Bundle
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {filteredBundles.map((bundle) => {
              const retailValue = calculateRetailValue(bundle);
              const savings = calculateSavings(bundle);
              const savingsPercent = calculateSavingsPercent(bundle);

              return (
                <div
                  key={bundle.id}
                  style={{
                    ...adminStyles.section,
                    marginBottom: 0,
                    position: 'relative',
                  }}
                >
                  {/* Savings Badge */}
                  {savingsPercent > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '16px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                    }}>
                      Save {savingsPercent}%
                    </div>
                  )}

                  {/* Bundle Image */}
                  <div style={{
                    height: '160px',
                    background: bundle.imageUrl
                      ? `url(${bundle.imageUrl}) center/cover`
                      : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {!bundle.imageUrl && <Layers size={40} style={{ color: '#f97316' }} />}

                    {/* Badges */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      gap: '8px',
                    }}>
                      {bundle.featured && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(251, 191, 36, 0.9)',
                          borderColor: '#fbbf24',
                          color: '#111827',
                        }}>
                          Featured
                        </span>
                      )}
                      {bundle.isNew && (
                        <span style={{
                          ...adminStyles.badge,
                          background: 'rgba(16, 185, 129, 0.9)',
                          borderColor: '#10b981',
                          color: 'white',
                        }}>
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bundle Info */}
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#fde68a',
                    marginBottom: '4px',
                  }}>
                    {bundle.title}
                  </h3>
                  {bundle.tagline && (
                    <p style={{
                      fontSize: '14px',
                      color: '#94a3b8',
                      marginBottom: '12px',
                      fontStyle: 'italic',
                    }}>
                      {bundle.tagline}
                    </p>
                  )}

                  {/* Included Games */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#fdba74',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Includes {bundle.includedGames?.length || 0} Games:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {bundle.includedGames?.slice(0, 4).map((game) => (
                        <span
                          key={game.id}
                          style={{
                            background: 'rgba(249, 115, 22, 0.1)',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: '#e2e8f0',
                          }}
                        >
                          {game.title}
                        </span>
                      ))}
                      {(bundle.includedGames?.length || 0) > 4 && (
                        <span style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: '#a78bfa',
                        }}>
                          +{bundle.includedGames!.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                        Retail Value
                      </div>
                      <div style={{
                        fontSize: '16px',
                        color: '#e2e8f0',
                        textDecoration: 'line-through',
                        opacity: 0.7,
                      }}>
                        ${(retailValue / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                        Bundle Price
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#10b981',
                      }}>
                        ${(bundle.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                        Customer Saves
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fbbf24',
                      }}>
                        ${(savings / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                        Stock
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: bundle.stock > 0 ? '#10b981' : '#ef4444',
                        fontWeight: 'bold',
                      }}>
                        {bundle.stock > 0 ? `${bundle.stock} available` : 'Out of stock'}
                      </div>
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
                      href={`/shop/games/${bundle.slug}`}
                      style={{
                        ...adminStyles.outlineButton,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        padding: '8px 12px',
                        textDecoration: 'none',
                      }}
                    >
                      <Eye size={14} />
                      View
                    </Link>
                    <Link
                      href={`/admin/bundles/${bundle.id}/edit`}
                      style={{
                        ...adminStyles.button,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        padding: '8px 12px',
                        textDecoration: 'none',
                      }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(bundle.id)}
                      style={{
                        ...adminStyles.dangerButton,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        padding: '8px 12px',
                      }}
                    >
                      <Trash2 size={14} />
                      {deleteConfirm === bundle.id ? 'Confirm' : ''}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
