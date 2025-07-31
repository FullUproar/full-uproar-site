'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  category: string;
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo: string | null;
  stock: number;
  tags: string | null;
  howToPlay: string | null;
  components: string | null;
  videoUrl: string | null;
}

interface GameEditFormProps {
  game: Game;
}

export default function GameEditForm({ game }: GameEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: game.title,
    slug: game.slug,
    tagline: game.tagline || '',
    description: game.description,
    priceCents: game.priceCents,
    players: game.players,
    timeToPlay: game.timeToPlay,
    ageRating: game.ageRating,
    category: game.category,
    imageUrl: game.imageUrl || '',
    isBundle: game.isBundle,
    isPreorder: game.isPreorder,
    featured: game.featured,
    bundleInfo: game.bundleInfo || '',
    stock: game.stock,
    howToPlay: game.howToPlay || '',
    components: game.components || '',
    videoUrl: game.videoUrl || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  const styles = {
    container: {
      background: 'rgba(30, 41, 59, 0.8)',
      borderRadius: '16px',
      padding: '32px',
      border: '3px solid #f97316',
      backdropFilter: 'blur(10px)'
    },
    section: {
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '16px',
      borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
      paddingBottom: '8px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px'
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
              value={formData.tagline}
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
        <div style={styles.grid}>
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
            <label style={styles.label}>Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Players</label>
            <input
              type="text"
              value={formData.players}
              onChange={(e) => setFormData({ ...formData, players: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="e.g., 2-4 Players"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Time to Play</label>
            <input
              type="text"
              value={formData.timeToPlay}
              onChange={(e) => setFormData({ ...formData, timeToPlay: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="e.g., 30-45 min"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Age Rating</label>
            <input
              type="text"
              value={formData.ageRating}
              onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="e.g., 13+"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={styles.select}
            >
              <option value="game">Game</option>
              <option value="mod">Mod</option>
            </select>
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>Image URL</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* How to Play Content */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>How to Play</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>How to Play Instructions</label>
          <textarea
            value={formData.howToPlay}
            onChange={(e) => setFormData({ ...formData, howToPlay: e.target.value })}
            style={{ ...styles.textarea, ...styles.textareaLarge }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            placeholder="Enter detailed instructions on how to play the game. You can use markdown formatting."
          />
          <span style={styles.helpText}>Supports basic HTML or line breaks. Use {'<br>'} for line breaks.</span>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Components (What's in the Box)</label>
          <textarea
            value={formData.components}
            onChange={(e) => setFormData({ ...formData, components: e.target.value })}
            style={styles.textarea}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            placeholder="List all components included in the game"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Video URL (YouTube Embed)</label>
          <input
            type="text"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            style={styles.input}
            onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
          />
          <span style={styles.helpText}>Use the embed URL format: https://www.youtube.com/embed/VIDEO_ID</span>
        </div>
      </div>

      {/* Bundle Information */}
      {formData.isBundle && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Bundle Information</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bundle Contents</label>
            <textarea
              value={formData.bundleInfo}
              onChange={(e) => setFormData({ ...formData, bundleInfo: e.target.value })}
              style={styles.textarea}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              placeholder="Describe what's included in this bundle"
            />
          </div>
        </div>
      )}

      {/* Options */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Options</h2>
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
            id="isBundle"
            checked={formData.isBundle}
            onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked })}
            style={styles.checkboxInput}
          />
          <label htmlFor="isBundle" style={styles.label}>This is a Bundle</label>
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