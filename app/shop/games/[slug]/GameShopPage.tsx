'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { useCartStore } from '@/lib/cartStore';
import { useToastStore } from '@/lib/toastStore';
import {
  ShoppingCart, Star, Users, Clock, Package,
  ChevronRight, Play, Award, Zap, Target,
  Shield, Sparkles, Heart, TrendingUp, ChevronDown
} from 'lucide-react';
import { ProductReviews, ReviewStars } from '@/app/components/reviews';
import { formatPlayerCount, formatPlayTime, formatAgeRating } from '@/lib/utils/formatting';

interface GameImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Game {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  teaser: string | null;
  story: string | null;
  tagline: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: string | null;
  playerCount: string | null;
  playTime: string | null;
  ageRating: string | null;
  difficulty: string | null;
  releaseYear: number | null;
  designer: string | null;
  stock: number;
  images: GameImage[];
  howToPlay: string | null;
  components: string | null;
  videoUrl: string | null;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

interface GameShopPageProps {
  game: Game;
  similarGames: any[];
  reviewSummary: ReviewSummary;
}

// Premium game shop page with buttery smooth animations and responsive design
// Built for launch - v1.0
export default function GameShopPage({ game, similarGames, reviewSummary }: GameShopPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const addToCartStore = useCartStore((state) => state.addToCart);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);

    checkMobile();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Calculate visibility for transitions
  const showStickyFooter = scrollY > 400;
  const heroArrowOpacity = Math.max(0, 1 - scrollY / 300);

  const isOutOfStock = game.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCartStore({
      id: game.id,
      name: game.title,
      slug: game.slug,
      priceCents: game.priceCents,
      imageUrl: game.imageUrl || game.images[0]?.imageUrl || '/placeholder-game.jpg',
      type: 'game'
    });

    // Visual feedback on the button
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || notifyStatus === 'loading') return;

    setNotifyStatus('loading');
    try {
      const res = await fetch(`/api/games/${game.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail }),
      });
      const data = await res.json();

      if (data.inStock) {
        // Game came back in stock while they were on the page
        window.location.reload();
        return;
      }

      if (!res.ok) {
        addToast({ message: data.error || 'Something went wrong', type: 'error' });
        setNotifyStatus('error');
        return;
      }

      setNotifyStatus('success');
    } catch {
      addToast({ message: 'Something went wrong. Please try again.', type: 'error' });
      setNotifyStatus('error');
    }
  };

  const allImages = [
    ...(game.imageUrl ? [{ imageUrl: game.imageUrl, alt: game.title, isPrimary: true, sortOrder: 0 }] : []),
    ...game.images
  ].filter(img => img.imageUrl);

  const mainImage = allImages[selectedImageIndex] || allImages[0];

  const features = [
    {
      icon: <Users size={30} color="white" />,
      title: formatPlayerCount(game.playerCount) || "2-4 Players",
      description: "Perfect for game night with friends and family"
    },
    {
      icon: <Clock size={30} color="white" />,
      title: formatPlayTime(game.playTime) || "30-60 min",
      description: "Quick to learn, endless replayability"
    },
    {
      icon: <Target size={30} color="white" />,
      title: formatAgeRating(game.ageRating) || "Ages 14+",
      description: "Challenging gameplay for serious gamers"
    },
    {
      icon: <Zap size={30} color="white" />,
      title: game.difficulty || "Strategic",
      description: "Deep strategy with meaningful choices"
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e2e8f0' }}>
      <Navigation />

      {/* Hero Section - Title, Tagline, Teaser, Learn More Arrow */}
      <section style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Parallax Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: `translateY(${scrollY * 0.5}px)`
        }}>
          <img
            src={mainImage?.imageUrl || '/placeholder-game.jpg'}
            alt={game.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.4)'
            }}
          />
        </div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.8) 100%)'
        }} />

        {/* Hero Content - Centered */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '800px'
        }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 'bold',
            color: '#FBDB65',
            marginBottom: '1rem',
            textShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
            {game.title}
          </h1>

          {game.tagline && (
            <p style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              color: '#FBDB65',
              marginBottom: '1.5rem',
              fontStyle: 'italic',
              fontWeight: 600
            }}>
              {game.tagline}
            </p>
          )}

          {/* Teaser Description - Makes them want to scroll */}
          {(game.teaser || game.description) && (
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.3rem)',
              color: '#e2e8f0',
              marginBottom: '0',
              lineHeight: 1.7,
              maxWidth: '650px',
              margin: '0 auto',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              opacity: 0.95
            }}>
              {game.teaser
                ? game.teaser
                : game.description && game.description.length > 150
                  ? game.description.substring(0, 150).trim() + '...'
                  : game.description}
            </p>
          )}

          {/* Hero Add to Cart - Fades out when sticky footer appears */}
          <div style={{
            marginTop: '2rem',
            opacity: showStickyFooter ? 0 : 1,
            transform: showStickyFooter ? 'translateY(20px)' : 'translateY(0)',
            transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: showStickyFooter ? 'none' : 'auto'
          }}>
            <div style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: '#FBDB65',
              fontWeight: 'bold',
              marginBottom: '1rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              ${(game.priceCents / 100).toFixed(2)}
            </div>
            {isOutOfStock ? (
              /* Notify Me Form — Out of Stock */
              notifyStatus === 'success' ? (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '2px solid #22c55e',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  textAlign: 'center',
                }}>
                  <p style={{ color: '#22c55e', fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>
                    ✓ We'll email you when it's back!
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '0.95rem',
                    marginBottom: '0.75rem',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}>
                    Sold out — get notified when it's back:
                  </p>
                  <form onSubmit={handleNotifyMe} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      placeholder="Your email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      required
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '50px',
                        border: '2px solid #374151',
                        background: '#1a1a2e',
                        color: '#e2e8f0',
                        fontSize: '1rem',
                        outline: 'none',
                        minWidth: '220px',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={notifyStatus === 'loading'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '50px',
                        border: 'none',
                        background: '#7D55C7',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: notifyStatus === 'loading' ? 'wait' : 'pointer',
                        opacity: notifyStatus === 'loading' ? 0.7 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {notifyStatus === 'loading' ? 'Saving...' : 'Notify Me'}
                    </button>
                  </form>
                </div>
              )
            ) : (
              /* Add to Cart Button — In Stock */
              <>
                <button
                  onClick={handleAddToCart}
                  className="hero-cta"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: 'clamp(0.875rem, 2vw, 1.25rem) clamp(1.5rem, 3vw, 2.5rem)',
                    background: addedToCart
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                      : 'linear-gradient(135deg, #FF8200, #ea580c)',
                    color: 'white',
                    fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: addedToCart
                      ? '0 8px 30px rgba(34, 197, 94, 0.5)'
                      : '0 8px 30px rgba(255, 130, 0, 0.5)',
                    transform: addedToCart ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <ShoppingCart size={isMobile ? 22 : 26} />
                  {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                </button>
                {game.stock > 0 && game.stock < 10 && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginTop: '0.75rem',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}>
                    Only {game.stock} left in stock!
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Learn More Arrow - Fades out on scroll */}
        <div
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          style={{
            position: 'absolute',
            bottom: isMobile ? '3vh' : '4vh',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            opacity: heroArrowOpacity,
            transition: 'opacity 0.3s',
            zIndex: 10
          }}
        >
          <span style={{
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            fontWeight: 900,
            color: '#FF8200',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textShadow: '0 0 20px rgba(255, 117, 0, 0.5)',
          }}>
            Learn More
          </span>
          <ChevronDown
            size={isMobile ? 32 : 44}
            color="#FF8200"
            strokeWidth={2.5}
            style={{
              animation: 'bounce 1.5s infinite',
              filter: 'drop-shadow(0 0 10px rgba(255, 117, 0, 0.5))',
            }}
          />
        </div>
      </section>

      {/* Story Section */}
      {(game.story || game.description) && (
        <section style={{
          padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)',
          background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(2rem, 5vw, 4rem)',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', lineHeight: '1.8', color: '#e2e8f0' }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                color: '#FBDB65',
                marginBottom: 'clamp(1rem, 3vw, 2rem)',
                fontWeight: 'bold'
              }}>
                The Story
              </h2>
              <p style={{ marginBottom: '1.5rem', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)' }}>
                {game.story || game.description}
              </p>
              {game.designer && (
                <p style={{ color: '#FBDB65', fontWeight: 'bold' }}>
                  Designed by {game.designer}
                </p>
              )}
            </div>
            {allImages[1] && (
              <div>
                <img
                  src={allImages[1].imageUrl}
                  alt="Game preview"
                  style={{
                    width: '100%',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                  }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', background: '#0a0a0a' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FBDB65', marginBottom: '1rem', fontWeight: 'bold' }}>
            Game Features
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)' }}>
            Everything you need for an epic gaming experience
          </p>
        </div>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                padding: 'clamp(1.5rem, 3vw, 2rem)',
                borderRadius: '15px',
                border: '1px solid rgba(255, 130, 0, 0.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 'clamp(48px, 8vw, 60px)',
                height: 'clamp(48px, 8vw, 60px)',
                background: 'linear-gradient(135deg, #FF8200, #ea580c)',
                borderRadius: 'clamp(10px, 2vw, 15px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 8px 20px rgba(255, 130, 0, 0.3)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', color: '#FBDB65', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: 'clamp(0.875rem, 1.3vw, 1rem)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      {allImages.length > 0 && (
        <section style={{ padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FBDB65', fontWeight: 'bold' }}>
                See It In Action
              </h2>
            </div>
            <div style={{
              width: '100%',
              height: 'clamp(300px, 50vw, 600px)',
              borderRadius: 'clamp(12px, 2vw, 20px)',
              overflow: 'hidden',
              marginBottom: 'clamp(1rem, 3vw, 2rem)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
              <img
                src={mainImage?.imageUrl || '/placeholder-game.jpg'}
                alt={game.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {allImages.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {allImages.map((img, index) => (
                  <div
                    key={index}
                    className="gallery-thumb"
                    style={{
                      height: 'clamp(80px, 12vw, 120px)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedImageIndex === index ? '2px solid #FF8200' : '2px solid transparent',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={`${game.title} preview ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section style={{
        padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)',
        background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ProductReviews gameId={game.id} productName={game.title} />
        </div>
      </section>

      {/* Components Section */}
      {game.components && (
        <section style={{ padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: '#FBDB65',
              textAlign: 'center',
              marginBottom: 'clamp(1.5rem, 4vw, 3rem)',
              fontWeight: 'bold'
            }}>
              What's In The Box
            </h2>
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: 'clamp(1.5rem, 4vw, 3rem)',
              borderRadius: 'clamp(12px, 2vw, 20px)',
              border: '1px solid rgba(255, 130, 0, 0.3)'
            }}>
              <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', lineHeight: '1.8', color: '#e2e8f0' }}>
                {game.components}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section style={{
        padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)',
        background: 'linear-gradient(135deg, #FF8200, #ea580c)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'white', marginBottom: '1rem', fontWeight: 'bold' }}>
          {isOutOfStock ? 'Want This Game?' : 'Ready to Play?'}
        </h2>
        <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#FBDB65', fontWeight: 'bold', marginBottom: 'clamp(1rem, 3vw, 2rem)' }}>
          ${(game.priceCents / 100).toFixed(2)}
        </div>
        {isOutOfStock ? (
          notifyStatus === 'success' ? (
            <div style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '2px solid #22c55e',
              borderRadius: '12px',
              padding: '1rem 2rem',
              display: 'inline-block',
            }}>
              <p style={{ color: '#22c55e', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>
                ✓ We'll email you when it's back!
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem', fontSize: '1.1rem' }}>
                Currently sold out — be the first to know when it's back:
              </p>
              <form onSubmit={handleNotifyMe} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  required
                  style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '50px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.4)',
                    color: 'white',
                    fontSize: '1.1rem',
                    outline: 'none',
                    minWidth: '240px',
                  }}
                />
                <button
                  type="submit"
                  disabled={notifyStatus === 'loading'}
                  style={{
                    padding: '1rem 2rem',
                    borderRadius: '50px',
                    border: 'none',
                    background: '#0a0a0a',
                    color: '#FBDB65',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: notifyStatus === 'loading' ? 'wait' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {notifyStatus === 'loading' ? 'Saving...' : 'Notify Me'}
                </button>
              </form>
            </div>
          )
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              className="cta-button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                padding: 'clamp(1rem, 2vw, 1.5rem) clamp(2rem, 4vw, 3rem)',
                background: addedToCart ? '#22c55e' : '#0a0a0a',
                color: addedToCart ? 'white' : '#FBDB65',
                fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transform: addedToCart ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <ShoppingCart size={isMobile ? 24 : 30} />
              {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
            <div style={{ marginTop: '2rem' }}>
              {game.stock > 0 && game.stock < 10 && (
                <p style={{ color: '#FBDB65', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Only {game.stock} left in stock!
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* Similar Games */}
      {similarGames.length > 0 && (
        <section style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem) clamp(5rem, 10vw, 8rem)', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: '#FBDB65',
              textAlign: 'center',
              marginBottom: 'clamp(1.5rem, 4vw, 3rem)',
              fontWeight: 'bold'
            }}>
              More Epic Adventures
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              {similarGames.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/shop/games/${similar.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="similar-game-card"
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 130, 0, 0.2)'
                    }}
                  >
                    <div style={{ height: 'clamp(150px, 20vw, 200px)', overflow: 'hidden' }}>
                      <img
                        src={similar.images[0]?.imageUrl || similar.imageUrl || '/placeholder-game.jpg'}
                        alt={similar.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ color: '#FBDB65', marginBottom: '0.5rem' }}>
                        {similar.title}
                      </h3>
                      <p style={{ color: '#FBDB65', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        ${(similar.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Purchase Footer - Fades in on scroll */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10, 10, 10, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 130, 0, 0.4)',
        padding: isMobile ? '0.875rem 1rem' : '1.25rem 2rem',
        zIndex: 100,
        opacity: showStickyFooter ? 1 : 0,
        transform: showStickyFooter ? 'translateY(0)' : 'translateY(100%)',
        transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: showStickyFooter ? 'auto' : 'none',
        boxShadow: showStickyFooter ? '0 -10px 40px rgba(0, 0, 0, 0.5)' : 'none'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Left side - Reviews */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            opacity: isMobile ? 0 : 1,
            width: isMobile ? 0 : 'auto',
            overflow: 'hidden'
          }}>
            {reviewSummary.totalReviews > 0 ? (
              <>
                <ReviewStars rating={reviewSummary.averageRating} size="small" />
                <span style={{ color: '#e2e8f0', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
                </span>
              </>
            ) : (
              <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                Be the first to review!
              </span>
            )}
          </div>

          {/* Right side - Price & CTA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1.5rem',
            flex: isMobile ? 1 : 'none',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 'bold',
                color: '#FBDB65'
              }}>
                ${(game.priceCents / 100).toFixed(2)}
              </div>
              {game.stock > 0 && game.stock < 10 && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                  Only {game.stock} left!
                </div>
              )}
            </div>
            {isOutOfStock ? (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="sticky-cta"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.75rem 1.25rem' : '1rem 2rem',
                  background: '#7D55C7',
                  color: 'white',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 15px rgba(125, 85, 199, 0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                {notifyStatus === 'success' ? '✓ Notified' : 'Get Notified'}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="sticky-cta"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.75rem 1.25rem' : '1rem 2rem',
                  background: addedToCart
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #FF8200, #ea580c)',
                  color: 'white',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: addedToCart
                    ? '0 4px 15px rgba(34, 197, 94, 0.4)'
                    : '0 4px 15px rgba(255, 130, 0, 0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                <ShoppingCart size={isMobile ? 18 : 22} />
                {addedToCart ? 'Added ✓' : 'Get Your Copy'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animation Styles - Premium, buttery smooth */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        /* Premium hover effects for feature cards */
        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 130, 0, 0.6) !important;
          box-shadow: 0 20px 40px rgba(255, 130, 0, 0.15);
        }

        /* Smooth image gallery hover */
        .gallery-thumb:hover {
          transform: scale(1.05);
          border-color: rgba(255, 130, 0, 0.6) !important;
        }

        /* Similar games card hover */
        .similar-game-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }

        .similar-game-card:hover img {
          transform: scale(1.08);
        }

        /* CTA button premium hover */
        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4) !important;
        }

        .sticky-cta:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(255, 130, 0, 0.5) !important;
        }

        .hero-cta:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(255, 130, 0, 0.6) !important;
        }

        /* Smooth scroll indicator pulse */
        .scroll-indicator {
          animation: bounce 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
