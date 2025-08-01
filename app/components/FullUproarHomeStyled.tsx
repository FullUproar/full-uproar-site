'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, ArrowRight, Zap, Skull, Pause, Gamepad2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cartStore';
import DeploymentInfo from './DeploymentInfo';
import FuglyChaosMode from './FuglyChaosMode';
import FuglyLogo from './FuglyLogo';
import FuglyPointing from './FuglyPointing';
import FooterLogo from './FooterLogo';
import Navigation from './Navigation';

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


interface Merch {
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

interface FullUproarHomeProps {
  games: Game[];
  comics: Comic[];
  news: NewsPost[];
  merch: Merch[];
}

export default function FullUproarHomeStyled({ games, comics, news, merch }: FullUproarHomeProps) {
  const { user } = useUser();
  const { addToCart } = useCartStore();
  const [email, setEmail] = useState('');
  const [activeGame, setActiveGame] = useState(0);
  const [currentComic, setCurrentComic] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardRotation, setCardRotation] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [chaosPhrase, setChaosPhrase] = useState('FRESHLY UNHINGED');
  const [phraseTransform, setPhraseTransform] = useState({ scale: 1, rotation: 0 });

  // Chaos phrases pool
  const chaosPhrases = [
    'FRESHLY UNHINGED',
    'WILDLY UNSTABLE',
    'BEAUTIFULLY BROKEN',
    'PROPERLY IMPROPER',
    'ORGANIZED CHAOS',
    'PERFECTLY FLAWED',
    'GLORIOUSLY MESSY',
    'DELIGHTFULLY DAMAGED',
    'ELEGANTLY EXPLOSIVE',
    'TASTEFULLY TERRIBLE',
    'WONDERFULLY WRONG',
    'MAJESTICALLY MAD'
  ];

  // Initialize chaos phrase with hourly persistence
  useEffect(() => {
    const storedData = localStorage.getItem('fuglyChaosPhraseData');
    const now = Date.now();
    
    if (storedData) {
      const { phrase, transform, timestamp } = JSON.parse(storedData);
      // Check if an hour has passed
      if (now - timestamp < 3600000) { // 1 hour in milliseconds
        setChaosPhrase(phrase);
        setPhraseTransform(transform);
      } else {
        // Generate new phrase after an hour
        generateNewChaosPhrase();
      }
    } else {
      // First visit - generate new phrase
      generateNewChaosPhrase();
    }
  }, []);

  const generateNewChaosPhrase = () => {
    // Pick random phrase
    const randomIndex = Math.floor(Math.random() * chaosPhrases.length);
    const newPhrase = chaosPhrases[randomIndex];
    
    // Generate subtle random transform
    const scales = [0.95, 0.98, 1, 1.02, 1.05];
    const rotations = [-5, -3, -2, 0, 2, 3, 5];
    const newTransform = {
      scale: scales[Math.floor(Math.random() * scales.length)],
      rotation: rotations[Math.floor(Math.random() * rotations.length)]
    };
    
    // Store in localStorage with timestamp
    localStorage.setItem('fuglyChaosPhraseData', JSON.stringify({
      phrase: newPhrase,
      transform: newTransform,
      timestamp: Date.now()
    }));
    
    setChaosPhrase(newPhrase);
    setPhraseTransform(newTransform);
  };

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug log
  console.log('FullUproarHomeStyled received games:', games.length, games);
  
  // Show alert for debugging on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Client side debug - games:', games.length, games);
    }
  }, [games]);

  const handleAddToCart = (game: Game) => {
    addToCart({
      id: game.id,
      name: game.title,
      slug: game.title.toLowerCase().replace(/\s+/g, '-'),
      priceCents: game.priceCents,
      imageUrl: game.imageUrl || '/placeholder-game.jpg',
      type: 'game'
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

  // Games are already filtered as featured from the API

  // Auto-rotate featured games with chaotic transitions (pause on hover)
  useEffect(() => {
    if (games.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Start transition animation
            setIsTransitioning(true);
            
            // After shake animation, change game and rotation
            setTimeout(() => {
              setActiveGame((current) => (current + 1) % games.length);
              // Random rotation between -5 and 5 degrees, but never 0
              const rotations = [-5, -3, -2, 2, 3, 5];
              setCardRotation(rotations[Math.floor(Math.random() * rotations.length)]);
              setIsTransitioning(false);
            }, 300);
            
            return 7;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [games.length, isPaused]);

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
      height: isMobile ? '3.5rem' : '4rem',
      overflow: 'hidden'
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
      padding: '0.25rem 0.75rem',
      borderRadius: '50px',
      marginBottom: '0.75rem',
      transform: 'rotate(-3deg)',
      fontWeight: 900,
      fontSize: '1.17rem'
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
      maxWidth: '46.5rem',
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
      transform: `rotate(${cardRotation}deg)`,
      transition: 'transform 0.3s',
      animation: isTransitioning ? 'chaosShake 0.3s ease-in-out' : 'none'
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
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: isMobile ? '1.5rem' : '2rem',
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
      <Navigation />

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.textCenter}>
            <div style={{
              ...styles.badge,
              transform: `rotate(${phraseTransform.rotation}deg) scale(${phraseTransform.scale})`,
              transition: 'none' // No transition to make it feel like it was always this way
            }}>{chaosPhrase}</div>

            <h1 style={{
              ...styles.heroTitle,
              fontSize: isMobile ? '2.5rem' : '4rem'
            }}>
              <div style={styles.orangeText}>GAMES AND MODS</div>
              <div style={styles.lightOrangeText}>SO CHAOTIC</div>
              <div style={styles.gradientText}>FUGLY APPROVES</div>
            </h1>
            
            <p style={{
              ...styles.heroSubtitle,
              fontSize: isMobile ? '1rem' : '1.25rem',
              padding: isMobile ? '0 1rem' : '0'
            }}>
              Turn ANY game night into a beautiful disaster with our chaos-inducing card decks.
              <br /><span style={{ fontSize: isMobile ? '0.875rem' : '1rem', marginTop: '0.5rem', color: '#fdba74' }}>Warning: Friendships may not survive. Worth it.</span>
            </p>
            
            {/* Email Capture */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
              <div style={styles.emailForm}>
                <form onSubmit={handleEmailSubmit} style={{
                  ...styles.emailContainer,
                  padding: '0.25rem',
                  height: '3rem'
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Join Fugly's chaos crew"
                    style={{
                      ...styles.emailInput,
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button type="submit" style={{
                    ...styles.emailButton,
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.875rem'
                  }}>
                    SIGN ME UP <Zap style={{ height: '0.875rem', width: '0.875rem' }} />
                  </button>
                </form>
                <p style={{ fontSize: '0.875rem', color: '#fdba74', marginTop: '0.5rem', fontWeight: 600, textAlign: 'center' }}>
                  🎁 Get exclusive pre-order bonuses and Fugly's seal of approval!
                </p>
              </div>
              {!isMobile && (
                <FuglyPointing size={180} style={{ 
                  position: 'absolute', 
                  right: '-20px', 
                  top: '50%', 
                  transform: 'translateY(-75%)'
                }} />
              )}
            </div>

            {/* Featured Game */}
            {featuredGame && (
              <div 
                style={{
                  ...styles.featuredCard,
                  padding: isMobile ? '1.5rem' : '2rem',
                  transform: isMobile ? 'rotate(0deg)' : `rotate(${cardRotation}deg)`
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: isMobile ? '1.5rem' : '2rem', 
                  alignItems: 'center' 
                }}>
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
                    <h2 style={{ 
                      fontSize: isMobile ? '1.75rem' : '2.5rem', 
                      fontWeight: 900, 
                      marginTop: '1rem', 
                      marginBottom: '1rem', 
                      color: '#fdba74' 
                    }}>
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
                      <div style={{ textAlign: 'center' }}>
                        <Gamepad2 style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#f97316' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{(featuredGame as any).category?.toUpperCase() || 'GAME'}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={styles.gamePrice}>${(featuredGame.priceCents / 100).toFixed(2)}</span>
                      <a 
                        href={`/games/${featuredGame.slug || featuredGame.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                      >
                        THROW MONEY AT FUGLY <ArrowRight style={{ height: '1.25rem', width: '1.25rem' }} />
                      </a>
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
                      fontWeight: 'bold',
                      overflow: 'hidden'
                    }}>
                      {featuredGame.imageUrl && featuredGame.imageUrl.trim() !== '' ? (
                        <img 
                          src={featuredGame.imageUrl} 
                          alt={featuredGame.title}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain'
                          }} 
                        />
                      ) : (
                        'FUGLY'
                      )}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-1rem',
                      right: '-1rem',
                      background: '#fbbf24',
                      color: '#111827',
                      padding: '1rem',
                      borderRadius: '50px',
                      transform: `rotate(${isTransitioning ? -12 : 12}deg)`,
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      transition: 'transform 0.3s',
                      animation: isTransitioning ? 'tagWobble 0.3s ease-in-out' : 'none'
                    }}>
                      Fugly Tested!
                    </div>
                  </div>
                </div>
                
                {/* Game selector dots with countdown */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {games.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveGame(index);
                          setCountdown(7);
                        }}
                        style={{
                          width: index === activeGame ? '2rem' : '0.75rem',
                          height: '0.75rem',
                          borderRadius: '50px',
                          border: 'none',
                          background: index === activeGame ? '#f97316' : '#6b7280',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                      />
                    ))}
                  </div>
                  {isPaused ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#fdba74',
                      background: '#374151',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '50px'
                    }}>
                      <Pause style={{ width: '1rem', height: '1rem' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>PAUSED</span>
                    </div>
                  ) : (
                    <div style={{
                      color: '#fdba74',
                      background: '#374151',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '50px'
                    }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>CHAOS IN {countdown}...</span>
                    </div>
                  )}
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
            {games.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#f97316', fontSize: '1.5rem' }}>
                No featured games found!
              </div>
            )}
            {games.map((game, index) => (
              <div 
                key={game.id} 
                style={{
                  ...styles.gameCard,
                  transform: `rotate(${index % 2 === 0 ? '-2' : '2'}deg)`
                }}
              >
                <div style={styles.gameImage}>
                  {game.imageUrl && game.imageUrl.trim() !== '' ? (
                    <img src={game.imageUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f3f4f6', color: '#6b7280', fontWeight: 'bold', fontSize: '1.5rem' }}>
                      🎮
                    </div>
                  )}
                </div>
                <h3 style={styles.gameTitle}>{game.title}</h3>
                <p style={styles.gameTagline}>{game.tagline || 'Epic chaos awaits!'}</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{game.players}</span>
                  <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{game.timeToPlay}</span>
                  <span style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{game.ageRating}</span>
                  <span style={{ background: (game as any).category === 'mod' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)', color: (game as any).category === 'mod' ? '#c7d2fe' : '#fdba74', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{(game as any).category?.toUpperCase() || 'GAME'}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.gamePrice}>${(game.priceCents / 100).toFixed(2)}</span>
                  <a 
                    href={`/games/${game.slug || game.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    style={{
                      ...styles.buyButton,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    VIEW CHAOS
                  </a>
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

      {/* Featured Merch Section */}
      {merch.length > 0 && (
        <section style={{ ...styles.gamesSection, background: 'rgba(31, 41, 55, 0.8)' }}>
          <div>
            <h2 style={styles.sectionTitle}>FUGLY'S SWAG SHOP</h2>
            <p style={styles.sectionSubtitle}>Wear your chaos with pride</p>
            
            <div style={styles.gameGrid}>
              {merch.map((item, index) => (
                <div 
                  key={item.id} 
                  style={{
                    ...styles.gameCard,
                    transform: `rotate(${index % 2 === 0 ? '2' : '-2'}deg)`,
                    border: '4px solid #8b5cf6'
                  }}
                >
                  <div style={{ ...styles.gameImage, background: '#4c1d95' }}>
                    {item.imageUrl && item.imageUrl.trim() !== '' ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        👕
                      </div>
                    )}
                  </div>
                  <h3 style={{ ...styles.gameTitle, color: '#c4b5fd' }}>{item.name}</h3>
                  <p style={{ ...styles.gameTagline, color: '#ddd6fe' }}>{item.description || 'Maximum chaos, minimum effort'}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
                    <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                      {item.category.toUpperCase()}
                    </span>
                    {item.totalStock === 0 && (
                      <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        SOLD OUT
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...styles.gamePrice, color: '#a78bfa' }}>${(item.priceCents / 100).toFixed(2)}</span>
                    <a 
                      href={`/merch/${item.slug}`}
                      style={{
                        ...styles.buyButton,
                        background: '#8b5cf6',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      GET SWAG
                    </a>
                  </div>
                  
                  <span style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    left: '-0.75rem',
                    background: '#a855f7',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    transform: 'rotate(-12deg)'
                  }}>
                    HOT!
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Footer placeholder */}
      <footer style={{ background: '#000', color: 'white', padding: '3rem 0', textAlign: 'center' as const }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <FooterLogo size={200} style={{ margin: '0 auto 1.5rem auto' }} />
          <p style={{ color: '#9ca3af', fontWeight: 600 }}>Professionally ruining game nights since day one</p>
          <p style={{ color: '#6b7280', marginTop: '2rem', fontWeight: 600 }}>© {new Date().getFullYear()} Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.</p>
        </div>
      </footer>
      
      {/* Deployment info for logged-in users */}
      <DeploymentInfo isVisible={!!user} />

      {/* Chaos Mode! */}
      <FuglyChaosMode />

      <style jsx>{`
        @keyframes chaosShake {
          0%, 100% { transform: rotate(${cardRotation}deg) translateX(0); }
          10% { transform: rotate(${cardRotation + 3}deg) translateX(-2px); }
          20% { transform: rotate(${cardRotation - 3}deg) translateX(2px); }
          30% { transform: rotate(${cardRotation + 2}deg) translateX(-4px); }
          40% { transform: rotate(${cardRotation - 2}deg) translateX(4px); }
          50% { transform: rotate(${cardRotation + 4}deg) translateX(-2px); }
          60% { transform: rotate(${cardRotation - 4}deg) translateX(2px); }
          70% { transform: rotate(${cardRotation + 1}deg) translateX(-1px); }
          80% { transform: rotate(${cardRotation - 1}deg) translateX(1px); }
          90% { transform: rotate(${cardRotation + 2}deg) translateX(0); }
        }

        @keyframes tagWobble {
          0%, 100% { transform: rotate(12deg) scale(1); }
          25% { transform: rotate(-20deg) scale(1.1); }
          50% { transform: rotate(25deg) scale(0.9); }
          75% { transform: rotate(-15deg) scale(1.05); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}