'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Shield, Users, Sparkles, ArrowLeft, ExternalLink } from 'lucide-react';
import Navigation from '../components/Navigation';

export default function TheLinePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [hugImageUrl, setHugImageUrl] = useState<string | null>(null);

  // Detect mobile on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 768);
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Fetch the hugging Fugly image (fugly3)
  useEffect(() => {
    fetch('/api/artwork')
      .then(res => res.json())
      .then(data => {
        // Find fugly3 (the hugging one)
        const hugFugly = data.find((art: any) =>
          art.name.toLowerCase() === 'fugly3' ||
          art.name.toLowerCase().includes('fugly3') ||
          art.name.toLowerCase().includes('hug')
        );
        if (hugFugly) {
          setHugImageUrl(hugFugly.imageUrl);
        }
      })
      .catch(err => console.error('Failed to load Fugly image:', err));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e2e8f0',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0a0a0a',
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '60vh',
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }} />
      </div>

      <Navigation />

      <main style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '800px',
        margin: '0 auto',
        padding: isMobile ? '6rem 1.5rem 4rem' : '8rem 2rem 6rem',
      }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '2rem',
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          {hugImageUrl && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <img
                src={hugImageUrl}
                alt="Fugly giving a hug"
                style={{
                  width: isMobile ? '180px' : '220px',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: 900,
            color: '#FF8200',
            marginBottom: '1rem',
            lineHeight: 1.1,
          }}>
            Chaos, Not Cruelty
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#a855f7',
            fontWeight: 600,
          }}>
            Where we draw the line
          </p>
        </div>

        {/* Core Philosophy Section */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          border: '2px solid #374151',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            fontSize: '1.1rem',
            lineHeight: 1.9,
            color: '#d1d5db',
          }}>
            <p style={{ marginBottom: '1.5rem' }}>
              At Full Uproar, we believe <strong style={{ color: '#FF8200' }}>chaos is what makes game night memorable</strong>.
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
              Rules get bent. Expectations get flipped. Laughter gets loud.
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
              That only works if everyone at the table feels like they belong.
            </p>

            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#FBDB65',
              marginBottom: '1.5rem',
              borderLeft: '4px solid #FF8200',
              paddingLeft: '1rem',
            }}>
              Our games are built to create shared fun—not cheap shots.
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
              Humor can tease, surprise, and even sting a little. That's part of the fun.
              But there's a line between laughing <em>with</em> people and laughing <em>at</em> them.
              When the joke pushes someone out instead of pulling everyone together, it stops being funny—and we're not interested in that.
            </p>

            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#a855f7',
              marginBottom: '1.5rem',
            }}>
              Chaos should lift the room, not hollow it out.
            </p>
          </div>
        </section>

        {/* We Draw the Line */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          border: '2px solid #374151',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#FBDB65',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <Shield size={24} color="#10b981" />
            We Draw the Line Simply
          </h2>

          <div style={{
            fontSize: '1.1rem',
            lineHeight: 1.9,
            color: '#d1d5db',
          }}>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#10b981',
              marginBottom: '0.75rem',
            }}>
              If everyone's laughing, we're doing it right.
            </p>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#10b981',
              marginBottom: '1.5rem',
            }}>
              If someone's not, the fun pauses—no debate, no drama.
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
              That doesn't mean every joke has to be safe or sanitized.
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
              It means jokes should be <strong style={{ color: '#FF8200' }}>playful, not personal</strong>. <strong style={{ color: '#a855f7' }}>Bold, not bitter</strong>. <strong style={{ color: '#FBDB65' }}>Clever, not cruel</strong>.
            </p>
          </div>
        </section>

        {/* Blank Cards Section */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          border: '2px solid #374151',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#FBDB65',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <Sparkles size={24} color="#FF8200" />
            Those Blank Cards?
          </h2>

          <div style={{
            fontSize: '1.1rem',
            lineHeight: 1.9,
            color: '#d1d5db',
          }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong style={{ color: '#FF8200' }}>They're powerful.</strong>
            </p>

            <p style={{ marginBottom: '1.5rem' }}>
              They let you bring your own humor, history, and inside jokes to the table.
              Use them to make the night <em>better</em>—to spark laughter, not resentment.
            </p>

            <div style={{
              background: 'rgba(255, 130, 0, 0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#FBDB65',
                marginBottom: '0.5rem',
              }}>
                Break rules. Break patterns. Break routines.
              </p>
              <p style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                color: '#ef4444',
                margin: 0,
              }}>
                Don't break people.
              </p>
            </div>
          </div>
        </section>

        {/* The Question Section */}
        <section style={{
          background: 'rgba(31, 41, 55, 0.5)',
          border: '2px solid #374151',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#FBDB65',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <Users size={24} color="#3b82f6" />
            The Question
          </h2>

          <div style={{
            fontSize: '1.1rem',
            lineHeight: 1.9,
            color: '#d1d5db',
          }}>
            <p style={{ marginBottom: '1.5rem' }}>
              If you ever wonder whether something crossed the line, ask yourself one question:
            </p>

            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#a855f7',
              fontStyle: 'italic',
              marginBottom: '1.5rem',
              paddingLeft: '1rem',
              borderLeft: '4px solid #a855f7',
            }}>
              Would I still say this if the person on the card were sitting right here?
            </p>

            <p>
              If the answer's no, there's always another way to make the table laugh.
            </p>
          </div>
        </section>

        {/* Need Support Section */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.05))',
          border: '2px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#c4b5fd',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <Heart size={24} color="#ec4899" />
            Need to Talk?
          </h2>

          <p style={{
            fontSize: '1rem',
            color: '#d1d5db',
            marginBottom: '1.5rem',
            lineHeight: 1.7,
          }}>
            Games are supposed to be fun, but life isn't always. If you're going through a tough time,
            these resources are here for you—no judgment, just support.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            {[
              {
                name: "988 Suicide & Crisis Lifeline",
                description: "Call or text 988 (US)",
                url: "https://988lifeline.org",
              },
              {
                name: "Crisis Text Line",
                description: "Text HOME to 741741",
                url: "https://www.crisistextline.org",
              },
              {
                name: "SAMHSA National Helpline",
                description: "1-800-662-4357 (free, confidential, 24/7)",
                url: "https://www.samhsa.gov/find-help/national-helpline",
              },
            ].map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem 1.25rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a855f7';
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                }}
              >
                <div>
                  <div style={{
                    fontWeight: 700,
                    color: '#e2e8f0',
                    marginBottom: '0.25rem',
                  }}>
                    {resource.name}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#9ca3af',
                  }}>
                    {resource.description}
                  </div>
                </div>
                <ExternalLink size={18} color="#9ca3af" />
              </a>
            ))}
          </div>
        </section>

        {/* Closing */}
        <div style={{
          textAlign: 'center',
          padding: '2rem 0',
          borderTop: '1px solid #374151',
        }}>
          <p style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#FF8200',
            marginBottom: '1rem',
          }}>
            Now go cause some chaos. The good kind.
          </p>
          <Link
            href="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#FF8200',
              color: '#0a0a0a',
              padding: '0.875rem 2rem',
              borderRadius: '50px',
              fontWeight: 900,
              textDecoration: 'none',
              fontSize: '1rem',
            }}
          >
            Browse Our Games
          </Link>
        </div>
      </main>

      {/* Simple Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid #1f2937',
        color: '#6b7280',
        fontSize: '0.875rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <p>© {new Date().getFullYear()} Full Uproar Games. All rights reserved.</p>
        <div style={{ marginTop: '0.5rem' }}>
          <Link href="/privacy" style={{ color: '#6b7280', marginRight: '1rem' }}>Privacy</Link>
          <Link href="/terms" style={{ color: '#6b7280' }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
