'use client';

import { useState } from 'react';
import { Loader2, CreditCard, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function TestStripePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testType: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      switch (testType) {
        case 'check-config':
          const configRes = await fetch('/api/admin/test-mode');
          const config = await configRes.json();
          setResult({
            type: 'config',
            data: config
          });
          break;

        case 'create-product':
          const productRes = await fetch('/api/admin/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Test Game for Stripe',
              description: 'This is a test game for Stripe integration testing',
              price: 19.99,
              stock: 100,
              images: ['/images/placeholder.jpg'],
              platform: 'PC',
              releaseDate: new Date().toISOString()
            })
          });
          
          if (!productRes.ok) {
            throw new Error('Failed to create test product. Make sure you are logged in as admin.');
          }
          
          const product = await productRes.json();
          setResult({
            type: 'product',
            data: product
          });
          break;

        case 'test-checkout':
          // First get a product
          const gamesRes = await fetch('/api/admin/games');
          const games = await gamesRes.json();
          
          if (!games || games.length === 0) {
            throw new Error('No products found. Create a test product first.');
          }

          const testGame = games[0];
          
          // Create an order
          const orderRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerEmail: 'test@example.com',
              customerName: 'Test User',
              shippingAddress: {
                line1: '123 Test Street',
                city: 'Test City',
                state: 'CA',
                postalCode: '12345',
                country: 'US'
              },
              items: [{
                itemType: 'game',
                gameId: testGame.id,
                quantity: 1
              }]
            })
          });

          if (!orderRes.ok) {
            const errorData = await orderRes.json();
            throw new Error(errorData.error || 'Failed to create order');
          }

          const order = await orderRes.json();
          setResult({
            type: 'order',
            data: order
          });
          break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e2e8f0',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#fdba74',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Stripe Integration Test Suite
        </h1>

        {/* Info Box */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px',
          display: 'flex',
          gap: '16px'
        }}>
          <Info size={24} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#60a5fa', marginBottom: '8px' }}>Before Testing</h3>
            <p style={{ color: '#94a3b8', marginBottom: '12px' }}>
              Make sure you have added your Stripe API keys to your .env file:
            </p>
            <code style={{
              background: 'rgba(0,0,0,0.5)',
              padding: '12px',
              borderRadius: '6px',
              display: 'block',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              STRIPE_SECRET_KEY=sk_test_YOUR_KEY<br />
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
            </code>
          </div>
        </div>

        {/* Test Buttons */}
        <div style={{
          display: 'grid',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Check Configuration */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#fdba74', marginBottom: '12px' }}>
              1. Check Stripe Configuration
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Verify that Stripe is properly configured and in test mode.
            </p>
            <button
              onClick={() => runTest('check-config')}
              disabled={loading}
              style={{
                background: '#f97316',
                color: '#111827',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Check Configuration
            </button>
          </div>

          {/* Create Test Product */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#fdba74', marginBottom: '12px' }}>
              2. Create Test Product
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Create a test game product for testing the checkout flow.
            </p>
            <button
              onClick={() => runTest('create-product')}
              disabled={loading}
              style={{
                background: '#f97316',
                color: '#111827',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Create Test Product
            </button>
          </div>

          {/* Test Checkout */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#fdba74', marginBottom: '12px' }}>
              3. Test Order Creation
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Create a test order to verify the checkout flow is working.
            </p>
            <button
              onClick={() => runTest('test-checkout')}
              disabled={loading}
              style={{
                background: '#f97316',
                color: '#111827',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Test Order Creation
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            gap: '16px'
          }}>
            <AlertCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            gap: '16px'
          }}>
            <CheckCircle size={24} style={{ color: '#10b981', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#10b981', marginBottom: '12px' }}>
                {result.type === 'config' && 'Configuration Status'}
                {result.type === 'product' && 'Product Created'}
                {result.type === 'order' && 'Order Created'}
              </h3>
              
              {result.type === 'config' && (
                <div>
                  <p>Test Mode: <strong>{result.data.enabled ? 'ENABLED' : 'DISABLED'}</strong></p>
                  <p>Environment: <strong>{result.data.environment}</strong></p>
                  <p>Stripe Mode: <strong>{result.data.stripeMode || 'NOT CONFIGURED'}</strong></p>
                  {!result.data.stripeMode && (
                    <p style={{ color: '#fbbf24', marginTop: '12px' }}>
                      ⚠️ Stripe keys are not configured. Add them to your .env file.
                    </p>
                  )}
                </div>
              )}
              
              {result.type === 'product' && (
                <div>
                  <p>Product ID: <strong>{result.data.id}</strong></p>
                  <p>Title: <strong>{result.data.title}</strong></p>
                  <p>Price: <strong>${result.data.price}</strong></p>
                  <p style={{ marginTop: '12px', color: '#60a5fa' }}>
                    ✓ Product created successfully! You can now test the checkout flow.
                  </p>
                </div>
              )}
              
              {result.type === 'order' && (
                <div>
                  <p>Order ID: <strong>{result.data.id}</strong></p>
                  <p>Total: <strong>${(result.data.totalCents / 100).toFixed(2)}</strong></p>
                  <p>Status: <strong>{result.data.status}</strong></p>
                  <p style={{ marginTop: '12px', color: '#60a5fa' }}>
                    ✓ Order created successfully! 
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    Next steps:
                  </p>
                  <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <li>Go to the store front-end</li>
                    <li>Add products to cart</li>
                    <li>Proceed to checkout</li>
                    <li>Use test card: 4242 4242 4242 4242</li>
                  </ol>
                </div>
              )}
              
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#60a5fa' }}>
                  View Raw Response
                </summary>
                <pre style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Manual Testing Instructions */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '2px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '40px'
        }}>
          <h3 style={{ color: '#a78bfa', marginBottom: '16px' }}>
            Manual Testing Instructions
          </h3>
          <ol style={{ marginLeft: '20px', color: '#c7d2fe', lineHeight: '1.8' }}>
            <li>Ensure Stripe API keys are in your .env file</li>
            <li>Run the configuration check above</li>
            <li>Create a test product if needed</li>
            <li>Go to the main store and add items to cart</li>
            <li>Proceed to checkout</li>
            <li>Use Stripe test cards:
              <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                <li><strong>Success:</strong> 4242 4242 4242 4242</li>
                <li><strong>Requires auth:</strong> 4000 0025 0000 3155</li>
                <li><strong>Declined:</strong> 4000 0000 0000 9995</li>
              </ul>
            </li>
            <li>Check orders in admin panel after completion</li>
          </ol>
        </div>
      </div>
    </div>
  );
}