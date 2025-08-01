'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, TestTube } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import ImageUpload from '../../components/ImageUpload';

interface GameEditFormProps {
  game?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function GameEditForm({ game, onSave, onCancel }: GameEditFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    priceCents: 0,
    slug: '',
    ageRating: 'ALL_AGES',
    imageUrl: '',
    isBundle: false,
    isPreorder: false,
    featured: false,
    bundleInfo: '',
    leadDesigner: '',
    leadArtist: '',
    additionalDesigners: [] as string[],
    additionalArtists: [] as string[],
    publisher: 'Full Uproar Games, Inc.',
    bggUrl: '',
    whatsInTheBox: '',
    category: 'GAME',
    playerCount: 'TWO_TO_FOUR',
    playTime: 'MEDIUM',
    players: '2-4',
    timeToPlay: '60-90 min',
    isNew: false,
    isBestseller: false,
    launchDate: null as Date | null,
    stock: 0,
  });

  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [isFullUproarPublisher, setIsFullUproarPublisher] = useState(true);

  useEffect(() => {
    if (game) {
      // Parse JSON strings back to arrays
      let parsedDesigners = [];
      let parsedArtists = [];
      
      try {
        if (game.additionalDesigners) {
          parsedDesigners = JSON.parse(game.additionalDesigners);
        }
      } catch (e) {
        console.error('Error parsing additionalDesigners:', e);
      }
      
      try {
        if (game.additionalArtists) {
          parsedArtists = JSON.parse(game.additionalArtists);
        }
      } catch (e) {
        console.error('Error parsing additionalArtists:', e);
      }
      
      setFormData({
        ...game,
        // Map database fields to form fields
        leadDesigner: game.designer || '',
        leadArtist: game.artist || '',
        whatsInTheBox: game.components || '',
        additionalDesigners: parsedDesigners,
        additionalArtists: parsedArtists,
        launchDate: game.launchDate ? new Date(game.launchDate) : null,
      });
      setIsFullUproarPublisher(game.publisher === 'Full Uproar Games, Inc.');
    }
  }, [game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = game ? `/api/admin/games/${game.id}` : '/api/admin/games';
      const method = game ? 'PATCH' : 'POST';

      // Prepare data for sending
      const dataToSend = {
        ...formData,
        // Convert field names to match database schema
        designer: formData.leadDesigner,
        artist: formData.leadArtist,
        components: formData.whatsInTheBox,
        // Convert arrays to JSON strings for storage
        additionalDesigners: formData.additionalDesigners && formData.additionalDesigners.length > 0 
          ? JSON.stringify(formData.additionalDesigners.filter(d => d.trim() !== ''))
          : null,
        additionalArtists: formData.additionalArtists && formData.additionalArtists.length > 0
          ? JSON.stringify(formData.additionalArtists.filter(a => a.trim() !== ''))
          : null,
      };
      
      // Remove fields that don't exist in the database
      delete dataToSend.leadDesigner;
      delete dataToSend.leadArtist;
      delete dataToSend.whatsInTheBox;
      delete dataToSend.gameCategory;
      
      // Debug log
      console.log('Sending game data:', dataToSend);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        console.error('Game save error:', error);
        alert(`Error: ${error.error}\n${error.details ? `Details: ${error.details}` : ''}`);
      }
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Failed to save game');
    } finally {
      setSaving(false);
    }
  };

  const validateSlug = async (slug: string) => {
    if (!slug) {
      setSlugError('');
      return;
    }

    try {
      const response = await fetch(`/api/admin/validate-slug?type=game&slug=${slug}${game ? `&excludeId=${game.id}` : ''}`);
      const data = await response.json();
      
      if (!data.available) {
        setSlugError('This slug is already in use');
      } else {
        setSlugError('');
      }
    } catch (error) {
      console.error('Error validating slug:', error);
    }
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setFormData({ ...formData, slug });
    validateSlug(slug);
  };

  const addDesigner = () => {
    setFormData({
      ...formData,
      additionalDesigners: [...formData.additionalDesigners, ''],
    });
  };

  const updateDesigner = (index: number, value: string) => {
    const designers = [...formData.additionalDesigners];
    designers[index] = value;
    setFormData({ ...formData, additionalDesigners: designers });
  };

  const removeDesigner = (index: number) => {
    const designers = formData.additionalDesigners.filter((_, i) => i !== index);
    setFormData({ ...formData, additionalDesigners: designers });
  };

  const addArtist = () => {
    setFormData({
      ...formData,
      additionalArtists: [...formData.additionalArtists, ''],
    });
  };

  const updateArtist = (index: number, value: string) => {
    const artists = [...formData.additionalArtists];
    artists[index] = value;
    setFormData({ ...formData, additionalArtists: artists });
  };

  const removeArtist = (index: number) => {
    const artists = formData.additionalArtists.filter((_, i) => i !== index);
    setFormData({ ...formData, additionalArtists: artists });
  };

  const fillTestData = () => {
    const timestamp = Date.now();
    setFormData({
      title: 'Test Game ' + timestamp,
      tagline: 'An exciting test adventure',
      description: 'This is a test game created for debugging purposes. It features exciting gameplay, stunning artwork, and hours of entertainment for the whole family.',
      priceCents: 3999,
      slug: 'test-game-' + timestamp,
      ageRating: 'ALL_AGES',
      imageUrl: 'https://via.placeholder.com/400x300',
      isBundle: false,
      isPreorder: false,
      featured: true,
      bundleInfo: '',
      leadDesigner: 'John Testerman',
      leadArtist: 'Jane Artistry',
      additionalDesigners: ['Bob Designer', 'Alice Creator'],
      additionalArtists: ['Charlie Artist'],
      publisher: 'Full Uproar Games, Inc.',
      bggUrl: 'https://boardgamegeek.com/boardgame/12345/test-game',
      whatsInTheBox: '1 Game board\n4 Player pieces\n100 Cards\n2 Dice\n1 Rulebook\n50 Victory tokens',
      category: 'GAME',
      playerCount: 'TWO_TO_FOUR',
      playTime: 'MEDIUM',
      players: '2-4',
      timeToPlay: '60-90 min',
      isNew: true,
      isBestseller: false,
      launchDate: null,
      stock: 100,
    });
  };

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>{game ? 'Edit Game' : 'New Game'}</h1>
        <p style={adminStyles.subtitle}>
          {game ? `Editing: ${game.title}` : 'Create a new game listing'}
        </p>
      </div>

      {!game && (
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={fillTestData}
            style={{
              ...adminStyles.button,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              marginBottom: '16px',
            }}
          >
            <TestTube size={16} style={{ marginRight: '4px' }} />
            Fill with Test Data
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Basic Information</h2>
          
          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={adminStyles.input}
              required
            />
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              style={adminStyles.input}
              required
            />
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              style={{
                ...adminStyles.input,
                borderColor: slugError ? '#fca5a5' : undefined,
              }}
              required
            />
            {slugError && (
              <p style={{ color: '#fca5a5', fontSize: '14px', marginTop: '4px' }}>
                {slugError}
              </p>
            )}
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={adminStyles.textarea}
              rows={4}
              required
            />
          </div>

          <div style={adminStyles.formRow}>
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Price</label>
              <input
                type="number"
                value={formData.priceCents / 100}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setFormData({ ...formData, priceCents: Math.round(value * 100) });
                  }
                }}
                style={adminStyles.input}
                step="0.01"
                required
              />
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Publisher</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                style={adminStyles.input}
                disabled={isFullUproarPublisher}
                placeholder={isFullUproarPublisher ? 'Full Uproar Games, Inc.' : 'Enter publisher name'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  id="fullUproarPublisher"
                  checked={isFullUproarPublisher}
                  onChange={(e) => {
                    setIsFullUproarPublisher(e.target.checked);
                    if (e.target.checked) {
                      setFormData({ ...formData, publisher: 'Full Uproar Games, Inc.' });
                    } else {
                      setFormData({ ...formData, publisher: '' });
                    }
                  }}
                  style={{ width: 'auto', marginRight: '4px' }}
                />
                <label htmlFor="fullUproarPublisher" style={{ fontWeight: 'normal', color: '#94a3b8', fontSize: '14px' }}>
                  Full Uproar Games, Inc.
                </label>
              </div>
            </div>
          </div>

          <div style={adminStyles.formRow}>
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                style={adminStyles.input}
                min="0"
                required
              />
            </div>
            <div style={adminStyles.formGroup}>
              {/* Empty column for spacing */}
            </div>
          </div>
        </div>

        {/* Game Details */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Game Details</h2>
          
          <div style={adminStyles.formRow}>
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={adminStyles.select}
              >
                <option value="GAME">Game</option>
                <option value="MOD">Mod</option>
                <option value="EXPANSION">Expansion</option>
              </select>
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Age Rating</label>
              <select
                value={formData.ageRating}
                onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                style={adminStyles.select}
              >
                <option value="ALL_AGES">All Ages</option>
                <option value="ELEVEN_PLUS">11+</option>
                <option value="FOURTEEN_PLUS">14+</option>
                <option value="SIXTEEN_PLUS">16+</option>
                <option value="EIGHTEEN_PLUS">18+</option>
                <option value="TWENTYONE_PLUS">21+</option>
              </select>
            </div>
          </div>

          <div style={adminStyles.formRow}>
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Player Count</label>
              <select
                value={formData.playerCount}
                onChange={(e) => {
                  const playerCountMap: Record<string, string> = {
                    'SINGLE': '1',
                    'TWO': '2',
                    'TWO_PLUS': '2+',
                    'TWO_TO_FOUR': '2-4',
                    'TWO_TO_SIX': '2-6',
                    'THREE_TO_FIVE': '3-5',
                    'THREE_TO_SIX': '3-6',
                    'FOUR_TO_EIGHT': '4-8',
                    'PARTY': '6+',
                    'VARIES': 'Varies'
                  };
                  setFormData({ 
                    ...formData, 
                    playerCount: e.target.value,
                    players: playerCountMap[e.target.value] || e.target.value
                  });
                }}
                style={adminStyles.select}
              >
                <option value="SINGLE">1 Player</option>
                <option value="TWO">2 Players</option>
                <option value="TWO_PLUS">2+ Players</option>
                <option value="TWO_TO_FOUR">2-4 Players</option>
                <option value="TWO_TO_SIX">2-6 Players</option>
                <option value="THREE_TO_FIVE">3-5 Players</option>
                <option value="THREE_TO_SIX">3-6 Players</option>
                <option value="FOUR_TO_EIGHT">4-8 Players</option>
                <option value="PARTY">Party (6+)</option>
                <option value="VARIES">Varies</option>
              </select>
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Play Time</label>
              <select
                value={formData.playTime}
                onChange={(e) => {
                  const playTimeMap: Record<string, string> = {
                    'QUICK': 'Under 30 min',
                    'SHORT': '30-60 min',
                    'MEDIUM': '60-90 min',
                    'LONG': '90-120 min',
                    'EXTENDED': 'Over 2 hours',
                    'VARIES': 'Varies'
                  };
                  setFormData({ 
                    ...formData, 
                    playTime: e.target.value,
                    timeToPlay: playTimeMap[e.target.value] || e.target.value
                  });
                }}
                style={adminStyles.select}
              >
                <option value="QUICK">Under 30 min</option>
                <option value="SHORT">30-60 min</option>
                <option value="MEDIUM">60-90 min</option>
                <option value="LONG">90-120 min</option>
                <option value="EXTENDED">Over 2 hours</option>
                <option value="VARIES">Varies</option>
              </select>
            </div>
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>What's in the Box</label>
            <textarea
              value={formData.whatsInTheBox}
              onChange={(e) => setFormData({ ...formData, whatsInTheBox: e.target.value })}
              style={adminStyles.textarea}
              rows={3}
              placeholder="List the components included..."
            />
          </div>
        </div>

        {/* Credits */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Credits</h2>
          
          <div style={adminStyles.formRow}>
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Lead Designer</label>
              <input
                type="text"
                value={formData.leadDesigner}
                onChange={(e) => setFormData({ ...formData, leadDesigner: e.target.value })}
                style={adminStyles.input}
              />
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Lead Artist</label>
              <input
                type="text"
                value={formData.leadArtist}
                onChange={(e) => setFormData({ ...formData, leadArtist: e.target.value })}
                style={adminStyles.input}
              />
            </div>
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Additional Designers</label>
            {formData.additionalDesigners.map((designer, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={designer}
                  onChange={(e) => updateDesigner(index, e.target.value)}
                  style={{ ...adminStyles.input, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeDesigner(index)}
                  style={adminStyles.iconButton}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDesigner}
              style={adminStyles.outlineButton}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              Add Designer
            </button>
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Additional Artists</label>
            {formData.additionalArtists.map((artist, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => updateArtist(index, e.target.value)}
                  style={{ ...adminStyles.input, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeArtist(index)}
                  style={adminStyles.iconButton}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addArtist}
              style={adminStyles.outlineButton}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              Add Artist
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Status & Badges</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Featured
            </label>

            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                style={adminStyles.checkbox}
              />
              New
            </label>

            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Bestseller
            </label>

            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isPreorder}
                onChange={(e) => setFormData({ ...formData, isPreorder: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Pre-order
            </label>

            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isBundle}
                onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Bundle
            </label>
          </div>

          {formData.isBundle && (
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Bundle Info</label>
              <textarea
                value={formData.bundleInfo}
                onChange={(e) => setFormData({ ...formData, bundleInfo: e.target.value })}
                style={adminStyles.textarea}
                rows={2}
                placeholder="What's included in this bundle?"
              />
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Image</h2>
          <ImageUpload
            currentImageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
          />
        </div>

        {/* Form Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '32px',
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={adminStyles.outlineButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !!slugError}
            style={{
              ...adminStyles.button,
              opacity: saving || slugError ? 0.6 : 1,
            }}
          >
            <Save size={16} style={{ marginRight: '4px' }} />
            {saving ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </form>
    </>
  );
}