'use client';

import { useState, useEffect } from 'react';

export default function TestMerch() {
  const [merch, setMerch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/merch')
      .then(res => {
        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);
        return res.json();
      })
      .then(data => {
        console.log('Data received:', data);
        console.log('Data is array:', Array.isArray(data));
        console.log('Data length:', data.length);
        setMerch(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>Merch Debug Test</h1>
      
      <div style={{ background: '#222', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Status:</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Products Found: {merch.length}</p>
      </div>

      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ background: 'red', padding: '10px', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && merch.length === 0 && (
        <div style={{ background: 'orange', padding: '10px', borderRadius: '4px' }}>
          No products found, but API call succeeded
        </div>
      )}

      {merch.length > 0 && (
        <div>
          <h2>Products ({merch.length}):</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {merch.map((item: any) => (
              <div key={item.id} style={{ 
                background: '#333', 
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid #555'
              }}>
                <h3 style={{ color: '#f97316' }}>{item.name}</h3>
                <p>Price: ${(item.priceCents / 100).toFixed(2)}</p>
                <p>Category: {item.category}</p>
                <p>Stock: {item.totalStock}</p>
                <p>Printify: {item.isPrintify ? 'Yes' : 'No'}</p>
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    style={{ width: '200px', height: '200px', objectFit: 'cover', marginTop: '10px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', background: '#222', padding: '20px', borderRadius: '8px' }}>
        <h2>Raw API Response:</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(merch, null, 2)}
        </pre>
      </div>
    </div>
  );
}