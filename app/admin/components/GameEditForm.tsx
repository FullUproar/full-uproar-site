'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';
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
    players: '',
    timeToPlay: '',
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
    publisher: '',
    bggUrl: '',
    whatsInTheBox: '',
    gameCategory: 'BOARD',
    playerCount: 'TWO_TO_FOUR',
    playTime: 'UNDER_30',
    isNew: false,
    isBestseller: false,
    launchDate: null as Date | null,
  });

  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState('');

  useEffect(() => {
    if (game) {
      setFormData({
        ...game,
        additionalDesigners: game.additionalDesigners || [],
        additionalArtists: game.additionalArtists || [],
        launchDate: game.launchDate ? new Date(game.launchDate) : null,
      });
    }
  }, [game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = game ? `/api/admin/games/${game.id}` : '/api/admin/games';
      const method = game ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
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

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>{game ? 'Edit Game' : 'New Game'}</h1>
        <p style={adminStyles.subtitle}>
          {game ? `Editing: ${game.title}` : 'Create a new game listing'}
        </p>
      </div>

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
                onChange={(e) => setFormData({ ...formData, priceCents: Math.round(parseFloat(e.target.value) * 100) })}
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
              />
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
                value={formData.gameCategory}
                onChange={(e) => setFormData({ ...formData, gameCategory: e.target.value })}
                style={adminStyles.select}
              >
                <option value="BOARD">Board Game</option>
                <option value="CARD">Card Game</option>
                <option value="DICE">Dice Game</option>
                <option value="RPG">RPG</option>
                <option value="MINIATURES">Miniatures</option>
                <option value="PARTY">Party Game</option>
                <option value="STRATEGY">Strategy Game</option>
                <option value="FAMILY">Family Game</option>
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
                onChange={(e) => setFormData({ ...formData, playerCount: e.target.value })}
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
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Play Time</label>
              <select
                value={formData.playTime}
                onChange={(e) => setFormData({ ...formData, playTime: e.target.value })}
                style={adminStyles.select}
              >
                <option value="QUICK">Under 30 min</option>
                <option value="SHORT">30-60 min</option>
                <option value="MEDIUM">60-90 min</option>
                <option value="LONG">90-120 min</option>
                <option value="EXTENDED">Over 2 hours</option>
                <option value="VARIABLE">Variable</option>
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