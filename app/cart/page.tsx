'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Navigation from '../components/Navigation';
import { TestId, getTestId } from '@/lib/constants/test-ids';
import { analytics, AnalyticsEvent, useAnalytics } from '@/lib/analytics/analytics';
import TrustBadges from '@/app/components/TrustBadges';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  useAnalytics();

  useEffect(() => {
    setMounted(true);
    analytics.track(AnalyticsEvent.CART_VIEW, {
      cartItemCount: getTotalItems(),
      cartValue: getTotalPrice()
    });
  }, []);

  const handleCheckout = () => {
    analytics.track(AnalyticsEvent.CART_PROCEED_TO_CHECKOUT, {
      cartItemCount: getTotalItems(),
      cartValue: getTotalPrice()
    });
    router.push('/checkout');
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
        <Navigation />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <ShoppingCart style={{ width: '4rem', height: '4rem', color: '#f97316', margin: '0 auto' }} />
            <p style={{ color: '#fdba74', fontSize: '1.5rem', marginTop: '1rem' }}>Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
      <Navigation />
      
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 900,
          color: '#f97316',
          textAlign: 'center',
          marginBottom: '3rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          YOUR FUGLY CART
        </h1>

        {items.length === 0 ? (
          <div {...getTestId(TestId.CART_EMPTY)} style={{ textAlign: 'center', padding: '4rem' }}>
            <ShoppingCart style={{ 
              width: '6rem', 
              height: '6rem', 
              color: '#6b7280', 
              margin: '0 auto 2rem' 
            }} />
            <p style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#fde68a', 
              marginBottom: '1rem' 
            }}>
              Your cart is empty
            </p>
            <p style={{ 
              fontSize: '1.25rem', 
              color: '#fdba74', 
              marginBottom: '3rem' 
            }}>
              Fugly is disappointed. Add some chaos!
            </p>
            <Link href="/games">
              <button style={{
                background: '#f97316',
                color: '#111827',
                padding: '1rem 2rem',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '1.125rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = '#ea580c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#f97316';
              }}>
                <ArrowLeft size={20} />
                BROWSE GAMES
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'start' }}>
            {/* Cart Items */}
            <div style={{ background: '#1f2937', borderRadius: '1rem', padding: '2rem', border: '4px solid #fb923c' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fdba74', marginBottom: '2rem' }}>
                Cart Items ({getTotalItems()})
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {items.map((item) => (
                  <div 
                    key={`${item.id}-${item.size || ''}`}
                    style={{
                      background: '#111827',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: '2px solid #374151',
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'center'
                    }}
                  >
                    {/* Image */}
                    <div style={{
                      width: '6rem',
                      height: '6rem',
                      background: '#374151',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem'
                        }}>
                          {item.type === 'game' ? '🎮' : '👕'}
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.25rem',
                        color: '#fde68a',
                        marginBottom: '0.25rem'
                      }}>
                        {item.name}
                      </h3>
                      {item.size && (
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          Size: {item.size}
                        </p>
                      )}
                      <p style={{ 
                        color: '#f97316', 
                        fontWeight: 'bold',
                        fontSize: '1.125rem',
                        marginTop: '0.5rem'
                      }}>
                        ${(item.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#374151',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                          style={{
                            padding: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#fdba74',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{
                          padding: '0 1.5rem',
                          fontWeight: 'bold',
                          color: 'white',
                          fontSize: '1.125rem'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                          style={{
                            padding: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#fdba74',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          borderRadius: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #374151' }}>
                <button
                  onClick={clearCart}
                  style={{
                    background: 'transparent',
                    color: '#ef4444',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    border: '2px solid #ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              background: '#1f2937',
              borderRadius: '1rem',
              padding: '2rem',
              border: '4px solid #fb923c',
              minWidth: '350px',
              position: 'sticky',
              top: '2rem'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#fdba74', 
                marginBottom: '2rem' 
              }}>
                Order Summary
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db' }}>
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span style={{ fontWeight: 'bold' }}>
                    ${(getTotalPrice() / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db' }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {getTotalPrice() > 5000 ? 'FREE' : '$9.99'}
                  </span>
                </div>
                <div style={{ height: '2px', background: '#374151', margin: '0.5rem 0' }} />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#fde68a'
                }}>
                  <span>Total</span>
                  <span style={{ color: '#f97316' }}>
                    ${((getTotalPrice() + (getTotalPrice() > 5000 ? 0 : 999)) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  background: '#f97316',
                  color: '#111827',
                  padding: '1rem',
                  borderRadius: '50px',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s',
                  marginBottom: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = '#ea580c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#f97316';
                }}
              >
                CHECKOUT
                <ArrowRight size={20} />
              </button>
              
              <Link href="/games">
                <button style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#fdba74',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  border: '2px solid #374151',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#374151';
                }}>
                  Continue Shopping
                </button>
              </Link>
              
              <p style={{
                fontSize: '0.875rem',
                color: '#9ca3af',
                marginTop: '1.5rem',
                textAlign: 'center'
              }}>
                Free shipping on orders over $50
              </p>
              
              {/* Trust Badge */}
              <TrustBadges variant="compact" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}