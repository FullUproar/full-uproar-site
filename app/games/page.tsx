'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { ShoppingCart, Calendar, Users, Play, Star, Package, Sparkles, Dice1, Map, ChevronRight, Zap, Shield, Shuffle, Trophy } from 'lucide-react';
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
  category?: string;
  launchDate?: string | null;
}

const categories = [
  { 
    id: 'MOD', 
    name: 'Game Mods', 
    icon: Shuffle,
    description: 'Transform any game with chaos',
    featured: true,
    color: '#f97316'
  },
  { 
    id: 'TTRPG', 
    name: 'TTRPGs', 
    icon: Map,
    description: 'Tabletop roleplaying adventures',
    color: '#8b5cf6'
  },
  { 
    id: 'BOARD_GAME', 
    name: 'Board Games', 
    icon: Dice1,
    description: 'Classic chaos on your table',
    color: '#10b981'
  },
  { 
    id: 'CARD_GAME', 
    name: 'Card Games', 
    icon: Package,
    description: 'Deck-based mayhem',
    color: '#3b82f6'
  },
  { 
    id: 'PARTY_GAME', 
    name: 'Party Games', 
    icon: Trophy,
    description: 'Group chaos generators',
    color: '#ec4899'
  }
];

export default function GamesPage() {
  const { addToCart } = useCartStore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('MOD');
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

  const filteredGames = games.filter(game => 
    game.category === selectedCategory || (!game.category && selectedCategory === 'MOD')
  );

  const activeCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
      <Navigation />
      
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        {/* Featured Section - Chaos Engine */}
        {selectedCategory === 'MOD' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05))',
            borderRadius: '1.5rem',
            padding: '3rem',
            marginBottom: '4rem',
            border: '3px solid #f97316',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                #f97316 10px,
                #f97316 20px
              )`,
              pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Logo/Title */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <Zap style={{ width: '3rem', height: '3rem', color: '#f97316' }} />
                  <h1 style={{
                    fontSize: '4rem',
                    fontWeight: 900,
                    background: 'linear-gradient(45deg, #f97316, #fbbf24)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0
                  }}>
                    Fugly's Chaos Engine
                  </h1>
                  <Zap style={{ width: '3rem', height: '3rem', color: '#f97316' }} />
                </div>
                <p style={{
                  fontSize: '1.5rem',
                  color: '#fbbf24',
                  fontWeight: 'bold',
                  letterSpacing: '0.05em'
                }}>
                  GAME MODIFICATION SYSTEM
                </p>
              </div>

              {/* Description */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr',
                gap: '2rem',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Shield style={{ width: '4rem', height: '4rem', color: '#f97316', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ color: '#fbbf24', fontSize: '1.125rem', fontWeight: 'bold' }}>Universal</h3>
                  <p style={{ color: '#fde68a', fontSize: '0.875rem' }}>Works with ANY game</p>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '2px solid rgba(249, 115, 22, 0.5)'
                }}>
                  <h2 style={{ 
                    color: '#f97316', 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    What is the Chaos Engine?
                  </h2>
                  <p style={{ 
                    color: '#fde68a', 
                    fontSize: '1.125rem',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                  }}>
                    The Chaos Engine is our revolutionary game modification system. These aren't expansions or new games - they're <strong style={{ color: '#f97316' }}>universal game modifiers</strong> that transform ANY game you already own into something completely new and insane.
                  </p>
                  <p style={{ 
                    color: '#fdba74', 
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    "Why buy 100 new games when you can make the games you have 100x more fun?"
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <Sparkles style={{ width: '4rem', height: '4rem', color: '#f97316', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ color: '#fbbf24', fontSize: '1.125rem', fontWeight: 'bold' }}>Transformative</h3>
                  <p style={{ color: '#fde68a', fontSize: '0.875rem' }}>Fresh chaos every time</p>
                </div>
              </div>

              {/* Features */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginTop: '2rem'
              }}>
                {[
                  { icon: '🎲', text: 'Works with board games' },
                  { icon: '🃏', text: 'Works with card games' },
                  { icon: '🎮', text: 'Works with video games' },
                  { icon: '🏃', text: 'Even works with sports!' }
                ].map((feature, i) => (
                  <div key={i} style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    textAlign: 'center',
                    border: '2px solid rgba(249, 115, 22, 0.3)'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                    <p style={{ color: '#fde68a', fontSize: '0.875rem', fontWeight: 'bold' }}>{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {categories.map(category => {
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
                  padding: '1rem 1.5rem',
                  background: isActive 
                    ? `linear-gradient(45deg, ${category.color}, ${category.color}88)`
                    : 'rgba(31, 41, 55, 0.8)',
                  border: `2px solid ${isActive ? category.color : '#374151'}`,
                  borderRadius: '50px',
                  color: isActive ? '#fff' : '#9ca3af',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = category.color;
                    e.currentTarget.style.color = category.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {category.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '10px',
                    background: '#f97316',
                    color: '#000',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.625rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Featured
                  </span>
                )}
                <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                <span>{category.name}</span>
                {category.id === 'MOD' && games.filter(g => g.category === 'MOD' || !g.category).length > 0 && (
                  <span style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '50px',
                    fontSize: '0.875rem'
                  }}>
                    {games.filter(g => g.category === 'MOD' || !g.category).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Description */}
        {activeCategory && (
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: activeCategory.color,
              marginBottom: '0.5rem'
            }}>
              {activeCategory.name}
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#fdba74'
            }}>
              {activeCategory.description}
            </p>
          </div>
        )}

        {/* Games Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#fdba74' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading chaos...</div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '5rem',
            background: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '1rem',
            border: '2px dashed #374151'
          }}>
            <p style={{ fontSize: '1.5rem', color: '#9ca3af', marginBottom: '1rem' }}>
              No {activeCategory?.name.toLowerCase()} available yet
            </p>
            <p style={{ color: '#6b7280' }}>
              Check back soon for more chaos!
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                data-testid={getTestId(TestId.PRODUCT_CARD)}
                style={{
                  background: 'linear-gradient(to bottom right, #1f2937, #111827)',
                  borderRadius: '1rem',
                  overflow: 'visible',
                  border: '3px solid #374151',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  transform: hoveredGame === game.id ? 'translateY(-10px) scale(1.05)' : 'translateY(0)',
                  boxShadow: hoveredGame === game.id 
                    ? '0 20px 40px rgba(249, 115, 22, 0.4), 0 0 60px rgba(249, 115, 22, 0.2)' 
                    : '0 10px 30px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                {/* Release Date Badge - Now with higher z-index */}
                {game.isPreorder && game.launchDate && (
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '-15px',
                    background: 'linear-gradient(45deg, #f97316, #fb923c)',
                    color: '#000',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    border: '3px solid #fed7aa',
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.6)',
                    transform: 'rotate(15deg)',
                    zIndex: 10  // Ensure it's above the card
                  }}>
                    <Calendar style={{ width: '1rem', height: '1rem', marginBottom: '0.25rem' }} />
                    <div>{new Date(game.launchDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div>{new Date(game.launchDate).getDate()}</div>
                  </div>
                )}

                <Link href={`/games/${game.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '1.5rem', paddingBottom: '0' }}>
                    {game.imageUrl && (
                      <img 
                        src={game.imageUrl} 
                        alt={game.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem'
                        }}
                      />
                    )}
                    
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: '#f97316',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase'
                    }}>
                      {game.title}
                    </h3>
                    
                    {game.tagline && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#fbbf24',
                        marginBottom: '0.75rem',
                        fontStyle: 'italic'
                      }}>
                        "{game.tagline}"
                      </p>
                    )}
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#e2e8f0',
                      marginBottom: '1rem',
                      height: '3rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      textOverflow: 'ellipsis'
                    }}>
                      {game.description}
                    </p>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users style={{ width: '1rem', height: '1rem', color: '#fdba74' }} />
                        <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>{game.players}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Play style={{ width: '1rem', height: '1rem', color: '#fdba74' }} />
                        <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>{game.timeToPlay}</span>
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      color: '#f97316',
                      marginBottom: '1rem'
                    }}>
                      ${(game.priceCents / 100).toFixed(2)}
                    </div>
                  </div>
                </Link>
                
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  {game.stock > 0 ? (
                    <AddToCartButton
                      onClick={() => {
                        handleAddToCart(game);
                      }}
                      disabled={game.stock === 0}
                    />
                  ) : (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#374151',
                        color: '#6b7280',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'not-allowed'
                      }}
                    >
                      Out of Stock
                    </button>
                  )}
                </div>

                {game.featured && selectedCategory === 'MOD' && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'linear-gradient(45deg, #f97316, #fbbf24)',
                    color: '#000',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Zap style={{ width: '0.875rem', height: '0.875rem' }} />
                    Chaos Engine
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Coming Soon for other categories */}
        {selectedCategory !== 'MOD' && (
          <div style={{
            marginTop: '4rem',
            padding: '3rem',
            background: 'rgba(31, 41, 55, 0.3)',
            borderRadius: '1rem',
            textAlign: 'center',
            border: `2px solid ${activeCategory?.color}`
          }}>
            <h3 style={{ 
              fontSize: '2rem', 
              color: activeCategory?.color,
              marginBottom: '1rem',
              fontWeight: 900
            }}>
              Coming Soon!
            </h3>
            <p style={{ color: '#fdba74', fontSize: '1.125rem' }}>
              We're cooking up some incredible {activeCategory?.name.toLowerCase()} for you.
            </p>
            <p style={{ color: '#fde68a', marginTop: '0.5rem' }}>
              Meanwhile, check out our revolutionary Chaos Engine mods!
            </p>
          </div>
        )}

        {/* Suggestions for graphics */}
        {selectedCategory === 'MOD' && (
          <div style={{
            marginTop: '4rem',
            padding: '2rem',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '1rem',
            border: '2px dashed #f97316'
          }}>
            <h3 style={{ color: '#f97316', marginBottom: '1rem' }}>🎨 Suggested Graphics to Generate:</h3>
            <ul style={{ color: '#fde68a', lineHeight: '2' }}>
              <li>A logo for "Fugly's Chaos Engine" - mechanical gears with dice, cards, and game pieces integrated</li>
              <li>Banner image showing game pieces being transformed by orange energy/chaos magic</li>
              <li>Icon set for each mod showing how it transforms games (shuffle icon, timer, wildcards, etc.)</li>
              <li>Background pattern with game elements (dice, cards, meeples) in a chaotic arrangement</li>
              <li>Before/After comparison graphic showing a boring game vs. chaos-modified version</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}