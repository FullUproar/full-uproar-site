'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { ShoppingCart, Users, Play, Calendar, Zap, Shuffle, Map, Dice1, Package, Trophy } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import AddToCartButton from '@/app/components/AddToCartButton';
import { analytics } from '@/lib/analytics/analytics';

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
  category?: string;
  launchDate?: string | null;
}

const gameCategories = [
  { id: 'MOD', name: 'Game Mods', icon: Shuffle, description: 'Transform any game with chaos', featured: true, color: '#FF8200' },
  { id: 'TTRPG', name: 'TTRPGs', icon: Map, description: 'Tabletop roleplaying adventures', color: '#8b5cf6' },
  { id: 'BOARD_GAME', name: 'Board Games', icon: Dice1, description: 'Classic chaos on your table', color: '#10b981' },
  { id: 'CARD_GAME', name: 'Card Games', icon: Package, description: 'Deck-based mayhem', color: '#3b82f6' },
  { id: 'PARTY_GAME', name: 'Party Games', icon: Trophy, description: 'Group chaos generators', color: '#ec4899' }
];

export default function ShopGamesPage() {
  const { addToCart } = useCartStore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('MOD');
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

  useEffect(() => {
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
    fetchGames();
  }, []);

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

  const filteredGames = games.filter(game =>
    game.category === selectedCategory || (!game.category && selectedCategory === 'MOD')
  );

  const activeCategory = gameCategories.find(c => c.id === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: '#FF8200',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            All Games
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#fdba74' }}>
            Games, mods, and chaos generators
          </p>
        </div>

        {/* Featured Section - Mayhem Machine */}
        {selectedCategory === 'MOD' && (
          <div style={{
            background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '2rem',
            border: '3px solid #FF8200',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Zap style={{ width: '2rem', height: '2rem', color: '#FF8200' }} />
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 900,
                background: 'linear-gradient(45deg, #FF8200, #fbbf24)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textTransform: 'uppercase',
                margin: 0
              }}>
                Fugly's Mayhem Machine
              </h2>
              <Zap style={{ width: '2rem', height: '2rem', color: '#FF8200' }} />
            </div>
            <p style={{ color: '#fbbf24', maxWidth: '600px', margin: '0 auto' }}>
              Universal game modifiers that transform ANY game into chaos
            </p>
          </div>
        )}

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {gameCategories.map(category => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: isActive ? `linear-gradient(45deg, ${category.color}, ${category.color}88)` : 'rgba(31, 41, 55, 0.8)',
                  border: `2px solid ${isActive ? category.color : '#374151'}`,
                  borderRadius: '50px',
                  color: isActive ? '#fff' : '#9ca3af',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
              >
                {category.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '10px',
                    background: '#FF8200',
                    color: '#000',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.5rem',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}>
                    Featured
                  </span>
                )}
                <Icon style={{ width: '1rem', height: '1rem' }} />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Category Description */}
        {activeCategory && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: activeCategory.color, marginBottom: '0.25rem' }}>
              {activeCategory.name}
            </h3>
            <p style={{ fontSize: '1rem', color: '#fdba74' }}>{activeCategory.description}</p>
          </div>
        )}

        {/* Games Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#fdba74' }}>
            <div style={{ fontSize: '1.5rem' }}>Loading games...</div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '1rem',
            border: '2px dashed #374151'
          }}>
            <p style={{ fontSize: '1.25rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              No {activeCategory?.name.toLowerCase()} available yet
            </p>
            <p style={{ color: '#6b7280' }}>Check back soon for more chaos!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                style={{
                  background: 'linear-gradient(to bottom right, #1f2937, #111827)',
                  borderRadius: '1rem',
                  overflow: 'visible',
                  border: '3px solid #374151',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transform: hoveredGame === game.id ? 'translateY(-10px) scale(1.02)' : 'translateY(0)',
                  boxShadow: hoveredGame === game.id
                    ? '0 20px 40px rgba(255, 117, 0, 0.4)'
                    : '0 10px 30px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                {game.isPreorder && game.launchDate && (
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '-15px',
                    background: 'linear-gradient(45deg, #FF8200, #fb923c)',
                    color: '#000',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    width: '70px',
                    height: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.625rem',
                    border: '3px solid #fed7aa',
                    boxShadow: '0 4px 20px rgba(255, 117, 0, 0.6)',
                    transform: 'rotate(15deg)',
                    zIndex: 10
                  }}>
                    <Calendar style={{ width: '0.875rem', height: '0.875rem', marginBottom: '0.125rem' }} />
                    <div>{new Date(game.launchDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div>{new Date(game.launchDate).getDate()}</div>
                  </div>
                )}

                <Link href={`/shop/games/${game.slug}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1.5rem', paddingBottom: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {game.imageUrl && (
                      <img
                        src={game.imageUrl}
                        alt={game.title}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem'
                        }}
                      />
                    )}

                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 900,
                      color: '#FF8200',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      minHeight: '2.75rem',
                      lineHeight: '1.2'
                    }}>
                      {game.title}
                    </h3>

                    <p style={{
                      fontSize: '0.8125rem',
                      color: '#fbbf24',
                      marginBottom: '0.5rem',
                      fontStyle: 'italic'
                    }}>
                      {game.tagline ? `"${game.tagline}"` : '\u00A0'}
                    </p>

                    <p style={{
                      fontSize: '0.8125rem',
                      color: '#e2e8f0',
                      marginBottom: '1rem',
                      height: '2.5rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      flex: 1
                    }}>
                      {game.description}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users style={{ width: '0.875rem', height: '0.875rem', color: '#fdba74' }} />
                        <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>{game.players}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Play style={{ width: '0.875rem', height: '0.875rem', color: '#fdba74' }} />
                        <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>{game.timeToPlay}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF8200', marginBottom: '0.5rem' }}>
                      ${(game.priceCents / 100).toFixed(2)}
                    </div>
                  </div>
                </Link>

                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  {game.stock > 0 ? (
                    <AddToCartButton onClick={() => handleAddToCart(game)} disabled={game.stock === 0} />
                  ) : (
                    <div style={{
                      padding: '0.875rem',
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      border: '2px solid #f97316',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#f97316', fontWeight: 900, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        COMING SOON
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Join the chaos soon
                      </div>
                    </div>
                  )}
                </div>

                {game.featured && selectedCategory === 'MOD' && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'linear-gradient(45deg, #FF8200, #fbbf24)',
                    color: '#000',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 900,
                    fontSize: '0.625rem',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Zap style={{ width: '0.75rem', height: '0.75rem' }} />
                    Mayhem Machine
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
