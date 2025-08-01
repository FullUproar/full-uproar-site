'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, TestTube, Package2 } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import ImageUpload from '../../components/ImageUpload';

interface MerchEditFormProps {
  merch?: any;
  onSave: () => void;
  onCancel: () => void;
}

const MERCH_CATEGORIES = [
  { value: 'APPAREL', label: 'Apparel' },
  { value: 'ACCESSORIES', label: 'Accessories' },
  { value: 'HOME_GOODS', label: 'Home Goods' },
  { value: 'COLLECTIBLES', label: 'Collectibles' },
  { value: 'STICKERS', label: 'Stickers' },
  { value: 'PRINTS', label: 'Prints' },
  { value: 'OTHER', label: 'Other' }
];

const APPAREL_TYPES = [
  { value: 'T_SHIRT', label: 'T-Shirt' },
  { value: 'HOODIE', label: 'Hoodie' },
  { value: 'TANK_TOP', label: 'Tank Top' },
  { value: 'LONG_SLEEVE', label: 'Long Sleeve' },
  { value: 'SWEATSHIRT', label: 'Sweatshirt' },
  { value: 'JACKET', label: 'Jacket' },
  { value: 'HAT', label: 'Hat' },
  { value: 'OTHER', label: 'Other' }
];

export default function MerchEditForm({ merch, onSave, onCancel }: MerchEditFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'APPAREL',
    priceCents: 0,
    imageUrl: '',
    sizes: [] as string[],
    featured: false,
    tags: [] as string[],
    printifyId: '',
    isPrintify: false,
    isNew: false,
    isBestseller: false,
    colors: [] as string[],
    material: '',
    careInstructions: '',
    fitDescription: '',
    weight: '',
    dimensions: '',
    apparelType: 'T_SHIRT',
    fit: '',
    isLimitedEdition: false,
    releaseDate: null as Date | null,
  });

  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [showPrintifyBrowser, setShowPrintifyBrowser] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    if (merch) {
      // Parse JSON strings back to arrays
      let parsedTags = [];
      let parsedSizes = [];
      let parsedColors = [];
      
      try {
        if (merch.tags) parsedTags = JSON.parse(merch.tags);
      } catch (e) {}
      
      try {
        if (merch.sizes) parsedSizes = JSON.parse(merch.sizes);
      } catch (e) {}
      
      try {
        if (merch.colors) parsedColors = JSON.parse(merch.colors);
      } catch (e) {}
      
      setFormData({
        ...merch,
        tags: parsedTags,
        sizes: parsedSizes,
        colors: parsedColors,
        releaseDate: merch.releaseDate ? new Date(merch.releaseDate) : null,
      });
    }
  }, [merch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = merch ? `/api/admin/merch/${merch.id}` : '/api/admin/merch';
      const method = merch ? 'PATCH' : 'POST';

      // Prepare data for sending
      const dataToSend = {
        ...formData,
        // Convert arrays to JSON strings for storage
        tags: formData.tags && formData.tags.length > 0 
          ? JSON.stringify(formData.tags)
          : null,
        sizes: formData.sizes && formData.sizes.length > 0
          ? JSON.stringify(formData.sizes)
          : null,
        colors: formData.colors && formData.colors.length > 0
          ? JSON.stringify(formData.colors)
          : null,
      };
      
      console.log('Sending merch data:', dataToSend);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        console.error('Merch save error:', error);
        alert(`Error: ${error.error}\n${error.details ? `Details: ${error.details}` : ''}`);
      }
    } catch (error) {
      console.error('Error saving merch:', error);
      alert('Failed to save merch');
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
      const response = await fetch(`/api/admin/validate-slug?type=merch&slug=${slug}${merch ? `&excludeId=${merch.id}` : ''}`);
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

  const fillTestData = () => {
    const timestamp = Date.now();
    setFormData({
      name: 'Test T-Shirt ' + timestamp,
      slug: 'test-tshirt-' + timestamp,
      description: 'A comfortable test t-shirt with a unique Full Uproar design. Perfect for testing the merchandise system.',
      category: 'APPAREL',
      priceCents: 2499,
      imageUrl: 'https://via.placeholder.com/400x400',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      featured: true,
      tags: ['test', 'tshirt', 'apparel'],
      printifyId: '',
      isPrintify: false,
      isNew: true,
      isBestseller: false,
      colors: ['Black', 'White', 'Navy', 'Red'],
      material: '100% Cotton',
      careInstructions: 'Machine wash cold, tumble dry low',
      fitDescription: 'Classic fit, true to size',
      weight: '5.3 oz',
      dimensions: '',
      apparelType: 'T_SHIRT',
      fit: 'Regular',
      isLimitedEdition: false,
      releaseDate: null,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addSize = () => {
    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>{merch ? 'Edit Merchandise' : 'New Merchandise'}</h1>
        <p style={adminStyles.subtitle}>
          {merch ? `Editing: ${merch.name}` : 'Create a new merchandise listing'}
        </p>
      </div>

      {!merch && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={fillTestData}
            style={{
              ...adminStyles.button,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            <TestTube size={16} style={{ marginRight: '4px' }} />
            Fill with Test Data
          </button>
          
          <button
            type="button"
            onClick={() => setShowPrintifyBrowser(true)}
            style={{
              ...adminStyles.button,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            }}
          >
            <Package2 size={16} style={{ marginRight: '4px' }} />
            Import from Printify
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Basic Information</h2>
          
          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label style={adminStyles.label}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={adminStyles.select}
              >
                {MERCH_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Details */}
        {formData.category === 'APPAREL' && (
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>Apparel Details</h2>
            
            <div style={adminStyles.formRow}>
              <div style={adminStyles.formGroup}>
                <label style={adminStyles.label}>Apparel Type</label>
                <select
                  value={formData.apparelType}
                  onChange={(e) => setFormData({ ...formData, apparelType: e.target.value })}
                  style={adminStyles.select}
                >
                  {APPAREL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div style={adminStyles.formGroup}>
                <label style={adminStyles.label}>Fit</label>
                <input
                  type="text"
                  value={formData.fit}
                  onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                  style={adminStyles.input}
                  placeholder="e.g., Regular, Slim, Oversized"
                />
              </div>
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Material</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                style={adminStyles.input}
                placeholder="e.g., 100% Cotton, Cotton/Polyester blend"
              />
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Care Instructions</label>
              <textarea
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                style={adminStyles.textarea}
                rows={2}
                placeholder="e.g., Machine wash cold, tumble dry low"
              />
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Fit Description</label>
              <input
                type="text"
                value={formData.fitDescription}
                onChange={(e) => setFormData({ ...formData, fitDescription: e.target.value })}
                style={adminStyles.input}
                placeholder="e.g., True to size, runs small, etc."
              />
            </div>
          </div>
        )}

        {/* Sizes and Colors */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Sizes & Colors</h2>
          
          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Available Sizes</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                style={{ ...adminStyles.input, flex: 1 }}
                placeholder="Add a size..."
              />
              <button
                type="button"
                onClick={addSize}
                style={adminStyles.outlineButton}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.sizes.map((size) => (
                <div
                  key={size}
                  style={{
                    ...adminStyles.badge,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeSize(size)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} style={{ color: '#fdba74' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Available Colors</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                style={{ ...adminStyles.input, flex: 1 }}
                placeholder="Add a color..."
              />
              <button
                type="button"
                onClick={addColor}
                style={adminStyles.outlineButton}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.colors.map((color) => (
                <div
                  key={color}
                  style={{
                    ...adminStyles.badge,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} style={{ color: '#fdba74' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status & Tags */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Status & Tags</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
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
                checked={formData.isLimitedEdition}
                onChange={(e) => setFormData({ ...formData, isLimitedEdition: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Limited Edition
            </label>

            <label style={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isPrintify}
                onChange={(e) => setFormData({ ...formData, isPrintify: e.target.checked })}
                style={adminStyles.checkbox}
              />
              Printify Product
            </label>
          </div>

          <div style={adminStyles.formGroup}>
            <label style={adminStyles.label}>Tags</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                style={{ ...adminStyles.input, flex: 1 }}
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                style={adminStyles.outlineButton}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    ...adminStyles.badge,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} style={{ color: '#fdba74' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Image</h2>
          <ImageUpload
            currentImageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
          />
        </div>

        {/* Additional Details */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Additional Details</h2>
          
          <div style={adminStyles.formRow}>
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Weight</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                style={adminStyles.input}
                placeholder="e.g., 5.3 oz"
              />
            </div>

            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Dimensions</label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                style={adminStyles.input}
                placeholder='e.g., 10" x 8" x 0.5"'
              />
            </div>
          </div>

          {formData.isPrintify && (
            <div style={adminStyles.formGroup}>
              <label style={adminStyles.label}>Printify ID</label>
              <input
                type="text"
                value={formData.printifyId}
                onChange={(e) => setFormData({ ...formData, printifyId: e.target.value })}
                style={adminStyles.input}
                placeholder="Printify product ID"
              />
            </div>
          )}
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
            {saving ? 'Saving...' : 'Save Merchandise'}
          </button>
        </div>
      </form>

      {/* Printify Browser Modal */}
      {showPrintifyBrowser && (
        <PrintifyProductBrowser
          onClose={() => setShowPrintifyBrowser(false)}
          onSelectProduct={(product: any) => {
            // Fill form with Printify product data
            setFormData({
              ...formData,
              name: product.title,
              slug: product.title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
              description: product.description,
              priceCents: Math.round(product.variants[0].price * 100),
              imageUrl: product.images[0]?.src || '',
              isPrintify: true,
              printifyId: product.id,
            });
            setShowPrintifyBrowser(false);
          }}
        />
      )}
    </>
  );
}

// Printify Product Browser Component
function PrintifyProductBrowser({ onClose, onSelectProduct }: { 
  onClose: () => void; 
  onSelectProduct: (product: any) => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrintifyProducts();
  }, []);

  const fetchPrintifyProducts = async () => {
    try {
      const response = await fetch('/api/printify/debug');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid rgba(249, 115, 22, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{ color: '#fdba74', fontSize: '24px', margin: 0 }}>
            Import from Printify
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          marginRight: '-16px',
          paddingRight: '16px',
        }}>
          {loading && (
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>
              Loading Printify products...
            </p>
          )}

          {error && (
            <p style={{ color: '#fca5a5', textAlign: 'center' }}>
              Error: {error}
            </p>
          )}

          {!loading && !error && products.length === 0 && (
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>
              No products found in Printify
            </p>
          )}

          {!loading && !error && products.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  style={{
                    background: 'rgba(17, 24, 39, 0.5)',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '2px solid rgba(249, 115, 22, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].src}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        marginBottom: '12px',
                      }}
                    />
                  )}
                  <h4 style={{
                    color: '#fde68a',
                    fontSize: '14px',
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {product.title}
                  </h4>
                  <p style={{
                    color: '#86efac',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    margin: 0,
                  }}>
                    ${(product.variants?.[0]?.price || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}