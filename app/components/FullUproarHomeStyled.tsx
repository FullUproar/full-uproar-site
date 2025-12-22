'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Users, ArrowRight, Zap, Skull, Pause, ChevronDown, Heart, ShieldCheck, Truck, Sparkles, Trophy, Gamepad2, Shuffle, Clock } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import DeploymentInfo from './DeploymentInfo';
import FuglyChaosMode from './FuglyChaosMode';
import FuglyLogo from './FuglyLogo';
import Navigation from './Navigation';
import Link from 'next/link';

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

type WeaponCategory = 'games' | 'mods' | 'gamenight' | null;

export default function FullUproarHomeStyled({ games }: FullUproarHomeProps) {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [activeGame, setActiveGame] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardRotation, setCardRotation] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Draggable headline state
  const [headlineTilts, setHeadlineTilts] = useState({ top: 0, bottom: 0 });
  const [isDraggingHeadline, setIsDraggingHeadline] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [userTopTilt, setUserTopTilt] = useState<number | null>(null);
  const topHeadlineRef = useRef<HTMLHeadingElement>(null);

  // Choose Your Weapon section state
  const [expandedWeapon, setExpandedWeapon] = useState<WeaponCategory>(null);

  // Mod products for the Mods panel
  const modProducts = [
    {
      id: 1,
      title: "Hack Your Deck",
      tagline: "Turn ANY game into chaos!",
      description: "Inject pure chaos into your next game night! Works with ANY existing game.",
      price: "$24.99",
      icon: Zap,
      color: '#FF7500',
      status: 'preorder'
    },
    {
      id: 2,
      title: "Crime and Funishments",
      tagline: "Justice never felt so stupid",
      description: "Hilarious punishment deck that bolts onto any party game.",
      price: "$19.99",
      icon: Skull,
      color: '#ef4444',
      status: 'preorder'
    },
    {
      id: 3,
      title: "Dumbest Ways to Win",
      tagline: "End ties with maximum stupidity",
      description: "Resolve stalemates with absurd prompts and challenges.",
      price: "$14.99",
      icon: Trophy,
      color: '#fbbf24',
      status: 'preorder'
    },
    {
      id: 4,
      title: "Chaos Engine Bundle",
      tagline: "All three decks - SAVE $10!",
      description: "Get all three game-breaking decks in one chaotic bundle!",
      price: "$49.99",
      icon: Sparkles,
      color: '#a855f7',
      status: 'preorder'
    }
  ];

  // Game Night tools
  const gameNightTools = [
    {
      title: "Host a Game Night",
      description: "Organize epic game nights with built-in RSVPs, reminders, and chaos coordination.",
      icon: Calendar,
      href: "/game-nights",
      cta: "Start Planning"
    },
    {
      title: "Find Local Players",
      description: "Connect with fellow chaos enthusiasts in your area.",
      icon: Users,
      href: "/game-nights",
      cta: "Find Your Crew"
    },
    {
      title: "Game Night Timer",
      description: "Keep turns moving with our built-in chaos timer. No more analysis paralysis!",
      icon: Clock,
      href: "/game-nights",
      cta: "Try It Free"
    }
  ];

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Random headline tilts on page load for chaos
  useEffect(() => {
    const randomTilt = () => (Math.random() * 6) - 3; // -3 to +3 degrees
    setHeadlineTilts({
      top: randomTilt(),
      bottom: -randomTilt(), // Opposite direction
    });
  }, []);

  // Draggable headline easter egg - rotate by dragging!
  const handleHeadlineMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingHeadline(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  }, []);

  const handleHeadlineMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingHeadline) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartX;

    // Convert horizontal drag to rotation (100px = ~15 degrees)
    const rotationDelta = deltaX / 7;
    const baseRotation = userTopTilt !== null ? userTopTilt : headlineTilts.top;
    const newRotation = Math.max(-45, Math.min(45, baseRotation + rotationDelta));

    setUserTopTilt(newRotation);
    setDragStartX(clientX);
  }, [isDraggingHeadline, dragStartX, userTopTilt, headlineTilts.top]);

  const handleHeadlineMouseUp = useCallback(() => {
    setIsDraggingHeadline(false);
  }, []);

  // Global mouse/touch listeners for drag
  useEffect(() => {
    if (isDraggingHeadline) {
      window.addEventListener('mousemove', handleHeadlineMouseMove);
      window.addEventListener('mouseup', handleHeadlineMouseUp);
      window.addEventListener('touchmove', handleHeadlineMouseMove);
      window.addEventListener('touchend', handleHeadlineMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleHeadlineMouseMove);
      window.removeEventListener('mouseup', handleHeadlineMouseUp);
      window.removeEventListener('touchmove', handleHeadlineMouseMove);
      window.removeEventListener('touchend', handleHeadlineMouseUp);
    };
  }, [isDraggingHeadline, handleHeadlineMouseMove, handleHeadlineMouseUp]);

  // Calculate the actual rotation to use (user-set or random)
  const actualTopTilt = userTopTilt !== null ? userTopTilt : headlineTilts.top;
  // Bottom tilt mirrors the top for that chaotic balance
  const actualBottomTilt = userTopTilt !== null ? -userTopTilt : headlineTilts.bottom;

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
      'Destroys 2-6 friendships simultaneously',
      'Guaranteed table flips or your money back',
      'Features 200+ ways to betray your loved ones',
      'Average game ends 3 relationships'
    ],
    'Fugly Jr.': [
      'Corrupts young minds efficiently',
      'Age-appropriate chaos for 6+',
      'Teaches valuable life lessons about betrayal',
      'Award-winning* childhood ruiner (*self-awarded)'
    ],
    'Fugly: After Dark': [
      'NSFW chaos for consenting adults',
      'Contains 69% more inappropriate content',
      'Best played with poor judgment',
      'Relationship status: It\'s complicated'
    ],
    'default': [
      'Pure, unfiltered board game chaos',
      'Designed by actual demons (probably)',
      'Fast-paced fun (running from consequences)',
      '100% chance of regrettable decisions'
    ]
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
          alert(`You're in! Get ready for chaos in your inbox.`);
          setEmail('');
        }
      } catch (error) {
        console.error('Newsletter signup failed:', error);
      }
    }
  };

  // Auto-rotate featured games with chaotic transitions
  useEffect(() => {
    if (games.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsTransitioning(true);

            setTimeout(() => {
              setActiveGame((current) => (current + 1) % games.length);
              const rotations = [-5, -3, -2, 2, 3, 5];
              setCardRotation(rotations[Math.floor(Math.random() * rotations.length)]);
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
      background: '#0a0a0a'
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

  const scrollToWeapons = () => {
    const element = document.getElementById('choose-your-weapon');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleWeapon = (weapon: WeaponCategory) => {
    setExpandedWeapon(expandedWeapon === weapon ? null : weapon);
  };

  return (
    <div style={styles.container}>
      <Navigation />

      {/* HERO SECTION - Life hits hard. Game night hits back. */}
      <section style={{
        height: isMobile ? '100dvh' : '100vh',
        maxHeight: isMobile ? '100dvh' : '100vh',
        minHeight: isMobile ? '600px' : '700px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 70%)',
      }}>
        {/* Background glow effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(circle at center, rgba(255, 117, 0, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: isMobile ? '0 0.75rem' : '0 1rem',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          textAlign: 'center',
          zIndex: 1,
        }}>
          {/* First headline - DRAGGABLE EASTER EGG! */}
          <h1
            ref={topHeadlineRef}
            onMouseDown={handleHeadlineMouseDown}
            onTouchStart={handleHeadlineMouseDown}
            style={{
              fontSize: isMobile ? 'clamp(2rem, 10vw, 3rem)' : 'clamp(4rem, 6vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 0,
              color: '#fde68a',
              textTransform: 'uppercase',
              transform: `rotate(${actualTopTilt}deg)`,
              transition: isDraggingHeadline ? 'none' : 'transform 0.3s',
              cursor: isDraggingHeadline ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          >
            Life hits hard
          </h1>

          {/* Fugly integrated between text */}
          <div style={{
            position: 'relative',
            marginTop: isMobile ? '1rem' : '1.5rem',
            marginBottom: isMobile ? '0.5rem' : '1rem',
            height: isMobile ? '25vh' : '35vh',
            maxHeight: isMobile ? '180px' : '320px',
            minHeight: isMobile ? '120px' : '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="/FuglyLaying.png"
              alt="Fugly - the chaos mascot"
              style={{
                height: '100%',
                maxHeight: isMobile ? '200px' : '380px',
                width: 'auto',
                transform: 'rotate(-2deg)',
                filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.5))',
              }}
            />
          </div>

          {/* Second headline - mirrors the top rotation */}
          <h1 style={{
            fontSize: isMobile ? 'clamp(2rem, 10vw, 3rem)' : 'clamp(4rem, 6vw, 5.5rem)',
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: isMobile ? '1rem' : '1.5rem',
            color: '#FF7500',
            textTransform: 'uppercase',
            textShadow: '0 0 60px rgba(255, 117, 0, 0.5)',
            transform: `rotate(${actualBottomTilt}deg)`,
            transition: isDraggingHeadline ? 'none' : 'transform 0.3s',
          }}>
            Game night hits back
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: '#9ca3af',
            lineHeight: 1.5,
            maxWidth: '500px',
            margin: '0 auto',
            marginTop: isMobile ? '1rem' : '1.5rem',
          }}>
            Arm yourself with chaos to transform boring game nights into legendary stories.
          </p>
        </div>

        {/* Scroll CTA - Weaponize My Game Night */}
        <div
          onClick={scrollToWeapons}
          style={{
            position: 'absolute',
            bottom: isMobile ? '2rem' : '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            opacity: scrollY > 100 ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        >
          <span style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: 900,
            color: '#FF7500',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textShadow: '0 0 30px rgba(255, 117, 0, 0.5)',
          }}>
            Weaponize My Game Night
          </span>
          <ChevronDown
            size={isMobile ? 32 : 44}
            color="#FF7500"
            strokeWidth={2.5}
            style={{
              animation: 'bounce 1.5s infinite',
              filter: 'drop-shadow(0 0 10px rgba(255, 117, 0, 0.5))',
            }}
          />
        </div>
      </section>

      {/* CHOOSE YOUR WEAPON SECTION */}
      <section id="choose-your-weapon" style={{
        padding: isMobile ? '4rem 1rem' : '6rem 2rem',
        background: 'linear-gradient(to bottom, #0a0a0a, #111827)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: 900,
            color: '#FF7500',
            textAlign: 'center',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Choose Your Weapon
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: '#9ca3af',
            textAlign: 'center',
            marginBottom: '3rem',
          }}>
            Three ways to level up your game night
          </p>

          {/* Weapon Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {/* GAMES Card */}
            <div style={{
              background: expandedWeapon === 'games' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(31, 41, 55, 0.5)',
              border: `3px solid ${expandedWeapon === 'games' ? '#10b981' : '#374151'}`,
              borderRadius: '1rem',
              overflow: 'hidden',
              transition: 'all 0.3s',
            }}>
              <button
                onClick={() => toggleWeapon('games')}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.25rem' : '1.5rem 2rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: isMobile ? '48px' : '60px',
                    height: isMobile ? '48px' : '60px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Gamepad2 size={isMobile ? 24 : 32} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: 900,
                      color: '#10b981',
                      marginBottom: '0.25rem',
                    }}>
                      Games
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: '#9ca3af',
                      margin: 0,
                    }}>
                      Standalone chaos experiences
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={24}
                  color="#9ca3af"
                  style={{
                    transform: expandedWeapon === 'games' ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s',
                  }}
                />
              </button>

              {/* Expanded Content - Games Coming Soon */}
              {expandedWeapon === 'games' && (
                <div style={{
                  padding: isMobile ? '1rem' : '1.5rem 2rem 2rem',
                  borderTop: '1px solid #374151',
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px dashed #10b981',
                    borderRadius: '1rem',
                    padding: isMobile ? '2rem 1.5rem' : '3rem',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: isMobile ? '3rem' : '4rem',
                      marginBottom: '1rem',
                    }}>
                      🎲
                    </div>
                    <h4 style={{
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 900,
                      color: '#10b981',
                      marginBottom: '0.75rem',
                    }}>
                      Coming Soon
                    </h4>
                    <p style={{
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      color: '#9ca3af',
                      maxWidth: '400px',
                      margin: '0 auto 1.5rem',
                      lineHeight: 1.6,
                    }}>
                      We're cooking up some standalone games that will redefine chaos. Sign up below to be the first to know.
                    </p>
                    <span style={{
                      display: 'inline-block',
                      background: '#10b981',
                      color: '#0a0a0a',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '50px',
                      fontWeight: 900,
                      fontSize: '0.875rem',
                    }}>
                      SPRING 2026
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* MODS Card */}
            <div style={{
              background: expandedWeapon === 'mods' ? 'rgba(255, 117, 0, 0.1)' : 'rgba(31, 41, 55, 0.5)',
              border: `3px solid ${expandedWeapon === 'mods' ? '#FF7500' : '#374151'}`,
              borderRadius: '1rem',
              overflow: 'hidden',
              transition: 'all 0.3s',
            }}>
              <button
                onClick={() => toggleWeapon('mods')}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.25rem' : '1.5rem 2rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: isMobile ? '48px' : '60px',
                    height: isMobile ? '48px' : '60px',
                    background: 'linear-gradient(135deg, #FF7500, #ea580c)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Shuffle size={isMobile ? 24 : 32} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: 900,
                      color: '#FF7500',
                      marginBottom: '0.25rem',
                    }}>
                      Mods
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: '#9ca3af',
                      margin: 0,
                    }}>
                      Hack games you already own
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    background: '#FF7500',
                    color: '#0a0a0a',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                  }}>
                    PRE-ORDER NOW
                  </span>
                  <ChevronDown
                    size={24}
                    color="#9ca3af"
                    style={{
                      transform: expandedWeapon === 'mods' ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </div>
              </button>

              {/* Expanded Content - Mod Products */}
              {expandedWeapon === 'mods' && (
                <div style={{
                  padding: isMobile ? '1rem' : '1.5rem 2rem 2rem',
                  borderTop: '1px solid #374151',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '1rem',
                  }}>
                    {modProducts.map((product) => {
                      const Icon = product.icon;
                      return (
                        <Link
                          key={product.id}
                          href="/shop"
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: `2px solid ${product.color}40`,
                            borderRadius: '0.75rem',
                            padding: '1.25rem',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            display: 'block',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = product.color;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = `${product.color}40`;
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: `${product.color}20`,
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Icon size={20} color={product.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 900,
                                color: product.color,
                                marginBottom: '0.25rem',
                              }}>
                                {product.title}
                              </h4>
                              <p style={{
                                fontSize: '0.8rem',
                                color: '#fbbf24',
                                marginBottom: '0.5rem',
                                fontStyle: 'italic',
                              }}>
                                "{product.tagline}"
                              </p>
                              <p style={{
                                fontSize: '0.8rem',
                                color: '#9ca3af',
                                marginBottom: '0.75rem',
                                lineHeight: 1.4,
                              }}>
                                {product.description}
                              </p>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}>
                                <span style={{
                                  fontSize: '1.125rem',
                                  fontWeight: 900,
                                  color: '#fff',
                                }}>
                                  {product.price}
                                </span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  color: '#FF7500',
                                  fontWeight: 700,
                                }}>
                                  SPRING 2026
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link
                      href="/shop"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#FF7500',
                        color: '#0a0a0a',
                        padding: '0.875rem 2rem',
                        borderRadius: '50px',
                        fontWeight: 900,
                        textDecoration: 'none',
                        fontSize: '1rem',
                      }}
                    >
                      Browse All Mods <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* GAME NIGHT Card */}
            <div style={{
              background: expandedWeapon === 'gamenight' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(31, 41, 55, 0.5)',
              border: `3px solid ${expandedWeapon === 'gamenight' ? '#a855f7' : '#374151'}`,
              borderRadius: '1rem',
              overflow: 'hidden',
              transition: 'all 0.3s',
            }}>
              <button
                onClick={() => toggleWeapon('gamenight')}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.25rem' : '1.5rem 2rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: isMobile ? '48px' : '60px',
                    height: isMobile ? '48px' : '60px',
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Calendar size={isMobile ? 24 : 32} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: 900,
                      color: '#a855f7',
                      marginBottom: '0.25rem',
                    }}>
                      Game Night
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: '#9ca3af',
                      margin: 0,
                    }}>
                      Tools to plan legendary nights
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    background: '#a855f7',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                  }}>
                    FREE
                  </span>
                  <ChevronDown
                    size={24}
                    color="#9ca3af"
                    style={{
                      transform: expandedWeapon === 'gamenight' ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </div>
              </button>

              {/* Expanded Content - Game Night Tools */}
              {expandedWeapon === 'gamenight' && (
                <div style={{
                  padding: isMobile ? '1rem' : '1.5rem 2rem 2rem',
                  borderTop: '1px solid #374151',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '1rem',
                  }}>
                    {gameNightTools.map((tool, index) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={index}
                          href={tool.href}
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '2px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            textDecoration: 'none',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#a855f7';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                          }}>
                            <Icon size={24} color="#a855f7" />
                          </div>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 900,
                            color: '#a855f7',
                            marginBottom: '0.5rem',
                          }}>
                            {tool.title}
                          </h4>
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#9ca3af',
                            marginBottom: '1rem',
                            lineHeight: 1.5,
                          }}>
                            {tool.description}
                          </p>
                          <span style={{
                            display: 'inline-block',
                            color: '#c4b5fd',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                          }}>
                            {tool.cta} →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / LEGITIMACY STRIP */}
      <section style={{
        background: '#0a0a0a',
        borderTop: '1px solid #1f2937',
        borderBottom: '1px solid #1f2937',
        padding: isMobile ? '1.5rem 1rem' : '2rem',
      }}>
        <div style={{
          maxWidth: '64rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? '1rem' : '3rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: 500,
          }}>
            <Heart size={18} color="#FF7500" />
            <span>Made by game night addicts</span>
          </div>

          {!isMobile && <div style={{ width: '1px', height: '1.5rem', background: '#374151' }} />}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: 500,
          }}>
            <ShieldCheck size={18} color="#10b981" />
            <span>Secure checkout</span>
          </div>

          {!isMobile && <div style={{ width: '1px', height: '1.5rem', background: '#374151' }} />}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: 500,
          }}>
            <Truck size={18} color="#3b82f6" />
            <span>Ships from the Midwest</span>
          </div>
        </div>
      </section>

      {/* FEATURED GAMES - Cycling Cards */}
      {featuredGame && (
        <section style={{
          padding: isMobile ? '4rem 1rem' : '6rem 2rem',
          background: 'linear-gradient(to bottom, #111827, #1f2937)',
        }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            <h2 style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 900,
              color: '#FF7500',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}>
              Featured
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#fdba74',
              textAlign: 'center',
              marginBottom: '2.5rem',
              fontWeight: 600,
            }}>
              Pre-order now, chaos later
            </p>

            <div
              style={{
                background: 'linear-gradient(135deg, #1f2937, #111827)',
                borderRadius: '1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                padding: isMobile ? '1.5rem' : '2.5rem',
                border: '4px solid #FF7500',
                transform: isMobile ? 'rotate(0deg)' : `rotate(${cardRotation}deg)`,
                transition: 'transform 0.3s ease-in-out'
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '1.5rem' : '2.5rem',
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
                    transform: 'rotate(-3deg)',
                    marginBottom: '1rem'
                  }}>
                    PRE-ORDER
                  </span>
                  <h3 style={{
                    fontSize: isMobile ? '2rem' : '2.5rem',
                    fontWeight: 900,
                    marginBottom: '0.75rem',
                    color: '#fdba74'
                  }}>
                    {featuredGame.title}
                  </h3>
                  <p style={{ color: '#fde68a', marginBottom: '1.25rem', fontSize: '1.125rem', fontWeight: 'bold' }}>
                    {featuredGame.description || 'The board game that destroys everything you hold dear.'}
                  </p>

                  {/* Value Props */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {(gameValueProps[featuredGame.title] || gameValueProps['default']).slice(0, 3).map((prop, idx) => (
                      <div key={idx} style={{
                        color: '#fdba74',
                        fontSize: '0.9rem',
                        marginBottom: '0.4rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#FF7500' }}>✓</span> {prop}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Users style={{ height: '1.25rem', width: '1.25rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                      <span style={{ fontWeight: 'bold', color: '#fde68a', fontSize: '0.875rem' }}>{featuredGame.players}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Calendar style={{ height: '1.25rem', width: '1.25rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                      <span style={{ fontWeight: 'bold', color: '#fde68a', fontSize: '0.875rem' }}>{featuredGame.timeToPlay}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Skull style={{ height: '1.25rem', width: '1.25rem', margin: '0 auto 0.25rem auto', color: '#FF7500' }} />
                      <span style={{ fontWeight: 'bold', color: '#fde68a', fontSize: '0.875rem' }}>{featuredGame.ageRating}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: '#FF7500' }}>
                      ${(featuredGame.priceCents / 100).toFixed(2)}
                    </span>
                    <Link
                      href={`/games/${featuredGame.slug || featuredGame.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      style={{
                        background: '#FF7500',
                        color: '#111827',
                        padding: '0.875rem 1.75rem',
                        borderRadius: '50px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 10px 30px rgba(255, 117, 0, 0.4)',
                        textDecoration: 'none',
                        fontSize: '0.95rem'
                      }}
                    >
                      THROW MONEY AT FUGLY <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: isMobile ? '200px' : '280px',
                    height: isMobile ? '200px' : '280px',
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
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      'FUGLY'
                    )}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-0.75rem',
                    right: isMobile ? '0' : '-0.75rem',
                    background: '#fbbf24',
                    color: '#111827',
                    padding: '0.75rem 1rem',
                    borderRadius: '50px',
                    transform: `rotate(${isTransitioning ? -12 : 12}deg)`,
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    transition: 'transform 0.3s',
                  }}>
                    Fugly Tested!
                  </div>
                </div>
              </div>

              {/* Rotating Testimonial */}
              <div style={{
                marginTop: '2rem',
                padding: '1.25rem',
                background: 'rgba(255, 117, 0, 0.1)',
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
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
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>NEXT IN {countdown}...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EMAIL SIGN UP */}
      <section style={{
        padding: isMobile ? '4rem 1rem' : '5rem 2rem',
        background: 'linear-gradient(to bottom, #1f2937, #0a0a0a)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: 900,
            color: '#fde68a',
            marginBottom: '0.75rem',
          }}>
            Join the Chaos Crew
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#9ca3af',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}>
            Get early access to new games, exclusive mod previews, and Fugly's personal wisdom delivered to your inbox.
          </p>

          <form onSubmit={handleEmailSubmit} style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: '1rem 1.5rem',
                background: '#1f2937',
                border: '3px solid #374151',
                borderRadius: '50px',
                color: '#fde68a',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '1rem 2rem',
                background: '#FF7500',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
              }}
            >
              Subscribe <Zap size={18} />
            </button>
          </form>

          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
          }}>
            No spam. Just chaos. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0a0a0a',
        borderTop: '1px solid #1f2937',
        padding: isMobile ? '3rem 1rem 2rem' : '4rem 2rem 2rem',
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '2rem' : '3rem',
          marginBottom: '3rem',
        }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <FuglyLogo size={50} />
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#FF7500' }}>FULL UPROAR</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Fugly Approved Games™</div>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
              Making game nights legendary since... well, we're working on it.
            </p>
          </div>

          {/* Shop Column */}
          <div>
            <h4 style={{ fontWeight: 900, color: '#fde68a', marginBottom: '1rem', fontSize: '0.95rem' }}>SHOP</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/shop" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>All Products</Link>
              <Link href="/shop?tab=games&category=MOD" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Game Mods</Link>
              <Link href="/shop?tab=merch" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Merch</Link>
            </div>
          </div>

          {/* Community Column */}
          <div>
            <h4 style={{ fontWeight: 900, color: '#fde68a', marginBottom: '1rem', fontSize: '0.95rem' }}>COMMUNITY</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/game-nights" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Game Nights</Link>
              <Link href="/forum" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Forum</Link>
              <Link href="/fugly" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Meet Fugly</Link>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 style={{ fontWeight: 900, color: '#fde68a', marginBottom: '1rem', fontSize: '0.95rem' }}>COMPANY</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/about" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>About Us</Link>
              <Link href="/track-order" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Track Order</Link>
              <a href="mailto:hello@fulluproar.com" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>Contact</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div style={{
          borderTop: '1px solid #1f2937',
          paddingTop: '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0 }}>
            © {new Date().getFullYear()} Full Uproar Games. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/privacy" style={{ fontSize: '0.8rem', color: '#4b5563', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: '0.8rem', color: '#4b5563', textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </footer>

      {/* Deployment info for logged-in users */}
      <DeploymentInfo isVisible={!!user} />

      {/* Chaos Mode effects */}
      <FuglyChaosMode />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
