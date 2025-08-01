'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, ArrowLeft, Loader2, X } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface ArtworkEditFormProps {
  artwork?: any;
  onBack: () => void;
  onSave: () => void;
}

export default function ArtworkEditForm({ artwork, onBack, onSave }: ArtworkEditFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Character Art',
    tags: '',
    chaosMode: false,
    imageUrl: '',
    thumbnailUrl: '',
    largeUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (artwork) {
      setFormData({
        name: artwork.name || '',
        description: artwork.description || '',
        category: artwork.category || 'Character Art',
        tags: Array.isArray(artwork.tags) ? artwork.tags.join(', ') : (artwork.tags || ''),
        chaosMode: artwork.chaosMode || false,
        imageUrl: artwork.imageUrl || '',
        thumbnailUrl: artwork.thumbnailUrl || artwork.imageUrl || '',
        largeUrl: artwork.largeUrl || artwork.imageUrl || '',
      });
      setPreviewUrl(artwork.imageUrl || '');
    }
  }, [artwork]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        largeUrl: data.largeUrl 
      }));
      setPreviewUrl(data.imageUrl);
      
      if (data.warning) {
        setMessage({ type: 'success', text: `Image uploaded! Note: ${data.warning}` });
      } else {
        setMessage({ type: 'success', text: 'Image uploaded and resized successfully!' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.imageUrl) {
      setMessage({ type: 'error', text: 'Name and image are required' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const url = artwork ? `/api/artwork?id=${artwork.id}` : '/api/artwork';
      const method = artwork ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          chaosMode: formData.chaosMode,
          imageUrl: formData.imageUrl,
          thumbnailUrl: formData.thumbnailUrl || formData.imageUrl,
          largeUrl: formData.largeUrl || formData.imageUrl,
          tags: formData.tags ? JSON.stringify(formData.tags.split(',').map(tag => tag.trim())) : '[]',
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setMessage({ type: 'success', text: artwork ? 'Artwork updated!' : 'Artwork created!' });
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save artwork' });
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    'Character Art',
    'Game Art',
    'Logos',
    'Apparel Design',
    'Concept Art',
    'Backgrounds',
    'Promotional',
    'Stickers',
    '3D Art',
    'UI/UX',
    'Other'
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '100%', overflow: 'hidden' }}>
      <button
        onClick={onBack}
        style={adminStyles.backButton}
        {...adminStyles.hoverEffects.button}
      >
        <ArrowLeft size={20} />
        Back to Artwork
      </button>

      <h2 style={adminStyles.title}>
        {artwork ? 'Edit Artwork' : 'New Artwork'}
      </h2>

      {message.text && (
        <div style={{
          ...adminStyles.card,
          marginBottom: '1rem',
          padding: '1rem',
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `2px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`,
          color: message.type === 'error' ? '#ef4444' : '#10b981'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ ...adminStyles.card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Image Upload */}
          <div style={adminStyles.fieldGroup}>
            <label style={adminStyles.label}>
              Image {!artwork && '*'}
            </label>
            
            {previewUrl && (
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%',
                    width: '300px', 
                    height: 'auto',
                    borderRadius: '8px',
                    border: '2px solid rgba(249, 115, 22, 0.3)',
                    display: 'block'
                  }} 
                />
                {!artwork && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl('');
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    style={{
                      ...adminStyles.iconButton,
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: 'none'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label 
                style={{
                  ...adminStyles.button,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    {previewUrl ? 'Change Image' : 'Upload Image'}
                  </>
                )}
              </label>
              {formData.imageUrl && (
                <span style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  wordBreak: 'break-all',
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {formData.imageUrl.startsWith('data:') ? 'Image uploaded (data URL)' : formData.imageUrl}
                </span>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={adminStyles.fieldGroup}>
            <label htmlFor="name" style={adminStyles.label}>
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={adminStyles.input}
              placeholder="e.g., Fugly's Chaotic Portrait"
              required
            />
          </div>

          {/* Category */}
          <div style={adminStyles.fieldGroup}>
            <label htmlFor="category" style={adminStyles.label}>
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={adminStyles.select}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={adminStyles.fieldGroup}>
            <label htmlFor="description" style={adminStyles.label}>
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={adminStyles.textarea}
              rows={3}
              placeholder="Describe the artwork..."
            />
          </div>

          {/* Tags */}
          <div style={adminStyles.fieldGroup}>
            <label htmlFor="tags" style={adminStyles.label}>
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              style={adminStyles.input}
              placeholder="e.g., fugly, mascot, character"
            />
          </div>

          {/* Chaos Mode */}
          <div style={adminStyles.fieldGroup}>
            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.chaosMode}
                onChange={(e) => setFormData({ ...formData, chaosMode: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Chaos Mode (Featured artwork)
            </label>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={saving || uploading}
              style={{
                ...adminStyles.primaryButton,
                opacity: (saving || uploading) ? 0.5 : 1,
                cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              {...adminStyles.hoverEffects.button}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {artwork ? 'Update Artwork' : 'Create Artwork'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onBack}
              style={adminStyles.outlineButton}
              {...adminStyles.hoverEffects.button}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}