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
  colors: string | null;
  featured: boolean;
  tags: string | null;
  images: MerchImage[];
  inventory: Inventory[];
  isPrintify?: boolean | null;
  totalStock?: number;
  material?: string | null;
  fitDescription?: string | null;
}

// Common color name to hex mapping
const COLOR_MAP: Record<string, string> = {
  'Black': '#1a1a1a',
  'White': '#ffffff',
  'Navy': '#1e3a5f',
  'Red': '#dc2626',
  'Blue': '#2563eb',
  'Green': '#16a34a',
  'Yellow': '#eab308',
  'Orange': '#f97316',
  'Purple': '#9333ea',
  'Pink': '#ec4899',
  'Gray': '#6b7280',
  'Grey': '#6b7280',
  'Brown': '#92400e',
  'Heather Gray': '#9ca3af',
  'Heather Grey': '#9ca3af',
  'Charcoal': '#374151',
  'Maroon': '#7f1d1d',
  'Forest Green': '#166534',
  'Royal Blue': '#1d4ed8',
  'Light Blue': '#93c5fd',
  'Natural': '#f5f5dc',
  'Cream': '#fffdd0',
  'Olive': '#808000',
  'Teal': '#0d9488',
  'Coral': '#f97066',
  'Burgundy': '#800020',
  'Mint': '#98fb98',
  'Lavender': '#e6e6fa'
};

function getColorHex(colorName: string): string {
  return COLOR_MAP[colorName] || COLOR_MAP[colorName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')] || '#6b7280';
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
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isInCart, setIsInCart] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Parse sizes and colors
  const availableSizes = merch.sizes ? JSON.parse(merch.sizes) : [];
  const availableColors = merch.colors ? JSON.parse(merch.colors) : [];

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
      alert("Pick a size first!");
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      alert("Pick a color first!");
      return;
    }

    // Build display name with variants
    let displayName = merch.name;
    const variantParts = [];
    if (selectedColor) variantParts.push(selectedColor);
    if (selectedSize) variantParts.push(selectedSize);
    if (variantParts.length > 0) {
      displayName = `${merch.name} (${variantParts.join(' / ')})`;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: merch.id,
        name: displayName,
        slug: merch.slug,
        priceCents: merch.priceCents,
        imageUrl: allImages[0]?.imageUrl || '/placeholder-merch.jpg',
        type: 'merch',
        size: selectedSize || undefined,
        color: selectedColor || undefined,
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

              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={styles.sizeLabel}>
                    <span>
                      Select Color
                      {selectedColor && (
                        <span style={{ fontWeight: 'normal', color: '#94a3b8', marginLeft: '8px' }}>
                          — {selectedColor}
                        </span>
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {availableColors.map((color: string) => {
                      const colorHex = getColorHex(color);
                      const isSelected = selectedColor === color;
                      const isLight = ['White', 'Natural', 'Cream', 'Yellow', 'Mint', 'Light Blue'].includes(color);

                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: colorHex,
                            border: isSelected
                              ? '3px solid #f97316'
                              : isLight
                                ? '2px solid rgba(0, 0, 0, 0.2)'
                                : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected
                              ? '0 0 0 3px rgba(249, 115, 22, 0.3)'
                              : 'none',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isSelected && (
                            <Check
                              size={20}
                              color={isLight ? '#1a1a1a' : '#ffffff'}
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div style={styles.sizeSection}>
                  <div style={styles.sizeLabel}>
                    <span>
                      Select Size
                      {selectedSize && (
                        <span style={{ fontWeight: 'normal', color: '#94a3b8', marginLeft: '8px' }}>
                          — {selectedSize}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      style={styles.sizeGuideButton}
                    >
                      <Ruler size={16} />
                      Size Guide
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {availableSizes.map((size: string) => {
                      const stock = getStockForSize(size);
                      const isAvailable = stock > 0;
                      const isLowStock = isAvailable && stock < 5 && !merch.isPrintify;
                      const isSelected = selectedSize === size;

                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                          style={{
                            position: 'relative',
                            minWidth: '56px',
                            padding: '12px 16px',
                            background: isSelected
                              ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                              : 'rgba(30, 41, 59, 0.5)',
                            border: isSelected
                              ? '2px solid #f97316'
                              : isAvailable
                                ? '2px solid rgba(249, 115, 22, 0.3)'
                                : '2px solid rgba(100, 116, 139, 0.2)',
                            borderRadius: '10px',
                            color: isSelected
                              ? '#000'
                              : isAvailable
                                ? '#e2e8f0'
                                : '#64748b',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: isAvailable ? 1 : 0.4,
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                            textDecoration: !isAvailable ? 'line-through' : 'none'
                          }}
                        >
                          {size}
                          {isLowStock && (
                            <span style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#ef4444',
                              color: 'white',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontWeight: 'bold'
                            }}>
                              {stock} left
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {showSizeGuide && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: '#94a3b8',
                      border: '1px solid rgba(249, 115, 22, 0.2)'
                    }}>
                      <strong style={{ color: '#fdba74', fontSize: '14px' }}>Size Guide (US)</strong>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '12px',
                        marginTop: '12px'
                      }}>
                        {[
                          { size: 'S', chest: '34-36"' },
                          { size: 'M', chest: '38-40"' },
                          { size: 'L', chest: '42-44"' },
                          { size: 'XL', chest: '46-48"' },
                          { size: '2XL', chest: '50-52"' }
                        ].map(({ size, chest }) => (
                          <div key={size} style={{
                            padding: '8px 12px',
                            background: 'rgba(249, 115, 22, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#fdba74' }}>{size}</div>
                            <div style={{ fontSize: '12px' }}>Chest {chest}</div>
                          </div>
                        ))}
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
                {(() => {
                  const needsSize = availableSizes.length > 0 && !selectedSize;
                  const needsColor = availableColors.length > 0 && !selectedColor;
                  const isDisabled = !isInStock || needsSize || needsColor;

                  let buttonText = 'Add to Cart';
                  if (!isInStock) buttonText = 'Out of Stock';
                  else if (needsColor && needsSize) buttonText = 'Select Color & Size';
                  else if (needsColor) buttonText = 'Select Color';
                  else if (needsSize) buttonText = 'Select Size';

                  return (
                    <button
                      onClick={handleAddToCart}
                      disabled={isDisabled}
                      style={{
                        ...styles.addToCartButton,
                        opacity: isDisabled && !isInCart ? 0.6 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isInCart ? (
                        <>
                          <Check size={20} />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={20} />
                          {buttonText}
                        </>
                      )}
                    </button>
                  );
                })()}
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