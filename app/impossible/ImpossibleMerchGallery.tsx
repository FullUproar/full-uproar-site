'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShoppingCart, X, Ban, Zap, Coffee, Heart, Skull } from 'lucide-react';
import { useToastStore } from '@/lib/toastStore';

interface ImpossibleProduct {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  impossiblePrice: string;
  imageUrl: string | null;
  category: string | null;
  warning: string | null;
  ingredients: string | null;
  features: string | null;
  legalDisclaimer: string | null;
  stockStatus: string;
  rejectionReason: string | null;
}

interface Props {
  products: ImpossibleProduct[];
}

const funnyRejections = [
  "Nice try, but the laws of physics called and said no.",
  "Your cart rejected this item and filed a restraining order.",
  "This product is currently stuck in an alternate dimension.",
  "Error 404: Reality not found.",
  "The shopping cart union has voted against this.",
  "Our lawyers are literally crying right now.",
  "This violates at least 17 international treaties.",
  "Your computer just laughed at you.",
  "The internet police have been notified.",
  "This product exists only in the quantum realm.",
  "Adding to cart would create a paradox.",
  "Your cart has trust issues with this item.",
  "This item is allergic to shopping carts.",
  "The checkout button has gone into witness protection.",
  "Sorry, this product is only available in the year 3021."
];

export default function ImpossibleMerchGallery({ products }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<ImpossibleProduct | null>(null);
  const [attemptCount, setAttemptCount] = useState<Record<number, number>>({});
  const addToast = useToastStore((state) => state.addToast);

  const handleAddToCart = (product: ImpossibleProduct) => {
    const count = attemptCount[product.id] || 0;
    const newCount = count + 1;
    setAttemptCount({ ...attemptCount, [product.id]: newCount });

    let message = product.rejectionReason || funnyRejections[Math.floor(Math.random() * funnyRejections.length)];
    
    // Escalate the humor based on attempts
    if (newCount === 2) {
      message = "Seriously? We just told you this is impossible.";
    } else if (newCount === 3) {
      message = "Your persistence is admirable but futile.";
    } else if (newCount === 5) {
      message = "OK, you win! Just kidding. Still impossible.";
    } else if (newCount === 10) {
      message = `You've clicked ${newCount} times. Seek help.`;
    } else if (newCount > 10) {
      message = `${newCount} clicks. We're genuinely concerned about you.`;
    }

    addToast({ 
      message, 
      type: 'error',
      duration: 5000 
    });
  };

  const getCategoryIcon = (category: string | null) => {
    switch(category) {
      case 'Food': return <Coffee size={20} />;
      case 'Weapons': return <Zap size={20} />;
      case 'Services': return <Heart size={20} />;
      default: return <Skull size={20} />;
    }
  };

  const getStockStatusDisplay = (status: string) => {
    switch(status) {
      case 'IMPOSSIBLE': return { text: 'Physically Impossible', color: '#ef4444' };
      case 'SOLD_OUT_FOREVER': return { text: 'Sold Out Forever', color: '#f97316' };
      case 'DISCONTINUED_BY_PHYSICS': return { text: 'Discontinued by Physics', color: '#8b5cf6' };
      default: return { text: 'Impossibly Unavailable', color: '#94a3b8' };
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '2rem'
    },
    
    header: {
      textAlign: 'center' as const,
      marginBottom: '4rem',
      padding: '2rem'
    },
    
    title: {
      fontSize: 'clamp(2rem, 5vw, 4rem)',
      color: '#fde68a',
      marginBottom: '1rem',
      fontWeight: 'bold',
      textShadow: '0 4px 20px rgba(249, 115, 22, 0.3)'
    },
    
    subtitle: {
      fontSize: '1.5rem',
      color: '#fdba74',
      marginBottom: '2rem',
      fontStyle: 'italic'
    },
    
    disclaimer: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '2px dashed #ef4444',
      borderRadius: '10px',
      padding: '1rem',
      maxWidth: '800px',
      margin: '0 auto',
      color: '#fca5a5'
    },
    
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    
    card: {
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      borderRadius: '15px',
      overflow: 'hidden',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative' as const
    },
    
    impossibleBadge: {
      position: 'absolute' as const,
      top: '1rem',
      right: '1rem',
      background: 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontWeight: 'bold',
      fontSize: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 10
    },
    
    imageContainer: {
      height: '250px',
      background: 'rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const
    },
    
    content: {
      padding: '1.5rem'
    },
    
    productTitle: {
      fontSize: '1.5rem',
      color: '#fde68a',
      marginBottom: '0.5rem',
      fontWeight: 'bold'
    },
    
    tagline: {
      color: '#fdba74',
      fontSize: '0.9rem',
      fontStyle: 'italic',
      marginBottom: '1rem'
    },
    
    price: {
      fontSize: '1.25rem',
      color: '#ef4444',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    
    warning: {
      background: 'rgba(251, 191, 36, 0.1)',
      border: '1px solid #fbbf24',
      borderRadius: '5px',
      padding: '0.5rem',
      fontSize: '0.75rem',
      color: '#fde68a',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    
    description: {
      color: '#94a3b8',
      fontSize: '0.9rem',
      lineHeight: '1.6',
      marginBottom: '1rem'
    },
    
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    },
    
    modalContent: {
      background: '#1e293b',
      borderRadius: '20px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative' as const
    },
    
    modalClose: {
      position: 'absolute' as const,
      top: '1rem',
      right: '1rem',
      background: 'rgba(239, 68, 68, 0.2)',
      border: 'none',
      color: '#ef4444',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Impossible Merchandise</h1>
        <p style={styles.subtitle}>Products That Definitely Don't Exist</p>
        <div style={styles.disclaimer}>
          <AlertTriangle size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
          <strong>Legal Notice:</strong> These products are 100% fake, impossible to manufacture, 
          and/or violate several laws of physics. Any attempt to purchase will result in 
          disappointment and possible existential crisis.
        </div>
      </div>

      <div style={styles.grid}>
        {products.map((product) => {
          const stockStatus = getStockStatusDisplay(product.stockStatus);
          const attempts = attemptCount[product.id] || 0;
          
          return (
            <div 
              key={product.id}
              style={styles.card}
              onClick={() => setSelectedProduct(product)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.impossibleBadge}>
                <Ban size={16} />
                IMPOSSIBLE
              </div>
              
              <div style={styles.imageContainer}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} style={styles.image} />
                ) : (
                  <div style={{ 
                    fontSize: '4rem', 
                    opacity: 0.3,
                    color: '#f97316'
                  }}>
                    {getCategoryIcon(product.category)}
                  </div>
                )}
              </div>
              
              <div style={styles.content}>
                <h3 style={styles.productTitle}>{product.title}</h3>
                {product.tagline && (
                  <p style={styles.tagline}>{product.tagline}</p>
                )}
                
                <div style={styles.price}>
                  Price: {product.impossiblePrice}
                </div>
                
                <div style={{ ...styles.warning, color: stockStatus.color }}>
                  {stockStatus.text}
                </div>
                
                {product.warning && (
                  <div style={styles.warning}>
                    <AlertTriangle size={16} />
                    {product.warning}
                  </div>
                )}
                
                <p style={styles.description}>
                  {product.description.substring(0, 150)}...
                </p>
                
                <button 
                  style={{
                    ...styles.button,
                    opacity: attempts > 5 ? 0.5 : 1
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #991b1b)';
                  }}
                >
                  <ShoppingCart size={20} />
                  {attempts === 0 ? 'Try to Add to Cart' : 
                   attempts === 1 ? 'Try Again?' :
                   attempts < 5 ? `Attempt #${attempts + 1}` :
                   'Still Trying?'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <div style={styles.modal} onClick={() => setSelectedProduct(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.modalClose}
              onClick={() => setSelectedProduct(null)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              <X size={24} />
            </button>
            
            <div style={{ padding: '2rem' }}>
              {selectedProduct.imageUrl && (
                <div style={{ 
                  height: '300px', 
                  marginBottom: '2rem',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              
              <h2 style={{ ...styles.productTitle, fontSize: '2rem' }}>
                {selectedProduct.title}
              </h2>
              
              {selectedProduct.tagline && (
                <p style={{ ...styles.tagline, fontSize: '1.2rem', marginBottom: '2rem' }}>
                  {selectedProduct.tagline}
                </p>
              )}
              
              <div style={{ ...styles.price, fontSize: '1.5rem', marginBottom: '2rem' }}>
                Price: {selectedProduct.impossiblePrice}
              </div>
              
              <p style={{ ...styles.description, fontSize: '1rem', marginBottom: '2rem' }}>
                {selectedProduct.description}
              </p>
              
              {selectedProduct.features && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#fdba74', marginBottom: '1rem' }}>Features:</h3>
                  <pre style={{ 
                    color: '#e2e8f0', 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: '1.8'
                  }}>
                    {selectedProduct.features}
                  </pre>
                </div>
              )}
              
              {selectedProduct.ingredients && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#fdba74', marginBottom: '1rem' }}>Ingredients:</h3>
                  <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    {selectedProduct.ingredients}
                  </p>
                </div>
              )}
              
              {selectedProduct.legalDisclaimer && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginTop: '2rem'
                }}>
                  <strong style={{ color: '#ef4444' }}>Legal Disclaimer:</strong>
                  <p style={{ color: '#fca5a5', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {selectedProduct.legalDisclaimer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}