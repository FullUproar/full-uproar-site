'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { Shirt, Tag, Filter, Package } from 'lucide-react';
import { LoadingSection, SkeletonGrid } from '@/app/components/ui';
import EmptyState from '@/app/components/ui/EmptyState';

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
}

export default function ShopMerchPage() {
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  useEffect(() => {
    const fetchMerch = async () => {
      try {
        const url = filter === 'all'
          ? '/api/merch'
          : `/api/merch?category=${encodeURIComponent(filter)}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMerch(Array.isArray(data) ? data : []);

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
    fetchMerch();
  }, [filter]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #6b21a8)' }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: '#a855f7',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            Merch & Apparel
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#c4b5fd' }}>
            Wear your chaos with pride (and questionable fashion sense)
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? '#a855f7' : 'transparent',
              color: filter === 'all' ? '#111827' : '#c4b5fd',
              border: `2px solid ${filter === 'all' ? '#a855f7' : '#c4b5fd'}`,
              padding: '0.625rem 1.5rem',
              borderRadius: '50px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Filter size={14} /> ALL SWAG
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              style={{
                background: filter === category ? '#a855f7' : 'transparent',
                color: filter === category ? '#111827' : '#c4b5fd',
                border: `2px solid ${filter === category ? '#a855f7' : '#c4b5fd'}`,
                padding: '0.625rem 1.5rem',
                borderRadius: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Tag size={14} /> {category.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Merch Grid */}
        {loading ? (
          <SkeletonGrid count={4} columns={4} />
        ) : merch.length === 0 ? (
          <EmptyState
            variant="products"
            title={filter === 'all' ? 'No swag yet!' : `No ${filter} yet!`}
            message="Fugly is still designing chaos-inducing apparel. Check back soon!"
            actionLabel="Browse Games"
            actionHref="/shop/games"
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {merch.map((item, index) => (
              <div
                key={item.id}
                style={{
                  background: '#1f2937',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s',
                  border: '3px solid #7D55C7',
                  transform: hoveredItem === item.id ? 'scale(1.02)' : `rotate(${index % 2 === 0 ? '1' : '-1'}deg)`,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link href={`/merch/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    height: '10rem',
                    background: '#4c1d95',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
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
                        <div style={{ fontSize: '2.5rem' }}>👕</div>
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#a78bfa' }}>FUGLY</div>
                      </div>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    marginBottom: '0.5rem',
                    color: '#c4b5fd',
                    textTransform: 'uppercase'
                  }}>
                    {item.name}
                  </h3>

                  <p style={{
                    color: '#ddd6fe',
                    fontWeight: 'bold',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    minHeight: '2.5rem'
                  }}>
                    {item.description || 'Maximum chaos, minimum effort'}
                  </p>
                </Link>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600, flexWrap: 'wrap' }}>
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
                      {JSON.parse(item.sizes).join(', ')}
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
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa' }}>
                    ${(item.priceCents / 100).toFixed(2)}
                  </span>
                  <Link
                    href={`/merch/${item.slug}`}
                    style={{
                      background: '#7D55C7',
                      color: '#111827',
                      padding: '0.625rem 1.25rem',
                      borderRadius: '50px',
                      fontWeight: 900,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                  >
                    <Package size={14} /> GET SWAG
                  </Link>
                </div>

                {item.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    background: '#fbbf24',
                    color: '#111827',
                    fontSize: '0.625rem',
                    padding: '0.5rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    transform: 'rotate(12deg)'
                  }}>
                    FEATURED
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
