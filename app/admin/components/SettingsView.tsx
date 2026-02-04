'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Key, Globe, Mail, Shield, Bell, Database, Package } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export default function SettingsView() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const settingsMap = data.reduce((acc: Record<string, Setting>, setting: Setting) => {
          acc[setting.key] = setting;
          return acc;
        }, {});
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    if (!editedValues[key] && editedValues[key] !== '') return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editedValues[key] })
      });
      
      if (response.ok) {
        await fetchSettings();
        setEditedValues(prev => {
          const { [key]: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => {
    return editedValues[key] !== undefined ? editedValues[key] : (settings[key]?.value || '');
  };

  const hasChanges = (key: string) => {
    return editedValues[key] !== undefined && editedValues[key] !== settings[key]?.value;
  };

  const settingGroups = [
    {
      title: 'Store Configuration',
      icon: <Globe size={24} />,
      settings: [
        { key: 'store_name', label: 'Store Name', type: 'text' },
        { key: 'store_url', label: 'Store URL', type: 'url' },
        { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
        { key: 'tax_rate', label: 'Tax Rate (%)', type: 'number' },
      ]
    },
    {
      title: 'Email Settings',
      icon: <Mail size={24} />,
      settings: [
        { key: 'smtp_host', label: 'SMTP Host', type: 'text' },
        { key: 'smtp_port', label: 'SMTP Port', type: 'number' },
        { key: 'smtp_user', label: 'SMTP Username', type: 'text' },
        { key: 'smtp_pass', label: 'SMTP Password', type: 'password' },
        { key: 'from_email', label: 'From Email', type: 'email' },
        { key: 'from_name', label: 'From Name', type: 'text' },
      ]
    },
    {
      title: 'Payment Configuration',
      icon: <Key size={24} />,
      settings: [
        { key: 'stripe_publishable_key', label: 'Stripe Publishable Key', type: 'text' },
        { key: 'stripe_secret_key', label: 'Stripe Secret Key', type: 'password' },
        { key: 'stripe_webhook_secret', label: 'Stripe Webhook Secret', type: 'password' },
        { key: 'payment_test_mode', label: 'Test Mode', type: 'boolean' },
      ]
    },
    {
      title: 'Printify Integration',
      icon: <Package size={24} />,
      settings: [
        { key: 'printify_api_key', label: 'Printify API Key', type: 'password' },
        { key: 'printify_shop_id', label: 'Printify Shop ID', type: 'text' },
        { key: 'printify_webhook_secret', label: 'Printify Webhook Secret', type: 'password' },
      ]
    },
    {
      title: 'Security',
      icon: <Shield size={24} />,
      settings: [
        { key: 'enable_recaptcha', label: 'Enable reCAPTCHA', type: 'boolean' },
        { key: 'recaptcha_site_key', label: 'reCAPTCHA Site Key', type: 'text' },
        { key: 'recaptcha_secret_key', label: 'reCAPTCHA Secret Key', type: 'password' },
        { key: 'session_timeout', label: 'Session Timeout (minutes)', type: 'number' },
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell size={24} />,
      settings: [
        { key: 'notify_new_orders', label: 'Notify on New Orders', type: 'boolean' },
        { key: 'notify_low_stock', label: 'Notify on Low Stock', type: 'boolean' },
        { key: 'low_stock_threshold', label: 'Low Stock Threshold', type: 'number' },
        { key: 'admin_notification_email', label: 'Admin Email', type: 'email' },
      ]
    }
  ];

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#FBDB65' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>System Settings</h1>
        <p style={adminStyles.subtitle}>Configure your store and system preferences</p>
      </div>

      {settingGroups.map(group => (
        <div key={group.title} style={{ ...adminStyles.section, marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ color: '#FF8200' }}>{group.icon}</div>
            <h2 style={adminStyles.sectionTitle}>{group.title}</h2>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {group.settings.map(setting => {
              const value = getValue(setting.key);
              const changed = hasChanges(setting.key);
              const settingData = settings[setting.key];

              return (
                <div key={setting.key} style={adminStyles.fieldGroup}>
                  <label style={adminStyles.label}>
                    {setting.label}
                    {settingData?.description && (
                      <span style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#64748b', 
                        fontWeight: 'normal',
                        marginTop: '4px'
                      }}>
                        {settingData.description}
                      </span>
                    )}
                  </label>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {setting.type === 'boolean' ? (
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer' 
                      }}>
                        <input
                          type="checkbox"
                          checked={value === 'true'}
                          onChange={(e) => handleChange(setting.key, e.target.checked ? 'true' : 'false')}
                          style={adminStyles.checkbox}
                        />
                        <span style={{ marginLeft: '8px', color: '#e2e8f0' }}>
                          {value === 'true' ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    ) : setting.type === 'select' && setting.options ? (
                      <select
                        value={value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        style={{ ...adminStyles.select, flex: 1 }}
                      >
                        {setting.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : setting.type === 'textarea' ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        style={{ ...adminStyles.textarea, flex: 1 }}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={setting.type || 'text'}
                        value={value}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        style={{ ...adminStyles.input, flex: 1 }}
                      />
                    )}

                    {changed && (
                      <button
                        onClick={() => handleSave(setting.key)}
                        disabled={saving}
                        style={{
                          ...adminStyles.button,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} />
                        Save
                      </button>
                    )}
                  </div>

                  {settingData?.updatedAt && (
                    <p style={{ 
                      fontSize: '11px', 
                      color: '#64748b', 
                      marginTop: '4px' 
                    }}>
                      Last updated: {new Date(settingData.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={adminStyles.section}>
        <h2 style={adminStyles.sectionTitle}>Advanced Settings</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{
            ...adminStyles.card,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Database size={32} style={{ color: '#FF8200' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#FBDB65', marginBottom: '4px' }}>Database Backup</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Download a backup of your database
              </p>
            </div>
            <button
              style={adminStyles.outlineButton}
              onClick={() => alert('Database backup functionality coming soon!')}
            >
              Backup
            </button>
          </div>

          <div style={{
            ...adminStyles.card,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <RefreshCw size={32} style={{ color: '#3b82f6' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#FBDB65', marginBottom: '4px' }}>Clear Cache</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Clear all system caches
              </p>
            </div>
            <button
              style={adminStyles.outlineButton}
              onClick={() => alert('Cache cleared successfully!')}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </>
  );
}