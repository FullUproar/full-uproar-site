'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cartStore';
import { useToastStore } from '@/lib/toastStore';
import { 
  ShoppingCart, Star, Users, Clock, Package, 
  ChevronRight, Play, Award, Zap, Target,
  Shield, Sparkles, Heart, TrendingUp
} from 'lucide-react';

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

interface Testimonial {
  author: string;
  rating: number;
  quote: string;
}

interface GameLandingPageProps {
  game: Game;
  testimonials: Testimonial[];
  similarGames: any[];
}

export default function GameLandingPage({ game, testimonials, similarGames }: GameLandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addToCartStore = useCartStore((state) => state.addToCart);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (game.stock === 0) {
      addToast({ message: 'Out of stock', type: 'error' });
      return;
    }

    addToCartStore({
      id: game.id,
      name: game.title,
      slug: game.slug,
      priceCents: game.priceCents,
      imageUrl: game.imageUrl || game.images[0]?.imageUrl || '/placeholder-game.jpg',
      type: 'game'
    });
    
    addToast({ message: `${game.title} added to cart!`, type: 'success' });
  };

  const allImages = [
    ...(game.imageUrl ? [{ imageUrl: game.imageUrl, alt: game.title, isPrimary: true, sortOrder: 0 }] : []),
    ...game.images
  ].filter(img => img.imageUrl);

  const mainImage = allImages[selectedImageIndex] || allImages[0];

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e2e8f0',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    
    // Hero Section
    hero: {
      position: 'relative' as const,
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    },
    
    heroBackground: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      transform: `translateY(${scrollY * 0.5}px)`,
      transition: 'transform 0.1s ease-out'
    },
    
    heroImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      filter: 'brightness(0.4)'
    },
    
    heroOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.8) 100%)'
    },
    
    heroContent: {
      position: 'relative' as const,
      zIndex: 10,
      textAlign: 'center' as const,
      padding: '2rem',
      maxWidth: '800px',
      animation: 'fadeInUp 1s ease-out'
    },
    
    heroTitle: {
      fontSize: 'clamp(3rem, 8vw, 6rem)',
      fontWeight: 'bold',
      color: '#fde68a',
      marginBottom: '1rem',
      textShadow: '0 4px 20px rgba(0,0,0,0.8)',
      letterSpacing: '2px'
    },
    
    heroTagline: {
      fontSize: 'clamp(1.2rem, 3vw, 2rem)',
      color: '#fdba74',
      marginBottom: '2rem',
      fontStyle: 'italic'
    },
    
    heroCTA: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.5rem 3rem',
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      color: 'white',
      fontSize: '1.25rem',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)',
      textDecoration: 'none'
    },
    
    // Story Section
    storySection: {
      padding: '6rem 2rem',
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
      position: 'relative' as const
    },
    
    storyContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '4rem',
      alignItems: 'center'
    },
    
    storyContent: {
      fontSize: '1.1rem',
      lineHeight: '1.8',
      color: '#e2e8f0'
    },
    
    storyTitle: {
      fontSize: '3rem',
      color: '#fde68a',
      marginBottom: '2rem',
      fontWeight: 'bold'
    },
    
    storyImage: {
      width: '100%',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      transform: `translateY(${-scrollY * 0.1}px)`,
      transition: 'transform 0.3s ease-out'
    },
    
    // Features Section
    featuresSection: {
      padding: '6rem 2rem',
      background: '#0a0a0a'
    },
    
    featuresGrid: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem'
    },
    
    featureCard: {
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      padding: '2rem',
      borderRadius: '15px',
      border: '1px solid rgba(249, 115, 22, 0.3)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    
    featureIcon: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      borderRadius: '15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem'
    },
    
    featureTitle: {
      fontSize: '1.5rem',
      color: '#fdba74',
      marginBottom: '0.5rem',
      fontWeight: 'bold'
    },
    
    featureText: {
      color: '#94a3b8',
      lineHeight: '1.6'
    },
    
    // Testimonials Section
    testimonialsSection: {
      padding: '6rem 2rem',
      background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)'
    },
    
    testimonialsContainer: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    
    testimonialCard: {
      background: 'rgba(30, 41, 59, 0.5)',
      padding: '2rem',
      borderRadius: '15px',
      border: '1px solid rgba(251, 191, 36, 0.2)',
      marginBottom: '2rem'
    },
    
    testimonialQuote: {
      fontSize: '1.5rem',
      color: '#fde68a',
      fontStyle: 'italic',
      marginBottom: '1rem',
      lineHeight: '1.6'
    },
    
    testimonialAuthor: {
      color: '#fdba74',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    
    // Gallery Section
    gallerySection: {
      padding: '6rem 2rem',
      background: '#0a0a0a'
    },
    
    galleryContainer: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    
    galleryMain: {
      width: '100%',
      height: '600px',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '2rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    },
    
    galleryThumbs: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '1rem'
    },
    
    galleryThumb: {
      height: '100px',
      borderRadius: '10px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.3s ease'
    },
    
    // CTA Section
    ctaSection: {
      padding: '6rem 2rem',
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      textAlign: 'center' as const
    },
    
    ctaTitle: {
      fontSize: '3rem',
      color: 'white',
      marginBottom: '1rem',
      fontWeight: 'bold'
    },
    
    ctaPrice: {
      fontSize: '4rem',
      color: '#fde68a',
      fontWeight: 'bold',
      marginBottom: '2rem'
    },
    
    ctaButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.5rem 3rem',
      background: '#0a0a0a',
      color: '#fde68a',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }
  };

  const features = [
    {
      icon: <Users size={30} color="white" />,
      title: game.playerCount || "2-4 Players",
      description: "Perfect for game night with friends and family"
    },
    {
      icon: <Clock size={30} color="white" />,
      title: game.playTime || "30-60 min",
      description: "Quick to learn, endless replayability"
    },
    {
      icon: <Target size={30} color="white" />,
      title: game.ageRating || "Ages 14+",
      description: "Challenging gameplay for serious gamers"
    },
    {
      icon: <Zap size={30} color="white" />,
      title: game.difficulty || "Strategic",
      description: "Deep strategy with meaningful choices"
    }
  ];

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroBackground}>
          <img 
            src={mainImage?.imageUrl || '/placeholder-game.jpg'} 
            alt={game.title}
            style={styles.heroImage}
          />
        </div>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>{game.title}</h1>
          {game.tagline && (
            <p style={styles.heroTagline}>{game.tagline}</p>
          )}
          <button 
            onClick={handleAddToCart}
            style={styles.heroCTA}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(249, 115, 22, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.3)';
            }}
          >
            <ShoppingCart size={30} />
            Get Your Copy Now
          </button>
        </div>
      </section>

      {/* Story Section */}
      {(game.story || game.description) && (
        <section style={styles.storySection}>
          <div style={styles.storyContainer}>
            <div style={styles.storyContent}>
              <h2 style={styles.storyTitle}>The Story</h2>
              <p style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                {game.story || game.description}
              </p>
              {game.designer && (
                <p style={{ color: '#fdba74', fontWeight: 'bold' }}>
                  Designed by {game.designer}
                </p>
              )}
            </div>
            {allImages[1] && (
              <div>
                <img 
                  src={allImages[1].imageUrl} 
                  alt="Game preview"
                  style={styles.storyImage}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ ...styles.storyTitle, marginBottom: '1rem' }}>Game Features</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
            Everything you need for an epic gaming experience
          </p>
        </div>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div 
              key={index}
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.featureIcon}>
                {feature.icon}
              </div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureText}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      {allImages.length > 0 && (
        <section style={styles.gallerySection}>
          <div style={styles.galleryContainer}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={styles.storyTitle}>See It In Action</h2>
            </div>
            <div style={styles.galleryMain}>
              <img 
                src={mainImage?.imageUrl || '/placeholder-game.jpg'}
                alt={game.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {allImages.length > 1 && (
              <div style={styles.galleryThumbs}>
                {allImages.map((img, index) => (
                  <div 
                    key={index}
                    style={{
                      ...styles.galleryThumb,
                      border: selectedImageIndex === index ? '2px solid #f97316' : '2px solid transparent'
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

      {/* Testimonials Section */}
      <section style={styles.testimonialsSection}>
        <div style={styles.testimonialsContainer}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={styles.storyTitle}>What Players Are Saying</h2>
          </div>
          {testimonials.map((testimonial, index) => (
            <div key={index} style={styles.testimonialCard}>
              <p style={styles.testimonialQuote}>"{testimonial.quote}"</p>
              <div style={styles.testimonialAuthor}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={20} 
                      fill={i < testimonial.rating ? '#fbbf24' : 'transparent'}
                      color="#fbbf24"
                    />
                  ))}
                </div>
                <span>— {testimonial.author}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Components Section */}
      {game.components && (
        <section style={{ ...styles.storySection, background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ ...styles.storyTitle, textAlign: 'center', marginBottom: '3rem' }}>
              What's In The Box
            </h2>
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '3rem',
              borderRadius: '20px',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e2e8f0' }}>
                {game.components}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Play?</h2>
        <div style={styles.ctaPrice}>
          ${(game.priceCents / 100).toFixed(2)}
        </div>
        <button 
          onClick={handleAddToCart}
          style={styles.ctaButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ShoppingCart size={30} />
          Add to Cart
        </button>
        <div style={{ marginTop: '2rem' }}>
          {game.stock > 0 && game.stock < 10 && (
            <p style={{ color: '#fde68a', fontSize: '1.2rem', fontWeight: 'bold' }}>
              Only {game.stock} left in stock!
            </p>
          )}
        </div>
      </section>

      {/* Similar Games */}
      {similarGames.length > 0 && (
        <section style={{ padding: '4rem 2rem', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ ...styles.storyTitle, textAlign: 'center', marginBottom: '3rem' }}>
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
                  href={`/play/${similar.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                      <img 
                        src={similar.images[0]?.imageUrl || similar.imageUrl || '/placeholder-game.jpg'}
                        alt={similar.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ color: '#fdba74', marginBottom: '0.5rem' }}>
                        {similar.title}
                      </h3>
                      <p style={{ color: '#fde68a', fontSize: '1.5rem', fontWeight: 'bold' }}>
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
    </div>
  );
}