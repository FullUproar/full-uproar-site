'use client';

import { useState, useEffect } from 'react';
import { TestTube, AlertTriangle } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

export default function TestModeToggle() {
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current test mode status
    const checkTestMode = async () => {
      try {
        const response = await fetch('/api/admin/test-mode');
        const data = await response.json();
        setTestMode(data.enabled);
      } catch (error) {
        console.error('Error checking test mode:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkTestMode();
  }, []);

  const toggleTestMode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !testMode })
      });
      
      if (response.ok) {
        setTestMode(!testMode);
        
        // Show notification
        alert(`Test mode ${!testMode ? 'enabled' : 'disabled'}. ${!testMode ? 'Using test payment methods and mock shipping.' : 'Using production settings.'}`);
      }
    } catch (error) {
      console.error('Error toggling test mode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        ...adminStyles.card,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: 0.5
      }}>
        <TestTube size={20} style={{ color: '#fdba74' }} />
        <span style={{ color: '#94a3b8' }}>Loading test mode status...</span>
      </div>
    );
  }

  return (
    <div style={{
      ...adminStyles.card,
      background: testMode ? 'rgba(249, 115, 22, 0.1)' : 'rgba(30, 41, 59, 0.8)',
      border: `2px solid ${testMode ? 'rgba(249, 115, 22, 0.5)' : 'rgba(249, 115, 22, 0.2)'}`,
      transition: 'all 0.3s'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TestTube size={24} style={{ color: testMode ? '#f97316' : '#fdba74' }} />
          <div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#fdba74',
              marginBottom: '4px'
            }}>
              Test Mode
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              {testMode ? 'Active - Using test payments' : 'Inactive - Production mode'}
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleTestMode}
          disabled={loading}
          style={{
            ...adminStyles.primaryButton,
            background: testMode ? '#ef4444' : '#10b981',
            borderColor: testMode ? '#ef4444' : '#10b981',
            opacity: loading ? 0.5 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {testMode ? 'Disable' : 'Enable'} Test Mode
        </button>
      </div>

      {testMode && (
        <div style={{
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: '#fca5a5' }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Test mode is active!</p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Payments use Stripe test mode</li>
              <li>Shipping labels are simulated</li>
              <li>Emails are logged, not sent</li>
              <li>Inventory changes are tracked but reversible</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        paddingTop: '16px', 
        borderTop: '1px solid rgba(249, 115, 22, 0.2)' 
      }}>
        <h4 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: '#fdba74',
          marginBottom: '12px'
        }}>
          Test Actions
        </h4>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={adminStyles.outlineButton}
            onClick={() => window.open('/api/test/orders', '_blank')}
          >
            Generate Test Order
          </button>
          
          <button
            style={adminStyles.outlineButton}
            onClick={() => {
              if (confirm('This will create 50 test orders. Continue?')) {
                fetch('/api/test/bulk-orders', { method: 'POST' })
                  .then(() => alert('Test orders created!'))
                  .catch(err => alert('Error creating test orders'));
              }
            }}
          >
            Bulk Test Orders
          </button>
          
          <button
            style={adminStyles.outlineButton}
            onClick={() => window.open('/checkout?test=true', '_blank')}
          >
            Test Checkout
          </button>
        </div>
      </div>
    </div>
  );
}