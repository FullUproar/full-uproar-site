'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, 
  Package, Star, Truck, BadgeCheck, Sparkles,
  Gift, Eye, ArrowRight, Flame, Check,
  Info, AlertCircle, X, Plus, Minus, Ruler
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { stripHtmlTags } from '@/lib/utils/formatting';

interface MerchImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Inventory {
  id: number;
  size: string | null;
  quantity: number;
  reserved: number;
}

interface Merch {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  sizes: string | null;
  featured: boolean;
  tags: string | null;
  images: MerchImage[];
  inventory: Inventory[];
  isPrintify?: boolean | null;
  totalStock?: number;
}

interface MerchProductStyledProps {
  merch: Merch;
  similarMerch: Merch[];
}

export default function MerchProductStyled({ merch, similarMerch }: MerchProductStyledProps) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isInCart, setIsInCart] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Parse sizes
  const availableSizes = merch.sizes ? JSON.parse(merch.sizes) : [];

  // Get all images
  const allImages = [
    ...(merch.imageUrl ? [{ imageUrl: merch.imageUrl, alt: merch.name, isPrimary: true }] : []),
    ...merch.images
  ].filter(img => img.imageUrl);

  // Get stock for selected size
  const getStockForSize = (size: string) => {
    // POD products always have stock
    if (merch.isPrintify) return 999;
    
    const inv = merch.inventory.find(i => i.size === size);
    return inv ? inv.quantity - inv.reserved : 0;
  };

  const currentStock = selectedSize ? getStockForSize(selectedSize) : (merch.totalStock || 0);
  const isInStock = merch.isPrintify || currentStock > 0;

  // Track window size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      alert("Pick a size, or Fugly will pick for you (and you won't like it)!");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: merch.id,
        name: merch.name,
        slug: merch.slug,
        priceCents: merch.priceCents,
        imageUrl: allImages[0]?.imageUrl || '/placeholder-merch.jpg',
        type: 'merch',
        size: selectedSize || undefined,
        category: merch.category
      });
    }
    
    setIsInCart(true);
    setTimeout(() => setIsInCart(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: merch.name,
        text: stripHtmlTags(merch.description),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Styles matching GameProductTabbed
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #374151)',
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: isMobile ? '20px' : '40px'
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
      fontSize: '14px'
    },
    breadcrumbLink: {
      color: '#94a3b8',
      textDecoration: 'none',
      transition: 'color 0.2s'
    },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '24px' : '48px',
      marginBottom: '48px'
    },
    imageSection: {
      position: 'relative' as const
    },
    mainImageContainer: {
      position: 'relative' as const,
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      marginBottom: '16px',
      aspectRatio: '1'
    },
    mainImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const
    },
    imageNav: {
      position: 'absolute' as const,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    thumbnailGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)',
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
      fontSize: isMobile ? '28px' : '36px',
      fontWeight: '900',
      color: '#fdba74',
      marginBottom: '16px',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
    },
    categoryBadge: {
      display: 'inline-block',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      background: 'rgba(249, 115, 22, 0.2)',
      color: '#fdba74',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      marginBottom: '16px'
    },
    description: {
      color: '#e2e8f0',
      lineHeight: '1.6',
      fontSize: '16px'
    },
    buyBox: {
      background: 'rgba(30, 41, 59, 0.8)',
      border: '3px solid #f97316',
      borderRadius: '16px',
      padding: isMobile ? '20px' : '24px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    },
    priceDisplay: {
      fontSize: isMobile ? '32px' : '42px',
      fontWeight: '900',
      color: '#f97316',
      marginBottom: '8px',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
    },
    stockStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '20px',
      fontSize: '14px'
    },
    inStock: {
      color: '#10b981'
    },
    outOfStock: {
      color: '#ef4444'
    },
    sizeSection: {
      marginBottom: '20px'
    },
    sizeLabel: {
      color: '#fdba74',
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    sizeGuideButton: {
      background: 'transparent',
      border: 'none',
      color: '#94a3b8',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    sizeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
      gap: '8px'
    },
    sizeButton: {
      padding: '10px',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.2)',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    sizeButtonSelected: {
      background: '#f97316',
      borderColor: '#f97316',
      color: '#000'
    },
    sizeButtonDisabled: {
      opacity: 0.3,
      cursor: 'not-allowed'
    },
    quantitySection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '20px'
    },
    quantityButton: {
      background: 'rgba(30, 41, 59, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '8px',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#fdba74',
      transition: 'all 0.2s'
    },
    quantityDisplay: {
      color: '#fdba74',
      fontSize: '20px',
      fontWeight: 'bold',
      minWidth: '40px',
      textAlign: 'center' as const
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      flexDirection: isMobile ? 'column' as const : 'row' as const
    },
    addToCartButton: {
      flex: 1,
      padding: '16px',
      background: isInCart 
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: isInStock ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s',
      opacity: isInStock ? 1 : 0.5
    },
    secondaryButton: {
      padding: '16px',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      color: '#fdba74',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '16px',
      marginTop: '24px'
    },
    featureCard: {
      background: 'rgba(30, 41, 59, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    featureIcon: {
      color: '#f97316'
    },
    featureText: {
      color: '#e2e8f0',
      fontSize: '14px'
    },
    similarSection: {
      marginTop: '64px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fdba74',
      marginBottom: '24px'
    },
    similarGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
      gap: '24px'
    },
    similarCard: {
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    },
    similarImage: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover' as const
    },
    similarInfo: {
      padding: '16px'
    },
    similarName: {
      color: '#fdba74',
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    similarPrice: {
      color: '#f97316',
      fontSize: '20px',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.container}>
      <Navigation />
      
      <div style={styles.content}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <Link href="/" style={styles.breadcrumbLink}>Home</Link>
          <span style={{ color: '#475569' }}>/</span>
          <Link href="/merch" style={styles.breadcrumbLink}>Merch</Link>
          <span style={{ color: '#475569' }}>/</span>
          <span style={{ color: '#fdba74' }}>{merch.name}</span>
        </div>

        {/* Product Grid */}
        <div style={styles.productGrid}>
          {/* Left: Images */}
          <div style={styles.imageSection}>
            <div style={styles.mainImageContainer}>
              {allImages[selectedImage] && (
                <img 
                  src={allImages[selectedImage].imageUrl}
                  alt={allImages[selectedImage].alt || merch.name}
                  style={styles.mainImage}
                />
              )}
              
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                    style={{ ...styles.imageNav, left: '16px' }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev < allImages.length - 1 ? prev + 1 : 0)}
                    style={{ ...styles.imageNav, right: '16px' }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={styles.thumbnailGrid}>
                {allImages.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    style={{
                      ...styles.thumbnail,
                      ...(selectedImage === index ? styles.thumbnailActive : {})
                    }}
                  >
                    <img 
                      src={img.imageUrl}
                      alt={img.alt || `${merch.name} ${index + 1}`}
                      style={styles.thumbnailImage}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info and Buy Box */}
          <div style={styles.infoSection}>
            {/* Title and Description */}
            <div style={styles.titleArea}>
              <div style={styles.categoryBadge}>
                {merch.category}
              </div>
              <h1 style={styles.title}>{merch.name}</h1>
              <p style={styles.description}>
                {stripHtmlTags(merch.description)}
              </p>
            </div>

            {/* Buy Box */}
            <div style={styles.buyBox}>
              <div style={styles.priceDisplay}>
                ${(merch.priceCents / 100).toFixed(2)}
              </div>

              <div style={styles.stockStatus}>
                {isInStock ? (
                  <>
                    <Check size={16} style={styles.inStock} />
                    <span style={styles.inStock}>In Stock</span>
                    {merch.isPrintify && (
                      <>
                        <span style={{ color: '#94a3b8' }}>•</span>
                        <span style={{ color: '#94a3b8' }}>Print on Demand</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <X size={16} style={styles.outOfStock} />
                    <span style={styles.outOfStock}>Out of Stock</span>
                  </>
                )}
              </div>

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div style={styles.sizeSection}>
                  <div style={styles.sizeLabel}>
                    <span>Select Size</span>
                    <button 
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      style={styles.sizeGuideButton}
                    >
                      <Ruler size={16} />
                      Size Guide
                    </button>
                  </div>
                  
                  <div style={styles.sizeGrid}>
                    {availableSizes.map((size: string) => {
                      const stock = getStockForSize(size);
                      const isAvailable = stock > 0;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                          style={{
                            ...styles.sizeButton,
                            ...(selectedSize === size ? styles.sizeButtonSelected : {}),
                            ...(!isAvailable ? styles.sizeButtonDisabled : {})
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {showSizeGuide && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#94a3b8'
                    }}>
                      <strong style={{ color: '#fdba74' }}>Size Guide (US)</strong>
                      <div style={{ marginTop: '8px' }}>
                        S: Chest 34-36" | M: Chest 38-40" | L: Chest 42-44" | XL: Chest 46-48" | 2XL: Chest 50-52"
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div style={styles.quantitySection}>
                <span style={{ color: '#94a3b8' }}>Quantity:</span>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.quantityButton}
                >
                  <Minus size={18} />
                </button>
                <span style={styles.quantityDisplay}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  style={styles.quantityButton}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionButtons}>
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || (availableSizes.length > 0 && !selectedSize)}
                  style={styles.addToCartButton}
                >
                  {isInCart ? (
                    <>
                      <Check size={20} />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      {isInStock ? 'Add to Cart' : 'Out of Stock'}
                    </>
                  )}
                </button>
                <button onClick={handleShare} style={styles.secondaryButton}>
                  <Share2 size={20} />
                </button>
              </div>

              {/* Features */}
              <div style={styles.featuresGrid}>
                <div style={styles.featureCard}>
                  <Truck size={20} style={styles.featureIcon} />
                  <span style={styles.featureText}>Fast Shipping</span>
                </div>
                {merch.isPrintify && (
                  <div style={styles.featureCard}>
                    <Sparkles size={20} style={styles.featureIcon} />
                    <span style={styles.featureText}>Made to Order</span>
                  </div>
                )}
                <div style={styles.featureCard}>
                  <BadgeCheck size={20} style={styles.featureIcon} />
                  <span style={styles.featureText}>Quality Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarMerch.length > 0 && (
          <div style={styles.similarSection}>
            <h2 style={styles.sectionTitle}>You Might Also Like</h2>
            <div style={styles.similarGrid}>
              {similarMerch.map((item) => (
                <Link
                  key={item.id}
                  href={`/merch/${item.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={styles.similarCard}>
                    <img 
                      src={item.imageUrl || '/placeholder-merch.jpg'}
                      alt={item.name}
                      style={styles.similarImage}
                    />
                    <div style={styles.similarInfo}>
                      <div style={styles.similarName}>{item.name}</div>
                      <div style={styles.similarPrice}>
                        ${(item.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}