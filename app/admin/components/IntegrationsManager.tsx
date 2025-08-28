'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Package, Check, X, AlertCircle, 
  RefreshCw, Settings, DollarSign, Truck,
  Eye, EyeOff, TestTube, Store
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import { useToastStore } from '@/lib/toastStore';

interface IntegrationStatus {
  stripe: {
    configured: boolean;
    mode: 'test' | 'live' | 'not_configured';
    lastWebhook?: string;
  };
  printify: {
    configured: boolean;
    shopId?: string;
    productCount?: number;
    lastSync?: string;
  };
}

export default function IntegrationsManager() {
  const [status, setStatus] = useState<IntegrationStatus>({
    stripe: { configured: false, mode: 'not_configured' },
    printify: { configured: false }
  });
  const [loading, setLoading] = useState(true);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [showPrintifyKey, setShowPrintifyKey] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({ publishable: '', secret: '' });
  const [printifyKeys, setPrintifyKeys] = useState({ apiToken: '', shopId: '' });
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addToast({ message, type });
  };

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    setLoading(true);
    try {
      // Check Stripe status
      const stripeMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_live') ? 'live' : 'test';
      const stripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      // Check Printify status
      const printifyResponse = await fetch('/api/printify/settings');
      const printifyData = await printifyResponse.json();

      setStatus({
        stripe: {
          configured: stripeConfigured,
          mode: stripeConfigured ? stripeMode : 'not_configured'
        },
        printify: {
          configured: printifyData.configured || false,
          shopId: printifyData.shopId,
          productCount: printifyData.productCount
        }
      });
    } catch (error) {
      console.error('Error checking integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStripeKeys = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_publishable_key: stripeKeys.publishable,
          stripe_secret_key: stripeKeys.secret
        })
      });

      if (response.ok) {
        showToast('Stripe keys saved successfully', 'success');
        checkIntegrationStatus();
      } else {
        throw new Error('Failed to save Stripe keys');
      }
    } catch (error) {
      showToast('Failed to save Stripe keys', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePrintifyKeys = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/printify/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: printifyKeys.apiToken,
          shopId: printifyKeys.shopId
        })
      });

      if (response.ok) {
        showToast('Printify settings saved successfully', 'success');
        checkIntegrationStatus();
      } else {
        throw new Error('Failed to save Printify settings');
      }
    } catch (error) {
      showToast('Failed to save Printify settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const importPrintifyProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/printify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importAll: true })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Imported ${data.results.imported} products, updated ${data.results.updated}`, 'success');
        checkIntegrationStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast('Failed to import products from Printify', 'error');
    } finally {
      setLoading(false);
    }
  };

  const testStripeConnection = async () => {
    try {
      const response = await fetch('/api/stripe/test-connection');
      const data = await response.json();
      
      if (data.success) {
        showToast('Stripe connection successful!', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast('Stripe connection failed', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p>Loading integration status...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ color: '#fdba74', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        🔌 Integration Settings
      </h1>

      {/* Stripe Integration */}
      <div style={adminStyles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#fdba74', fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={24} />
            Stripe Payment Processing
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {status.stripe.configured ? (
              <>
                <span style={{
                  background: status.stripe.mode === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                  color: status.stripe.mode === 'live' ? '#10b981' : '#fbbf24',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {status.stripe.mode === 'live' ? '🟢 LIVE MODE' : '🟡 TEST MODE'}
                </span>
                <Check size={20} color="#10b981" />
              </>
            ) : (
              <X size={20} color="#ef4444" />
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            {status.stripe.configured 
              ? `Stripe is configured in ${status.stripe.mode} mode. You can update your keys below.`
              : 'Configure your Stripe API keys to accept payments.'}
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ color: '#e2e8f0', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Publishable Key (starts with pk_)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showStripeKey ? 'text' : 'password'}
                  value={stripeKeys.publishable}
                  onChange={(e) => setStripeKeys({ ...stripeKeys, publishable: e.target.value })}
                  placeholder="pk_live_..."
                  style={adminStyles.input}
                />
                <button
                  onClick={() => setShowStripeKey(!showStripeKey)}
                  style={adminStyles.secondaryButton}
                >
                  {showStripeKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ color: '#e2e8f0', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Secret Key (starts with sk_)
              </label>
              <input
                type="password"
                value={stripeKeys.secret}
                onChange={(e) => setStripeKeys({ ...stripeKeys, secret: e.target.value })}
                placeholder="sk_live_..."
                style={adminStyles.input}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={saveStripeKeys}
              disabled={saving || (!stripeKeys.publishable && !stripeKeys.secret)}
              style={{
                ...adminStyles.primaryButton,
                opacity: saving || (!stripeKeys.publishable && !stripeKeys.secret) ? 0.5 : 1
              }}
            >
              <Settings size={18} />
              Save Stripe Keys
            </button>
            {status.stripe.configured && (
              <button
                onClick={testStripeConnection}
                style={adminStyles.secondaryButton}
              >
                <TestTube size={18} />
                Test Connection
              </button>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ borderTop: '1px solid rgba(249, 115, 22, 0.2)', paddingTop: '16px' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Quick Links:</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#fdba74', fontSize: '14px' }}>
              Stripe Dashboard →
            </a>
            <a href="/test-stripe" target="_blank" 
               style={{ color: '#fdba74', fontSize: '14px' }}>
              Test Payment Page →
            </a>
          </div>
        </div>
      </div>

      {/* Printify Integration */}
      <div style={adminStyles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#fdba74', fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={24} />
            Printify POD Integration
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {status.printify.configured ? (
              <>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}>
                  {status.printify.productCount || 0} products
                </span>
                <Check size={20} color="#10b981" />
              </>
            ) : (
              <X size={20} color="#ef4444" />
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            {status.printify.configured 
              ? `Printify is connected to shop ${status.printify.shopId}. You can sync products below.`
              : 'Configure your Printify API to enable POD fulfillment.'}
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ color: '#e2e8f0', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                API Token
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showPrintifyKey ? 'text' : 'password'}
                  value={printifyKeys.apiToken}
                  onChange={(e) => setPrintifyKeys({ ...printifyKeys, apiToken: e.target.value })}
                  placeholder="Your Printify API token"
                  style={adminStyles.input}
                />
                <button
                  onClick={() => setShowPrintifyKey(!showPrintifyKey)}
                  style={adminStyles.secondaryButton}
                >
                  {showPrintifyKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ color: '#e2e8f0', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Shop ID
              </label>
              <input
                type="text"
                value={printifyKeys.shopId}
                onChange={(e) => setPrintifyKeys({ ...printifyKeys, shopId: e.target.value })}
                placeholder="Your Printify Shop ID"
                style={adminStyles.input}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={savePrintifyKeys}
              disabled={saving || (!printifyKeys.apiToken && !printifyKeys.shopId)}
              style={{
                ...adminStyles.primaryButton,
                opacity: saving || (!printifyKeys.apiToken && !printifyKeys.shopId) ? 0.5 : 1
              }}
            >
              <Settings size={18} />
              Save Printify Settings
            </button>
            {status.printify.configured && (
              <button
                onClick={importPrintifyProducts}
                style={adminStyles.primaryButton}
                disabled={loading}
              >
                <Store size={18} />
                Import All Products
              </button>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ borderTop: '1px solid rgba(249, 115, 22, 0.2)', paddingTop: '16px' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Quick Links:</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://printify.com" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#fdba74', fontSize: '14px' }}>
              Printify Dashboard →
            </a>
            <a href="/admin/merch" target="_blank" 
               style={{ color: '#fdba74', fontSize: '14px' }}>
              Manage Merchandise →
            </a>
          </div>
        </div>
      </div>

      {/* Integration Info */}
      <div style={{
        ...adminStyles.card,
        background: 'rgba(251, 191, 36, 0.1)',
        border: '2px solid rgba(251, 191, 36, 0.3)'
      }}>
        <h3 style={{ color: '#fbbf24', fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          How POD Integration Works
        </h3>
        <ol style={{ color: '#e2e8f0', fontSize: '14px', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Customer orders Printify product on your site</li>
          <li>Payment processed through Stripe</li>
          <li>Order automatically sent to Printify</li>
          <li>Printify produces and ships directly to customer</li>
          <li>You keep the profit (retail - base cost - fees)</li>
        </ol>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>
          <strong>Example:</strong> $29.99 shirt - $8.95 base cost - $1.17 Stripe fee = <span style={{ color: '#10b981' }}>$19.87 profit</span>
        </p>
      </div>
    </div>
  );
}