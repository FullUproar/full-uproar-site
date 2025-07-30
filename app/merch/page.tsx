'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { ShoppingCart, Package, Filter, Tag } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';

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

  useEffect(() => {
    fetchMerch();
  }, [filter]);

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #6b21a8)' }}>
      <Navigation />
      
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 900,
          color: '#a855f7',
          textAlign: 'center',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
        }}>
          FUGLY'S SWAG SHOP
        </h1>
        
        <p style={{
          fontSize: '1.5rem',
          color: '#c4b5fd',
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
              background: filter === 'all' ? '#a855f7' : 'transparent',
              color: filter === 'all' ? '#111827' : '#c4b5fd',
              border: `2px solid ${filter === 'all' ? '#a855f7' : '#c4b5fd'}`,
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
                background: filter === category ? '#a855f7' : 'transparent',
                color: filter === category ? '#111827' : '#c4b5fd',
                border: `2px solid ${filter === category ? '#a855f7' : '#c4b5fd'}`,
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
            <div style={{ fontSize: '2rem', color: '#a855f7', animation: 'pulse 2s infinite' }}>
              Loading swag...
            </div>
          </div>
        ) : merch.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '6rem 2rem',
            background: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '2rem',
            border: '4px dashed #a855f7'
          }}>
            <p style={{ fontSize: '2rem', color: '#a855f7', fontWeight: 'bold' }}>
              No swag found in this category!
            </p>
            <p style={{ fontSize: '1.25rem', color: '#c4b5fd', marginTop: '1rem' }}>
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
                  border: '4px solid #8b5cf6',
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
                    color: '#c4b5fd',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {item.name}
                  </h3>
                  
                  <p style={{ 
                    color: '#ddd6fe', 
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    minHeight: '3rem'
                  }}>
                    {item.description || 'Maximum chaos, minimum effort'}
                  </p>
                </Link>
                
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, flexWrap: 'wrap' }}>
                  <span style={{ 
                    background: 'rgba(139, 92, 246, 0.2)', 
                    color: '#c4b5fd', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem'
                  }}>
                    {item.category.toUpperCase()}
                  </span>
                  {item.sizes && (
                    <span style={{ 
                      background: 'rgba(139, 92, 246, 0.2)', 
                      color: '#c4b5fd', 
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
                      background: '#8b5cf6',
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
                      e.currentTarget.style.background = '#8b5cf6';
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