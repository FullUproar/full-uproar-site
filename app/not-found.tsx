'use client';

import Link from 'next/link';
import { Home, Skull, Dices } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        {/* 404 Animation */}
        <div style={{
          fontSize: '10rem',
          fontWeight: 900,
          color: '#FF8200',
          marginBottom: '2rem',
          lineHeight: 1,
          textShadow: '0 0 30px rgba(255, 130, 0, 0.5)',
          animation: 'glitch 2s infinite'
        }}>
          404
        </div>
        
        <Skull style={{
          width: '80px',
          height: '80px',
          color: '#FBDB65',
          margin: '0 auto 2rem',
          animation: 'wobble 1s ease-in-out infinite'
        }} />
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '1rem',
          color: '#FBDB65',
          textTransform: 'uppercase'
        }}>
          Page Got Fuglied
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#FBDB65',
          marginBottom: '3rem',
          fontWeight: 'bold'
        }}>
          This page got destroyed harder than your friendships after game night.
          <br />
          Even we can't find it, and we're professionals at chaos.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#FF8200',
            color: '#111827',
            padding: '1rem 2rem',
            borderRadius: '50px',
            fontWeight: 900,
            textDecoration: 'none',
            transition: 'transform 0.2s',
            fontSize: '1.1rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Home size={20} />
            GO HOME
          </Link>
          
          <Link href="/shop" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            color: '#FF8200',
            padding: '1rem 2rem',
            borderRadius: '50px',
            fontWeight: 900,
            textDecoration: 'none',
            border: '3px solid #FF8200',
            transition: 'all 0.2s',
            fontSize: '1.1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FF8200';
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#FF8200';
          }}>
            <Dices size={20} />
            BROWSE CHAOS
          </Link>
        </div>
        
        <div style={{
          marginTop: '4rem',
          padding: '1.5rem',
          background: 'rgba(255, 130, 0, 0.1)',
          borderRadius: '1rem',
          border: '2px solid rgba(255, 130, 0, 0.3)'
        }}>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            margin: 0
          }}>
            <strong style={{ color: '#FBDB65' }}>Fun Fact:</strong> 404 errors are 
            just pages that couldn't handle the Fugly lifestyle. Natural selection at work.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes glitch {
          0%, 100% {
            text-shadow: 
              0 0 30px rgba(255, 130, 0, 0.5),
              -2px 0 #ef4444,
              2px 0 #3b82f6;
          }
          50% {
            text-shadow: 
              0 0 30px rgba(255, 130, 0, 0.8),
              2px 0 #ef4444,
              -2px 0 #3b82f6;
          }
        }
        
        @keyframes wobble {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}