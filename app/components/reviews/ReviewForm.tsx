'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import ReviewStars from './ReviewStars';

interface ReviewFormProps {
  gameId?: number;
  merchId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ gameId, merchId, onSuccess, onCancel }: ReviewFormProps) {
  const { data: session, status } = useSession();
  const isSignedIn = !!session;
  const user = session?.user;
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSignedIn) {
      setError('Please sign in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (comment.length < 20) {
      setError('Review must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          merchId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Show success message
      if (data.verified) {
        alert('Thanks for your review! Your purchase has been verified.');
      } else {
        alert('Thanks for your review!');
      }

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#e2e8f0', marginBottom: 16 }}>
          Sign in to leave a review
        </p>
        <a
          href="/sign-in"
          style={{
            display: 'inline-block',
            background: '#FF8200',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h3 style={{ color: '#FBDB65', marginBottom: 20, fontSize: 18 }}>
        Write a Review
      </h3>

      {error && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Rating */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            color: '#e2e8f0',
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          Your Rating *
        </label>
        <ReviewStars
          rating={rating}
          size="large"
          interactive
          onChange={setRating}
        />
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            color: '#e2e8f0',
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          Review Title * <span style={{ color: '#6b7280' }}>(5-100 characters)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Summarize your experience"
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12, marginTop: 4 }}>
          {title.length}/100
        </div>
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            color: '#e2e8f0',
            marginBottom: 8,
            fontSize: 14,
          }}
        >
          Your Review * <span style={{ color: '#6b7280' }}>(20-2000 characters)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Tell us what you think about this product. What did you like? What could be improved?"
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            resize: 'vertical',
            minHeight: 120,
          }}
        />
        <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 12, marginTop: 4 }}>
          {comment.length}/2000
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px 24px',
            background: isSubmitting ? '#666' : '#FF8200',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      <p style={{ color: '#6b7280', fontSize: 12, marginTop: 16 }}>
        {user?.name?.split(' ')[0] || 'You'} - Your review will be posted publicly.
        If you've purchased this product, your review will be marked as a verified purchase.
      </p>
    </form>
  );
}
