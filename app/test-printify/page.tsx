'use client';

import { useState, useEffect } from 'react';

export default function TestPrintify() {
  const [settings, setSettings] = useState<any>({});
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/printify/settings');
      const data = await response.json();
      console.log('Current settings:', data);
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/printify/import');
      const data = await response.json();
      console.log('Test result:', data);
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult('Error: ' + error);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/printify/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printify_api_key: settings.printify_api_key,
          printify_shop_id: settings.printify_shop_id,
          printify_enabled: 'true'
        })
      });
      const data = await response.json();
      console.log('Save response:', data);
      if (response.ok) {
        alert('Settings saved!');
        fetchSettings();
      } else {
        alert('Error saving: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error: ' + error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Printify Settings</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Current Settings:</h2>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Update Settings:</h2>
        <div>
          <label>
            API Key:
            <input
              type="text"
              value={settings.printify_api_key || ''}
              onChange={(e) => setSettings({ ...settings, printify_api_key: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
          </label>
        </div>
        <div>
          <label>
            Shop ID:
            <input
              type="text"
              value={settings.printify_shop_id || ''}
              onChange={(e) => setSettings({ ...settings, printify_shop_id: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            />
          </label>
        </div>
        <button 
          onClick={saveSettings}
          style={{ padding: '0.5rem 1rem', marginRight: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Save Settings
        </button>
        <button 
          onClick={fetchSettings}
          style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}
        >
          Refresh Settings
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Test Connection:</h2>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Testing...' : 'Test Printify Connection'}
        </button>
        {testResult && (
          <pre style={{ marginTop: '1rem', background: '#f3f4f6', padding: '1rem', borderRadius: '4px' }}>
            {testResult}
          </pre>
        )}
      </div>
    </div>
  );
}