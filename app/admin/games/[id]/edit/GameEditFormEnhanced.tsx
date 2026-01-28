'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
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

export default function GameEditFormEnhanced({ game }: GameEditFormEnhancedProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ...game,
    launchDate: game.launchDate ? new Date(game.launchDate).toISOString().split('T')[0] : ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>(game.tags ? JSON.parse(game.tags) : []);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: JSON.stringify(tags),
          priceCents: parseInt(formData.priceCents.toString()),
          stock: parseInt(formData.stock.toString()),
          releaseYear: formData.releaseYear ? parseInt(formData.releaseYear.toString()) : null,
          weightOz: formData.weightOz ? parseInt(formData.weightOz.toString()) : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update game');
      }

      router.push('/admin/dashboard');
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
        </div>
      </div>

      {/* Game Details */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Game Details</h2>
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>Image URL</label>
            <input
              type="text"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              style={styles.input}
              placeholder="https://..."
            />
          </div>

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
          {isLoading ? 'Saving...' : 'Save Changes'}
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