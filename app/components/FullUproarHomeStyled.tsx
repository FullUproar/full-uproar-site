'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, ArrowRight, Zap, Skull, Pause, Dices, ChevronDown, Heart, ShieldCheck, Truck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cartStore';
import { useChaos } from '@/lib/chaos-context';
import { colors, colorsRgba } from '@/lib/colors';
import DeploymentInfo from './DeploymentInfo';
import FuglyChaosMode from './FuglyChaosMode';
import FuglyLogo from './FuglyLogo';
import FuglyPointing from './FuglyPointing';
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
  const { chaosEnabled } = useChaos();
  const [email, setEmail] = useState('');
  const [activeGame, setActiveGame] = useState(0);
  const [currentComic, setCurrentComic] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardRotation, setCardRotation] = useState(chaosEnabled ? 1 : 0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [chaosPhrase, setChaosPhrase] = useState('FRESHLY UNHINGED');
  const [phraseTransform, setPhraseTransform] = useState({ scale: 1, rotation: 0 });
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  // Scroll tracking for hero shrink effect
  useEffect(() => {
    setViewportHeight(window.innerHeight);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate hero fade based on scroll - content fades as below-content scrolls up
  const heroFadeStart = 100; // Start fading after 100px scroll
  const heroFadeEnd = viewportHeight * 0.5; // Fully faded by half viewport scroll
  const heroOpacity = scrollY < heroFadeStart
    ? 1
    : Math.max(1 - (scrollY - heroFadeStart) / (heroFadeEnd - heroFadeStart), 0);

  // Scale content slightly as it fades for dramatic effect
  const heroContentScale = 1 - Math.min(scrollY / heroFadeEnd, 1) * 0.1; // Shrink to 90%

  // Below-hero content scrolls up faster - as if the shrinking hero is pulling it up
  // This creates the effect of content "catching up" to fill the shrinking hero space
  const scrollProgress = Math.min(scrollY / heroFadeEnd, 1);
  const belowHeroLift = scrollProgress * (viewportHeight * 0.4); // Extra lift = 40% of viewport as hero fades

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

  // Testimonials for featured games
  const gameTestimonials: Record<string, string[]> = {
    'Fugly': [
      '"This game ruined my marriage in the best way possible!" - Sarah, 5 stars',
      '"I haven\'t spoken to my brother since we played. 10/10 would destroy family again." - Mike',
      '"The chaos is so beautiful, I cried orange tears." - Anonymous Cultist',
      '"My therapist says I shouldn\'t play this anymore. I bought three more copies." - Jennifer'
    ],
    'Fugly Jr.': [
      '"My kids love it! They\'ve formed rival gangs. Send help." - Concerned Parent',
      '"Perfect for teaching children that life is unfair and chaotic!" - Elementary Teacher',
      '"My 8-year-old is now a master strategist and sociopath. Thanks Fugly!" - Dave',
      '"The daycare banned it. That\'s how you know it\'s good." - Proud Mom'
    ],
    'Fugly: After Dark': [
      '"We\'re not friends anymore but the memories are worth it." - Former Friend Group',
      '"Spicier than my relationship drama. And that\'s saying something." - Reality TV Star',
      '"The police were called. Not related, but worth mentioning." - Brad',
      '"This game should come with a lawyer\'s contact info." - Legal Expert'
    ],
    'default': [
      '"I don\'t know what I played but I need more of it." - Confused but Happy',
      '"My life has meaning now. That meaning is chaos." - Philosophy Major',
      '"Better than therapy and twice as destructive!" - Reformed Gamer',
      '"I showed this to my therapist and now they need therapy." - Patient Zero'
    ]
  };

  // Value propositions for featured games
  const gameValueProps: Record<string, string[]> = {
    'Fugly': [
      '🔥 Destroys 2-6 friendships simultaneously',
      '💀 Guaranteed table flips or your money back',
      '🎭 Features 200+ ways to betray your loved ones',
      '⚡ Average game ends 3 relationships'
    ],
    'Fugly Jr.': [
      '👶 Corrupts young minds efficiently',
      '🍼 Age-appropriate chaos for 6+',
      '🎓 Teaches valuable life lessons about betrayal',
      '🏆 Award-winning* childhood ruiner (*self-awarded)'
    ],
    'Fugly: After Dark': [
      '🌙 NSFW chaos for consenting adults',
      '🔞 Contains 69% more inappropriate content',
      '🍷 Best played with poor judgment',
      '💔 Relationship status: It\'s complicated'
    ],
    'default': [
      '🎲 Pure, unfiltered board game chaos',
      '😈 Designed by actual demons (probably)',
      '🏃 Fast-paced fun (running from consequences)',
      '💯 100% chance of regrettable decisions'
    ]
  };

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

  // Remove debug logs that were causing console spam
  // These were firing on every render (every second due to countdown timer)

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
              // Random rotation only in full chaos mode
              if (chaosEnabled) {
                const rotations = [-5, -3, -2, 2, 3, 5];
                setCardRotation(rotations[Math.floor(Math.random() * rotations.length)]);
              } else {
                setCardRotation(0); // Keep straight for mild and off modes
              }
              // Also rotate testimonial
              setCurrentTestimonialIndex((prev) => (prev + 1) % 4);
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
      background: !chaosEnabled
        ? 'linear-gradient(to bottom, #1f2937, #374151)'
        : `linear-gradient(to bottom right, #111827, #1f2937, ${colors.chaosOrange})`
    },
    nav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.9)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #FF7500'
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
      background: '#FF7500',
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
      color: '#FF7500'
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
      overflow: 'hidden',
      minHeight: '100vh', // Full viewport
      paddingTop: '4rem', // Space for fixed nav
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      // No transform on the section itself - it stays full size
    },
    heroContent: {
      // This is what fades/scales as you scroll
      opacity: heroOpacity,
      transform: `scale(${heroContentScale})`,
      transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
      pointerEvents: heroOpacity < 0.3 ? 'none' as const : 'auto' as const,
    },
    heroContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
      padding: isMobile ? '2rem 1rem' : '3rem 1rem',
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollIndicator: {
      position: 'absolute' as const,
      bottom: isMobile ? '2rem' : '3rem',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '0.75rem',
      color: colors.chaosOrange,
      opacity: scrollY > 80 ? 0 : 1,
      transition: 'opacity 0.3s ease',
      cursor: 'pointer',
      textShadow: '0 0 20px rgba(255, 117, 0, 0.5)',
    },
    textCenter: {
      textAlign: 'center' as const
    },
    badge: {
      display: 'inline-block',
      background: !chaosEnabled ? '#10b981' : '#FF7500',
      color: !chaosEnabled ? '#fff' : '#111827',
      padding: '0.25rem 0.75rem',
      borderRadius: '50px',
      marginBottom: '0.75rem',
      transform: !chaosEnabled ? 'rotate(0deg)' : 'rotate(-3deg)',
      fontWeight: 900,
      fontSize: '1.17rem',
      transition: 'all 0.3s'
    },
    heroTitle: {
      fontSize: '4rem',
      fontWeight: 900,
      marginBottom: '1.5rem',
      lineHeight: 1.1
    },
    orangeText: {
      color: colors.chaosOrange  // Pantone 2018C - #FF7500
    },
    lightOrangeText: {
      color: colors.goldenChaos  // Pantone 2006C - #EBBC4E
    },
    coralText: {
      color: colors.chaosCoral   // Pantone 7417C - #E04F39
    },
    gradientText: {
      background: `linear-gradient(to right, ${colors.chaosCoral}, ${colors.chaosOrange})`,
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
      border: '4px solid #FF7500'
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
      background: '#FF7500',
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
      border: '4px solid #FF7500',
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
      color: '#FF7500',
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
      transition: 'box-shadow 0.3s, border-color 0.3s',
      border: '4px solid #fb923c',
      willChange: 'box-shadow, border-color'
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
      color: '#FF7500',
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
      color: '#FF7500'
    },
    buyButton: {
      background: '#FF7500',
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

      {/* Hero Section - Full viewport welcome mat */}
      <section style={styles.heroSection}>
        {/* Hero content wrapper - this fades/scales on scroll */}
        <div style={styles.heroContent}>
          <div style={styles.heroContainer}>
            <div style={styles.textCenter}>
              <div style={{
                ...styles.badge,
                transform: `rotate(${phraseTransform.rotation}deg) scale(${phraseTransform.scale})`,
                transition: 'none',
                fontSize: isMobile ? '1.1rem' : '1.5rem',
                padding: '0.5rem 1.25rem',
              }}>{chaosPhrase}</div>

              <h1 style={{
                ...styles.heroTitle,
                fontSize: isMobile ? '2.25rem' : '4rem',
                marginBottom: '1.5rem',
                lineHeight: 1.15,
              }}>
                <div style={styles.orangeText}>Chaotic party games</div>
                <div style={styles.lightOrangeText}>that hack your game night.</div>
              </h1>

              <p style={{
                ...styles.heroSubtitle,
                fontSize: isMobile ? '1.05rem' : '1.35rem',
                padding: isMobile ? '0 0.5rem' : '0',
                maxWidth: '42rem',
                lineHeight: 1.6,
              }}>
                We make hilarious standalone games and game-mod decks that plug into the games you already own.
              </p>

              {/* CTA Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                gap: isMobile ? '1rem' : '1.25rem',
              }}>
                {/* Primary CTA */}
                <a
                  href="/shop"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: '#FF7500',
                    color: '#111827',
                    padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
                    borderRadius: '50px',
                    fontWeight: 900,
                    fontSize: isMobile ? '1rem' : '1.25rem',
                    textDecoration: 'none',
                    boxShadow: '0 10px 40px rgba(255, 117, 0, 0.5)',
                    transition: 'all 0.3s',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.03em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(255, 117, 0, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 117, 0, 0.5)';
                  }}
                >
                  Browse Game-Mod Decks <ArrowRight size={isMobile ? 20 : 24} />
                </a>

                {/* Secondary CTA - Ghost Button */}
                <button
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    color: '#fde68a',
                    padding: isMobile ? '0.875rem 1.75rem' : '1.125rem 2rem',
                    borderRadius: '50px',
                    fontWeight: 700,
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    border: '2px solid #fde68a',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(253, 230, 138, 0.1)';
                    e.currentTarget.style.borderColor = '#FF7500';
                    e.currentTarget.style.color = '#FF7500';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#fde68a';
                    e.currentTarget.style.color = '#fde68a';
                  }}
                >
                  How It Works
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Bigger and Bolder */}
        <div
          style={styles.scrollIndicator}
          onClick={() => window.scrollTo({ top: viewportHeight * 0.7, behavior: 'smooth' })}
        >
          <span style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: 900,
            letterSpacing: '0.15em',
          }}>
            SCROLL FOR CHAOS
          </span>
          <ChevronDown
            size={isMobile ? 40 : 52}
            strokeWidth={2.5}
            style={{
              animation: 'bounce 1.5s infinite',
              filter: 'drop-shadow(0 0 8px rgba(255, 117, 0, 0.5))',
            }}
          />
        </div>
      </section>

      {/* All Below-Hero Content - scrolls up faster as hero shrinks */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        transform: `translateY(-${belowHeroLift}px)`, // Accelerated scroll - pulled up by shrinking hero
        transition: 'transform 0.05s ease-out',
      }}>
        {/* Legitimacy Strip - Subtle trust anchors */}
        <div style={{
          background: '#0a0a0a',
          borderTop: '1px solid #1f2937',
          borderBottom: '1px solid #1f2937',
          padding: isMobile ? '1rem 0.5rem' : '1.25rem 1rem',
        }}>
          <div style={{
            maxWidth: '64rem',
            margin: '0 auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '0.875rem' : '3rem',
          }}>
            {/* Item 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: 500,
            }}>
              <Heart size={isMobile ? 14 : 16} style={{ opacity: 0.7 }} />
              <span>Built by lifelong game-night nerds</span>
            </div>

            {/* Separator - desktop only */}
            {!isMobile && (
              <div style={{ width: '1px', height: '1rem', background: '#374151' }} />
            )}

            {/* Item 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: 500,
            }}>
              <ShieldCheck size={isMobile ? 14 : 16} style={{ opacity: 0.7 }} />
              <span>Secure checkout + hassle-free returns</span>
            </div>

            {/* Separator - desktop only */}
            {!isMobile && (
              <div style={{ width: '1px', height: '1rem', background: '#374151' }} />
            )}

            {/* Item 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: 500,
            }}>
              <Truck size={isMobile ? 14 : 16} style={{ opacity: 0.7 }} />
              <span>Fast shipping from the Midwest</span>
            </div>
          </div>
        </div>

        {/* Featured Section */}
        <section style={{
          background: '#111827', // Solid background
          paddingTop: '3rem',
          paddingBottom: '3rem',
        }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          {/* Email Capture */}
          <div style={{ position: 'relative', marginBottom: '2rem', textAlign: 'center' }}>
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
              {!isMobile && chaosEnabled && (
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
                  transform: isMobile || !chaosEnabled ? 'rotate(0deg)' : `rotate(${cardRotation}deg)`,
                  animation: !chaosEnabled ? 'none' : isTransitioning ? 'chaosShake 0.3s ease-in-out' : 'none'
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
                    <p style={{ color: '#fde68a', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 'bold' }}>
                      {featuredGame.description || 'The board game that destroys everything you hold dear.'}
                    </p>
                    
                    {/* Value Propositions */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      {(gameValueProps[featuredGame.title] || gameValueProps['default']).map((prop, idx) => (
                        <div key={idx} style={{ 
                          color: '#fdba74', 
                          fontSize: '0.95rem',
                          marginBottom: '0.5rem',
                          fontWeight: 'bold'
                        }}>
                          {prop}
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <Users style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{featuredGame.players}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Calendar style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{featuredGame.timeToPlay}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Skull style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{featuredGame.ageRating}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Dices style={{ height: '1.5rem', width: '1.5rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                        <span style={{ fontWeight: 'bold', color: '#fde68a' }}>{(featuredGame as any).category?.toUpperCase() || 'GAME'}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={styles.gamePrice}>${(featuredGame.priceCents / 100).toFixed(2)}</span>
                      <a 
                        href={`/games/${featuredGame.slug || featuredGame.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        style={{
                          background: '#FF7500',
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
                      color: '#FF7500',
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
                
                {/* Rotating Testimonial */}
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'rgba(249, 115, 22, 0.1)',
                  borderLeft: '4px solid #FF7500',
                  borderRadius: '0.5rem'
                }}>
                  <p style={{
                    color: '#fde68a',
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    margin: 0,
                    fontWeight: 'bold'
                  }}>
                    {(gameTestimonials[featuredGame.title] || gameTestimonials['default'])[currentTestimonialIndex % 4]}
                  </p>
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
                          background: index === activeGame ? '#FF7500' : '#6b7280',
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
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{
        background: 'linear-gradient(to bottom, #1f2937, #111827)',
        padding: isMobile ? '3rem 1rem' : '4rem 1rem',
      }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 900,
            color: '#FF7500',
            textAlign: 'center',
            marginBottom: '0.75rem'
          }}>
            HOW GAME-MOD DECKS WORK
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#fdba74',
            textAlign: 'center',
            marginBottom: '2.5rem',
            fontWeight: 600
          }}>
            Three steps to hack any game night
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '1.5rem' : '2rem',
          }}>
            {/* Step 1 */}
            <div style={{
              background: 'rgba(255, 117, 0, 0.1)',
              border: '3px solid #FF7500',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#FF7500',
                color: '#111827',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.25rem'
              }}>1</div>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', marginTop: '0.5rem' }}>🎲</div>
              <h3 style={{ color: '#fde68a', fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Pick Any Game
              </h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Grab a game you already own—board game, card game, party game, whatever.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '3px solid #fbbf24',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fbbf24',
                color: '#111827',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.25rem'
              }}>2</div>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', marginTop: '0.5rem' }}>🃏</div>
              <h3 style={{ color: '#fde68a', fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Add a Mod Deck
              </h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Draw mod cards that introduce wild new rules, challenges, and chaos triggers.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '3px solid #ef4444',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ef4444',
                color: '#fff',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.25rem'
              }}>3</div>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', marginTop: '0.5rem' }}>🔥</div>
              <h3 style={{ color: '#fde68a', fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Unleash Chaos
              </h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Watch as your "normal" game night transforms into legendary chaos.
              </p>
            </div>
          </div>

          {/* CTA after explainer */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <a
              href="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FF7500',
                color: '#111827',
                padding: '0.875rem 2rem',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'all 0.3s',
              }}
            >
              See All Game-Mod Decks <ArrowRight size={18} />
            </a>
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
              <div style={{ padding: '2rem', textAlign: 'center', color: '#FF7500', fontSize: '1.5rem' }}>
                No featured games found!
              </div>
            )}
            {games.map((game, index) => (
              <div 
                key={game.id} 
                className="game-card-wrapper"
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
                    background: 'linear-gradient(to right, #FF7500, #ef4444)',
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
      </div>{/* End of accelerated scroll wrapper */}

      {/* Deployment info for logged-in users */}
      <DeploymentInfo isVisible={!!user} />

      {/* Chaos Mode! - Only in full chaos */}
      {chaosEnabled && <FuglyChaosMode />}

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

        @keyframes mildShake {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          10% { transform: rotate(2deg) translateX(-1px); }
          20% { transform: rotate(-2deg) translateX(1px); }
          30% { transform: rotate(1deg) translateX(-2px); }
          40% { transform: rotate(-1deg) translateX(2px); }
          50% { transform: rotate(2deg) translateX(-1px); }
          60% { transform: rotate(-2deg) translateX(1px); }
          70% { transform: rotate(1deg) translateX(-1px); }
          80% { transform: rotate(-1deg) translateX(1px); }
          90% { transform: rotate(0deg) translateX(0); }
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