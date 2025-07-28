'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Mail, ShoppingCart, Calendar, Users, BookOpen, Star, Package, ArrowRight, Menu, X, Heart, Share2, Play, Zap, Skull } from 'lucide-react';
import { useUser, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cartStore';

interface Game {
  id: number;
  title: string;
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
}

interface Comic {
  id: number;
  title: string;
  episode: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: string;
}

interface FullUproarHomeProps {
  games: Game[];
  comics: Comic[];
  news: NewsPost[];
}

export default function FullUproarHomeStyled({ games, comics, news }: FullUproarHomeProps) {
  const { user } = useUser();
  const { items, addToCart } = useCartStore();
  const [email, setEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeGame, setActiveGame] = useState(0);
  const [currentComic, setCurrentComic] = useState(0);

  // Debug log
  console.log('FullUproarHomeStyled received games:', games.length, games);

  const handleAddToCart = (game: Game) => {
    addToCart({
      id: game.id,
      name: game.title,
      slug: game.title.toLowerCase().replace(/\s+/g, '-'),
      priceCents: game.priceCents,
      imageUrl: game.imageUrl || '/placeholder-game.jpg'
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (response.ok) {
          alert(`Welcome to the chaos! Fugly will personally deliver updates to ${email}`);
          setEmail('');
        }
      } catch (error) {
        console.error('Newsletter signup failed:', error);
      }
    }
  };

  // Auto-rotate featured games
  useEffect(() => {
    if (games.length > 0) {
      const interval = setInterval(() => {
        setActiveGame((prev) => (prev + 1) % games.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [games.length]);

  const featuredGame = games[activeGame];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)'
    },
    nav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.9)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #f97316'
    },
    navContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
      padding: '0 1rem'
    },
    navFlex: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '4rem'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoCircle: {
      width: '3rem',
      height: '3rem',
      background: '#f97316',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontWeight: 900,
      color: '#111827'
    },
    logoText: {
      fontWeight: 900,
      fontSize: '1.5rem',
      color: '#f97316'
    },
    logoSubtext: {
      fontSize: '0.75rem',
      color: '#fdba74',
      marginTop: '-0.25rem'
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '2rem'
    },
    navLink: {
      fontWeight: 'bold',
      color: '#fde68a',
      textDecoration: 'none',
      transition: 'color 0.3s'
    },
    cartButton: {
      position: 'relative' as const,
      padding: '0.5rem',
      borderRadius: '50%',
      transition: 'background-color 0.3s',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer'
    },
    heroSection: {
      position: 'relative' as const,
      overflow: 'hidden'
    },
    heroContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
      padding: '5rem 1rem',
      position: 'relative' as const
    },
    textCenter: {
      textAlign: 'center' as const
    },
    badge: {
      display: 'inline-block',
      background: '#f97316',
      color: '#111827',
      padding: '0.5rem 1.5rem',
      borderRadius: '50px',
      marginBottom: '1.5rem',
      transform: 'rotate(-3deg)',
      fontWeight: 900,
      fontSize: '0.875rem'
    },
    heroTitle: {
      fontSize: '4rem',
      fontWeight: 900,
      marginBottom: '1.5rem',
      lineHeight: 1.1
    },
    orangeText: {
      color: '#f97316'
    },
    lightOrangeText: {
      color: '#fdba74'
    },
    gradientText: {
      background: 'linear-gradient(to right, #ef4444, #f97316)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      color: '#fde68a',
      marginBottom: '2rem',
      maxWidth: '32rem',
      margin: '0 auto 2rem auto',
      fontWeight: 'bold'
    },
    emailForm: {
      maxWidth: '28rem',
      margin: '0 auto 2rem auto'
    },
    emailContainer: {
      background: '#1f2937',
      borderRadius: '50px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      border: '4px solid #f97316'
    },
    emailInput: {
      flex: 1,
      padding: '0.5rem 1rem',
      outline: 'none',
      fontWeight: 'bold',
      background: 'transparent',
      color: '#fde68a',
      border: 'none'
    },
    emailButton: {
      background: '#f97316',
      color: '#111827',
      padding: '0.5rem 1.5rem',
      borderRadius: '50px',
      fontWeight: 900,
      transition: 'all 0.3s',
      transform: 'scale(1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      border: 'none',
      cursor: 'pointer'
    },
    featuredCard: {
      background: '#1f2937',
      borderRadius: '1.5rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '2rem',
      maxWidth: '64rem',
      margin: '0 auto',
      border: '4px solid #f97316',
      transform: 'rotate(1deg)',
      transition: 'transform 0.3s'
    },
    gamesSection: {
      padding: '5rem 0',
      background: 'rgba(17, 24, 39, 0.5)'
    },
    sectionTitle: {
      fontSize: '3rem',
      fontWeight: 900,
      marginBottom: '1rem',
      color: '#f97316',
      textAlign: 'center' as const
    },
    sectionSubtitle: {
      fontSize: '1.25rem',
      color: '#fdba74',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      marginBottom: '3rem'
    },
    gameGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      maxWidth: '80rem',
      margin: '0 auto',
      padding: '0 1rem'
    },
    gameCard: {
      background: '#1f2937',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s',
      border: '4px solid #fb923c'
    },
    gameImage: {
      width: '100%',
      height: '8rem',
      background: '#374151',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f97316',
      fontSize: '2rem',
      fontWeight: 'bold'
    },
    gameTitle: {
      fontSize: '1.5rem',
      fontWeight: 900,
      marginBottom: '0.5rem',
      color: '#fdba74'
    },
    gameTagline: {
      color: '#fde68a',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    gamePrice: {
      fontSize: '1.875rem',
      fontWeight: 900,
      color: '#f97316'
    },
    buyButton: {
      background: '#f97316',
      color: '#111827',
      padding: '0.75rem 1.5rem',
      borderRadius: '50px',
      fontWeight: 900,
      transition: 'all 0.3s',
      border: 'none',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.navFlex}>
            <div style={styles.logo}>
              <div style={styles.logoCircle}>FU</div>
              <div>
                <span style={styles.logoText}>FULL UPROAR</span>
                <div style={styles.logoSubtext}>Fugly Approved Games™</div>
              </div>
            </div>
            
            <div style={styles.navLinks}>
              <a href="#games" style={styles.navLink}>GAMES</a>
              <a href="#comics" style={styles.navLink}>COMICS</a>
              <a href="#news" style={styles.navLink}>CHAOS</a>
              <a href="#community" style={styles.navLink}>CULT</a>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button style={{
                    background: '#f97316',
                    color: '#111827',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    SIGN IN
                  </button>
                </SignInButton>
              </SignedOut>
              
              <SignedIn>
                <a href="/admin/dashboard" style={styles.navLink}>ADMIN</a>
                <UserButton />
              </SignedIn>
              
              <button style={styles.cartButton}>
                <ShoppingCart style={{ height: '1.25rem', width: '1.25rem', color: '#fdba74' }} />
                {items.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.25rem',
                    right: '-0.25rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '50%',
                    height: '1.25rem',
                    width: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {items.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.textCenter}>
            <div style={styles.badge}>EXTRA SKETCHY SINCE 2024</div>

            <h1 style={styles.heroTitle}>
              <div style={styles.orangeText}>GAME MODIFIERS</div>
              <div style={styles.lightOrangeText}>SO CHAOTIC</div>
              <div style={styles.gradientText}>FUGLY APPROVES</div>
            </h1>
            
            <p style={styles.heroSubtitle}>
              Turn ANY game night into a beautiful disaster with our chaos-inducing card decks.
              <br /><span style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#fdba74' }}>Warning: Friendships may not survive. Worth it.</span>
            </p>
            
            {/* Email Capture */}
            <div style={styles.emailForm}>
              <form onSubmit={handleEmailSubmit} style={styles.emailContainer}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Join Fugly's chaos crew"
                  style={styles.emailInput}
                />
                <button type="submit" style={styles.emailButton}>
                  SIGN ME UP <Zap style={{ height: '1rem', width: '1rem' }} />
                </button>
              </form>
              <p style={{ fontSize: '0.875rem', color: '#fdba74', marginTop: '0.5rem', fontWeight: 600 }}>
                🎁 Get exclusive pre-order bonuses and Fugly's seal of approval!
              </p>
            </div>

            {/* Featured Game */}
            {featuredGame && (
              <div style={styles.featuredCard}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{
                      background: '#ef4444',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '50px',
                      fontSize: '0.875rem',
                      fontWeight: 900,
                      display: 'inline-block',
                      transform: 'rotate(-3deg)'
                    }}>
                      PRE-ORDER MADNESS
                    </span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '1rem', marginBottom: '1rem', color: '#fdba74' }}>
                      {featuredGame.title}
                    </h2>
                    <p style={{ color: '#fde68a', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
                      {featuredGame.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <Users style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#f97316' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{featuredGame.players}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Calendar style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#f97316' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{featuredGame.timeToPlay}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Skull style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#f97316' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{featuredGame.ageRating}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={styles.gamePrice}>${(featuredGame.priceCents / 100).toFixed(2)}</span>
                      <button 
                        onClick={() => handleAddToCart(featuredGame)}
                        style={{
                          background: '#f97316',
                          color: '#111827',
                          padding: '1rem 2rem',
                          borderRadius: '50px',
                          fontWeight: 900,
                          transform: 'scale(1)',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        THROW MONEY AT FUGLY <ArrowRight style={{ height: '1.25rem', width: '1.25rem' }} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '16rem',
                      height: '16rem',
                      margin: '0 auto',
                      background: '#374151',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f97316',
                      fontSize: '4rem',
                      fontWeight: 'bold'
                    }}>
                      FUGLY
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-1rem',
                      right: '-1rem',
                      background: '#fbbf24',
                      color: '#111827',
                      padding: '1rem',
                      borderRadius: '50px',
                      transform: 'rotate(12deg)',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      Fugly Tested!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section style={styles.gamesSection}>
        <div>
          <h2 style={styles.sectionTitle}>THE CHAOS COLLECTION</h2>
          <p style={styles.sectionSubtitle}>Games that make Fugly purr with evil delight</p>
          
          <div style={styles.gameGrid}>
            {games.map((game, index) => (
              <div 
                key={game.id} 
                style={{
                  ...styles.gameCard,
                  transform: `rotate(${index % 2 === 0 ? '-2' : '2'}deg)`
                }}
              >
                <div style={styles.gameImage}>
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }} />
                  ) : (
                    'GAME'
                  )}
                </div>
                <h3 style={styles.gameTitle}>{game.title}</h3>
                <p style={styles.gameTagline}>{game.tagline || 'Epic chaos awaits!'}</p>
                
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
                  <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{game.players}</span>
                  <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{game.timeToPlay}</span>
                  <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{game.ageRating}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.gamePrice}>${(game.priceCents / 100).toFixed(2)}</span>
                  <button 
                    onClick={() => handleAddToCart(game)}
                    style={styles.buyButton}
                  >
                    WANT IT
                  </button>
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
                    transform: 'rotate(12deg)'
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
                    transform: 'rotate(12deg)'
                  }}>
                    SAVE $10
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer placeholder */}
      <footer style={{ background: '#000', color: 'white', padding: '3rem 0', textAlign: 'center' as const }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>
              FU
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#f97316' }}>FULL UPROAR</span>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Games Inc.</div>
            </div>
          </div>
          <p style={{ color: '#9ca3af', fontWeight: 600 }}>Making game night weird since 2024</p>
          <p style={{ color: '#6b7280', marginTop: '2rem', fontWeight: 600 }}>© 2024 Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.</p>
        </div>
      </footer>
    </div>
  );
}