'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { BookOpen, Newspaper, Flame } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [chaosLevel, setChaosLevel] = useState(1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Random chaos level changes for visual effect
    const chaosInterval = setInterval(() => {
      setChaosLevel(Math.floor(Math.random() * 5) + 1);
    }, 3000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(chaosInterval);
    };
  }, []);

  // Load content
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
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111827',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at ${chaosLevel * 20}% ${chaosLevel * 20}%, rgba(239, 68, 68, 0.2), transparent)`,
        pointerEvents: 'none',
        transition: 'background 0.5s'
      }} />

      <Navigation />

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '6rem 1rem 3rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
          <p style={{
            fontSize: '1.25rem',
            color: '#fca5a5',
            marginBottom: '2rem',
            fontWeight: 'bold'
          }}>
            The chaotic narrator of Full Uproar
          </p>
          <p style={{
            fontSize: '1.125rem',
            color: '#94a3b8',
            maxWidth: '42rem',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Fugly is the id, the gremlin, the voice that whispers "do it, it'll be fun."
            He doesn't track your progress—he just celebrates the chaos you create.
          </p>
        </div>

        {/* Comics Section */}
        {comics.length > 0 && (
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#FF8200',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'center'
            }}>
              <BookOpen size={28} />
              FUGLY COMICS
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#FBDB65',
              marginBottom: '2rem',
              fontSize: '1.125rem'
            }}>
              Stories from the mind of a beautiful disaster
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) rotate(0deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`;
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
                    <p style={{ color: '#FBDB65', fontSize: '0.875rem' }}>{comic.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News/Chaos Dispatches Section */}
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#ef4444',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            <Newspaper size={28} />
            CHAOS DISPATCHES
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#fca5a5',
            marginBottom: '2rem',
            fontSize: '1.125rem'
          }}>
            Latest dispatches from the realm of beautiful disasters
          </p>

          {loading ? (
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02) rotate(0deg)';
                    e.currentTarget.style.borderColor = '#FF8200';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`;
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
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
                  <p style={{ color: '#FBDB65', marginBottom: '1rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
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
            <div style={{ color: '#FBDB65', lineHeight: 1.8, marginBottom: '2rem' }}>
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
    </div>
  );
}
