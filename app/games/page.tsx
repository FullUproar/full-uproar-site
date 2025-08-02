'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { ShoppingCart, Calendar, Users, Play, Star, Package } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import AddToCartButton from '../components/AddToCartButton';
import { TestId, getTestId } from '@/lib/constants/test-ids';
import { analytics, AnalyticsEvent, useAnalytics } from '@/lib/analytics/analytics';

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
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo: string | null;
  createdAt: string;
  stock: number;
}

export default function GamesPage() {
  const { addToCart } = useCartStore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'preorder' | 'bundle'>('all');
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  
  useAnalytics();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (game: Game) => {
    addToCart({
      id: game.id,
      name: game.title,
      slug: game.slug,
      priceCents: game.priceCents,
      imageUrl: game.imageUrl || '/placeholder-game.jpg',
      type: 'game'
    });
    
    analytics.trackAddToCart(game.id.toString(), game.title, game.priceCents);
  };

  const filteredGames = games.filter(game => {
    if (filter === 'preorder') return game.isPreorder;
    if (filter === 'bundle') return game.isBundle;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
      <Navigation />
      
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 900,
          color: '#f97316',
          textAlign: 'center',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          The Chaos Collection
        </h1>
        
        <p style={{
          fontSize: '1.5rem',
          color: '#fdba74',
          textAlign: 'center',
          marginBottom: '3rem',
          fontWeight: 'bold'
        }}>
          Game modifiers that make Fugly purr with evil delight
        </p>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {[
            { value: 'all', label: 'ALL GAMES' },
            { value: 'preorder', label: 'PRE-ORDERS' },
            { value: 'bundle', label: 'BUNDLES' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              style={{
                background: filter === option.value ? '#f97316' : 'transparent',
                color: filter === option.value ? '#111827' : '#fdba74',
                border: `2px solid ${filter === option.value ? '#f97316' : '#fdba74'}`,
                padding: '0.75rem 2rem',
                borderRadius: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                transform: filter === option.value ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '2rem', color: '#f97316', animation: 'pulse 2s infinite' }}>
              Loading chaos...
            </div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '6rem 2rem',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '2rem',
            border: '4px dashed #f97316'
          }}>
            <p style={{ fontSize: '2rem', color: '#f97316', fontWeight: 'bold' }}>
              No games found in this category!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {filteredGames.map((game, index) => (
              <div 
                key={game.id}
                {...getTestId(TestId.PRODUCT_CARD)}
                data-track-impression="true"
                data-product-id={game.id}
                data-product-name={game.title}
                data-product-price={game.priceCents}
                data-product-category="game"
                style={{
                  background: '#1f2937',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s',
                  border: '4px solid #fb923c',
                  transform: `rotate(${index % 2 === 0 ? '-2' : '2'}deg)`,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => {
                  setHoveredGame(game.id);
                  const el = document.getElementById(`game-${game.id}`);
                  if (el) {
                    el.style.transform = 'rotate(0deg) scale(1.05)';
                    el.style.zIndex = '10';
                  }
                }}
                onMouseLeave={() => {
                  setHoveredGame(null);
                  const el = document.getElementById(`game-${game.id}`);
                  if (el) {
                    el.style.transform = `rotate(${index % 2 === 0 ? '-2' : '2'}deg)`;
                    el.style.zIndex = '1';
                  }
                }}
                id={`game-${game.id}`}
              >
                <Link href={`/games/${game.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ 
                    height: '12rem', 
                    background: '#374151', 
                    borderRadius: '0.5rem', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f97316',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {game.imageUrl && game.imageUrl.trim() !== '' ? (
                      <img 
                        src={game.imageUrl} 
                        alt={game.title}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s',
                          transform: hoveredGame === game.id ? 'scale(1.1)' : 'scale(1)'
                        }} 
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div>🎮</div>
                        <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>FUGLY</div>
                      </div>
                    )}
                  </div>
                  
                  <h3 
                    {...getTestId(TestId.PRODUCT_CARD_NAME)}
                    style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 900, 
                      marginBottom: '0.5rem', 
                      color: '#fdba74',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {game.title}
                  </h3>
                  
                  <p style={{ 
                    color: '#fde68a', 
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    minHeight: '3rem'
                  }}>
                    {game.tagline || 'Epic chaos awaits!'}
                  </p>
                </Link>
                
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
                  <span style={{ 
                    background: 'rgba(249, 115, 22, 0.2)', 
                    color: '#fdba74', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Users size={14} /> {game.players}
                  </span>
                  <span style={{ 
                    background: 'rgba(249, 115, 22, 0.2)', 
                    color: '#fdba74', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Play size={14} /> {game.timeToPlay}
                  </span>
                  <span style={{ 
                    background: 'rgba(249, 115, 22, 0.2)', 
                    color: '#fdba74', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem'
                  }}>
                    {game.ageRating}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#f97316' }}>
                    ${(game.priceCents / 100).toFixed(2)}
                  </span>
                  <AddToCartButton
                    onClick={() => handleAddToCart(game)}
                    disabled={game.stock === 0}
                    size="small"
                  />
                </div>
                
                {game.isPreorder && !game.isBundle && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    right: '-0.75rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    transform: 'rotate(12deg)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    AUG 2025
                  </span>
                )}
                {game.isBundle && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    right: '-0.75rem',
                    background: 'linear-gradient(to right, #f97316, #ef4444)',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    transform: 'rotate(12deg)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    SAVE $10
                  </span>
                )}
                {game.stock === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '1rem'
                  }}>
                    <span style={{
                      color: '#ef4444',
                      fontSize: '2rem',
                      fontWeight: 900,
                      transform: 'rotate(-15deg)'
                    }}>
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}