'use client';

import { useState } from 'react';
import { MetaPixelEvents } from '@/app/components/MetaPixel';
import Navigation from '@/app/components/Navigation';

export default function TestPixelPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testViewContent = () => {
    MetaPixelEvents.viewContent('test_product_1', 'Test Product', 'product', 29.99, 'USD');
    addMessage('Fired ViewContent event');
  };

  const testAddToCart = () => {
    MetaPixelEvents.addToCart('test_product_1', 'Test Product', 'product', 29.99, 'USD');
    addMessage('Fired AddToCart event');
  };

  const testInitiateCheckout = () => {
    MetaPixelEvents.initiateCheckout(59.98, 2, ['test_product_1', 'test_product_2'], 'USD');
    addMessage('Fired InitiateCheckout event');
  };

  const testPurchase = () => {
    MetaPixelEvents.purchase(59.98, ['test_product_1', 'test_product_2'], 'product', 2, 'USD');
    addMessage('Fired Purchase event');
  };

  const testSearch = () => {
    MetaPixelEvents.search('board games');
    addMessage('Fired Search event');
  };

  const testLead = () => {
    MetaPixelEvents.lead(10, 'USD');
    addMessage('Fired Lead event');
  };

  const testRegistration = () => {
    MetaPixelEvents.completeRegistration(0, 'USD');
    addMessage('Fired CompleteRegistration event');
  };

  const testCustomEvent = () => {
    MetaPixelEvents.custom('FuglyAction', { action: 'chaos_mode_activated', value: 100 });
    addMessage('Fired Custom FuglyAction event');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: '#fdba74'
    }}>
      <Navigation />
      
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem' 
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 900, 
          color: '#f97316',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          🎯 META PIXEL TEST PAGE
        </h1>

        <div style={{
          background: '#1a1a1a',
          border: '3px solid #f97316',
          borderRadius: '10px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#fdba74', marginBottom: '1rem' }}>Pixel Status</h2>
          <p style={{ fontSize: '1.2rem' }}>
            Pixel ID: <code style={{ background: '#2a2a2a', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              {pixelId || 'NOT CONFIGURED'}
            </code>
          </p>
          <p style={{ marginTop: '1rem', color: pixelId ? '#10b981' : '#ef4444' }}>
            Status: {pixelId ? '✅ Active' : '❌ Not Configured'}
          </p>
          {!pixelId && (
            <p style={{ marginTop: '1rem', color: '#fbbf24' }}>
              Add NEXT_PUBLIC_META_PIXEL_ID to your .env.local file to activate
            </p>
          )}
        </div>

        <div style={{
          background: '#1a1a1a',
          border: '3px solid #f97316',
          borderRadius: '10px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#fdba74', marginBottom: '1.5rem' }}>Test Events</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button onClick={testViewContent} style={buttonStyle}>
              ViewContent
            </button>
            <button onClick={testAddToCart} style={buttonStyle}>
              AddToCart
            </button>
            <button onClick={testInitiateCheckout} style={buttonStyle}>
              InitiateCheckout
            </button>
            <button onClick={testPurchase} style={buttonStyle}>
              Purchase
            </button>
            <button onClick={testSearch} style={buttonStyle}>
              Search
            </button>
            <button onClick={testLead} style={buttonStyle}>
              Lead
            </button>
            <button onClick={testRegistration} style={buttonStyle}>
              CompleteRegistration
            </button>
            <button onClick={testCustomEvent} style={buttonStyle}>
              Custom Event
            </button>
          </div>
        </div>

        <div style={{
          background: '#1a1a1a',
          border: '3px solid #f97316',
          borderRadius: '10px',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#fdba74', marginBottom: '1rem' }}>Event Log</h2>
          <div style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '1rem',
            minHeight: '200px',
            maxHeight: '400px',
            overflowY: 'auto',
            fontFamily: 'monospace'
          }}>
            {messages.length === 0 ? (
              <p style={{ color: '#666' }}>No events fired yet. Click buttons above to test.</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: '0.5rem', color: '#10b981' }}>
                  {msg}
                </div>
              ))
            )}
          </div>
          {messages.length > 0 && (
            <button 
              onClick={() => setMessages([])}
              style={{ 
                ...buttonStyle, 
                marginTop: '1rem',
                background: '#dc2626'
              }}
            >
              Clear Log
            </button>
          )}
        </div>

        <div style={{
          background: '#1a1a1a',
          border: '3px solid #8b5cf6',
          borderRadius: '10px',
          padding: '2rem',
          marginTop: '2rem'
        }}>
          <h2 style={{ color: '#fdba74', marginBottom: '1rem' }}>📖 How to Verify</h2>
          <ol style={{ lineHeight: '1.8' }}>
            <li>1. Install the <strong>Meta Pixel Helper</strong> Chrome extension</li>
            <li>2. Open browser Developer Tools → Console</li>
            <li>3. Look for messages starting with <code>fbq</code></li>
            <li>4. Click test buttons above and watch for events</li>
            <li>5. Check Meta Events Manager in your Facebook Business account</li>
          </ol>
          <p style={{ marginTop: '1rem', color: '#fbbf24' }}>
            ⚠️ Note: Events may take up to 20 minutes to appear in Events Manager
          </p>
        </div>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: '#f97316',
  color: '#0a0a0a',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};