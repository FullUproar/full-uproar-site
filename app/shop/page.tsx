'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { ShoppingCart, Calendar, Users, Play, Package, Sparkles, Dice1, Map, Zap, Shield, Shuffle, Trophy, Filter, Tag, Gamepad2, Shirt } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import AddToCartButton from '../components/AddToCartButton';
import { analytics, useAnalytics } from '@/lib/analytics/analytics';

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

type ShopTab = 'games' | 'merch';

const gameCategories = [
  { id: 'MOD', name: 'Game Mods', icon: Shuffle, description: 'Transform any game with chaos', featured: true, color: '#FF7500' },
  { id: 'TTRPG', name: 'TTRPGs', icon: Map, description: 'Tabletop roleplaying adventures', color: '#8b5cf6' },
  { id: 'BOARD_GAME', name: 'Board Games', icon: Dice1, description: 'Classic chaos on your table', color: '#10b981' },
  { id: 'CARD_GAME', name: 'Card Games', icon: Package, description: 'Deck-based mayhem', color: '#3b82f6' },
  { id: 'PARTY_GAME', name: 'Party Games', icon: Trophy, description: 'Group chaos generators', color: '#ec4899' }
];

export default function ShopPage() {
  const { addToCart } = useCartStore();
  const [activeTab, setActiveTab] = useState<ShopTab>('games');

  // Games state
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('MOD');
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

  // Merch state
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [merchLoading, setMerchLoading] = useState(true);
  const [merchFilter, setMerchFilter] = useState<'all' | string>('all');
  const [merchCategories, setMerchCategories] = useState<string[]>([]);
  const [hoveredMerch, setHoveredMerch] = useState<number | null>(null);

  useAnalytics();

  // Fetch games
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
        setGamesLoading(false);
      }
    };
    fetchGames();
  }, []);

  // Fetch merch
  useEffect(() => {
    const fetchMerch = async () => {
      try {
        const url = merchFilter === 'all'
          ? '/api/merch'
          : `/api/merch?category=${encodeURIComponent(merchFilter)}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMerch(Array.isArray(data) ? data : []);

          if (merchFilter === 'all') {
            const uniqueCategories = [...new Set(data.map((item: MerchItem) => item.category))] as string[];
            setMerchCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error('Failed to fetch merch:', error);
      } finally {
        setMerchLoading(false);
      }
    };
    fetchMerch();
  }, [merchFilter]);

  const handleAddGameToCart = (game: Game) => {
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

  const activeGameCategory = gameCategories.find(c => c.id === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: activeTab === 'games'
      ? 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)'
      : 'linear-gradient(to bottom right, #111827, #1f2937, #6b21a8)',
      transition: 'background 0.5s ease'
    }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Shop Header with Tabs */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 900,
            color: activeTab === 'games' ? '#FF7500' : '#a855f7',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: activeTab === 'games'
              ? '0 0 20px rgba(255, 117, 0, 0.5)'
              : '0 0 20px rgba(168, 85, 247, 0.5)',
            transition: 'all 0.3s',
            marginBottom: '0.5rem'
          }}>
            FUGLY'S SHOP
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#fdba74',
            marginBottom: '2rem'
          }}>
            Games, mods, and merch to fuel your chaos
          </p>

          {/* Tab Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('games')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2.5rem',
                background: activeTab === 'games'
                  ? 'linear-gradient(135deg, #FF7500, #ea580c)'
                  : 'rgba(31, 41, 55, 0.8)',
                border: `3px solid ${activeTab === 'games' ? '#FF7500' : '#374151'}`,
                borderRadius: '50px',
                color: activeTab === 'games' ? '#111827' : '#9ca3af',
                fontWeight: 900,
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: activeTab === 'games'
                  ? '0 10px 30px rgba(255, 117, 0, 0.4)'
                  : 'none'
              }}
            >
              <Gamepad2 size={24} />
              GAMES
            </button>
            <button
              onClick={() => setActiveTab('merch')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2.5rem',
                background: activeTab === 'merch'
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                  : 'rgba(31, 41, 55, 0.8)',
                border: `3px solid ${activeTab === 'merch' ? '#a855f7' : '#374151'}`,
                borderRadius: '50px',
                color: activeTab === 'merch' ? '#111827' : '#9ca3af',
                fontWeight: 900,
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: activeTab === 'merch'
                  ? '0 10px 30px rgba(168, 85, 247, 0.4)'
                  : 'none'
              }}
            >
              <Shirt size={24} />
              MERCH
            </button>
          </div>
        </div>

        {/* GAMES TAB */}
        {activeTab === 'games' && (
          <>
            {/* Featured Section - Chaos Engine */}
            {selectedCategory === 'MOD' && (
              <div style={{
                background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                borderRadius: '1.5rem',
                padding: '3rem',
                marginBottom: '3rem',
                border: '3px solid #FF7500',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), inset 0 0 100px rgba(249, 115, 22, 0.1)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  opacity: 0.03,
                  background: `repeating-linear-gradient(45deg, transparent, transparent 10px, #FF7500 10px, #FF7500 20px)`,
                  pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <Zap style={{ width: '3rem', height: '3rem', color: '#FF7500' }} />
                      <h2 style={{
                        fontSize: '3rem',
                        fontWeight: 900,
                        background: 'linear-gradient(45deg, #FF7500, #fbbf24)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: 0
                      }}>
                        Fugly's Chaos Engine
                      </h2>
                      <Zap style={{ width: '3rem', height: '3rem', color: '#FF7500' }} />
                    </div>
                    <p style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 'bold' }}>
                      GAME MODIFICATION SYSTEM
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '2px solid #FF7500',
                    maxWidth: '800px',
                    margin: '0 auto'
                  }}>
                    <p style={{ color: '#ffffff', fontSize: '1.125rem', lineHeight: '1.7', textAlign: 'center' }}>
                      These aren't expansions or new games - they're <strong style={{ color: '#fbbf24' }}>universal game modifiers</strong> that transform ANY game you already own into something completely new and insane.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Game Category Tabs */}
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
                        background: '#FF7500',
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
            {activeGameCategory && (
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: activeGameCategory.color, marginBottom: '0.25rem' }}>
                  {activeGameCategory.name}
                </h3>
                <p style={{ fontSize: '1rem', color: '#fdba74' }}>{activeGameCategory.description}</p>
              </div>
            )}

            {/* Games Grid */}
            {gamesLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#fdba74' }}>
                <div style={{ fontSize: '1.5rem' }}>Loading chaos...</div>
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
                  No {activeGameCategory?.name.toLowerCase()} available yet
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
                        background: 'linear-gradient(45deg, #FF7500, #fb923c)',
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

                    <Link href={`/games/${game.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '1.5rem', paddingBottom: '0' }}>
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
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: '#FF7500',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase'
                        }}>
                          {game.title}
                        </h3>

                        {game.tagline && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#fbbf24',
                            marginBottom: '0.5rem',
                            fontStyle: 'italic'
                          }}>
                            "{game.tagline}"
                          </p>
                        )}

                        <p style={{
                          fontSize: '0.875rem',
                          color: '#e2e8f0',
                          marginBottom: '1rem',
                          height: '2.5rem',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {game.description}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Users style={{ width: '0.875rem', height: '0.875rem', color: '#fdba74' }} />
                            <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>{game.players}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Play style={{ width: '0.875rem', height: '0.875rem', color: '#fdba74' }} />
                            <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>{game.timeToPlay}</span>
                          </div>
                        </div>

                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FF7500', marginBottom: '1rem' }}>
                          ${(game.priceCents / 100).toFixed(2)}
                        </div>
                      </div>
                    </Link>

                    <div style={{ padding: '0 1.5rem 1.5rem' }}>
                      {game.stock > 0 ? (
                        <AddToCartButton onClick={() => handleAddGameToCart(game)} disabled={game.stock === 0} />
                      ) : (
                        <div style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                          border: '2px solid #f97316',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ color: '#f97316', fontWeight: 900, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            COMING SPRING 2026
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
                        background: 'linear-gradient(45deg, #FF7500, #fbbf24)',
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
                        Chaos Engine
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MERCH TAB */}
        {activeTab === 'merch' && (
          <>
            <p style={{
              fontSize: '1.25rem',
              color: '#c4b5fd',
              textAlign: 'center',
              marginBottom: '2rem',
              fontWeight: 'bold'
            }}>
              Wear your chaos with pride (and questionable fashion sense)
            </p>

            {/* Merch Filter Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setMerchFilter('all')}
                style={{
                  background: merchFilter === 'all' ? '#a855f7' : 'transparent',
                  color: merchFilter === 'all' ? '#111827' : '#c4b5fd',
                  border: `2px solid ${merchFilter === 'all' ? '#a855f7' : '#c4b5fd'}`,
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
              {merchCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setMerchFilter(category)}
                  style={{
                    background: merchFilter === category ? '#a855f7' : 'transparent',
                    color: merchFilter === category ? '#111827' : '#c4b5fd',
                    border: `2px solid ${merchFilter === category ? '#a855f7' : '#c4b5fd'}`,
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
            {merchLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#a855f7' }}>Loading swag...</div>
              </div>
            ) : merch.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem',
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '1rem',
                border: '3px dashed #a855f7'
              }}>
                <p style={{ fontSize: '1.5rem', color: '#a855f7', fontWeight: 'bold' }}>
                  No swag found in this category!
                </p>
                <p style={{ fontSize: '1rem', color: '#c4b5fd', marginTop: '0.5rem' }}>
                  Fugly is still designing chaos-inducing apparel...
                </p>
              </div>
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
                      border: '3px solid #8b5cf6',
                      transform: hoveredMerch === item.id ? 'scale(1.02)' : `rotate(${index % 2 === 0 ? '1' : '-1'}deg)`,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={() => setHoveredMerch(item.id)}
                    onMouseLeave={() => setHoveredMerch(null)}
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
                              transform: hoveredMerch === item.id ? 'scale(1.1)' : 'scale(1)'
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
                          background: '#8b5cf6',
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
          </>
        )}
      </div>
    </div>
  );
}
