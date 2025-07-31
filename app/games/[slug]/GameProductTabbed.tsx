'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Users, Clock, Heart, Share2, ChevronLeft, ChevronRight, 
  Zap, Package, Star, Skull, Shield, Truck, BadgeCheck, Sparkles,
  Gift, Timer, Eye, ArrowRight, Gamepad2, Trophy, Flame, Check,
  Info, AlertCircle, X, Plus, Minus, ThumbsUp, ThumbsDown, Play
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import Tooltip from '@/app/components/Tooltip';

interface GameImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Review {
  id: number;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  createdAt: string;
}

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  category?: string;
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo: string | null;
  stock: number;
  tags: string | null;
  images: GameImage[];
  howToPlay?: string | null;
  components?: string | null;
  videoUrl?: string | null;
}

interface GameProductTabbedProps {
  game: Game;
  similarGames: Game[];
}

export default function GameProductTabbed({ game, similarGames }: GameProductTabbedProps) {
  const router = useRouter();
  const { user } = useUser();
  const { addToCart, toggleCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  const [isInCart, setIsInCart] = useState(false);
  const [viewersCount, setViewersCount] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    total: 0,
    distribution: {} as Record<number, number>
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const allImages = [
    ...(game.imageUrl ? [{ imageUrl: game.imageUrl, alt: game.title, isPrimary: true }] : []),
    ...game.images
  ].filter(img => img.imageUrl);

  // Track product view
  useEffect(() => {
    const trackView = async () => {
      try {
        const response = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'view',
            productType: 'game',
            productId: game.id
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setViewersCount(data.viewersCount || 0);
        }
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    trackView();

    // Update viewer count every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/track?type=game&id=${game.id}`);
        if (response.ok) {
          const data = await response.json();
          setViewersCount(data.currentViewers || 0);
          setTodayViews(data.todayViews || 0);
        }
      } catch (error) {
        console.error('Failed to fetch viewer stats:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [game.id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?gameId=${game.id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
          setReviewStats({
            averageRating: data.averageRating,
            total: data.total,
            distribution: data.ratingDistribution
          });
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };

    fetchReviews();
  }, [game.id]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: game.id,
        name: game.title,
        slug: game.slug,
        priceCents: game.priceCents,
        imageUrl: allImages[0]?.imageUrl || '/placeholder-game.jpg',
        type: 'game'
      });
    }
    
    setIsInCart(true);
    setTimeout(() => setIsInCart(false), 3000);

    // Track add to cart
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_to_cart',
        productType: 'game',
        productId: game.id,
        metadata: { quantity }
      })
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    toggleCart();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: game.title,
        text: game.tagline || game.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    },
    mainSection: {
      padding: '40px 0'
    },
    mainContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 16px'
    },
    topSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '40px',
      marginBottom: '40px',
      '@media (max-width: 1024px)': {
        gridTemplateColumns: '1fr',
        gap: '24px'
      }
    },
    // Left side - Images
    imageSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px'
    },
    mainImageContainer: {
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative' as const,
      border: '3px solid rgba(249, 115, 22, 0.2)',
      backdropFilter: 'blur(10px)'
    },
    mainImage: {
      width: '100%',
      height: '500px',
      objectFit: 'contain' as const,
      display: 'block'
    },
    viewingIndicator: {
      position: 'absolute' as const,
      top: '16px',
      right: '16px',
      background: 'rgba(239, 68, 68, 0.9)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      animation: 'pulse 2s infinite'
    },
    thumbnailGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '8px'
    },
    thumbnail: {
      aspectRatio: '1',
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '2px solid transparent'
    },
    thumbnailActive: {
      border: '2px solid #f97316'
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const
    },
    // Right side - Info and Buy Box
    infoSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    titleArea: {
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.2)'
    },
    title: {
      fontSize: '36px',
      fontWeight: '900',
      color: '#fdba74',
      marginBottom: '8px',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
    },
    tagline: {
      fontSize: '20px',
      color: '#fde68a',
      marginBottom: '16px',
      fontWeight: '600'
    },
    ratingContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    categoryBadge: {
      display: 'inline-block',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: 'auto'
    },
    gameBadge: {
      background: 'rgba(249, 115, 22, 0.2)',
      color: '#fdba74',
      border: '1px solid rgba(249, 115, 22, 0.3)'
    },
    modBadge: {
      background: 'rgba(139, 92, 246, 0.2)',
      color: '#c7d2fe',
      border: '1px solid rgba(139, 92, 246, 0.3)'
    },
    buyBox: {
      background: 'rgba(30, 41, 59, 0.8)',
      border: '3px solid #f97316',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    },
    priceDisplay: {
      fontSize: '42px',
      fontWeight: '900',
      color: '#f97316',
      marginBottom: '8px',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
    },
    stockStatus: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '20px'
    },
    quantitySection: {
      marginBottom: '20px'
    },
    quantityLabel: {
      fontSize: '14px',
      color: '#fde68a',
      marginBottom: '8px',
      fontWeight: '600'
    },
    quantitySelector: {
      display: 'flex',
      alignItems: 'center',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      width: 'fit-content',
      background: 'rgba(17, 24, 39, 0.5)'
    },
    quantityButton: {
      padding: '8px 12px',
      background: 'transparent',
      border: 'none',
      color: '#f97316',
      cursor: 'pointer',
      fontSize: '18px',
      transition: 'background 0.2s'
    },
    quantityValue: {
      padding: '8px 24px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#fde68a',
      borderLeft: '2px solid rgba(249, 115, 22, 0.3)',
      borderRight: '2px solid rgba(249, 115, 22, 0.3)'
    },
    actionButtons: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    },
    addToCartButton: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '900',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      color: '#111827',
      transform: 'scale(1)',
      boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
    },
    buyNowButton: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '900',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)'
    },
    // Tabs Section
    tabsContainer: {
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '16px',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.2)'
    },
    tabNavigation: {
      display: 'flex',
      borderBottom: '2px solid rgba(249, 115, 22, 0.2)'
    },
    tabButton: {
      flex: 1,
      padding: '20px',
      background: 'transparent',
      border: 'none',
      color: '#94a3b8',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const
    },
    tabButtonActive: {
      color: '#fdba74',
      background: 'rgba(249, 115, 22, 0.1)'
    },
    tabIndicator: {
      position: 'absolute' as const,
      bottom: '-2px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#f97316'
    },
    tabContent: {
      padding: '32px'
    },
    // Review styles
    reviewsGrid: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px'
    },
    reviewCard: {
      background: 'rgba(17, 24, 39, 0.5)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(249, 115, 22, 0.1)'
    },
    reviewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    reviewAuthor: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    reviewName: {
      fontWeight: 'bold',
      color: '#fdba74'
    },
    verifiedBadge: {
      background: 'rgba(34, 197, 94, 0.2)',
      color: '#86efac',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    },
    reviewTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#fde68a',
      marginBottom: '8px'
    },
    reviewComment: {
      color: '#e2e8f0',
      lineHeight: '1.6',
      marginBottom: '16px'
    },
    reviewActions: {
      display: 'flex',
      gap: '16px',
      fontSize: '14px',
      color: '#94a3b8'
    },
    reviewActionButton: {
      background: 'none',
      border: 'none',
      color: '#94a3b8',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'color 0.2s'
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fdba74', marginBottom: '16px' }}>
              About This Game
            </h3>
            <p style={{ color: '#e2e8f0', fontSize: '16px', lineHeight: '1.8', marginBottom: '24px' }}>
              {game.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
              <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fdba74', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gamepad2 style={{ width: '20px', height: '20px' }} />
                  Game Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Players:</span>
                    <span style={{ color: '#fde68a', fontWeight: '600' }}>{game.players}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Play Time:</span>
                    <span style={{ color: '#fde68a', fontWeight: '600' }}>{game.timeToPlay}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Age Rating:</span>
                    <span style={{ color: '#fde68a', fontWeight: '600' }}>{game.ageRating}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Category:</span>
                    <span style={{ color: '#fde68a', fontWeight: '600' }}>{game.category?.toUpperCase() || 'GAME'}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fdba74', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package style={{ width: '20px', height: '20px' }} />
                  What's in the Box
                </h4>
                <div style={{ color: '#e2e8f0', lineHeight: '1.8' }}>
                  {game.components ? (
                    <div dangerouslySetInnerHTML={{ __html: game.components.replace(/\n/g, '<br>') }} />
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      <li>• 200+ Chaos Cards</li>
                      <li>• 1 Fugly-approved rulebook</li>
                      <li>• Special chaos dice</li>
                      <li>• Score tracking tokens</li>
                      <li>• Exclusive Fugly sticker</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {game.bundleInfo && (
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdba74', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gift style={{ width: '24px', height: '24px' }} />
                  Bundle Contents
                </h4>
                <p style={{ color: '#fde68a', fontSize: '16px' }}>{game.bundleInfo}</p>
              </div>
            )}
          </div>
        );

      case 'howToPlay':
        return (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fdba74', marginBottom: '16px' }}>
              How to Spread Chaos
            </h3>
            
            {game.videoUrl && (
              <div style={{ marginBottom: '32px', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe
                  width="100%"
                  height="400"
                  src={game.videoUrl}
                  title={`${game.title} - How to Play`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div style={{ color: '#e2e8f0', fontSize: '16px', lineHeight: '1.8' }}>
              {game.howToPlay ? (
                <div dangerouslySetInnerHTML={{ __html: game.howToPlay.replace(/\n/g, '<br>') }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: '#f97316', color: '#111827', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', flexShrink: 0 }}>
                      1
                    </div>
                    <div>
                      <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdba74', marginBottom: '8px' }}>
                        Gather Your Victims
                      </h4>
                      <p>Round up {game.players} of your favorite chaos agents. Make sure they're ready for friendship-ending fun!</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: '#f97316', color: '#111827', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', flexShrink: 0 }}>
                      2
                    </div>
                    <div>
                      <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdba74', marginBottom: '8px' }}>
                        Deal the Chaos
                      </h4>
                      <p>Shuffle the deck and deal out destruction. Each player gets their arsenal of mayhem.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: '#f97316', color: '#111827', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', flexShrink: 0 }}>
                      3
                    </div>
                    <div>
                      <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdba74', marginBottom: '8px' }}>
                        Unleash the Madness
                      </h4>
                      <p>Take turns playing cards and watch as alliances crumble and tables get flipped. Last one standing wins!</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: '#f97316', color: '#111827', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', flexShrink: 0 }}>
                      4
                    </div>
                    <div>
                      <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdba74', marginBottom: '8px' }}>
                        Embrace the Chaos
                      </h4>
                      <p>Remember: it's not about winning, it's about making everyone else lose spectacularly!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fdba74' }}>
                Customer Reviews
              </h3>
              {user && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{
                    background: '#f97316',
                    color: '#111827',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Write a Review
                </button>
              )}
            </div>

            {/* Review Stats */}
            <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#f97316' }}>
                    {reviewStats.averageRating.toFixed(1)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          fill: i < Math.round(reviewStats.averageRating) ? '#f97316' : 'transparent',
                          color: '#f97316' 
                        }} 
                      />
                    ))}
                  </div>
                  <div style={{ color: '#94a3b8' }}>{reviewStats.total} reviews</div>
                </div>

                <div>
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = reviewStats.distribution[rating] || 0;
                    const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    
                    return (
                      <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ color: '#fdba74', fontWeight: '600', width: '60px' }}>{rating} stars</span>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(249, 115, 22, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${percentage}%`, 
                              height: '100%', 
                              background: '#f97316',
                              transition: 'width 0.3s'
                            }} 
                          />
                        </div>
                        <span style={{ color: '#94a3b8', width: '40px', textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div style={styles.reviewsGrid}>
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} style={styles.reviewCard}>
                    <div style={styles.reviewHeader}>
                      <div style={styles.reviewAuthor}>
                        <span style={styles.reviewName}>{review.userName}</span>
                        {review.verified && (
                          <span style={styles.verifiedBadge}>Verified Purchase</span>
                        )}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            fill: i < review.rating ? '#f97316' : 'transparent',
                            color: '#f97316' 
                          }} 
                        />
                      ))}
                    </div>

                    <h4 style={styles.reviewTitle}>{review.title}</h4>
                    <p style={styles.reviewComment}>{review.comment}</p>

                    <div style={styles.reviewActions}>
                      <button style={styles.reviewActionButton}>
                        <ThumbsUp style={{ width: '14px', height: '14px' }} />
                        Helpful ({review.helpful})
                      </button>
                      <button style={styles.reviewActionButton}>
                        <ThumbsDown style={{ width: '14px', height: '14px' }} />
                        Not Helpful ({review.unhelpful})
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <p style={{ fontSize: '18px', marginBottom: '16px' }}>No reviews yet. Be the first to share your chaos experience!</p>
                  {!user && (
                    <p>Sign in to write a review</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <Navigation />

      <div style={styles.mainSection}>
        <div style={styles.mainContainer}>
          {/* Top Section - Images and Buy Box */}
          <div style={styles.topSection}>
            {/* Image Gallery */}
            <div style={styles.imageSection}>
              <div style={styles.mainImageContainer}>
                <img
                  src={allImages[selectedImage]?.imageUrl || '/placeholder-game.jpg'}
                  alt={allImages[selectedImage]?.alt || game.title}
                  style={styles.mainImage}
                />
                
                {viewersCount > 0 && (
                  <div style={styles.viewingIndicator}>
                    <Eye style={{ width: '16px', height: '16px' }} />
                    {viewersCount} {viewersCount === 1 ? 'person' : 'people'} viewing
                  </div>
                )}

                {/* Badges */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {game.isPreorder && (
                    <div style={{ background: '#dc2626', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', transform: 'rotate(-3deg)' }}>
                      PRE-ORDER
                    </div>
                  )}
                  {game.featured && (
                    <div style={{ background: '#f97316', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', transform: 'rotate(2deg)' }}>
                      BESTSELLER
                    </div>
                  )}
                </div>
              </div>

              {allImages.length > 1 && (
                <div style={styles.thumbnailGrid}>
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      style={{
                        ...styles.thumbnail,
                        ...(selectedImage === index ? styles.thumbnailActive : {})
                      }}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.alt || `${game.title} ${index + 1}`}
                        style={styles.thumbnailImage}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info and Buy Box */}
            <div style={styles.infoSection}>
              {/* Title Area */}
              <div style={styles.titleArea}>
                <h1 style={styles.title}>{game.title}</h1>
                {game.tagline && (
                  <p style={styles.tagline}>{game.tagline}</p>
                )}
                
                <div style={styles.ratingContainer}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          fill: i < Math.round(reviewStats.averageRating) ? '#f97316' : 'transparent',
                          color: '#f97316' 
                        }} 
                      />
                    ))}
                  </div>
                  <span style={{ color: '#fdba74', fontSize: '14px', fontWeight: '600' }}>
                    {reviewStats.averageRating.toFixed(1)} ({reviewStats.total} reviews)
                  </span>
                  
                  <div style={{
                    ...styles.categoryBadge,
                    ...(game.category === 'mod' ? styles.modBadge : styles.gameBadge)
                  }}>
                    {game.category?.toUpperCase() || 'GAME'}
                  </div>
                </div>
              </div>

              {/* Buy Box */}
              <div style={styles.buyBox}>
                <div style={styles.priceDisplay}>
                  ${(game.priceCents / 100).toFixed(2)}
                  {game.isBundle && (
                    <span style={{ fontSize: '20px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '12px' }}>
                      ${((game.priceCents * 1.3) / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                
                {game.isBundle && (
                  <p style={{ color: '#86efac', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Save ${((game.priceCents * 0.3) / 100).toFixed(2)} (23%)
                  </p>
                )}

                <div style={{
                  ...styles.stockStatus,
                  color: game.stock > 20 ? '#86efac' : game.stock > 0 ? '#fdba74' : '#fca5a5'
                }}>
                  {game.stock > 20 ? '✓ In Stock' : game.stock > 0 ? `Only ${game.stock} left!` : 'Out of Stock'}
                </div>

                {todayViews > 50 && (
                  <p style={{ color: '#fdba74', fontSize: '14px', marginBottom: '16px' }}>
                    🔥 {todayViews} people viewed this today
                  </p>
                )}

                <div style={styles.quantitySection}>
                  <label style={styles.quantityLabel}>Quantity:</label>
                  <div style={styles.quantitySelector}>
                    <Tooltip text="Minimum quantity is 1" position="top">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        style={{
                          ...styles.quantityButton,
                          opacity: quantity <= 1 ? 0.5 : 1
                        }}
                        disabled={quantity <= 1}
                      >
                        <Minus style={{ width: '16px', height: '16px' }} />
                      </button>
                    </Tooltip>
                    <span style={styles.quantityValue}>{quantity}</span>
                    <Tooltip 
                      text={quantity >= game.stock ? `Only ${game.stock} in stock!` : "Maximum quantity reached"} 
                      position="top"
                    >
                      <button
                        onClick={() => setQuantity(Math.min(game.stock || 99, quantity + 1))}
                        style={{
                          ...styles.quantityButton,
                          opacity: quantity >= (game.stock || 99) ? 0.5 : 1
                        }}
                        disabled={quantity >= (game.stock || 99)}
                      >
                        <Plus style={{ width: '16px', height: '16px' }} />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div style={styles.actionButtons}>
                  {game.stock === 0 ? (
                    <Tooltip text="This item is currently out of stock" position="top">
                      <button
                        disabled={true}
                        style={{
                          ...styles.addToCartButton,
                          opacity: 0.5,
                          cursor: 'not-allowed',
                          width: '100%'
                        }}
                      >
                        <ShoppingCart style={{ width: '20px', height: '20px' }} />
                        Out of Stock
                      </button>
                    </Tooltip>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      style={styles.addToCartButton}
                      onMouseEnter={(e) => { if (game.stock > 0) e.currentTarget.style.transform = 'scale(1.05)' }}
                      onMouseLeave={(e) => { if (game.stock > 0) e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      {isInCart ? (
                        <>
                          <Check style={{ width: '20px', height: '20px' }} />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart style={{ width: '20px', height: '20px' }} />
                          Add to Chaos Cart
                        </>
                      )}
                    </button>
                  )}
                  
                  {game.stock === 0 ? (
                    <Tooltip text="This item is currently out of stock" position="bottom">
                      <button
                        disabled={true}
                        style={{
                          ...styles.buyNowButton,
                          opacity: 0.5,
                          cursor: 'not-allowed',
                          width: '100%'
                        }}
                      >
                        Buy It Now!
                      </button>
                    </Tooltip>
                  ) : (
                    <button
                      onClick={handleBuyNow}
                      style={styles.buyNowButton}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Buy It Now!
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Truck style={{ width: '16px', height: '16px', color: '#86efac' }} />
                    <span style={{ color: '#fde68a', fontWeight: '600' }}>FREE shipping on orders over $25</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield style={{ width: '16px', height: '16px', color: '#86efac' }} />
                    <span style={{ color: '#fde68a', fontWeight: '600' }}>Secure checkout • Fugly approved</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <button 
                    onClick={handleShare}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#94a3b8', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <Share2 style={{ width: '16px', height: '16px' }} />
                    Share
                  </button>
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#94a3b8', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <Heart style={{ width: '16px', height: '16px' }} />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabNavigation}>
              {['details', 'howToPlay', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab ? styles.tabButtonActive : {})
                  }}
                >
                  {tab === 'details' && 'Game Details'}
                  {tab === 'howToPlay' && 'How to Play'}
                  {tab === 'reviews' && `Reviews (${reviewStats.total})`}
                  {activeTab === tab && <div style={styles.tabIndicator} />}
                </button>
              ))}
            </div>

            <div style={styles.tabContent}>
              {renderTabContent()}
            </div>
          </div>

          {/* Similar Products */}
          {similarGames.length > 0 && (
            <div style={{ marginTop: '48px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fdba74', marginBottom: '24px' }}>
                More Chaos You'll Love
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {similarGames.slice(0, 6).map((similarGame) => (
                  <Link
                    key={similarGame.id}
                    href={`/games/${similarGame.slug}`}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      border: '2px solid transparent',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = '#f97316';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ width: '100%', height: '200px', background: 'rgba(17, 24, 39, 0.5)' }}>
                      <img
                        src={similarGame.images[0]?.imageUrl || similarGame.imageUrl || '/placeholder-game.jpg'}
                        alt={similarGame.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fde68a', marginBottom: '4px', lineHeight: '1.2' }}>
                        {similarGame.title}
                      </h3>
                      <p style={{ fontSize: '20px', fontWeight: '900', color: '#f97316' }}>
                        ${(similarGame.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}