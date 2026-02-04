'use client';

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

interface ReviewFormProps {
  productId: number;
  productType: 'game' | 'merch';
  onClose: () => void;
  onSubmit: (review: any) => void;
}

export default function ReviewForm({ productId, productType, onClose, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    
    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [productType === 'game' ? 'gameId' : 'merchId']: productId,
          rating,
          title: title.trim(),
          comment: comment.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const review = await response.json();
      onSubmit(review);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: '#1f2937',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative' as const,
      border: '3px solid #FF8200',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '900',
      color: '#FBDB65'
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: '#94a3b8',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      transition: 'all 0.2s'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    ratingSection: {
      textAlign: 'center' as const
    },
    ratingLabel: {
      fontSize: '16px',
      color: '#FBDB65',
      fontWeight: '600',
      marginBottom: '12px',
      display: 'block'
    },
    stars: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    star: {
      cursor: 'pointer',
      transition: 'transform 0.2s'
    },
    ratingText: {
      fontSize: '14px',
      color: '#94a3b8',
      fontStyle: 'italic'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      color: '#FBDB65',
      fontWeight: '600'
    },
    input: {
      background: 'rgba(17, 24, 39, 0.5)',
      border: '2px solid rgba(255, 130, 0, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#e2e8f0',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    textarea: {
      background: 'rgba(17, 24, 39, 0.5)',
      border: '2px solid rgba(255, 130, 0, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#e2e8f0',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s',
      minHeight: '120px',
      resize: 'vertical' as const
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      color: '#fca5a5',
      fontSize: '14px'
    },
    submitButton: {
      background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '18px',
      fontWeight: '900',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 20px rgba(255, 130, 0, 0.3)'
    },
    submitButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Total chaos (not the fun kind)";
      case 2: return "Meh, Fugly is disappointed";
      case 3: return "Decent chaos potential";
      case 4: return "Solid table-flipping material!";
      case 5: return "MAXIMUM CHAOS! Fugly approves!";
      default: return "Click to rate";
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Share Your Chaos Experience</h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 130, 0, 0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.ratingSection}>
            <label style={styles.ratingLabel}>How much chaos did this bring?</label>
            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  style={{
                    ...styles.star,
                    width: '32px',
                    height: '32px',
                    fill: value <= (hoveredRating || rating) ? '#FF8200' : 'transparent',
                    color: '#FF8200',
                    transform: value <= (hoveredRating || rating) ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
            <p style={styles.ratingText}>
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Review Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience..."
              style={styles.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#FF8200' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.3)' }}
              maxLength={100}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this game. Did it successfully ruin friendships? Did tables get flipped? We want the juicy details!"
              style={styles.textarea}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#FF8200' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.3)' }}
              maxLength={1000}
            />
            <span style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
              {comment.length}/1000 characters
            </span>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              ...(isSubmitting ? styles.submitButtonDisabled : {})
            }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'scale(1)' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Chaos Report'}
          </button>
        </form>
      </div>
    </div>
  );
}