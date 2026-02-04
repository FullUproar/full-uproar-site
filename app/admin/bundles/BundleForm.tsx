'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Plus, X, Check, DollarSign, Layers,
  Package, Percent, AlertCircle, GripVertical
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import ImageUpload from '@/app/components/ImageUpload';

interface Game {
  id: number;
  title: string;
  slug: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  category: string;
}

interface BundleFormProps {
  bundle?: {
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
  };
  isEdit?: boolean;
}

export default function BundleForm({ bundle, isEdit = false }: BundleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: bundle?.title || '',
    slug: bundle?.slug || '',
    tagline: bundle?.tagline || '',
    description: bundle?.description || '',
    priceCents: bundle?.priceCents || 0,
    imageUrl: bundle?.imageUrl || '',
    featured: bundle?.featured || false,
    isNew: bundle?.isNew ?? true,
    stock: bundle?.stock || 100,
  });

  // Parse existing bundleInfo if editing
  useEffect(() => {
    if (bundle?.bundleInfo) {
      try {
        const gameIds = JSON.parse(bundle.bundleInfo);
        setSelectedGameIds(gameIds);
      } catch (e) {
        console.error('Error parsing bundleInfo:', e);
      }
    }
  }, [bundle]);

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/admin/games?excludeBundles=true');
        const data = await response.json();
        setAvailableGames(data);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };
    fetchGames();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, isEdit]);

  // Calculate totals
  const selectedGames = availableGames.filter(g => selectedGameIds.includes(g.id));
  const retailValue = selectedGames.reduce((sum, g) => sum + g.priceCents, 0);
  const savings = retailValue - formData.priceCents;
  const savingsPercent = retailValue > 0 ? Math.round((savings / retailValue) * 100) : 0;

  // Suggested price (20% off retail)
  const suggestedPrice = Math.round(retailValue * 0.8);

  const handleAddGame = (gameId: number) => {
    if (!selectedGameIds.includes(gameId)) {
      setSelectedGameIds([...selectedGameIds, gameId]);
    }
  };

  const handleRemoveGame = (gameId: number) => {
    setSelectedGameIds(selectedGameIds.filter(id => id !== gameId));
  };

  const handleMoveGame = (fromIndex: number, toIndex: number) => {
    const newOrder = [...selectedGameIds];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setSelectedGameIds(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedGameIds.length < 2) {
      setError('A bundle must include at least 2 games');
      setLoading(false);
      return;
    }

    if (formData.priceCents >= retailValue) {
      setError('Bundle price should be less than the combined retail value');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isEdit
        ? `/api/admin/bundles/${bundle?.id}`
        : '/api/admin/bundles';

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bundleInfo: JSON.stringify(selectedGameIds),
          isBundle: true,
          // Use defaults for game-specific fields
          playerCount: 'VARIES',
          playTime: 'VARIES',
          ageRating: 'FOURTEEN_PLUS',
          category: 'GAME',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save bundle');
      }

      router.push('/admin/bundles');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    form: {
      display: 'grid',
      gap: '24px',
    },
    twoColumn: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      color: '#FBDB65',
      fontSize: '14px',
      fontWeight: '600',
    },
    input: {
      ...adminStyles.input,
      width: '100%',
    },
    textarea: {
      ...adminStyles.input,
      minHeight: '120px',
      resize: 'vertical' as const,
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
    },
    checkboxInput: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
    },
    gameSelector: {
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '20px',
    },
    gameList: {
      maxHeight: '300px',
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    gameItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 130, 0, 0.2)',
    },
    gameImage: {
      width: '50px',
      height: '50px',
      borderRadius: '6px',
      objectFit: 'cover' as const,
      background: 'rgba(255, 130, 0, 0.1)',
    },
    selectedGame: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'rgba(255, 130, 0, 0.1)',
      borderRadius: '8px',
      border: '2px solid rgba(255, 130, 0, 0.5)',
    },
    pricingSummary: {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 130, 0, 0.1) 100%)',
      border: '2px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '12px',
      padding: '24px',
    },
    priceRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    bigPrice: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#10b981',
    },
    savingsBadge: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '16px',
    },
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <Link
          href="/admin/bundles"
          style={adminStyles.backButton}
        >
          <ArrowLeft size={20} />
          Back to Bundles
        </Link>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={adminStyles.title}>
            <Layers size={36} style={{ display: 'inline', marginRight: '12px', verticalAlign: 'middle' }} />
            {isEdit ? 'Edit Bundle' : 'Create New Bundle'}
          </h1>
          <p style={adminStyles.subtitle}>
            {isEdit
              ? 'Update bundle details and included games'
              : 'Combine multiple games into a discounted bundle'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fca5a5',
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Basic Info Section */}
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>Bundle Details</h2>

            <div style={styles.twoColumn}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Bundle Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Ultimate Party Pack"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>URL Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ultimate-party-pack"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={{ ...styles.inputGroup, marginTop: '20px' }}>
              <label style={styles.label}>Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A short catchy description"
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.inputGroup, marginTop: '20px' }}>
              <label style={styles.label}>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what makes this bundle special..."
                style={styles.textarea}
                required
              />
            </div>

            <div style={{ ...styles.inputGroup, marginTop: '20px' }}>
              <label style={styles.label}>Bundle Image</label>
              <ImageUpload
                onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                currentImageUrl={formData.imageUrl}
              />
              {formData.imageUrl && (
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Or enter image URL"
                  style={{ ...styles.input, marginTop: '8px' }}
                />
              )}
            </div>
          </div>

          {/* Game Selection Section */}
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>
              Select Games for Bundle
              <span style={{ fontWeight: 'normal', color: '#94a3b8', marginLeft: '8px' }}>
                (minimum 2)
              </span>
            </h2>

            {/* Selected Games */}
            {selectedGameIds.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '14px',
                  color: '#FBDB65',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                }}>
                  Included in Bundle ({selectedGameIds.length} games):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedGameIds.map((gameId, index) => {
                    const game = availableGames.find(g => g.id === gameId);
                    if (!game) return null;

                    return (
                      <div key={gameId} style={styles.selectedGame}>
                        <GripVertical size={16} style={{ color: '#94a3b8', cursor: 'grab' }} />
                        {game.imageUrl ? (
                          <img src={game.imageUrl} alt={game.title} style={styles.gameImage} />
                        ) : (
                          <div style={{ ...styles.gameImage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} style={{ color: '#FF8200' }} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#FBDB65', fontWeight: 'bold', fontSize: '15px' }}>
                            {game.title}
                          </div>
                          <div style={{ color: '#10b981', fontSize: '14px' }}>
                            ${(game.priceCents / 100).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGame(gameId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#fca5a5',
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Games */}
            <div style={styles.gameSelector}>
              <div style={{
                fontSize: '14px',
                color: '#94a3b8',
                marginBottom: '12px',
              }}>
                Click to add games:
              </div>
              <div style={styles.gameList}>
                {availableGames
                  .filter(g => !selectedGameIds.includes(g.id))
                  .map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleAddGame(game.id)}
                      style={{
                        ...styles.gameItem,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.5)';
                        e.currentTarget.style.background = 'rgba(255, 130, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.2)';
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                      }}
                    >
                      {game.imageUrl ? (
                        <img src={game.imageUrl} alt={game.title} style={styles.gameImage} />
                      ) : (
                        <div style={{ ...styles.gameImage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} style={{ color: '#94a3b8' }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#e2e8f0', fontWeight: '500' }}>
                          {game.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                          {game.category} • {game.stock} in stock
                        </div>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                        ${(game.priceCents / 100).toFixed(2)}
                      </div>
                      <Plus size={20} style={{ color: '#FF8200' }} />
                    </div>
                  ))}
                {availableGames.filter(g => !selectedGameIds.includes(g.id)).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    All games have been added to the bundle
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>Pricing</h2>

            <div style={styles.twoColumn}>
              <div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Bundle Price (cents) *</label>
                  <input
                    type="number"
                    value={formData.priceCents}
                    onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 4999 for $49.99"
                    style={styles.input}
                    required
                    min={1}
                  />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Displays as: ${(formData.priceCents / 100).toFixed(2)}
                  </span>
                </div>

                {retailValue > 0 && formData.priceCents === 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, priceCents: suggestedPrice })}
                    style={{
                      ...adminStyles.secondaryButton,
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Percent size={16} />
                    Apply 20% discount (${(suggestedPrice / 100).toFixed(2)})
                  </button>
                )}

                <div style={{ ...styles.inputGroup, marginTop: '20px' }}>
                  <label style={styles.label}>Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    style={styles.input}
                    min={0}
                  />
                </div>
              </div>

              {/* Pricing Summary */}
              {selectedGameIds.length > 0 && (
                <div style={styles.pricingSummary}>
                  <h3 style={{ color: '#FBDB65', marginBottom: '16px', fontSize: '16px' }}>
                    Pricing Summary
                  </h3>

                  <div style={styles.priceRow}>
                    <span style={{ color: '#94a3b8' }}>Retail Value ({selectedGameIds.length} games)</span>
                    <span style={{ color: '#e2e8f0', fontSize: '18px' }}>
                      ${(retailValue / 100).toFixed(2)}
                    </span>
                  </div>

                  <div style={styles.priceRow}>
                    <span style={{ color: '#94a3b8' }}>Bundle Price</span>
                    <span style={styles.bigPrice}>
                      ${(formData.priceCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ ...styles.priceRow, borderBottom: 'none' }}>
                    <span style={{ color: '#94a3b8' }}>Customer Saves</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '18px' }}>
                        ${(savings / 100).toFixed(2)}
                      </div>
                      {savingsPercent > 0 && (
                        <span style={styles.savingsBadge}>
                          {savingsPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  {savings <= 0 && formData.priceCents > 0 && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <AlertCircle size={16} />
                      Bundle price should be less than retail value
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Display Options */}
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>Display Options</h2>

            <div style={{ display: 'flex', gap: '32px' }}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  style={styles.checkboxInput}
                />
                <span style={{ color: '#e2e8f0' }}>Featured Bundle</span>
              </label>

              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  style={styles.checkboxInput}
                />
                <span style={{ color: '#e2e8f0' }}>Show "New" Badge</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <Link
              href="/admin/bundles"
              style={{
                ...adminStyles.secondaryButton,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || selectedGameIds.length < 2}
              style={{
                ...adminStyles.button,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loading || selectedGameIds.length < 2 ? 0.6 : 1,
                cursor: loading || selectedGameIds.length < 2 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? 'Update Bundle' : 'Create Bundle'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
