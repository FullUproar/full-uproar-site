'use client';

import { useState, useEffect } from 'react';
// import ChaosWarningGate from './ChaosWarningGate'; // Temporarily disabled
import FullUproarHomeStyled from './FullUproarHomeStyled';

// TEMP: Set to false to re-enable the chaos/passcode gate
const BYPASS_GATE = true;

export default function HomeWithGate() {
  const [isAuthenticated, setIsAuthenticated] = useState(BYPASS_GATE);
  const [games, setGames] = useState<any[]>([]);
  const [comics, setComics] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [merch, setMerch] = useState<any[]>([]);
  const [loading, setLoading] = useState(!BYPASS_GATE);

  // Check if already authenticated on load (skipped if BYPASS_GATE is true)
  useEffect(() => {
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

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f97316',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Loading Fugly's chaos...
      </div>
    );
  }

  // TEMP: Gate bypassed - uncomment below to re-enable
  // if (!isAuthenticated) {
  //   return <ChaosWarningGate onProceed={handleCorrectPassword} />;
  // }

  return <FullUproarHomeStyled games={games} comics={comics} news={news} merch={merch} />;
}