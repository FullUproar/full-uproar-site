'use client';

import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsEditFormProps {
  post?: NewsPost;
  onBack: () => void;
  onSave: () => void;
}

export default function NewsEditForm({ post, onBack, onSave }: NewsEditFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.excerpt) {
      setMessage({ type: 'error', text: 'Title and excerpt are required' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const url = post ? `/api/news?id=${post.id}` : '/api/news';
      const method = post ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setMessage({ type: 'success', text: post ? 'News post updated!' : 'News post created!' });
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save news post' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={adminStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <button
            onClick={onBack}
            style={{
              ...adminStyles.secondaryButton,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 style={adminStyles.title}>{post ? 'Edit News Post' : 'New News Post'}</h1>
        </div>
        <p style={adminStyles.subtitle}>
          {post ? 'Update your news post' : 'Create a new news post or announcement'}
        </p>
      </div>

      <div style={adminStyles.section}>
        <form onSubmit={handleSubmit}>
          {message.text && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '20px',
                background: message.type === 'error' ? '#ef4444' : '#10b981',
                color: 'white',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Title */}
            <div>
              <label style={adminStyles.label}>
                Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                style={adminStyles.input}
                placeholder="Enter news post title..."
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label style={adminStyles.label}>
                Excerpt <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                style={{
                  ...adminStyles.textarea,
                  minHeight: '80px'
                }}
                placeholder="Short summary for the news list..."
                required
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Brief summary shown in news listings (recommended: 1-2 sentences)
              </p>
            </div>

            {/* Content */}
            <div>
              <label style={adminStyles.label}>
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                style={{
                  ...adminStyles.textarea,
                  minHeight: '300px',
                  fontFamily: 'monospace'
                }}
                placeholder="Full news post content (supports markdown)..."
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Full article content. You can use basic formatting.
              </p>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid #334155'
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...adminStyles.primaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {post ? 'Update Post' : 'Create Post'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                style={{
                  ...adminStyles.secondaryButton,
                  opacity: saving ? 0.5 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
