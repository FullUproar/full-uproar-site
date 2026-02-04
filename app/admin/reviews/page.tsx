'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star, Check, X, Flag, Ban, Eye, EyeOff, MessageSquare,
  AlertTriangle, Search, Filter, ChevronLeft, ChevronRight,
  ExternalLink, User, Calendar, ThumbsUp, ThumbsDown
} from 'lucide-react';
import Navigation from '@/app/components/Navigation';

interface Review {
  id: number;
  gameId: number | null;
  merchId: number | null;
  userId: string;
  userName: string;
  userEmail: string | null;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  status: string;
  helpful: number;
  unhelpful: number;
  responseText: string | null;
  isTest: boolean;
  createdAt: string;
  game?: { title: string; slug: string } | null;
  merch?: { name: string; slug: string } | null;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#10b981',
  rejected: '#ef4444',
  flagged: '#FF8200',
};

const STATUS_BG: Record<string, string> = {
  pending: 'rgba(251, 191, 36, 0.15)',
  approved: 'rgba(16, 185, 129, 0.15)',
  rejected: 'rgba(239, 68, 68, 0.15)',
  flagged: 'rgba(255, 130, 0, 0.15)',
};

export default function AdminReviewsPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/admin/reviews?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleStatusChange = async (reviewId: number, newStatus: string, reason?: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: newStatus, reason }),
      });

      if (response.ok) {
        fetchReviews();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          responseText,
        }),
      });

      if (response.ok) {
        setShowResponseModal(false);
        setResponseText('');
        setSelectedReview(null);
        fetchReviews();
      } else {
        alert('Failed to add response');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/reviews/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: selectedReview.userId,
          reason: banReason,
          durationHours: banDuration ? parseInt(banDuration) : null,
        }),
      });

      if (response.ok) {
        setShowBanModal(false);
        setBanReason('');
        setBanDuration('');
        setSelectedReview(null);
        alert('User has been banned from posting reviews');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#FF8200' : 'transparent'}
            color={star <= rating ? '#FF8200' : '#4b5563'}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      color: '#e2e8f0'
    }}>
      <Navigation />
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Star size={32} style={{ color: '#FF8200' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200' }}>
              Review Moderation
            </h1>
          </div>
          <p style={{ color: '#94a3b8' }}>
            Review, approve, and moderate customer reviews
          </p>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {Object.entries(data.stats).map(([status, count]) => (
              <div
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={{
                  background: statusFilter === status ? STATUS_BG[status] : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${statusFilter === status ? STATUS_COLORS[status] : '#374151'}`,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: STATUS_COLORS[status]
                }}>
                  {count}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  textTransform: 'capitalize'
                }}>
                  {status}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected', 'flagged'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: statusFilter === status ? '#FF8200' : 'rgba(255, 255, 255, 0.05)',
                  border: statusFilter === status ? 'none' : '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: statusFilter === status ? '#111827' : '#94a3b8',
                  fontWeight: statusFilter === status ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '0.875rem'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                background: '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading reviews...
          </div>
        ) : !data || data.reviews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            border: '1px dashed #374151'
          }}>
            <Star size={48} style={{ color: '#6b7280', margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8' }}>No reviews found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
                  borderRadius: '0.75rem',
                  border: `2px solid ${STATUS_COLORS[review.status] || '#374151'}`,
                  padding: '1.5rem',
                  opacity: review.isTest ? 0.7 : 1
                }}
              >
                {/* Header Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      {renderStars(review.rating)}
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: STATUS_BG[review.status],
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: STATUS_COLORS[review.status],
                        textTransform: 'uppercase'
                      }}>
                        {review.status}
                      </span>
                      {review.verified && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(34, 197, 94, 0.15)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: '#22c55e'
                        }}>
                          Verified Purchase
                        </span>
                      )}
                      {review.isTest && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(139, 92, 246, 0.15)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: '#7D55C7'
                        }}>
                          Test Data
                        </span>
                      )}
                    </div>
                    <h3 style={{ color: '#FBDB65', fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>
                      {review.title}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                      {review.userName}
                    </div>
                    {review.userEmail && (
                      <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {review.userEmail}
                      </div>
                    )}
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ marginBottom: '1rem' }}>
                  {review.game && (
                    <Link
                      href={`/shop/games/${review.game.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#60a5fa',
                        fontSize: '0.875rem',
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} />
                      Game: {review.game.title}
                    </Link>
                  )}
                  {review.merch && (
                    <Link
                      href={`/shop/merch/${review.merch.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#60a5fa',
                        fontSize: '0.875rem',
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} />
                      Merch: {review.merch.name}
                    </Link>
                  )}
                </div>

                {/* Review Content */}
                <p style={{
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  marginBottom: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  {review.comment}
                </p>

                {/* Engagement Stats */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#94a3b8'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ThumbsUp size={14} /> {review.helpful} helpful
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ThumbsDown size={14} /> {review.unhelpful} unhelpful
                  </span>
                </div>

                {/* Existing Response */}
                {review.responseText && (
                  <div style={{
                    background: 'rgba(255, 130, 0, 0.1)',
                    border: '1px solid rgba(255, 130, 0, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#FF8200',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      Official Response:
                    </div>
                    <p style={{ color: '#FBDB65', fontSize: '0.9rem', margin: 0 }}>
                      {review.responseText}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(review.id, 'approved')}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          opacity: actionLoading ? 0.5 : 1
                        }}
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(review.id, 'rejected', 'Review does not meet guidelines')}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          opacity: actionLoading ? 0.5 : 1
                        }}
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </>
                  )}

                  {review.status === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(review.id, 'flagged', 'Flagged for review')}
                      disabled={actionLoading}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#FF8200',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#111827',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: actionLoading ? 0.5 : 1
                      }}
                    >
                      <Flag size={16} />
                      Flag
                    </button>
                  )}

                  {review.status === 'flagged' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(review.id, 'approved')}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Check size={16} />
                        Restore
                      </button>
                      <button
                        onClick={() => handleStatusChange(review.id, 'rejected', 'Review violates guidelines')}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </>
                  )}

                  {review.status !== 'rejected' && !review.responseText && (
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setShowResponseModal(true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <MessageSquare size={16} />
                      Respond
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setShowBanModal(true);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: '0.5rem',
                      color: '#ef4444',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Ban size={16} />
                    Ban User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.5rem 1rem',
                background: page === 1 ? '#374151' : '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: page === 1 ? '#6b7280' : '#111827',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span style={{ color: '#94a3b8' }}>
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              style={{
                padding: '0.5rem 1rem',
                background: page === data.totalPages ? '#374151' : '#FF8200',
                border: 'none',
                borderRadius: '0.5rem',
                color: page === data.totalPages ? '#6b7280' : '#111827',
                cursor: page === data.totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedReview && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 1000
            }}
            onClick={() => setShowResponseModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                background: '#111827',
                borderRadius: '1rem',
                border: '2px solid #FF8200',
                padding: '1.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#FF8200', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                Official Response
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Responding to: <strong style={{ color: '#FBDB65' }}>{selectedReview.title}</strong>
              </p>

              <form onSubmit={handleResponse}>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  required
                  rows={4}
                  placeholder="Write your response..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '2px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseText('');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: actionLoading ? '#374151' : '#FF8200',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: actionLoading ? '#6b7280' : '#111827',
                      fontWeight: 'bold',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading ? 'Saving...' : 'Post Response'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && selectedReview && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 1000
            }}
            onClick={() => setShowBanModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                background: '#111827',
                borderRadius: '1rem',
                border: '2px solid #ef4444',
                padding: '1.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                Ban User from Reviews
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Banning: <strong style={{ color: '#FBDB65' }}>{selectedReview.userName}</strong>
                <br />
                <span style={{ color: '#6b7280' }}>This will prevent them from posting new reviews.</span>
              </p>

              <form onSubmit={handleBanUser}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Reason (required)
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    required
                    rows={3}
                    placeholder="Why is this user being banned?"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Duration (hours, leave empty for permanent)
                  </label>
                  <input
                    type="number"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    placeholder="24"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBanModal(false);
                      setBanReason('');
                      setBanDuration('');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: actionLoading ? '#374151' : '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: actionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading ? 'Processing...' : 'Ban User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
