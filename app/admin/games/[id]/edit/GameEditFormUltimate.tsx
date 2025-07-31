'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, X, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';
import SymbolHelper from '@/app/components/SymbolHelper';

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
  leadDesigner: string | null;
  leadArtist: string | null;
  additionalDesigners: string | null;
  additionalArtists: string | null;
  publisher: string | null;
  releaseYear: number | null;
  videoUrl: string | null;
  bggUrl: string | null;
  
  // Launch date fields
  launchYear: number | null;
  launchMonth: number | null;
  launchDay: number | null;
  launchHour: number | null;
  launchMinute: number | null;
}

interface GameEditFormUltimateProps {
  game: Game;
}

// Your existing enum mappings here...
const AGE_RATINGS = [
  { value: 'ALL_AGES', label: 'All Ages' },
  { value: 'ELEVEN_PLUS', label: '11+' },
  { value: 'FOURTEEN_PLUS', label: '14+' },
  { value: 'SIXTEEN_PLUS', label: '16+' },
  { value: 'EIGHTEEN_PLUS', label: '18+' },
  { value: 'TWENTYONE_PLUS', label: '21+' },
];

const CATEGORIES = [
  { value: 'GAME', label: 'Game' },
  { value: 'MOD', label: 'Mod' },
  { value: 'EXPANSION', label: 'Expansion' },
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
  { value: 'CUSTOM', label: 'Custom' },
];

const PLAY_TIMES = [
  { value: 'QUICK', label: 'Under 30 min' },
  { value: 'SHORT', label: '30-60 min' },
  { value: 'MEDIUM', label: '60-90 min' },
  { value: 'LONG', label: '90-120 min' },
  { value: 'EXTENDED', label: '2+ hours' },
  { value: 'VARIABLE', label: 'Variable' },
];

export default function GameEditFormUltimate({ game }: GameEditFormUltimateProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ...game,
    tags: game.tags ? JSON.parse(game.tags) : [],
    additionalDesigners: game.additionalDesigners ? JSON.parse(game.additionalDesigners) : [],
    additionalArtists: game.additionalArtists ? JSON.parse(game.additionalArtists) : [],
  });
  const [newTag, setNewTag] = useState('');
  const [newDesigner, setNewDesigner] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  const titleRef = useRef<HTMLInputElement>(null);
  const taglineRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Check slug availability
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.slug && formData.slug !== game.slug) {
        setCheckingSlug(true);
        try {
          const response = await fetch('/api/admin/validate-slug', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              slug: formData.slug, 
              currentId: game.id,
              type: 'game'
            })
          });
          const data = await response.json();
          setSlugAvailable(data.available);
          setSlugMessage(data.message);
        } catch (error) {
          console.error('Slug check error:', error);
        }
        setCheckingSlug(false);
      }
    }, 500); // Debounce
    
    return () => clearTimeout(timer);
  }, [formData.slug, game.slug, game.id]);

  const insertSymbol = (symbol: string, fieldRef: any) => {
    if (fieldRef?.current) {
      const input = fieldRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const value = input.value;
      const newValue = value.substring(0, start) + symbol + value.substring(end);
      
      // Update the specific field
      const fieldName = input.name;
      setFormData({ ...formData, [fieldName]: newValue });
      
      // Restore cursor position
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + symbol.length, start + symbol.length);
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: JSON.stringify(formData.tags),
          additionalDesigners: JSON.stringify(formData.additionalDesigners),
          additionalArtists: JSON.stringify(formData.additionalArtists),
        }),
      });

      if (!response.ok) throw new Error('Failed to update game');
      
      router.push('/admin/games');
      router.refresh();
    } catch (error) {
      console.error('Error updating game:', error);
      alert('Failed to update game');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove) 
    });
  };

  const addDesigner = () => {
    if (newDesigner.trim() && !formData.additionalDesigners.includes(newDesigner.trim())) {
      setFormData({ 
        ...formData, 
        additionalDesigners: [...formData.additionalDesigners, newDesigner.trim()] 
      });
      setNewDesigner('');
    }
  };

  const removeDesigner = (designer: string) => {
    setFormData({ 
      ...formData, 
      additionalDesigners: formData.additionalDesigners.filter((d: string) => d !== designer) 
    });
  };

  const addArtist = () => {
    if (newArtist.trim() && !formData.additionalArtists.includes(newArtist.trim())) {
      setFormData({ 
        ...formData, 
        additionalArtists: [...formData.additionalArtists, newArtist.trim()] 
      });
      setNewArtist('';
    }
  };

  const removeArtist = (artist: string) => {
    setFormData({ 
      ...formData, 
      additionalArtists: formData.additionalArtists.filter((a: string) => a !== artist) 
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      padding: '40px 20px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '40px',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#fdba74',
      textDecoration: 'none',
      marginBottom: '20px',
      padding: '8px 16px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      transition: 'all 0.2s',
    },
    title: {
      fontSize: '36px',
      fontWeight: '900',
      color: '#fdba74',
      marginBottom: '8px',
    },
    form: {
      display: 'grid',
      gap: '32px',
    },
    section: {
      background: 'rgba(30, 41, 59, 0.8)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '24px',
      backdropFilter: 'blur(10px)',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '20px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#e2e8f0',
    },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      transition: 'all 0.2s',
    },
    textarea: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      resize: 'vertical' as const,
      minHeight: '100px',
      transition: 'all 0.2s',
    },
    select: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      cursor: 'pointer',
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '8px',
    },
    tag: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 12px',
      background: 'rgba(249, 115, 22, 0.2)',
      border: '1px solid rgba(249, 115, 22, 0.5)',
      borderRadius: '16px',
      fontSize: '14px',
      color: '#fde68a',
    },
    tagButton: {
      background: 'none',
      border: 'none',
      color: '#fca5a5',
      cursor: 'pointer',
      padding: '0',
    },
    addButton: {
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'transform 0.2s',
    },
    submitButton: {
      padding: '16px 32px',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '900',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'transform 0.2s',
      boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '32px',
    },
    slugStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Link 
          href="/admin/games" 
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ArrowLeft size={20} />
          Back to Games
        </Link>

        <div style={styles.header}>
          <h1 style={styles.title}>Edit Game</h1>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Basic Information */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Basic Information</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Title
                  <SymbolHelper 
                    onInsert={(symbol) => insertSymbol(symbol, titleRef)}
                    style={{ float: 'right' }}
                  />
                </label>
                <input
                  ref={titleRef}
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Slug
                  {checkingSlug && <span style={{ color: '#94a3b8' }}> (checking...)</span>}
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  style={styles.input}
                  required
                />
                {!checkingSlug && slugAvailable !== null && formData.slug !== game.slug && (
                  <div style={{
                    ...styles.slugStatus,
                    color: slugAvailable ? '#86efac' : '#fca5a5'
                  }}>
                    {slugAvailable ? <Check size={16} /> : <AlertCircle size={16} />}
                    {slugMessage}
                  </div>
                )}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Tagline
                  <SymbolHelper 
                    onInsert={(symbol) => insertSymbol(symbol, taglineRef)}
                    style={{ float: 'right' }}
                  />
                </label>
                <input
                  ref={taglineRef}
                  name="tagline"
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Price (cents)</label>
                <input
                  type="number"
                  value={formData.priceCents}
                  onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) })}
                  style={styles.input}
                  min="0"
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={styles.label}>
                Description
                <SymbolHelper 
                  onInsert={(symbol) => insertSymbol(symbol, descriptionRef)}
                  style={{ float: 'right' }}
                />
              </label>
              <textarea
                ref={descriptionRef}
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textarea}
                rows={4}
                required
              />
            </div>
          </div>

          {/* Game Details */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Game Details</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.select}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.fieldGroup}>
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

              <div style={styles.fieldGroup}>
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

              <div style={styles.fieldGroup}>
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
            </div>
          </div>

          {/* Credits */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Credits</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Lead Game Designer</label>
                <input
                  type="text"
                  value={formData.leadDesigner || ''}
                  onChange={(e) => setFormData({ ...formData, leadDesigner: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Lead Artist</label>
                <input
                  type="text"
                  value={formData.leadArtist || ''}
                  onChange={(e) => setFormData({ ...formData, leadArtist: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Publisher</label>
                <input
                  type="text"
                  value={formData.publisher || ''}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Additional Designers */}
            <div style={{ marginTop: '20px' }}>
              <label style={styles.label}>Additional Game Designers</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  value={newDesigner}
                  onChange={(e) => setNewDesigner(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDesigner())}
                  placeholder="Add designer name"
                  style={{ ...styles.input, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addDesigner}
                  style={styles.addButton}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              <div style={styles.tagContainer}>
                {formData.additionalDesigners.map((designer) => (
                  <div key={designer} style={styles.tag}>
                    {designer}
                    <button
                      type="button"
                      onClick={() => removeDesigner(designer)}
                      style={styles.tagButton}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Artists */}
            <div style={{ marginTop: '20px' }}>
              <label style={styles.label}>Additional Artists</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArtist())}
                  placeholder="Add artist name"
                  style={{ ...styles.input, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addArtist}
                  style={styles.addButton}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              <div style={styles.tagContainer}>
                {formData.additionalArtists.map((artist) => (
                  <div key={artist} style={styles.tag}>
                    {artist}
                    <button
                      type="button"
                      onClick={() => removeArtist(artist)}
                      style={styles.tagButton}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Date */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Launch Date (Eastern Time)</h2>
            <div style={styles.grid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Year</label>
                <input
                  type="number"
                  value={formData.launchYear || ''}
                  onChange={(e) => setFormData({ ...formData, launchYear: e.target.value ? parseInt(e.target.value) : null })}
                  style={styles.input}
                  min="2024"
                  max="2030"
                  placeholder="YYYY"
                />
              </div>

              {formData.launchYear && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Month</label>
                  <select
                    value={formData.launchMonth || ''}
                    onChange={(e) => setFormData({ ...formData, launchMonth: e.target.value ? parseInt(e.target.value) : null })}
                    style={styles.select}
                  >
                    <option value="">--</option>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.launchMonth && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Day</label>
                  <input
                    type="number"
                    value={formData.launchDay || ''}
                    onChange={(e) => setFormData({ ...formData, launchDay: e.target.value ? parseInt(e.target.value) : null })}
                    style={styles.input}
                    min="1"
                    max="31"
                    placeholder="DD"
                  />
                </div>
              )}

              {formData.launchDay && (
                <>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Hour (0-23)</label>
                    <input
                      type="number"
                      value={formData.launchHour || ''}
                      onChange={(e) => setFormData({ ...formData, launchHour: e.target.value ? parseInt(e.target.value) : null })}
                      style={styles.input}
                      min="0"
                      max="23"
                      placeholder="HH"
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Minute</label>
                    <input
                      type="number"
                      value={formData.launchMinute || ''}
                      onChange={(e) => setFormData({ ...formData, launchMinute: e.target.value ? parseInt(e.target.value) : null })}
                      style={styles.input}
                      min="0"
                      max="59"
                      placeholder="MM"
                    />
                  </div>
                </>
              )}
            </div>
            {formData.launchYear && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#94a3b8' }}>
                All times are in Eastern Time (ET)
              </p>
            )}
          </div>

          {/* Display Options */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Display Options</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  style={styles.checkbox}
                />
                Featured
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  style={styles.checkbox}
                />
                New
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isBestseller}
                  onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                  style={styles.checkbox}
                />
                Bestseller
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isPreorder}
                  onChange={(e) => setFormData({ ...formData, isPreorder: e.target.checked })}
                  style={styles.checkbox}
                />
                Pre-order
              </label>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isBundle}
                  onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked })}
                  style={styles.checkbox}
                />
                Bundle
              </label>
            </div>
          </div>

          {/* Tags */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Tags</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag"
                style={{ ...styles.input, flex: 1 }}
              />
              <button
                type="button"
                onClick={addTag}
                style={styles.addButton}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Plus size={16} />
                Add Tag
              </button>
            </div>
            <div style={styles.tagContainer}>
              {formData.tags.map((tag) => (
                <div key={tag} style={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={styles.tagButton}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={loading || (slugAvailable === false && formData.slug !== game.slug)}
              style={{
                ...styles.submitButton,
                opacity: loading || (slugAvailable === false && formData.slug !== game.slug) ? 0.5 : 1,
                cursor: loading || (slugAvailable === false && formData.slug !== game.slug) ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading && !(slugAvailable === false && formData.slug !== game.slug)) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}