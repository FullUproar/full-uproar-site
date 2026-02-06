'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { ShoppingCart, Package, Filter, Tag, Lock, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';

const MERCH_ACCESS_CODE = 'fuglyonly';
const MERCH_ACCESS_KEY = 'merch_early_access';

interface MerchItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  sizes: string | null;
  featured: boolean;
  totalStock: number;
  createdAt: string;
}

export default function MerchPage() {
  const { addToCart } = useCartStore();
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Access gate state
  const [hasAccess, setHasAccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check for existing access on mount
  useEffect(() => {
    const storedAccess = sessionStorage.getItem(MERCH_ACCESS_KEY);
    if (storedAccess === 'granted') {
      setHasAccess(true);
    }
    setCheckingAccess(false);
  }, []);

  // Handle access code submission
  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.toLowerCase().trim() === MERCH_ACCESS_CODE) {
      sessionStorage.setItem(MERCH_ACCESS_KEY, 'granted');
      setHasAccess(true);
      setAccessError('');
    } else {
      setAccessError('Invalid access code. Nice try though!');
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchMerch();
    }
  }, [filter, hasAccess]);

  const fetchMerch = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/merch' 
        : `/api/merch?category=${encodeURIComponent(filter)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMerch(Array.isArray(data) ? data : []);
        
        // Extract unique categories
        if (filter === 'all') {
          const uniqueCategories = [...new Set(data.map((item: MerchItem) => item.category))] as string[];
          setCategories(uniqueCategories);
        }
      }
    } catch (error) {
      console.error('Failed to fetch merch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking access
  if (checkingAccess) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #6b21a8)' }}>
        <Navigation />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ fontSize: '1.5rem', color: '#7D55C7' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show access gate if user doesn't have access
  if (!hasAccess) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #6b21a8)' }}>
        <Navigation />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(31, 41, 55, 0.95)',
            border: '4px solid #7D55C7',
            borderRadius: '1.5rem',
            padding: '3rem',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(125, 85, 199, 0.25)'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <Lock size={64} style={{ color: '#7D55C7', margin: '0 auto' }} />
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#7D55C7',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              EARLY ACCESS ONLY
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(125, 85, 199, 0.4)',
              marginBottom: '2rem',
              fontWeight: 500
            }}>
              Fugly's Swag Shop is currently in early access. Enter your access code to browse exclusive merch.
            </p>

            <form onSubmit={handleAccessSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setAccessError('');
                  }}
                  placeholder="Enter access code..."
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    fontSize: '1.125rem',
                    background: '#374151',
                    border: '2px solid #6b7280',
                    borderRadius: '0.75rem',
                    color: '#f9fafb',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7D55C7'}
                  onBlur={(e) => e.target.style.borderColor = '#6b7280'}
                />
              </div>

              {accessError && (
                <p style={{
                  color: '#f87171',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  fontWeight: 600
                }}>
                  {accessError}
                </p>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#7D55C7',
                  color: '#111827',
                  padding: '1rem 2rem',
                  fontSize: '1.125rem',
                  fontWeight: 900,
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.background = '#7c3aed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#7D55C7';
                }}
              >
                <Sparkles size={20} /> UNLOCK THE SWAG
              </button>
            </form>

            <p style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              marginTop: '2rem'
            }}>
              Don't have a code? Merch shop opens to everyone Spring 2026!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #6b21a8)' }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 900,
          color: '#7D55C7',
          textAlign: 'center',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: '0 0 20px rgba(125, 85, 199, 0.5)'
        }}>
          FUGLY'S SWAG SHOP
        </h1>
        
        <p style={{
          fontSize: '1.5rem',
          color: 'rgba(125, 85, 199, 0.4)',
          textAlign: 'center',
          marginBottom: '3rem',
          fontWeight: 'bold'
        }}>
          Wear your chaos with pride (and questionable fashion sense)
        </p>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? '#7D55C7' : 'transparent',
              color: filter === 'all' ? '#111827' : 'rgba(125, 85, 199, 0.4)',
              border: `2px solid ${filter === 'all' ? '#7D55C7' : 'rgba(125, 85, 199, 0.4)'}`,
              padding: '0.75rem 2rem',
              borderRadius: '50px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              transform: filter === 'all' ? 'scale(1.05)' : 'scale(1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Filter size={16} /> ALL SWAG
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              style={{
                background: filter === category ? '#7D55C7' : 'transparent',
                color: filter === category ? '#111827' : 'rgba(125, 85, 199, 0.4)',
                border: `2px solid ${filter === category ? '#7D55C7' : 'rgba(125, 85, 199, 0.4)'}`,
                padding: '0.75rem 2rem',
                borderRadius: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                transform: filter === category ? 'scale(1.05)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Tag size={16} /> {category.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '2rem', color: '#7D55C7', animation: 'pulse 2s infinite' }}>
              Loading swag...
            </div>
          </div>
        ) : merch.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '6rem 2rem',
            background: 'rgba(125, 85, 199, 0.1)',
            borderRadius: '2rem',
            border: '4px dashed #7D55C7'
          }}>
            <p style={{ fontSize: '2rem', color: '#7D55C7', fontWeight: 'bold' }}>
              No swag found in this category!
            </p>
            <p style={{ fontSize: '1.25rem', color: 'rgba(125, 85, 199, 0.4)', marginTop: '1rem' }}>
              Fugly is still designing chaos-inducing apparel...
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {merch.map((item, index) => (
              <div 
                key={item.id}
                style={{
                  background: '#1f2937',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s',
                  border: '4px solid #7D55C7',
                  transform: `rotate(${index % 2 === 0 ? '2' : '-2'}deg)`,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => {
                  setHoveredItem(item.id);
                  const el = document.getElementById(`merch-${item.id}`);
                  if (el) {
                    el.style.transform = 'rotate(0deg) scale(1.05)';
                    el.style.zIndex = '10';
                  }
                }}
                onMouseLeave={() => {
                  setHoveredItem(null);
                  const el = document.getElementById(`merch-${item.id}`);
                  if (el) {
                    el.style.transform = `rotate(${index % 2 === 0 ? '2' : '-2'}deg)`;
                    el.style.zIndex = '1';
                  }
                }}
                id={`merch-${item.id}`}
              >
                <Link href={`/merch/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ 
                    height: '12rem', 
                    background: '#4c1d95', 
                    borderRadius: '0.5rem', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {item.imageUrl && item.imageUrl.trim() !== '' ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s',
                          transform: hoveredItem === item.id ? 'scale(1.1)' : 'scale(1)'
                        }} 
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem' }}>👕</div>
                        <div style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#a78bfa' }}>FUGLY</div>
                      </div>
                    )}
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 900, 
                    marginBottom: '0.5rem', 
                    color: 'rgba(125, 85, 199, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {item.name}
                  </h3>
                  
                  <p style={{ 
                    color: 'rgba(125, 85, 199, 0.2)', 
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    minHeight: '3rem'
                  }}>
                    {item.description || 'Maximum chaos, minimum effort'}
                  </p>
                </Link>
                
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, flexWrap: 'wrap' }}>
                  <span style={{ 
                    background: 'rgba(125, 85, 199, 0.2)', 
                    color: 'rgba(125, 85, 199, 0.4)', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem'
                  }}>
                    {item.category.toUpperCase()}
                  </span>
                  {item.sizes && (
                    <span style={{ 
                      background: 'rgba(125, 85, 199, 0.2)', 
                      color: 'rgba(125, 85, 199, 0.4)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.25rem'
                    }}>
                      SIZES: {JSON.parse(item.sizes).join(', ')}
                    </span>
                  )}
                  {item.totalStock === 0 && (
                    <span style={{ 
                      background: 'rgba(239, 68, 68, 0.2)', 
                      color: '#fca5a5', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.25rem'
                    }}>
                      SOLD OUT
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#a78bfa' }}>
                    ${(item.priceCents / 100).toFixed(2)}
                  </span>
                  <Link
                    href={`/merch/${item.slug}`}
                    style={{
                      background: '#7D55C7',
                      color: '#111827',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '50px',
                      fontWeight: 900,
                      transition: 'all 0.3s',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.background = '#7c3aed';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = '#7D55C7';
                    }}
                  >
                    <Package size={16} /> GET SWAG
                  </Link>
                </div>
                
                {item.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    right: '-0.75rem',
                    background: '#fbbf24',
                    color: '#111827',
                    fontSize: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    transform: 'rotate(12deg)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    FEATURED
                  </span>
                )}
                {item.totalStock > 0 && item.totalStock <= 5 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite'
                  }}>
                    Only {item.totalStock} left!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating style elements */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {['👕', '🧢', '🧦', '👟', '🎽', '👔'].map((emoji, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              fontSize: '2rem',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatMerch ${15 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.1
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes floatMerch {
          0% { transform: translateY(100vh) rotate(0deg); }
          100% { transform: translateY(-100vh) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}