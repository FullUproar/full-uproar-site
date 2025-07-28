'use client';

import { useState, useEffect } from 'react';

export default function DebugGamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Starting to fetch games...');
    fetch('/api/games')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Games loaded:', data);
        setGames(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#f97316' }}>GAMES DEBUG PAGE</h1>
      
      {loading && <p>Loading games from API...</p>}
      
      {error && (
        <div style={{ color: 'red', border: '1px solid red', padding: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && (
        <div>
          <p><strong>Games found:</strong> {games.length}</p>
          <div style={{ background: '#f5f5f5', padding: '1rem', marginTop: '1rem' }}>
            <pre>{JSON.stringify(games, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '2rem', color: '#666' }}>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
}