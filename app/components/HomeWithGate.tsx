'use client';

import { useState, useEffect } from 'react';
import PasswordGate from './PasswordGate';
import FullUproarHomeStyled from './FullUproarHomeStyled';

export default function HomeWithGate() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [games, setGames] = useState([]);
  const [comics, setComics] = useState([]);
  const [news, setNews] = useState([]);
  const [merch, setMerch] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if already authenticated on load
  useEffect(() => {
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
        fetch('/api/games'),
        fetch('/api/comics'), 
        fetch('/api/news'),
        fetch('/api/merch')
      ]);

      if (gamesRes.ok) setGames(await gamesRes.json());
      if (comicsRes.ok) setComics(await comicsRes.json());
      if (newsRes.ok) setNews(await newsRes.json());
      if (merchRes.ok) setMerch(await merchRes.json());
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

  if (!isAuthenticated) {
    return <PasswordGate onCorrectPassword={handleCorrectPassword} />;
  }

  return <FullUproarHomeStyled games={games} comics={comics} news={news} merch={merch} />;
}