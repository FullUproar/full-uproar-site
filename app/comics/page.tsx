'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

interface Comic {
  id: number;
  title: string;
  episode: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export default function ComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchComics();
  }, []);

  const fetchComics = async () => {
    try {
      const response = await fetch('/api/comics');
      if (response.ok) {
        const data = await response.json();
        setComics(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch comics:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #111827 100%)'
    },
    nav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.9)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #f97316'
    }
  };

  return (
    <div style={styles.container}>
      <Navigation />

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{
          fontSize: isMobile ? '3rem' : '4rem',
          fontWeight: 900,
          color: '#f97316',
          textAlign: 'center',
          marginBottom: '1rem',
          animation: 'glitch 3s infinite'
        }}>
          FUGLY'S COMIC CHAOS
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#fdba74',
          textAlign: 'center',
          marginBottom: '3rem',
          fontWeight: 'bold'
        }}>
          Beautifully deranged stories from the mind of Fugly
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '2rem', color: '#f97316', animation: 'pulse 2s infinite' }}>
              Loading chaos...
            </div>
          </div>
        ) : comics.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '6rem 2rem',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '2rem',
            border: '4px dashed #f97316',
            transform: 'rotate(-1deg)'
          }}>
            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🎨</div>
            <p style={{ fontSize: '2rem', color: '#f97316', fontWeight: 900, marginBottom: '1rem' }}>
              COMICS COMING SOON!
            </p>
            <p style={{ fontSize: '1.25rem', color: '#fdba74' }}>
              Fugly is still drawing with his chaos crayons...
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {comics.map((comic, index) => (
              <div
                key={comic.id}
                style={{
                  background: '#111827',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  transform: `perspective(1000px) rotateY(${index % 2 === 0 ? '5' : '-5'}deg)`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  border: '3px solid #f97316'
                }}
                onClick={() => setSelectedComic(comic)}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = `perspective(1000px) rotateY(${index % 2 === 0 ? '5' : '-5'}deg)`;
                  }
                }}
              >
                <div style={{ 
                  height: '300px', 
                  background: `linear-gradient(${45 + index * 30}deg, #f97316, #ef4444)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '6rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {comic.imageUrl ? (
                    <img 
                      src={comic.imageUrl} 
                      alt={comic.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <>
                      <div style={{ zIndex: 1 }}>📚</div>
                      <div style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-20%',
                        width: '140%',
                        height: '200%',
                        background: 'rgba(255,255,255,0.1)',
                        transform: 'rotate(45deg)',
                        animation: `slideAcross ${10 + index}s linear infinite`
                      }} />
                    </>
                  )}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ 
                    color: '#fdba74', 
                    fontSize: '1.75rem', 
                    fontWeight: 900, 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase'
                  }}>
                    {comic.title}
                  </h3>
                  <p style={{ 
                    color: '#fde68a', 
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    marginBottom: '0.5rem'
                  }}>
                    {comic.episode}
                  </p>
                  {comic.description && (
                    <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>
                      {comic.description}
                    </p>
                  )}
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#f97316',
                    color: '#111827',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    transform: 'skewX(-10deg)'
                  }}>
                    READ NOW →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Comic Modal */}
      {selectedComic && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedComic(null)}
        >
          <div 
            style={{
              background: '#111827',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              border: '4px solid #f97316',
              transform: 'rotate(-1deg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#f97316', fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
              {selectedComic.title}
            </h2>
            <p style={{ color: '#fdba74', fontSize: '1.25rem', marginBottom: '1rem' }}>
              {selectedComic.episode}
            </p>
            <p style={{ color: '#fde68a', marginBottom: '2rem' }}>
              {selectedComic.description || 'Full comic coming soon! Fugly is still perfecting the chaos...'}
            </p>
            <button
              onClick={() => setSelectedComic(null)}
              style={{
                background: '#ef4444',
                color: '#111827',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1.125rem'
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Floating comic pages animation */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '60px',
              height: '80px',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '2px solid rgba(249, 115, 22, 0.3)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatPage ${10 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        @keyframes floatPage {
          0% { transform: translateY(100vh) rotate(0deg); }
          100% { transform: translateY(-100vh) rotate(360deg); }
        }

        @keyframes slideAcross {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}