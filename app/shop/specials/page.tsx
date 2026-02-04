'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { Tag, Zap, Gift, Clock, Sparkles, Package } from 'lucide-react';

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  isBundle: boolean;
  featured: boolean;
  stock: number;
}

export default function ShopSpecialsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/games');
        if (response.ok) {
          const data = await response.json();
          // Filter for bundles and featured items
          const specials = (Array.isArray(data) ? data : []).filter(
            (game: Game) => game.isBundle || game.featured
          );
          setGames(specials);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)' }}>
      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Sparkles style={{ width: '2.5rem', height: '2.5rem', color: '#fbbf24' }} />
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 900,
              background: 'linear-gradient(45deg, #fbbf24, #FF8200)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textTransform: 'uppercase'
            }}>
              Specials & Deals
            </h1>
            <Sparkles style={{ width: '2.5rem', height: '2.5rem', color: '#fbbf24' }} />
          </div>
          <p style={{ fontSize: '1.25rem', color: '#FBDB65' }}>
            Bundles, featured items, and limited-time offers
          </p>
        </div>

        {/* Bundles Section */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            <Gift style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FF8200' }}>
              Bundles & Combo Deals
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#FBDB65' }}>
              Loading specials...
            </div>
          ) : games.filter(g => g.isBundle).length === 0 ? (
            <div style={{
              padding: '3rem',
              background: 'rgba(255, 130, 0, 0.1)',
              borderRadius: '1rem',
              border: '2px dashed #FF8200',
              textAlign: 'center'
            }}>
              <Package style={{ width: '3rem', height: '3rem', color: '#FF8200', margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.25rem', color: '#FBDB65', marginBottom: '0.5rem' }}>
                No bundles available right now
              </p>
              <p style={{ color: '#94a3b8' }}>
                Check back soon for combo deals and special offers!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {games.filter(g => g.isBundle).map((game) => (
                <Link
                  key={game.id}
                  href={`/shop/games/${game.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #1f2937, #111827)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: '3px solid #FF8200',
                    transition: 'all 0.3s',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(45deg, #FF8200, #fbbf24)',
                      color: '#000',
                      padding: '0.5rem 1rem',
                      borderRadius: '50px',
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Gift size={14} />
                      BUNDLE
                    </div>
                    {game.imageUrl && (
                      <img
                        src={game.imageUrl}
                        alt={game.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#fbbf24',
                        marginBottom: '0.5rem'
                      }}>
                        {game.title}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#e2e8f0',
                        marginBottom: '1rem',
                        lineHeight: 1.6
                      }}>
                        {game.description}
                      </p>
                      <div style={{
                        fontSize: '1.75rem',
                        fontWeight: 900,
                        color: '#FF8200'
                      }}>
                        ${(game.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Section */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            <Zap style={{ width: '1.5rem', height: '1.5rem', color: '#fbbf24' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24' }}>
              Featured Products
            </h2>
          </div>

          {games.filter(g => g.featured && !g.isBundle).length === 0 ? (
            <div style={{
              padding: '3rem',
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '1rem',
              border: '2px dashed #fbbf24',
              textAlign: 'center'
            }}>
              <Sparkles style={{ width: '3rem', height: '3rem', color: '#fbbf24', margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.25rem', color: '#fbbf24', marginBottom: '0.5rem' }}>
                No featured items right now
              </p>
              <p style={{ color: '#94a3b8' }}>
                Browse our <Link href="/shop/games" style={{ color: '#FF8200' }}>full catalog</Link>!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem'
            }}>
              {games.filter(g => g.featured && !g.isBundle).map((game) => (
                <Link
                  key={game.id}
                  href={`/shop/games/${game.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #1f2937, #111827)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: '2px solid #fbbf24',
                    transition: 'all 0.3s'
                  }}>
                    {game.imageUrl && (
                      <img
                        src={game.imageUrl}
                        alt={game.title}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 900,
                        color: '#fbbf24',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase'
                      }}>
                        {game.title}
                      </h3>
                      <p style={{
                        fontSize: '0.8125rem',
                        color: '#e2e8f0',
                        marginBottom: '1rem'
                      }}>
                        {game.tagline}
                      </p>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: '#FF8200'
                      }}>
                        ${(game.priceCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <div style={{
          marginTop: '4rem',
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 130, 0, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 130, 0, 0.3)'
        }}>
          <p style={{ color: '#FBDB65', marginBottom: '1rem' }}>
            Looking for something specific?
          </p>
          <Link
            href="/shop/games"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, #FF8200, #fb923c)',
              color: '#0a0a0a',
              borderRadius: '50px',
              fontWeight: 900,
              textDecoration: 'none',
              textTransform: 'uppercase'
            }}
          >
            Browse All Games
          </Link>
        </div>
      </div>
    </div>
  );
}
