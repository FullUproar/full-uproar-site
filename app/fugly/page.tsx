'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import GlobalFooter from '../components/GlobalFooter';
import { Users, Flame, Star, Crown, Skull, Heart, Zap, BookOpen, Newspaper } from 'lucide-react';
import { useUser, SignInButton } from '@clerk/nextjs';

type FuglyTab = 'cult' | 'fuglyverse';

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: string;
}

interface Comic {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  episode: number | null;
  createdAt: string;
}

export default function FuglyPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<FuglyTab>('cult');
  const [isMobile, setIsMobile] = useState(false);

  // Cult state
  const [hoveredPerk, setHoveredPerk] = useState<number | null>(null);
  const [cultLevel, setCultLevel] = useState(1);
  const [ritualActive, setRitualActive] = useState(false);
  const [devotion, setDevotion] = useState(0);
  const [cultLoading, setCultLoading] = useState(true);
  const [lastSavedDevotion, setLastSavedDevotion] = useState(0);

  // Fuglyverse state
  const [news, setNews] = useState<NewsPost[]>([]);
  const [comics, setComics] = useState<Comic[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [chaosLevel, setChaosLevel] = useState(1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Random chaos level changes
    const chaosInterval = setInterval(() => {
      setChaosLevel(Math.floor(Math.random() * 5) + 1);
    }, 3000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(chaosInterval);
    };
  }, []);

  // Load cult data
  useEffect(() => {
    if (!isLoaded || !user) {
      setCultLoading(false);
      return;
    }

    const loadCultData = async () => {
      try {
        const response = await fetch('/api/cult/devotion');
        if (response.ok) {
          const data = await response.json();
          setDevotion(data.devotion);
          setCultLevel(data.level || 1);
          setLastSavedDevotion(data.devotion);

          // Migrate from localStorage
          const localDevotion = localStorage.getItem('cult-devotion');
          const localLevel = localStorage.getItem('cult-level');

          if (localDevotion || localLevel) {
            const migratedDevotion = Math.max(data.devotion, parseInt(localDevotion || '0'));
            const migratedLevel = Math.max(data.level || 1, parseInt(localLevel || '1'));

            if (migratedDevotion !== data.devotion || migratedLevel !== data.level) {
              await saveCultData(migratedDevotion, migratedLevel);
            }

            localStorage.removeItem('cult-devotion');
            localStorage.removeItem('cult-level');
            localStorage.removeItem('cult-last-visit');
          }
        }
      } catch (error) {
        console.error('Error loading cult data:', error);
      } finally {
        setCultLoading(false);
      }
    };

    loadCultData();
  }, [isLoaded, user]);

  // Increase devotion over time
  useEffect(() => {
    if (!user || cultLoading) return;

    const devotionInterval = setInterval(() => {
      setDevotion(prev => Math.min(prev + 1, 100));
    }, 5000);

    return () => clearInterval(devotionInterval);
  }, [user, cultLoading]);

  // Save cult data periodically
  useEffect(() => {
    if (!user || cultLoading) return;

    const saveInterval = setInterval(() => {
      if (devotion !== lastSavedDevotion) {
        saveCultData(devotion, cultLevel);
        setLastSavedDevotion(devotion);
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [user, devotion, cultLevel, lastSavedDevotion, cultLoading]);

  // Load Fuglyverse content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [newsRes, comicsRes] = await Promise.all([
          fetch('/api/news?limit=10'),
          fetch('/api/comics')
        ]);

        if (newsRes.ok) {
          const data = await newsRes.json();
          setNews(Array.isArray(data) ? data : data.news || []);
        }

        if (comicsRes.ok) {
          const data = await comicsRes.json();
          setComics(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setContentLoading(false);
      }
    };

    fetchContent();
  }, []);

  const saveCultData = async (newDevotion: number, newLevel: number) => {
    try {
      await fetch('/api/cult/devotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devotion: newDevotion, level: newLevel })
      });
    } catch (error) {
      console.error('Error saving cult data:', error);
    }
  };

  const performRitual = async () => {
    if (!user) {
      alert('You must be signed in to perform rituals!');
      return;
    }

    setRitualActive(true);

    try {
      const response = await fetch('/api/cult/ritual', { method: 'POST' });

      if (response.ok) {
        const data = await response.json();
        setTimeout(() => {
          setCultLevel(data.newLevel);
          setDevotion(data.devotion);
          setLastSavedDevotion(data.devotion);
          setRitualActive(false);
        }, 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to perform ritual');
        setRitualActive(false);
      }
    } catch (error) {
      console.error('Error performing ritual:', error);
      alert('Failed to perform ritual');
      setRitualActive(false);
    }
  };

  const cultPerks = [
    { icon: '🎭', title: 'EXCLUSIVE CHAOS', description: 'First access to new game modifiers', level: 1 },
    { icon: '🔥', title: "FUGLY'S FAVOR", description: 'Personal insults from Fugly (it\'s an honor)', level: 2 },
    { icon: '👹', title: 'CHAOS COUNCIL', description: 'Vote on which games to ruin next', level: 3 },
    { icon: '💀', title: 'INNER CIRCLE', description: 'Secret beta access to experimental tools', level: 4 },
    { icon: '⚡', title: 'CHAOS ARCHITECT', description: 'Design your own game-ruining mods', level: 5 },
    { icon: '👑', title: 'FUGLY\'S CHOSEN', description: 'Co-create chaos with Fugly himself', level: 6 }
  ];

  const cultRanks = [
    'Chaos Initiate',
    'Disorder Disciple',
    'Mayhem Merchant',
    'Anarchy Apostle',
    'Pandemonium Prophet',
    'FUGLY\'S RIGHT HAND'
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: activeTab === 'cult'
        ? 'linear-gradient(to bottom, #1f2937, #111827)'
        : '#111827',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: activeTab === 'cult'
          ? 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent)'
          : `radial-gradient(circle at ${chaosLevel * 20}% ${chaosLevel * 20}%, rgba(239, 68, 68, 0.2), transparent)`,
        pointerEvents: 'none',
        transition: 'background 0.5s'
      }} />

      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem', position: 'relative' }}>
        {/* Header with Tabs */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: isMobile ? '3rem' : '4.5rem',
            fontWeight: 900,
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #a855f7, #FF8200, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            FUGLY'S DOMAIN
          </h1>

          {/* Tab Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('cult')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2rem',
                background: activeTab === 'cult'
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                  : 'rgba(31, 41, 55, 0.8)',
                border: `3px solid ${activeTab === 'cult' ? '#a855f7' : '#374151'}`,
                borderRadius: '50px',
                color: activeTab === 'cult' ? '#fff' : '#9ca3af',
                fontWeight: 900,
                fontSize: '1.125rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                boxShadow: activeTab === 'cult' ? '0 10px 30px rgba(168, 85, 247, 0.4)' : 'none'
              }}
            >
              <Crown size={22} />
              THE CULT
            </button>
            <button
              onClick={() => setActiveTab('fuglyverse')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2rem',
                background: activeTab === 'fuglyverse'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'rgba(31, 41, 55, 0.8)',
                border: `3px solid ${activeTab === 'fuglyverse' ? '#ef4444' : '#374151'}`,
                borderRadius: '50px',
                color: activeTab === 'fuglyverse' ? '#fff' : '#9ca3af',
                fontWeight: 900,
                fontSize: '1.125rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                boxShadow: activeTab === 'fuglyverse' ? '0 10px 30px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              <Flame size={22} />
              FUGLYVERSE
            </button>
          </div>
        </div>

        {/* CULT TAB */}
        {activeTab === 'cult' && (
          <>
            {/* User Status or Sign In */}
            {!user && isLoaded ? (
              <div style={{
                textAlign: 'center',
                marginBottom: '3rem',
                padding: '2.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '1rem',
                border: '2px solid #ef4444'
              }}>
                <p style={{ color: '#fca5a5', fontSize: '1.5rem', marginBottom: '1rem' }}>
                  SIGN IN TO TRACK YOUR DEVOTION
                </p>
                <p style={{ color: '#f87171', fontSize: '1rem', marginBottom: '1.5rem' }}>
                  Your path to chaos requires authentication
                </p>
                <SignInButton mode="modal">
                  <button style={{
                    background: 'linear-gradient(45deg, #a855f7, #FF8200)',
                    color: '#111827',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 900,
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                    JOIN THE CULT
                  </button>
                </SignInButton>
              </div>
            ) : user ? (
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '2rem',
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '1rem',
                border: '2px solid #a855f7'
              }}>
                <p style={{ color: '#d8b4fe', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Welcome, {user.firstName || 'Chaos Seeker'}!
                </p>
                <p style={{ color: '#a855f7', fontSize: '1.75rem', fontWeight: 900 }}>
                  Rank: {cultRanks[cultLevel - 1]}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          background: i < cultLevel ? '#a855f7' : 'rgba(168, 85, 247, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem'
                        }}
                      >
                        {i < cultLevel ? '⚡' : ''}
                      </div>
                    ))}
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Level {cultLevel} of 6</p>
                </div>
              </div>
            ) : null}

            {/* Devotion Meter */}
            <div style={{
              maxWidth: '500px',
              margin: '0 auto 2rem auto',
              padding: '1.5rem',
              background: 'rgba(255, 117, 0, 0.1)',
              borderRadius: '1rem',
              border: '2px solid #FF8200'
            }}>
              <h3 style={{ color: '#FF8200', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem', textAlign: 'center' }}>
                DEVOTION TO CHAOS
              </h3>
              <div style={{
                width: '100%',
                height: '1.5rem',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '1rem',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${devotion}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #a855f7, #FF8200, #ef4444)',
                  transition: 'width 0.1s ease'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  {devotion}%
                </div>
              </div>
              <p style={{ color: '#fdba74', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Your chaos energy is building...
              </p>
            </div>

            {/* Membership Perks Grid */}
            <div style={{
              background: 'rgba(255, 117, 0, 0.05)',
              border: '3px solid #FF8200',
              borderRadius: '1.5rem',
              padding: isMobile ? '1.5rem' : '2.5rem',
              position: 'relative',
              marginBottom: '2rem'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(45deg, #a855f7, #FF8200)',
                color: '#111827',
                padding: '0.5rem 1.5rem',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '1rem'
              }}>
                CULT BENEFITS
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                {cultPerks.map((perk, index) => (
                  <div
                    key={index}
                    style={{
                      background: cultLevel >= perk.level ? '#111827' : 'rgba(17, 24, 39, 0.5)',
                      padding: '1.5rem',
                      borderRadius: '1rem',
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      border: cultLevel >= perk.level ? '2px solid #a855f7' : '2px solid transparent',
                      opacity: cultLevel >= perk.level ? 1 : 0.6
                    }}
                    onMouseEnter={() => setHoveredPerk(index)}
                    onMouseLeave={() => setHoveredPerk(null)}
                  >
                    <div style={{
                      fontSize: '2.5rem',
                      marginBottom: '0.75rem',
                      transform: hoveredPerk === index ? 'scale(1.2) rotate(10deg)' : 'scale(1)',
                      transition: 'transform 0.3s'
                    }}>
                      {perk.icon}
                    </div>
                    <h3 style={{
                      color: cultLevel >= perk.level ? '#a855f7' : '#6b7280',
                      fontSize: '1.125rem',
                      fontWeight: 900,
                      marginBottom: '0.5rem'
                    }}>
                      {perk.title}
                    </h3>
                    <p style={{ color: cultLevel >= perk.level ? '#fde68a' : '#9ca3af', fontSize: '0.875rem' }}>
                      {perk.description}
                    </p>
                    {cultLevel < perk.level && (
                      <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Unlocks at Level {perk.level}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ritual Button */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <button
                onClick={performRitual}
                disabled={ritualActive || cultLevel >= 6 || devotion < 100}
                style={{
                  background: ritualActive
                    ? 'linear-gradient(45deg, #111827, #1f2937)'
                    : cultLevel >= 6
                      ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                      : devotion < 100
                        ? 'linear-gradient(45deg, #4b5563, #6b7280)'
                        : 'linear-gradient(45deg, #a855f7, #FF8200, #ef4444)',
                  color: devotion < 100 && cultLevel < 6 ? '#9ca3af' : '#111827',
                  padding: '1.25rem 3rem',
                  borderRadius: '50px',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  cursor: (cultLevel >= 6 || devotion < 100) ? 'not-allowed' : 'pointer',
                  boxShadow: devotion >= 100 ? '0 20px 40px rgba(168, 85, 247, 0.3)' : 'none',
                  opacity: ritualActive ? 0.7 : 1
                }}
              >
                {ritualActive ? '🔮 RITUAL IN PROGRESS...' : cultLevel >= 6 ? '👑 MAXIMUM CHAOS ACHIEVED' : devotion < 100 ? `NEED ${100 - devotion}% MORE DEVOTION` : 'PERFORM CHAOS RITUAL'}
              </button>
            </div>

            {/* Cult Statistics */}
            <div style={{
              background: 'rgba(17, 24, 39, 0.8)',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
              border: '2px solid #a855f7'
            }}>
              <h2 style={{ color: '#a855f7', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>
                CULT STATISTICS
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '1.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '2.5rem', color: '#FF8200', fontWeight: 900 }}>13,666</div>
                  <p style={{ color: '#fdba74' }}>Active Cultists</p>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', color: '#ef4444', fontWeight: 900 }}>666,666</div>
                  <p style={{ color: '#fca5a5' }}>Games Ruined</p>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', color: '#a855f7', fontWeight: 900 }}>∞</div>
                  <p style={{ color: '#d8b4fe' }}>Chaos Generated</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* FUGLYVERSE TAB */}
        {activeTab === 'fuglyverse' && (
          <>
            <p style={{
              fontSize: '1.25rem',
              color: '#fca5a5',
              textAlign: 'center',
              marginBottom: '2rem',
              fontWeight: 'bold'
            }}>
              Latest dispatches from the realm of beautiful disasters
            </p>

            {/* Comics Section */}
            {comics.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: '#FF8200',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <BookOpen size={28} />
                  FUGLY COMICS
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '1.5rem'
                }}>
                  {comics.slice(0, 6).map((comic, index) => (
                    <div
                      key={comic.id}
                      style={{
                        background: 'rgba(17, 24, 39, 0.9)',
                        border: '3px solid #FF8200',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        transform: `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`
                      }}
                    >
                      {comic.imageUrl && (
                        <img
                          src={comic.imageUrl}
                          alt={comic.title}
                          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        />
                      )}
                      <div style={{ padding: '1rem' }}>
                        <h3 style={{ color: '#FF8200', fontWeight: 900, marginBottom: '0.5rem' }}>
                          {comic.episode && `#${comic.episode}: `}{comic.title}
                        </h3>
                        <p style={{ color: '#fdba74', fontSize: '0.875rem' }}>{comic.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News/Chaos Section */}
            <div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#ef4444',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Newspaper size={28} />
                CHAOS DISPATCHES
              </h2>

              {contentLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '1.5rem', color: '#ef4444' }}>⚡ LOADING CHAOS ⚡</div>
                </div>
              ) : news.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '1rem',
                  border: '3px dashed #ef4444'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔥</div>
                  <p style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 900 }}>NO CHAOS TO REPORT!</p>
                  <p style={{ color: '#fca5a5' }}>The universe is suspiciously quiet...</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: '1.5rem'
                }}>
                  {news.map((post, index) => (
                    <div
                      key={post.id}
                      style={{
                        background: 'rgba(17, 24, 39, 0.9)',
                        border: '3px solid #ef4444',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        transform: `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => setSelectedPost(post)}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '1.5rem'
                      }}>
                        {['🔥', '⚡', '💥', '🌪️', '☄️'][index % 5]}
                      </div>

                      <h3 style={{
                        color: '#ef4444',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        paddingRight: '2rem'
                      }}>
                        {post.title}
                      </h3>
                      <p style={{ color: '#fde68a', marginBottom: '1rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
                        {post.excerpt}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span style={{
                          background: '#ef4444',
                          color: '#111827',
                          padding: '0.375rem 1rem',
                          borderRadius: '0.25rem',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}>
                          READ MORE →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Selected Post Modal */}
      {selectedPost && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            style={{
              background: '#111827',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '700px',
              width: '100%',
              border: '3px solid #ef4444',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#ef4444', fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>
              {selectedPost.title}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {new Date(selectedPost.createdAt).toLocaleDateString()}
            </p>
            <div style={{ color: '#fde68a', lineHeight: 1.8, marginBottom: '2rem' }}>
              {selectedPost.content || selectedPost.excerpt}
            </div>
            <button
              onClick={() => setSelectedPost(null)}
              style={{
                background: '#ef4444',
                color: '#111827',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Ritual Effect */}
      {ritualActive && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(168, 85, 247, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{ fontSize: '6rem', animation: 'spin 1s linear infinite' }}>🔮</div>
        </div>
      )}

      <GlobalFooter />

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
