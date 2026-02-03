'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, X, Star, Trash2, GripVertical, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/app/components/ImageUpload';

type GameImageType = 'COVER' | 'BACK' | 'BOX_3D' | 'LOGO' | 'LIFESTYLE' | 'COMPONENTS' | 'INSTRUCTIONS';

interface GameImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  imageType: GameImageType;
  isPrimary: boolean;
  sortOrder: number;
}

// Image type configuration
const IMAGE_TYPES: { value: GameImageType; label: string; description: string; isSingle: boolean }[] = [
  { value: 'COVER', label: 'Cover', description: 'Main box front/product shot', isSingle: true },
  { value: 'BACK', label: 'Back', description: 'Box back showing details', isSingle: true },
  { value: 'BOX_3D', label: '3D Box', description: 'Rendered 3D view', isSingle: true },
  { value: 'LOGO', label: 'Logo', description: 'Game logo/badge', isSingle: true },
  { value: 'LIFESTYLE', label: 'Lifestyle', description: 'Action shots of people playing', isSingle: false },
  { value: 'COMPONENTS', label: 'Components', description: 'Contents laid out', isSingle: false },
  { value: 'INSTRUCTIONS', label: 'Instructions', description: 'Rules/how-to-play visuals', isSingle: false },
];

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  teaser: string | null;
  story: string | null;
  description: string;
  priceCents: number;
  ageRating: string;
  category: string;
  playerCount: string;
  playerCountCustom: string | null;
  playTime: string;
  playTimeCustom: string | null;
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  bundleInfo: string | null;
  stock: number;
  tags: string | null;

  // Game details
  components: string | null;
  howToPlay: string | null;
  setupTime: string | null;
  difficulty: string | null;
  designer: string | null;
  artist: string | null;
  publisher: string | null;
  releaseYear: number | null;
  videoUrl: string | null;
  bggUrl: string | null;
  launchDate: string | null;
  isHidden?: boolean;
  weightOz?: number | null;
}

interface GameEditFormEnhancedProps {
  game: Game;
  isNew?: boolean;
}

// Enum mappings
const AGE_RATINGS = [
  { value: 'ALL_AGES', label: 'All Ages' },
  { value: 'ELEVEN_PLUS', label: '11+' },
  { value: 'FOURTEEN_PLUS', label: '14+' },
  { value: 'SIXTEEN_PLUS', label: '16+' },
  { value: 'EIGHTEEN_PLUS', label: '18+' },
  { value: 'TWENTYONE_PLUS', label: '21+' }
];

const GAME_CATEGORIES = [
  { value: 'GAME', label: 'Game' },
  { value: 'MOD', label: 'Mod' },
  { value: 'EXPANSION', label: 'Expansion' }
];

const PLAYER_COUNTS = [
  { value: 'SINGLE', label: '1 Player' },
  { value: 'TWO', label: '2 Players' },
  { value: 'TWO_TO_FOUR', label: '2-4 Players' },
  { value: 'TWO_TO_SIX', label: '2-6 Players' },
  { value: 'THREE_TO_FIVE', label: '3-5 Players' },
  { value: 'THREE_TO_SIX', label: '3-6 Players' },
  { value: 'FOUR_TO_EIGHT', label: '4-8 Players' },
  { value: 'PARTY', label: '6+ Players' },
  { value: 'CUSTOM', label: 'Custom Range' }
];

const PLAY_TIMES = [
  { value: 'QUICK', label: 'Under 30 min' },
  { value: 'SHORT', label: '30-60 min' },
  { value: 'MEDIUM', label: '60-90 min' },
  { value: 'LONG', label: '90-120 min' },
  { value: 'EXTENDED', label: '2+ hours' },
  { value: 'VARIABLE', label: 'Varies' }
];

export default function GameEditFormEnhanced({ game, isNew = false }: GameEditFormEnhancedProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ...game,
    launchDate: game.launchDate ? new Date(game.launchDate).toISOString().split('T')[0] : ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>(game.tags ? JSON.parse(game.tags) : []);
  const [newTag, setNewTag] = useState('');

  // Image management state
  const [images, setImages] = useState<GameImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageMessage, setImageMessage] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageType, setNewImageType] = useState<GameImageType>('COVER');
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Fetch images on mount (only for existing games)
  useEffect(() => {
    if (!isNew && game.id) {
      fetchImages();
    } else {
      setImagesLoading(false);
    }
  }, [game.id, isNew]);

  const fetchImages = async () => {
    try {
      setImagesLoading(true);
      const response = await fetch(`/api/games/${game.id}/images`);
      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl) return;
    const typeConfig = IMAGE_TYPES.find(t => t.value === newImageType);
    try {
      const response = await fetch(`/api/games/${game.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newImageUrl,
          alt: `${game.title} - ${typeConfig?.label || 'Image'}`,
          imageType: newImageType,
          isPrimary: newImageType === 'COVER' && !images.some(i => i.imageType === 'COVER')
        })
      });
      if (response.ok) {
        const replacedMsg = typeConfig?.isSingle ? ' (replaced existing)' : '';
        setImageMessage(`${typeConfig?.label} image added!${replacedMsg}`);
        setNewImageUrl('');
        fetchImages();
        setTimeout(() => setImageMessage(''), 3000);
      }
    } catch (err) {
      setImageMessage('Error adding image');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      await fetch(`/api/games/${game.id}/images?imageId=${imageId}`, { method: 'DELETE' });
      setImageMessage('Image deleted');
      fetchImages();
      setTimeout(() => setImageMessage(''), 3000);
    } catch (err) {
      setImageMessage('Error deleting image');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await fetch(`/api/games/${game.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, isPrimary: true })
      });
      setImageMessage('Primary image updated');
      fetchImages();
      setTimeout(() => setImageMessage(''), 3000);
    } catch (err) {
      setImageMessage('Error setting primary');
    }
  };

  const handleImageDragStart = (index: number) => setDraggedImageIndex(index);

  const handleChangeImageType = async (imageId: number, newType: GameImageType) => {
    try {
      await fetch(`/api/games/${game.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, imageType: newType })
      });
      setImageMessage(`Changed to ${IMAGE_TYPES.find(t => t.value === newType)?.label}`);
      fetchImages();
      setTimeout(() => setImageMessage(''), 3000);
    } catch (err) {
      setImageMessage('Error changing type');
    }
  };

  const handleImageDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;

    const reordered = [...images];
    const [dragged] = reordered.splice(draggedImageIndex, 1);
    reordered.splice(dropIndex, 0, dragged);
    const updated = reordered.map((img, i) => ({ ...img, sortOrder: i }));
    setImages(updated);

    // Save new order
    for (const img of updated) {
      await fetch(`/api/games/${game.id}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: img.id, sortOrder: img.sortOrder })
      });
    }
    setDraggedImageIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const gameData = {
        ...formData,
        tags: JSON.stringify(tags),
        priceCents: parseInt(formData.priceCents.toString()),
        stock: parseInt(formData.stock.toString()),
        releaseYear: formData.releaseYear ? parseInt(formData.releaseYear.toString()) : null,
        weightOz: formData.weightOz ? parseInt(formData.weightOz.toString()) : null
      };

      const url = isNew ? '/api/admin/games' : `/api/admin/games/${game.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isNew ? 'create' : 'update'} game`);
      }

      router.push('/admin/games');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const styles = {
    container: {
      background: 'rgba(30, 41, 59, 0.8)',
      borderRadius: '16px',
      padding: '32px',
      border: '3px solid #f97316',
      backdropFilter: 'blur(10px)'
    },
    section: {
      marginBottom: '48px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '24px',
      borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
      paddingBottom: '12px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px'
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    label: {
      color: '#fde68a',
      fontSize: '14px',
      fontWeight: '600'
    },
    input: {
      background: 'rgba(17, 24, 39, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#e2e8f0',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    textarea: {
      background: 'rgba(17, 24, 39, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#e2e8f0',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s',
      minHeight: '120px',
      resize: 'vertical' as const
    },
    textareaLarge: {
      minHeight: '300px'
    },
    select: {
      background: 'rgba(17, 24, 39, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#e2e8f0',
      fontSize: '16px',
      outline: 'none',
      cursor: 'pointer'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '8px'
    },
    checkboxInput: {
      width: '20px',
      height: '20px',
      cursor: 'pointer'
    },
    helpText: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '16px',
      marginTop: '32px'
    },
    button: {
      padding: '14px 28px',
      borderRadius: '12px',
      fontWeight: 'bold',
      fontSize: '16px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    saveButton: {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white'
    },
    cancelButton: {
      background: 'rgba(156, 163, 175, 0.2)',
      color: '#e2e8f0',
      border: '2px solid rgba(156, 163, 175, 0.3)'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#fca5a5',
      marginBottom: '16px'
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '8px'
    },
    tag: {
      background: 'rgba(249, 115, 22, 0.2)',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '20px',
      padding: '6px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#fdba74',
      fontSize: '14px'
    },
    tagInput: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px'
    },
    addButton: {
      background: 'rgba(249, 115, 22, 0.2)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      padding: '8px 16px',
      color: '#fdba74',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '14px'
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}

      {/* Basic Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Basic Information</h2>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              required
            />
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>Tagline</label>
            <input
              type="text"
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="Optional catchy tagline"
            />
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>Teaser (Hero Hook)</label>
            <textarea
              value={formData.teaser || ''}
              onChange={(e) => setFormData({ ...formData, teaser: e.target.value })}
              style={{ ...styles.textarea, minHeight: '80px' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="Short, enticing marketing hook for the product hero section (1-2 sentences)"
            />
            <span style={styles.helpText}>This appears in the hero section. Make it intriguing, not complete - tease the experience!</span>
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={styles.textarea}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              required
            />
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>Story / Narrative</label>
            <textarea
              value={formData.story || ''}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              style={{ ...styles.textarea, minHeight: '150px' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="The game's backstory or narrative setup that draws players in..."
            />
            <span style={styles.helpText}>Displayed on the product page "The Story" section. Make it immersive!</span>
          </div>
        </div>
      </div>

      {/* Game Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Product Details</h2>
        <div style={styles.grid3}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={styles.select}
            >
              {GAME_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Age Rating</label>
            <select
              value={formData.ageRating}
              onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
              style={styles.select}
            >
              {AGE_RATINGS.map(rating => (
                <option key={rating.value} value={rating.value}>{rating.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Player Count</label>
            <select
              value={formData.playerCount}
              onChange={(e) => setFormData({ ...formData, playerCount: e.target.value })}
              style={styles.select}
            >
              {PLAYER_COUNTS.map(count => (
                <option key={count.value} value={count.value}>{count.label}</option>
              ))}
            </select>
          </div>

          {formData.playerCount === 'CUSTOM' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Custom Player Count</label>
              <input
                type="text"
                value={formData.playerCountCustom || ''}
                onChange={(e) => setFormData({ ...formData, playerCountCustom: e.target.value })}
                style={styles.input}
                placeholder="e.g., 2-10 Players"
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Play Time</label>
            <select
              value={formData.playTime}
              onChange={(e) => setFormData({ ...formData, playTime: e.target.value })}
              style={styles.select}
            >
              {PLAY_TIMES.map(time => (
                <option key={time.value} value={time.value}>{time.label}</option>
              ))}
            </select>
          </div>

          {formData.playTime === 'VARIABLE' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Custom Play Time</label>
              <input
                type="text"
                value={formData.playTimeCustom || ''}
                onChange={(e) => setFormData({ ...formData, playTimeCustom: e.target.value })}
                style={styles.input}
                placeholder="e.g., 45-75 minutes"
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Setup Time</label>
            <input
              type="text"
              value={formData.setupTime || ''}
              onChange={(e) => setFormData({ ...formData, setupTime: e.target.value })}
              style={styles.input}
              placeholder="e.g., 5 minutes"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Difficulty</label>
            <input
              type="text"
              value={formData.difficulty || ''}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              style={styles.input}
              placeholder="e.g., Easy to learn, hard to master"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Release Year</label>
            <input
              type="number"
              value={formData.releaseYear || ''}
              onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value ? parseInt(e.target.value) : null })}
              style={styles.input}
              placeholder="e.g., 2025"
              min="2020"
              max="2030"
            />
          </div>
        </div>
      </div>

      {/* Credits & Publishing */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Credits & Publishing</h2>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Designer</label>
            <input
              type="text"
              value={formData.designer || ''}
              onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
              style={styles.input}
              placeholder="Game designer name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Artist</label>
            <input
              type="text"
              value={formData.artist || ''}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              style={styles.input}
              placeholder="Game artist name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Publisher</label>
            <input
              type="text"
              value={formData.publisher || ''}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              style={styles.input}
              placeholder="Full Uproar Games"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>BoardGameGeek URL</label>
            <input
              type="text"
              value={formData.bggUrl || ''}
              onChange={(e) => setFormData({ ...formData, bggUrl: e.target.value })}
              style={styles.input}
              placeholder="https://boardgamegeek.com/boardgame/..."
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Pricing & Inventory</h2>
        <div style={styles.grid3}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Price (in cents)</label>
            <input
              type="number"
              value={formData.priceCents}
              onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) || 0 })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              required
            />
            <span style={styles.helpText}>Enter 1999 for $19.99</span>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Stock (Legacy)</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            />
            <span style={styles.helpText}>Use Inventory management instead</span>
          </div>

          {/* Legacy imageUrl field - hidden but preserved for data migration */}
          <input
            type="hidden"
            value={formData.imageUrl || ''}
            name="imageUrl"
          />

          <div style={styles.inputGroup}>
            <label style={styles.label}>Weight (oz)</label>
            <input
              type="number"
              value={formData.weightOz || ''}
              onChange={(e) => setFormData({ ...formData, weightOz: e.target.value ? parseInt(e.target.value) : null })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="e.g., 32"
              min="1"
            />
            <span style={styles.helpText}>Product weight in ounces for shipping (16 oz = 1 lb)</span>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ImageIcon size={24} />
            Product Images
            {!isNew && (
              <Link
                href={`/admin/manage-images/game/${game.id}`}
                style={{
                  fontSize: '14px',
                  color: '#f97316',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: 'auto',
                  fontWeight: 'normal'
                }}
              >
                Full Image Manager <ExternalLink size={14} />
              </Link>
            )}
          </span>
        </h2>

        {isNew && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            color: '#fde68a',
            textAlign: 'center'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Save the game first to add images</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              After creating the game, you can add product images using the image gallery.
            </p>
          </div>
        )}

        {!isNew && imageMessage && (
          <div style={{
            background: imageMessage.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${imageMessage.includes('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: imageMessage.includes('Error') ? '#fca5a5' : '#86efac'
          }}>
            {imageMessage}
          </div>
        )}

        {!isNew && (
          <>
        {/* Add New Image */}
        <div style={{ marginBottom: '24px' }}>
          <label style={styles.label}>Add New Image</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
            <div>
              <ImageUpload
                onImageUploaded={(url) => setNewImageUrl(url)}
                currentImageUrl={newImageUrl}
              />
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                style={{ ...styles.input, marginTop: '8px' }}
                placeholder="Or paste image URL..."
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={newImageType}
                onChange={(e) => setNewImageType(e.target.value as GameImageType)}
                style={{
                  ...styles.select,
                  minWidth: '140px',
                  fontSize: '14px',
                  padding: '10px'
                }}
              >
                {IMAGE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} {type.isSingle ? '(1)' : '(+)'}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '140px' }}>
                {IMAGE_TYPES.find(t => t.value === newImageType)?.description}
              </span>
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!newImageUrl}
                style={{
                  ...styles.addButton,
                  opacity: !newImageUrl ? 0.5 : 1
                }}
              >
                <Plus size={16} />
                Add {IMAGE_TYPES.find(t => t.value === newImageType)?.label}
              </button>
            </div>
          </div>
        </div>

        {/* Legacy Image URL Notice - Always show if there's a legacy URL */}
        {formData.imageUrl && !imagesLoading && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <img
              src={formData.imageUrl}
              alt={game.title}
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fde68a', fontWeight: 'bold', marginBottom: '4px' }}>
                Legacy Image URL
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
                {images.length > 0
                  ? 'You have gallery images. Clear this legacy URL to use only the gallery.'
                  : 'This image is in the old format. Migrate it to the gallery or clear it.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.length === 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/games/${game.id}/images`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            imageUrl: formData.imageUrl,
                            alt: `${game.title} - Cover`,
                            imageType: 'COVER',
                            isPrimary: true,
                            sortOrder: 0
                          })
                        });
                        if (response.ok) {
                          setImageMessage('Image migrated to gallery as Cover!');
                          setFormData({ ...formData, imageUrl: null });
                          fetchImages();
                          setTimeout(() => setImageMessage(''), 3000);
                        }
                      } catch (err) {
                        setImageMessage('Error migrating image');
                      }
                    }}
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#86efac',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    Migrate to Gallery
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear this legacy image URL? This won\'t delete any gallery images.')) {
                      setFormData({ ...formData, imageUrl: null });
                      setImageMessage('Legacy image URL cleared. Save to confirm.');
                      setTimeout(() => setImageMessage(''), 3000);
                    }
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X size={14} />
                  Clear Legacy URL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Images Grid */}
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>Current Images ({images.length})</label>
          {imagesLoading ? (
            <p style={{ color: '#94a3b8' }}>Loading images...</p>
          ) : images.length === 0 && !formData.imageUrl ? (
            <p style={{ color: '#94a3b8' }}>No images yet. Add your first image above.</p>
          ) : images.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>Use the button above to migrate your legacy image, or add new images.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '12px'
            }}>
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleImageDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleImageDrop(e, index)}
                  style={{
                    background: 'rgba(17, 24, 39, 0.5)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: image.isPrimary ? '3px solid #f97316' : '2px solid rgba(249, 115, 22, 0.3)',
                    cursor: 'move',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={image.imageUrl}
                      alt={image.alt || game.title}
                      style={{
                        width: '100%',
                        height: '140px',
                        objectFit: 'cover'
                      }}
                    />
                    {/* Type badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fdba74',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {IMAGE_TYPES.find(t => t.value === image.imageType)?.label || image.imageType}
                      </div>
                      {image.isPrimary && (
                        <div style={{
                          background: '#f97316',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Star size={10} fill="white" />
                          PRIMARY
                        </div>
                      )}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '4px'
                    }}>
                      <GripVertical size={16} color="white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                    </div>
                  </div>
                  <div style={{ padding: '10px' }}>
                    {/* Type changer */}
                    <select
                      value={image.imageType}
                      onChange={(e) => handleChangeImageType(image.id, e.target.value as GameImageType)}
                      style={{
                        width: '100%',
                        background: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        color: '#e2e8f0',
                        fontSize: '11px',
                        marginBottom: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {IMAGE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label} {type.isSingle ? '(single)' : '(gallery)'}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {!image.isPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(image.id)}
                          style={{
                            background: 'rgba(249, 115, 22, 0.2)',
                            border: '1px solid rgba(249, 115, 22, 0.4)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: '#fdba74',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Star size={10} />
                          Primary
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>Main</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          color: '#fca5a5',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p style={{ ...styles.helpText, marginTop: '12px' }}>
            Drag images to reorder. The primary image appears as the main product photo.
          </p>
        </div>
          </>
        )}
      </div>

      {/* Game Content */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Game Content</h2>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Components (What's in the Box)</label>
          <textarea
            value={formData.components || ''}
            onChange={(e) => setFormData({ ...formData, components: e.target.value })}
            style={styles.textarea}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            placeholder="List all components included in the game"
          />
          <span style={styles.helpText}>List each component on a new line</span>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>How to Play Instructions</label>
          <textarea
            value={formData.howToPlay || ''}
            onChange={(e) => setFormData({ ...formData, howToPlay: e.target.value })}
            style={{ ...styles.textarea, ...styles.textareaLarge }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            placeholder="Enter detailed instructions on how to play the game"
          />
          <span style={styles.helpText}>Supports basic HTML or markdown formatting</span>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Video URL (YouTube Embed)</label>
          <input
            type="text"
            value={formData.videoUrl || ''}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            style={styles.input}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
          />
          <span style={styles.helpText}>Use the embed URL format</span>
        </div>
      </div>

      {/* Bundle Information */}
      {formData.isBundle && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Bundle Information</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bundle Contents</label>
            <textarea
              value={formData.bundleInfo || ''}
              onChange={(e) => setFormData({ ...formData, bundleInfo: e.target.value })}
              style={styles.textarea}
              placeholder="Describe what's included in this bundle"
            />
          </div>
        </div>
      )}

      {/* Display Options & Launch */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Display Options & Launch</h2>
        
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Launch Date</label>
            <input
              type="date"
              value={formData.launchDate}
              onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
              style={styles.input}
            />
            <span style={styles.helpText}>Set for pre-orders or to show release date</span>
          </div>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ ...styles.label, marginBottom: '16px', fontSize: '16px' }}>Badges & Display Options</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                style={styles.checkboxInput}
              />
              <label htmlFor="featured" style={styles.label}>Featured Game</label>
            </div>

            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="isNew"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                style={styles.checkboxInput}
              />
              <label htmlFor="isNew" style={styles.label}>Show "NEW" Badge</label>
            </div>

            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="isBestseller"
                checked={formData.isBestseller}
                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                style={styles.checkboxInput}
              />
              <label htmlFor="isBestseller" style={styles.label}>Show "BESTSELLER" Badge</label>
            </div>

            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="isPreorder"
                checked={formData.isPreorder}
                onChange={(e) => setFormData({ ...formData, isPreorder: e.target.checked })}
                style={styles.checkboxInput}
              />
              <label htmlFor="isPreorder" style={styles.label}>Available for Pre-order</label>
            </div>

            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="isBundle"
                checked={formData.isBundle}
                onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked })}
                style={styles.checkboxInput}
              />
              <label htmlFor="isBundle" style={styles.label}>This is a Bundle</label>
            </div>
          </div>

          {/* Hidden Product Option - Standalone with highlight */}
          <div style={{
            marginTop: '24px',
            background: formData.isHidden ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            padding: '16px',
            borderRadius: '8px',
            border: formData.isHidden ? '2px solid #eab308' : '2px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="isHidden"
                checked={formData.isHidden || false}
                onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                style={styles.checkboxInput}
              />
              <label htmlFor="isHidden" style={{ ...styles.label, color: formData.isHidden ? '#eab308' : '#fca5a5' }}>
                Hidden from Public Shop (Test Product)
              </label>
            </div>
            <p style={{ ...styles.helpText, marginTop: '8px', color: formData.isHidden ? '#fde68a' : '#fca5a5' }}>
              {formData.isHidden
                ? 'This product is hidden from the public shop. Only accessible via direct URL.'
                : 'Check this to hide the product from the public shop (for testing).'}
            </p>
          </div>
        </div>
      </div>

      {/* Tags & SEO */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Tags & SEO</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Tags</label>
          <div style={styles.tagInput}>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              style={{ ...styles.input, flex: 1 }}
              placeholder="Add a tag..."
            />
            <button type="button" onClick={addTag} style={styles.addButton}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Add
            </button>
          </div>
          <div style={styles.tagContainer}>
            {tags.map(tag => (
              <div key={tag} style={styles.tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X style={{ width: '14px', height: '14px', color: '#fdba74' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonGroup}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            ...styles.button,
            ...styles.saveButton,
            opacity: isLoading ? 0.5 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          <Save style={{ width: '20px', height: '20px' }} />
          {isLoading ? 'Saving...' : isNew ? 'Create Game' : 'Save Changes'}
        </button>
        
        <Link
          href="/admin/dashboard"
          style={{
            ...styles.button,
            ...styles.cancelButton,
            textDecoration: 'none'
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
          Cancel
        </Link>
      </div>
    </form>
  );
}