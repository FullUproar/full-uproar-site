'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
// import ChaosWarningGate from './ChaosWarningGate'; // Temporarily disabled
import FullUproarHomeStyled from './FullUproarHomeStyled';
import { getABVariant, setABVariant, assignVariant, AB_COOKIE_NAME, AB_COOKIE_DAYS, type ABVariant } from '@/lib/ab-testing';
import { analytics, AnalyticsEvent } from '@/lib/analytics/analytics';

// Code-split variant B so it only loads when assigned
const TroublemakerHero = dynamic(() => import('./TroublemakerHero'), {
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }} />
  ),
});

// TEMP: Set to false to re-enable the chaos/passcode gate
const BYPASS_GATE = true;

export default function HomeWithGate() {
  const [isAuthenticated, setIsAuthenticated] = useState(BYPASS_GATE);
  const [games, setGames] = useState<any[]>([]);
  const [comics, setComics] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [merch, setMerch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abVariant, setAbVariant] = useState<ABVariant | null>(null);

  // A/B variant assignment + auth check on mount
  useEffect(() => {
    // Allow manual override via ?ab=A or ?ab=B (sets cookie too, so it persists)
    const urlParam = new URLSearchParams(window.location.search).get('ab');
    let variant: ABVariant =
      urlParam === 'A' || urlParam === 'B'
        ? urlParam
        : (getABVariant(AB_COOKIE_NAME) ?? assignVariant());
    setABVariant(AB_COOKIE_NAME, variant, AB_COOKIE_DAYS);
    setAbVariant(variant);

    // Track which variant this session is seeing
    analytics.track(AnalyticsEvent.AB_IMPRESSION, {
      experiment: 'homepage_v3',
      variant,
    });

    // Auth gate (skipped when BYPASS_GATE is true)
    if (BYPASS_GATE) {
      setLoading(false);
      return;
    }
    const authStatus = sessionStorage.getItem('fugly-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Load data only for variant A (variant B doesn't need it)
  useEffect(() => {
    if (isAuthenticated && abVariant === 'A') {
      loadData();
    }
  }, [isAuthenticated, abVariant]);

  const loadData = async () => {
    try {
      const [gamesRes, comicsRes, newsRes, merchRes] = await Promise.all([
        fetch('/api/games?featured=true'),
        fetch('/api/comics'),
        fetch('/api/news'),
        fetch('/api/merch?featured=true')
      ]);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(Array.isArray(gamesData) ? gamesData : []);
      } else {
        console.error('Failed to fetch games:', await gamesRes.text());
        setGames([]);
      }
      if (comicsRes.ok) {
        const comicsData = await comicsRes.json();
        setComics(Array.isArray(comicsData) ? comicsData : []);
      } else {
        console.error('Failed to fetch comics:', await comicsRes.text());
        setComics([]);
      }
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(Array.isArray(newsData) ? newsData : []);
      } else {
        console.error('Failed to fetch news:', await newsRes.text());
        setNews([]);
      }
      if (merchRes.ok) {
        const merchData = await merchRes.json();
        setMerch(Array.isArray(merchData) ? merchData : []);
      } else {
        console.error('Failed to fetch merch:', await merchRes.text());
        setMerch([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCorrectPassword = () => {
    sessionStorage.setItem('fugly-auth', 'true');
    setIsAuthenticated(true);
  };

  // Show loading while determining variant
  if (loading || abVariant === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FF8200',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Loading Fugly&apos;s chaos...
      </div>
    );
  }

  // TEMP: Gate bypassed - uncomment below to re-enable
  // if (!isAuthenticated) {
  //   return <ChaosWarningGate onProceed={handleCorrectPassword} />;
  // }

  // A/B split: variant B gets the Troublemaker hero page
  if (abVariant === 'B') {
    return <TroublemakerHero />;
  }

  return <FullUproarHomeStyled games={games} comics={comics} news={news} merch={merch} />;
}
