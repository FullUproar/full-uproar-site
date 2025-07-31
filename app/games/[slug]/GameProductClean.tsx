'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Users, Clock, Heart, Share2, ChevronLeft, ChevronRight, 
  Zap, Package, Star, Skull, Shield, Truck, BadgeCheck, Sparkles,
  Gift, Timer, Eye, ArrowRight, Gamepad2, Trophy, Flame, Check,
  Info, AlertCircle, X, Plus, Minus
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

interface GameImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
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
}

interface GameProductCleanProps {
  game: Game;
  similarGames: Game[];
}

export default function GameProductClean({ game, similarGames }: GameProductCleanProps) {
  const router = useRouter();
  const { addToCart, toggleCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInCart, setIsInCart] = useState(false);

  const allImages = [
    ...(game.imageUrl ? [{ imageUrl: game.imageUrl, alt: game.title, isPrimary: true }] : []),
    ...game.images
  ].filter(img => img.imageUrl);

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
      background: '#1a1a1a'
    },
    breadcrumb: {
      background: '#2a2a2a',
      borderBottom: '2px solid #f97316',
      padding: '12px 0'
    },
    breadcrumbInner: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    },
    breadcrumbLink: {
      color: '#fdba74',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'color 0.2s'
    },
    breadcrumbSeparator: {
      color: '#666'
    },
    breadcrumbCurrent: {
      color: '#fde68a',
      fontWeight: '600'
    },
    mainSection: {
      background: '#1f1f1f',
      padding: '40px 0'
    },
    mainContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 16px'
    },
    gridLayout: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 380px',
      gap: '40px',
      '@media (max-width: 1024px)': {
        gridTemplateColumns: '1fr',
        gap: '24px'
      }
    },
    // Image Gallery Styles
    imageSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px'
    },
    mainImageContainer: {
      background: '#2a2a2a',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative' as const,
      border: '2px solid #333'
    },
    mainImage: {
      width: '100%',
      height: '500px',
      objectFit: 'contain' as const,
      display: 'block'
    },
    badgesContainer: {
      position: 'absolute' as const,
      top: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    badge: {
      background: '#ef4444',
      color: 'white',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    bestsellerBadge: {
      background: '#f97316',
      color: 'white',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    thumbnailGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '8px'
    },
    thumbnail: {
      aspectRatio: '1',
      background: '#2a2a2a',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    thumbnailActive: {
      border: '3px solid #f97316'
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const
    },
    // Product Info Styles
    infoSection: {
      color: '#e5e5e5'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '8px'
    },
    tagline: {
      fontSize: '18px',
      color: '#fde68a',
      marginBottom: '16px'
    },
    ratingContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    },
    stars: {
      display: 'flex',
      gap: '2px'
    },
    ratingText: {
      color: '#60a5fa',
      fontSize: '14px',
      cursor: 'pointer'
    },
    categoryBadge: {
      display: 'inline-block',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '24px'
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
    priceSection: {
      borderTop: '1px solid #333',
      borderBottom: '1px solid #333',
      padding: '24px 0',
      marginBottom: '24px'
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '12px',
      marginBottom: '8px'
    },
    priceLabel: {
      fontSize: '14px',
      color: '#999'
    },
    price: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#f97316'
    },
    originalPrice: {
      fontSize: '20px',
      color: '#666',
      textDecoration: 'line-through'
    },
    savings: {
      color: '#10b981',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    shipping: {
      fontSize: '14px',
      color: '#fde68a',
      marginTop: '8px'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '32px'
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    },
    featureIcon: {
      color: '#f97316'
    },
    featureLabel: {
      color: '#999'
    },
    featureValue: {
      color: '#fde68a',
      fontWeight: 'bold'
    },
    description: {
      fontSize: '16px',
      lineHeight: '1.8',
      color: '#e5e5e5',
      marginBottom: '24px'
    },
    bundleInfo: {
      background: 'rgba(249, 115, 22, 0.1)',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    },
    bundleTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    bundleText: {
      color: '#fde68a',
      fontSize: '14px'
    },
    // Buy Box Styles
    buyBox: {
      background: '#2a2a2a',
      border: '2px solid #333',
      borderRadius: '12px',
      padding: '24px',
      position: 'sticky' as const,
      top: '80px',
      height: 'fit-content'
    },
    buyBoxPrice: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#f97316',
      marginBottom: '20px'
    },
    deliveryInfo: {
      fontSize: '14px',
      marginBottom: '20px'
    },
    deliveryItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    deliveryText: {
      color: '#e5e5e5'
    },
    deliveryHighlight: {
      fontWeight: 'bold',
      color: '#10b981'
    },
    stockStatus: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '20px'
    },
    inStock: {
      color: '#10b981'
    },
    lowStock: {
      color: '#f97316'
    },
    outOfStock: {
      color: '#ef4444'
    },
    quantitySection: {
      marginBottom: '20px'
    },
    quantityLabel: {
      fontSize: '14px',
      color: '#e5e5e5',
      marginBottom: '8px'
    },
    quantitySelector: {
      display: 'flex',
      alignItems: 'center',
      border: '2px solid #444',
      borderRadius: '8px',
      width: 'fit-content',
      background: '#1a1a1a'
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
      borderLeft: '2px solid #444',
      borderRight: '2px solid #444'
    },
    actionButtons: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      marginBottom: '20px'
    },
    addToCartButton: {
      width: '100%',
      padding: '14px',
      borderRadius: '50px',
      fontSize: '16px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    addToCartEnabled: {
      background: '#fbbf24',
      color: '#111827'
    },
    addToCartDisabled: {
      background: '#4b5563',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    buyNowButton: {
      width: '100%',
      padding: '14px',
      borderRadius: '50px',
      fontSize: '16px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: '#f97316',
      color: 'white'
    },
    securityInfo: {
      borderTop: '1px solid #333',
      paddingTop: '20px',
      fontSize: '14px'
    },
    securityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#999',
      marginBottom: '8px'
    },
    shareButtons: {
      borderTop: '1px solid #333',
      marginTop: '20px',
      paddingTop: '20px',
      display: 'flex',
      gap: '16px'
    },
    shareButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#999',
      fontSize: '14px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s'
    },
    // Similar Products
    similarSection: {
      background: '#1a1a1a',
      padding: '40px 0'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '24px'
    },
    similarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px'
    },
    similarCard: {
      background: '#2a2a2a',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'transform 0.2s',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    similarImage: {
      width: '100%',
      height: '200px',
      objectFit: 'contain' as const,
      background: '#333'
    },
    similarInfo: {
      padding: '12px'
    },
    similarTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#fde68a',
      marginBottom: '4px',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden'
    },
    similarPrice: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#f97316'
    }
  };

  return (
    <div style={styles.container}>
      <Navigation />

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <div style={styles.breadcrumbInner}>
          <Link href="/" style={styles.breadcrumbLink}>Full Uproar</Link>
          <ChevronRight style={{ width: '14px', height: '14px', ...styles.breadcrumbSeparator }} />
          <Link href="/games" style={styles.breadcrumbLink}>Games</Link>
          <ChevronRight style={{ width: '14px', height: '14px', ...styles.breadcrumbSeparator }} />
          <span style={styles.breadcrumbCurrent}>{game.category === 'mod' ? 'Mods' : 'Games'}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div style={styles.mainSection}>
        <div style={styles.mainContainer}>
          <div style={styles.gridLayout}>
            
            {/* Image Gallery */}
            <div style={styles.imageSection}>
              <div style={styles.mainImageContainer}>
                <img
                  src={allImages[selectedImage]?.imageUrl || '/placeholder-game.jpg'}
                  alt={allImages[selectedImage]?.alt || game.title}
                  style={styles.mainImage}
                />
                
                <div style={styles.badgesContainer}>
                  {game.isPreorder && (
                    <div style={styles.badge}>PRE-ORDER</div>
                  )}
                  {game.featured && (
                    <div style={styles.bestsellerBadge}>BESTSELLER</div>
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
                        ...(selectedImage === index ? styles.thumbnailActive : {}),
                        border: selectedImage === index ? '3px solid #f97316' : '3px solid transparent'
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

            {/* Product Info */}
            <div style={styles.infoSection}>
              <h1 style={styles.title}>{game.title}</h1>
              {game.tagline && (
                <p style={styles.tagline}>{game.tagline}</p>
              )}
              
              <div style={styles.ratingContainer}>
                <div style={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} style={{ width: '18px', height: '18px', fill: '#f97316', color: '#f97316' }} />
                  ))}
                </div>
                <span style={styles.ratingText}>4.8 out of 5 | 234 ratings</span>
              </div>

              <div style={{
                ...styles.categoryBadge,
                ...(game.category === 'mod' ? styles.modBadge : styles.gameBadge)
              }}>
                {game.category?.toUpperCase() || 'GAME'}
              </div>

              <div style={styles.priceSection}>
                <div style={styles.priceContainer}>
                  <span style={styles.priceLabel}>Price:</span>
                  <span style={styles.price}>${(game.priceCents / 100).toFixed(2)}</span>
                  {game.isBundle && (
                    <>
                      <span style={styles.originalPrice}>
                        ${((game.priceCents * 1.3) / 100).toFixed(2)}
                      </span>
                      <span style={styles.savings}>
                        Save ${((game.priceCents * 0.3) / 100).toFixed(2)} (23%)
                      </span>
                    </>
                  )}
                </div>
                <p style={styles.shipping}>
                  🚚 FREE delivery on orders over $25
                </p>
              </div>

              <div style={styles.featuresGrid}>
                <div style={styles.featureItem}>
                  <Users style={{ width: '16px', height: '16px', ...styles.featureIcon }} />
                  <span style={styles.featureLabel}>Players:</span>
                  <span style={styles.featureValue}>{game.players}</span>
                </div>
                <div style={styles.featureItem}>
                  <Clock style={{ width: '16px', height: '16px', ...styles.featureIcon }} />
                  <span style={styles.featureLabel}>Play Time:</span>
                  <span style={styles.featureValue}>{game.timeToPlay}</span>
                </div>
                <div style={styles.featureItem}>
                  <Info style={{ width: '16px', height: '16px', ...styles.featureIcon }} />
                  <span style={styles.featureLabel}>Age Rating:</span>
                  <span style={styles.featureValue}>{game.ageRating}</span>
                </div>
                <div style={styles.featureItem}>
                  <Gamepad2 style={{ width: '16px', height: '16px', ...styles.featureIcon }} />
                  <span style={styles.featureLabel}>Category:</span>
                  <span style={styles.featureValue}>{game.category?.toUpperCase() || 'GAME'}</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fdba74', marginBottom: '12px' }}>
                  About This Game
                </h3>
                <p style={styles.description}>{game.description}</p>
              </div>

              {game.bundleInfo && (
                <div style={styles.bundleInfo}>
                  <h4 style={styles.bundleTitle}>
                    <Package style={{ width: '20px', height: '20px' }} />
                    Bundle Includes
                  </h4>
                  <p style={styles.bundleText}>{game.bundleInfo}</p>
                </div>
              )}
            </div>

            {/* Buy Box */}
            <div style={styles.buyBox}>
              <div style={styles.buyBoxPrice}>
                ${(game.priceCents / 100).toFixed(2)}
              </div>

              <div style={styles.deliveryInfo}>
                <div style={styles.deliveryItem}>
                  <Truck style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  <span style={styles.deliveryText}>
                    <span style={styles.deliveryHighlight}>FREE delivery</span> Thursday, November 7
                  </span>
                </div>
                <p style={{ ...styles.deliveryText, marginLeft: '24px' }}>
                  Or fastest delivery <span style={styles.deliveryHighlight}>Tomorrow, Nov 5</span>
                </p>
              </div>

              <div style={{
                ...styles.stockStatus,
                ...(game.stock > 20 ? styles.inStock : game.stock > 0 ? styles.lowStock : styles.outOfStock)
              }}>
                {game.stock > 20 ? 'In Stock' : game.stock > 0 ? `Only ${game.stock} left in stock - order soon` : 'Currently unavailable'}
              </div>

              <div style={styles.quantitySection}>
                <label style={styles.quantityLabel}>Quantity:</label>
                <div style={styles.quantitySelector}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={styles.quantityButton}
                    disabled={quantity <= 1}
                  >
                    <Minus style={{ width: '16px', height: '16px' }} />
                  </button>
                  <span style={styles.quantityValue}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(game.stock || 99, quantity + 1))}
                    style={styles.quantityButton}
                    disabled={quantity >= (game.stock || 99)}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>

              <div style={styles.actionButtons}>
                <button
                  onClick={handleAddToCart}
                  disabled={game.stock === 0}
                  style={{
                    ...styles.addToCartButton,
                    ...(game.stock === 0 ? styles.addToCartDisabled : styles.addToCartEnabled)
                  }}
                >
                  {isInCart ? (
                    <>
                      <Check style={{ width: '18px', height: '18px' }} />
                      Added to Cart
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={game.stock === 0}
                  style={{
                    ...styles.buyNowButton,
                    opacity: game.stock === 0 ? 0.5 : 1,
                    cursor: game.stock === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Buy Now
                </button>
              </div>

              <div style={styles.securityInfo}>
                <div style={styles.securityItem}>
                  <Shield style={{ width: '16px', height: '16px' }} />
                  <span>Secure transaction</span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <p style={{ color: '#e5e5e5', marginBottom: '4px' }}>Ships from</p>
                  <p style={{ color: '#fdba74', fontWeight: 'bold' }}>Full Uproar Games</p>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <p style={{ color: '#e5e5e5', marginBottom: '4px' }}>Sold by</p>
                  <p style={{ color: '#fdba74', fontWeight: 'bold' }}>Full Uproar Games</p>
                </div>
              </div>

              <div style={styles.shareButtons}>
                <button onClick={handleShare} style={styles.shareButton}>
                  <Share2 style={{ width: '16px', height: '16px' }} />
                  Share
                </button>
                <button style={styles.shareButton}>
                  <Heart style={{ width: '16px', height: '16px' }} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarGames.length > 0 && (
        <div style={styles.similarSection}>
          <div style={styles.mainContainer}>
            <h2 style={styles.sectionTitle}>Customers who viewed this item also viewed</h2>
            
            <div style={styles.similarGrid}>
              {similarGames.slice(0, 6).map((similarGame) => (
                <Link
                  key={similarGame.id}
                  href={`/games/${similarGame.slug}`}
                  style={styles.similarCard}
                >
                  <img
                    src={similarGame.images[0]?.imageUrl || similarGame.imageUrl || '/placeholder-game.jpg'}
                    alt={similarGame.title}
                    style={styles.similarImage}
                  />
                  <div style={styles.similarInfo}>
                    <h3 style={styles.similarTitle}>{similarGame.title}</h3>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} style={{ width: '12px', height: '12px', fill: '#f97316', color: '#f97316' }} />
                      ))}
                    </div>
                    <p style={styles.similarPrice}>${(similarGame.priceCents / 100).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}