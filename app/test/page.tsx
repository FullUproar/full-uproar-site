'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        console.log('Games loaded:', data);
        setGames(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Page</h1>
      <p>Games count: {games.length}</p>
      <pre>{JSON.stringify(games, null, 2)}</pre>
    </div>
  );
}
