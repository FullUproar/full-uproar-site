'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ReviewStars from './ReviewStars';
import ReviewForm from './ReviewForm';

interface Review {
  id: number;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  purchaseDate: string | null;
  helpful: number;
  unhelpful: number;
  responseText: string | null;
  responseAt: string | null;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  verifiedCount: number;
  page: number;
  totalPages: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

interface ProductReviewsProps {
  gameId?: number;
  merchId?: number;
  productName?: string;
}

export default function ProductReviews({ gameId, merchId, productName }: ProductReviewsProps) {
  const { data: session } = useSession();
  const isSignedIn = !!session;
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [votingReviewId, setVotingReviewId] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sort,
        limit: '10',
      });
      if (gameId) params.set('gameId', gameId.toString());
      if (merchId) params.set('merchId', merchId.toString());

      const response = await fetch(`/api/reviews?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId, merchId, page, sort]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleVote = async (reviewId: number, vote: 'helpful' | 'unhelpful') => {
    if (!isSignedIn) {
      alert('Please sign in to vote on reviews');
      return;
    }

    setVotingReviewId(reviewId);
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, vote }),
      });

      if (response.ok) {
        // Refresh reviews to get updated counts
        fetchReviews();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVotingReviewId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const RatingBar = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ color: '#e2e8f0', fontSize: 12, width: 50 }}>{stars} star</span>
        <div
          style={{
            flex: 1,
            height: 8,
            background: '#2a2a2a',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: '#FF8200',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ color: '#6b7280', fontSize: 12, width: 30 }}>{count}</span>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>Loading reviews...</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 40 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ color: '#FBDB65', fontSize: 24, margin: 0 }}>
          Customer Reviews
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              background: '#FF8200',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div style={{ marginBottom: 32 }}>
          <ReviewForm
            gameId={gameId}
            merchId={merchId}
            onSuccess={() => {
              setShowForm(false);
              fetchReviews();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Summary Section */}
      {data && data.total > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
            marginBottom: 32,
            padding: 24,
            background: '#1a1a1a',
            borderRadius: 12,
          }}
        >
          {/* Average Rating */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#FF8200' }}>
              {data.averageRating.toFixed(1)}
            </div>
            <ReviewStars rating={data.averageRating} size="medium" />
            <div style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>
              Based on {data.total} review{data.total !== 1 ? 's' : ''}
            </div>
            {data.verifiedCount > 0 && (
              <div style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>
                {data.verifiedCount} verified purchase{data.verifiedCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          <div>
            {[5, 4, 3, 2, 1].map((stars) => (
              <RatingBar
                key={stars}
                stars={stars}
                count={data.ratingDistribution[stars] || 0}
                total={data.total}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sort & Filter */}
      {data && data.total > 0 && (
        <div style={{ marginBottom: 20 }}>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="newest">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {data && data.reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.reviews.map((review) => (
            <div
              key={review.id}
              style={{
                background: '#1a1a1a',
                borderRadius: 12,
                padding: 20,
              }}
            >
              {/* Review Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ReviewStars rating={review.rating} size="small" />
                    {review.verified && (
                      <span
                        style={{
                          background: '#22c55e20',
                          color: '#22c55e',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <h4 style={{ color: '#FBDB65', margin: '8px 0 4px', fontSize: 16 }}>
                    {review.title}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#e2e8f0', fontSize: 14 }}>{review.userName}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <p
                style={{
                  color: '#e2e8f0',
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {review.comment}
              </p>

              {/* Official Response */}
              {review.responseText && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 16,
                    background: '#FF820010',
                    border: '1px solid #FF820030',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        background: '#FF8200',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Full Uproar Response
                    </span>
                    {review.responseAt && (
                      <span style={{ color: '#6b7280', fontSize: 12 }}>
                        {formatDate(review.responseAt)}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#FBDB65', fontSize: 14, margin: 0 }}>
                    {review.responseText}
                  </p>
                </div>
              )}

              {/* Helpful Voting */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <span style={{ color: '#6b7280', fontSize: 13 }}>Was this helpful?</span>
                <button
                  onClick={() => handleVote(review.id, 'helpful')}
                  disabled={votingReviewId === review.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 12px',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: 4,
                    color: '#e2e8f0',
                    fontSize: 13,
                    cursor: votingReviewId === review.id ? 'not-allowed' : 'pointer',
                    opacity: votingReviewId === review.id ? 0.5 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Yes ({review.helpful})
                </button>
                <button
                  onClick={() => handleVote(review.id, 'unhelpful')}
                  disabled={votingReviewId === review.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 12px',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: 4,
                    color: '#e2e8f0',
                    fontSize: 13,
                    cursor: votingReviewId === review.id ? 'not-allowed' : 'pointer',
                    opacity: votingReviewId === review.id ? 0.5 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  No ({review.unhelpful})
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  background: page === 1 ? '#333' : '#FF8200',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ color: '#e2e8f0', padding: '0 16px' }}>
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                style={{
                  padding: '8px 16px',
                  background: page === data.totalPages ? '#333' : '#FF8200',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: page === data.totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        !showForm && (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              background: '#1a1a1a',
              borderRadius: 12,
            }}
          >
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              No reviews yet. Be the first to review{productName ? ` ${productName}` : ' this product'}!
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 24px',
                background: '#FF8200',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Write the First Review
            </button>
          </div>
        )
      )}
    </div>
  );
}
