'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TestTube, Wrench, Shield, Trash2 } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface TestMode {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  dangerous?: boolean;
}

export default function TestModesView() {
  const [testModes, setTestModes] = useState<TestMode[]>([
    {
      key: 'transaction_test_mode',
      name: 'Transaction Test Mode',
      description: 'Enable test payment processing - no real charges will occur',
      icon: <TestTube size={20} />,
      enabled: false
    },
    {
      key: 'debug_mode',
      name: 'Debug Mode',
      description: 'Show debug information and development tools',
      icon: <Wrench size={20} />,
      enabled: false
    },
    {
      key: 'maintenance_mode',
      name: 'Maintenance Mode',
      description: 'Put site in maintenance mode - shows maintenance page to visitors',
      icon: <Shield size={20} />,
      enabled: false,
      dangerous: true
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchTestModes();
  }, []);

  const fetchTestModes = async () => {
    try {
      const response = await fetch('/api/settings/test-mode');
      const data = await response.json();
      
      setTestModes(modes => modes.map(mode => ({
        ...mode,
        enabled: mode.key === 'transaction_test_mode' ? data.transactionTestMode : mode.enabled
      })));
      
      // Fetch other modes if API expands
    } catch (error) {
      console.error('Error fetching test modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTestMode = async (key: string, enabled: boolean) => {
    setSaving(key);
    
    try {
      const response = await fetch('/api/settings/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: enabled })
      });

      if (response.ok) {
        setTestModes(modes => modes.map(mode => 
          mode.key === key ? { ...mode, enabled } : mode
        ));
        
        // If it's transaction test mode, reload to update banner
        if (key === 'transaction_test_mode') {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error updating test mode:', error);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#fdba74' }}>Loading test modes...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Test Modes</h1>
        <p style={adminStyles.subtitle}>Manage development and testing features</p>
      </div>

      <div style={adminStyles.section}>
        <div style={{
          ...adminStyles.card,
          padding: '24px',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderColor: '#f97316',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={24} style={{ color: '#f97316', flexShrink: 0 }} />
            <div>
              <h3 style={{ color: '#fdba74', marginBottom: '8px', fontSize: '18px' }}>
                Warning: Test Modes Active
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Test modes are intended for development and testing only. 
                Some modes may affect site functionality or visibility to users.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {testModes.map((mode) => (
            <div
              key={mode.key}
              style={{
                ...adminStyles.card,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: mode.enabled ? 'rgba(249, 115, 22, 0.05)' : 'transparent',
                borderColor: mode.enabled ? '#f97316' : '#334155'
              }}
            >
              <div style={{ 
                color: mode.enabled ? '#f97316' : '#64748b',
                flexShrink: 0
              }}>
                {mode.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  color: '#fdba74', 
                  marginBottom: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {mode.name}
                </h3>
                <p style={{ 
                  color: '#94a3b8', 
                  fontSize: '14px',
                  margin: 0
                }}>
                  {mode.description}
                </p>
              </div>

              {mode.dangerous && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  DANGEROUS
                </div>
              )}

              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '48px',
                height: '24px',
                cursor: saving === mode.key ? 'not-allowed' : 'pointer',
                opacity: saving === mode.key ? 0.5 : 1
              }}>
                <input
                  type="checkbox"
                  checked={mode.enabled}
                  onChange={(e) => toggleTestMode(mode.key, e.target.checked)}
                  disabled={saving === mode.key}
                  style={{ display: 'none' }}
                />
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: mode.enabled ? '#f97316' : '#475569',
                  borderRadius: '12px',
                  transition: 'all 0.3s',
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: mode.enabled ? '26px' : '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <h4 style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '14px' }}>
            Active Test Modes:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {testModes.filter(m => m.enabled).length === 0 ? (
              <span style={{ color: '#64748b', fontSize: '14px' }}>
                No test modes active
              </span>
            ) : (
              testModes.filter(m => m.enabled).map(mode => (
                <span
                  key={mode.key}
                  style={{
                    backgroundColor: '#f97316',
                    color: '#111827',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {mode.name.toUpperCase()}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Clear Test Data Section */}
      <div style={adminStyles.section}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '1.5rem' }}>Clear Test Data</h3>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          Remove test data to allow deletion of games and merchandise
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              const confirmPhrase = prompt('Type "CLEAR TEST DATA" to confirm deletion of ALL orders:');
              if (confirmPhrase === 'CLEAR TEST DATA') {
                try {
                  const response = await fetch('/api/admin/clear-test-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'orders', confirmPhrase })
                  });
                  const result = await response.json();
                  if (response.ok) {
                    alert(`Cleared:\n- ${result.results.orders.orders} orders\n- ${result.results.orders.orderItems} order items\n- Reset inventory for ${result.results.orders.inventoryReset + result.results.orders.gameInventoryReset} items`);
                  } else {
                    alert(result.error);
                  }
                } catch (error) {
                  alert('Failed to clear test data');
                }
              }
            }}
            style={{
              ...adminStyles.button,
              background: '#dc2626',
            }}
          >
            <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
            Clear All Orders
          </button>

          <button
            onClick={async () => {
              const confirmPhrase = prompt('Type "CLEAR TEST DATA" to confirm deletion of ALL test data:');
              if (confirmPhrase === 'CLEAR TEST DATA') {
                try {
                  const response = await fetch('/api/admin/clear-test-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'all', confirmPhrase })
                  });
                  const result = await response.json();
                  if (response.ok) {
                    alert('All test data cleared successfully! Check console for details.');
                    console.log('Cleared data:', result.results);
                  } else {
                    alert(result.error);
                  }
                } catch (error) {
                  alert('Failed to clear test data');
                }
              }
            }}
            style={{
              ...adminStyles.button,
              background: '#991b1b',
            }}
          >
            <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
            Clear ALL Test Data
          </button>
        </div>
      </div>
    </>
  );
}