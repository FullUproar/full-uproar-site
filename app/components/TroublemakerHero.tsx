'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Oswald, DM_Sans } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from './Navigation';
import { colors, hexToRgba } from '@/lib/colors';
import { analytics, AnalyticsEvent } from '@/lib/analytics/analytics';

// ─── Fonts (scoped to this component only) ──────────────────
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-oswald',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// ─── Brand-mapped tokens ─────────────────────────────────────
const t = {
  bg: colors.bgDark,
  text: colors.textSecondary,
  muted: colors.textMuted,
  accent: colors.primary,
  accentGlow: hexToRgba('#FF8200', 0.27),
  accentGlowSubtle: hexToRgba('#FF8200', 0.04),
  ctaText: '#111827',
};

const MANIFESTO_LINES = [
  'Choose the job.',
  'Choose the commute.',
  'Choose the meeting about meetings.',
];

export default function TroublemakerHero() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [struckLines, setStruckLines] = useState<number[]>([]);
  const [showOr, setShowOr] = useState(false);
  const [showHeadline, setShowHeadline] = useState(false);
  const [showFugly, setShowFugly] = useState(false);
  const [fuglyFloating, setFuglyFloating] = useState(false);
  const [showSubline, setShowSubline] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [ctaPulsing, setCtaPulsing] = useState(false);
  const [showReplay, setShowReplay] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const runAnimation = useCallback(() => {
    clearTimers();

    // Reset all state
    setVisibleLines([]);
    setStruckLines([]);
    setShowOr(false);
    setShowHeadline(false);
    setShowFugly(false);
    setFuglyFloating(false);
    setShowSubline(false);
    setShowCta(false);
    setCtaPulsing(false);
    setShowReplay(false);

    let t = 500;

    // 3 lines: appear → read → strike
    MANIFESTO_LINES.forEach((_, i) => {
      later(() => setVisibleLines((prev) => [...prev, i]), t);
      t += 1300;
      later(() => setStruckLines((prev) => [...prev, i]), t);
      t += 650;
    });

    // "or" — pattern break
    t += 350;
    later(() => setShowOr(true), t);

    // Let it hang
    t += 1100;

    // "Choose Mayhem."
    later(() => setShowHeadline(true), t);

    // Fugly head fades in
    t += 800;
    later(() => setShowFugly(true), t);

    // Fugly idle float
    t += 900;
    later(() => setFuglyFloating(true), t);

    // Subline (overlaps slightly with fugly settling)
    t -= 400;
    later(() => setShowSubline(true), t);

    // CTA
    t += 600;
    later(() => {
      setShowCta(true);
      setCtaPulsing(true);
    }, t);

    // Replay button
    t += 1000;
    later(() => setShowReplay(true), t);
  }, [clearTimers, later]);

  useEffect(() => {
    runAnimation();
    return clearTimers;
  }, [runAnimation, clearTimers]);

  return (
    <div className={`${oswald.variable} ${dmSans.variable}`}>
      <style>{`
        @keyframes troublemakerTypeIn {
          from { opacity: 0; transform: translateY(8px); filter: blur(3px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes troublemakerFloat {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-5px); }
        }
        @keyframes troublemakerBtnPulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 600px) {
          .tm-line { white-space: normal !important; font-size: 1rem !important; }
          .tm-fugly { width: 120px !important; height: 120px !important; }
          .tm-cta { padding: 18px 50px !important; font-size: 1rem !important; }
          .tm-hero { padding: 60px 24px !important; }
        }
      `}</style>

      <Navigation />

      <section
        className="tm-hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '80px 30px',
          position: 'relative',
          overflow: 'hidden',
          background: t.bg,
        }}
      >
        {/* Background gradients */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 90%, ${t.accentGlow} 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, ${t.accentGlowSubtle} 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Noise texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 700,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Manifesto lines */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 26,
              marginBottom: 40,
            }}
          >
            {MANIFESTO_LINES.map((line, i) => {
              const isVisible = visibleLines.includes(i);
              const isStruck = struckLines.includes(i);
              return (
                <div
                  key={i}
                  className="tm-line"
                  style={{
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                    lineHeight: 1.6,
                    color: t.muted,
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    opacity: isVisible ? (isStruck ? 0.3 : 1) : 0,
                    animation: isVisible ? 'troublemakerTypeIn 0.45s ease forwards' : 'none',
                    transition: isStruck ? 'opacity 0.5s ease 0.2s' : 'none',
                  }}
                >
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    {line}
                    {/* Strikethrough bar */}
                    <span
                      style={{
                        position: 'absolute',
                        left: -4,
                        top: '50%',
                        height: 2.5,
                        width: isStruck ? 'calc(100% + 8px)' : 0,
                        background: t.accent,
                        transform: 'translateY(-50%)',
                        borderRadius: 2,
                        transition: 'width 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)',
                      }}
                    />
                  </span>
                </div>
              );
            })}

            {/* "or" */}
            <div
              style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                color: t.text,
                letterSpacing: '0.08em',
                opacity: showOr ? 1 : 0,
                transform: showOr ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            >
              or
            </div>
          </div>

          {/* "Choose Mayhem." */}
          <h1
            style={{
              fontFamily: 'var(--font-oswald), sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: t.text,
              marginBottom: 24,
              textShadow: `0 0 50px ${t.accentGlow}`,
              opacity: showHeadline ? 1 : 0,
              transform: showHeadline ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
          >
            Choose Mayhem.
          </h1>

          {/* Fugly head */}
          <div
            className="tm-fugly"
            style={{
              width: 160,
              height: 160,
              marginBottom: 20,
              opacity: showFugly ? 1 : 0,
              transform: showFugly ? 'scale(1)' : 'scale(0.85)',
              transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: fuglyFloating ? 'troublemakerFloat 3s ease-in-out infinite' : 'none',
              filter: `drop-shadow(0 0 30px ${hexToRgba('#FF8200', 0.2)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src="/FuglyLogo.png"
              alt="Fugly the Cat"
              width={160}
              height={160}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Subline */}
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '1rem',
              color: t.muted,
              marginBottom: 40,
              letterSpacing: '0.02em',
              opacity: showSubline ? 1 : 0,
              transform: showSubline ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            Game night doesn&apos;t ask permission.
          </p>

          {/* CTA */}
          <Link
            href="/shop/games"
            className="tm-cta"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-oswald), sans-serif',
              fontWeight: 700,
              fontSize: '1.15rem',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              padding: '20px 70px',
              background: t.accent,
              color: t.ctaText,
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'none',
              position: 'relative',
              overflow: 'hidden',
              opacity: showCta ? 1 : 0,
              transform: showCta ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
            onClick={() => analytics.track(AnalyticsEvent.AB_CTA_CLICK, {
              experiment: 'homepage_v3',
              variant: 'B',
              cta: 'choose_mayhem',
            })}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 50px ${t.accentGlow}, 0 0 100px ${hexToRgba('#FF8200', 0.2)}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {/* Pulse glow behind button */}
            {ctaPulsing && (
              <span
                style={{
                  position: 'absolute',
                  inset: -2,
                  background: t.accent,
                  opacity: 0,
                  animation: 'troublemakerBtnPulse 2s ease-in-out 0.5s infinite',
                  zIndex: -1,
                  filter: 'blur(20px)',
                }}
              />
            )}
            Choose Mayhem
          </Link>
        </div>
      </section>

      {/* Replay button */}
      <button
        onClick={runAnimation}
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: '0.8rem',
          color: t.muted,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '10px 20px',
          cursor: 'pointer',
          borderRadius: 4,
          zIndex: 200,
          letterSpacing: '0.05em',
          opacity: showReplay ? 1 : 0,
          transition: 'opacity 0.5s ease, color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = t.text;
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = t.muted;
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      >
        ↻ Replay
      </button>
    </div>
  );
}
