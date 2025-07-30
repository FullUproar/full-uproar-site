'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { Zap, Flame, Skull } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: string;
}

export default function ChaosPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [chaosLevel, setChaosLevel] = useState(1);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
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

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setNews(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#111827',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    nav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.9)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #ef4444'
    }
  };

  return (
    <div style={styles.container}>
      {/* Chaos Background Effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at ${chaosLevel * 20}% ${chaosLevel * 20}%, rgba(239, 68, 68, 0.3), transparent)`,
        animation: 'chaosBackground 5s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <Navigation />

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem', position: 'relative' }}>
        {/* Glitchy Title */}
        <h1 style={{
          fontSize: isMobile ? '3rem' : '5rem',
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: '1rem',
          position: 'relative',
          textTransform: 'uppercase'
        }}>
          <span style={{ 
            color: '#ef4444',
            animation: 'glitch 2s infinite',
            display: 'inline-block'
          }}>
            CHAOS
          </span>
          <span style={{ 
            position: 'absolute', 
            left: '50%', 
            top: 0,
            transform: 'translateX(-50%)',
            color: '#f97316',
            animation: 'glitch 2s infinite reverse',
            opacity: 0.7,
            zIndex: -1
          }}>
            CHAOS
          </span>
          <span style={{ 
            position: 'absolute', 
            left: '50%', 
            top: 0,
            transform: 'translateX(-50%)',
            color: '#3b82f6',
            animation: 'glitch 2s infinite 0.5s',
            opacity: 0.5,
            zIndex: -2
          }}>
            CHAOS
          </span>
        </h1>

        {/* Chaos Meter */}
        <div style={{
          maxWidth: '400px',
          margin: '0 auto 3rem auto',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '1rem',
          border: '2px solid #ef4444'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>CHAOS LEVEL:</span>
            <span style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900 }}>{chaosLevel}/5</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '1rem', 
            background: 'rgba(0,0,0,0.5)', 
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${chaosLevel * 20}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ef4444, #f97316)',
              transition: 'width 0.5s ease',
              animation: 'pulse 1s infinite'
            }} />
          </div>
        </div>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#fca5a5',
          textAlign: 'center',
          marginBottom: '3rem',
          fontWeight: 'bold',
          transform: `rotate(${chaosLevel - 3}deg)`
        }}>
          Latest dispatches from the realm of beautiful disasters
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '2rem', color: '#ef4444', animation: 'spin 1s linear infinite' }}>
              ⚡ LOADING CHAOS ⚡
            </div>
          </div>
        ) : news.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '6rem 2rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '2rem',
            border: '4px solid #ef4444',
            transform: 'rotate(-2deg)',
            animation: 'shake 0.5s ease-in-out infinite'
          }}>
            <div style={{ fontSize: '6rem', marginBottom: '2rem', animation: 'spin 3s linear infinite' }}>🔥</div>
            <p style={{ fontSize: '2rem', color: '#ef4444', fontWeight: 900, marginBottom: '1rem' }}>
              NO CHAOS TO REPORT!
            </p>
            <p style={{ fontSize: '1.25rem', color: '#fca5a5' }}>
              The universe is suspiciously quiet... This can't be good.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '2rem'
          }}>
            {news.map((post, index) => (
              <div
                key={post.id}
                style={{
                  background: 'rgba(17, 24, 39, 0.9)',
                  border: '3px solid #ef4444',
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `chaosShake ${3 + index}s ease-in-out infinite`
                }}
                onClick={() => setSelectedPost(post)}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? '-3' : '3'}deg) scale(1.05)`;
                    e.currentTarget.style.borderColor = '#f97316';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? '-1' : '1'}deg)`;
                    e.currentTarget.style.borderColor = '#ef4444';
                  }
                }}
              >
                {/* Chaos decorations */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, #ef4444, transparent)',
                  opacity: 0.3,
                  animation: 'pulse 2s infinite'
                }} />
                
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '2rem',
                  animation: `spin ${2 + index}s linear infinite`
                }}>
                  {['🔥', '⚡', '💥', '🌪️', '☄️'][index % 5]}
                </div>
                
                <h3 style={{ 
                  color: '#ef4444', 
                  fontSize: '1.75rem', 
                  fontWeight: 900, 
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {post.title}
                </h3>
                <p style={{ color: '#fde68a', marginBottom: '1rem', lineHeight: 1.6 }}>
                  {post.excerpt}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <button style={{
                    background: '#ef4444',
                    color: '#111827',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transform: 'skewX(-10deg)',
                    transition: 'all 0.3s'
                  }}>
                    EMBRACE CHAOS →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Post Modal */}
      {selectedPost && (
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
          onClick={() => setSelectedPost(null)}
        >
          <div 
            style={{
              background: '#111827',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              border: '4px solid #ef4444',
              transform: 'rotate(-1deg)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>
              {selectedPost.title}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
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
                cursor: 'pointer',
                fontSize: '1.125rem'
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Chaos particles */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${2 + Math.random() * 6}px`,
              height: `${2 + Math.random() * 6}px`,
              background: ['#ef4444', '#f97316', '#fbbf24'][i % 3],
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `chaosFloat ${5 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.6 + Math.random() * 0.4
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes glitch {
          0%, 100% { 
            transform: translate(0);
            filter: hue-rotate(0deg);
          }
          20% { 
            transform: translate(-2px, 2px);
            filter: hue-rotate(90deg);
          }
          40% { 
            transform: translate(-2px, -2px);
            filter: hue-rotate(180deg);
          }
          60% { 
            transform: translate(2px, 2px);
            filter: hue-rotate(270deg);
          }
          80% { 
            transform: translate(2px, -2px);
            filter: hue-rotate(360deg);
          }
        }

        @keyframes chaosFloat {
          0% { 
            transform: translate(0, 100vh) scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% { 
            transform: translate(100vw, -100vh) scale(2) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes chaosShake {
          0%, 100% { transform: rotate(-1deg) translateX(0); }
          25% { transform: rotate(1deg) translateX(-1px); }
          50% { transform: rotate(-1deg) translateX(1px); }
          75% { transform: rotate(1deg) translateX(-1px); }
        }

        @keyframes shake {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes chaosBackground {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}