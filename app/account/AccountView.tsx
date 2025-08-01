'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { 
  User, Settings, Shield, Bell, Palette, Globe, 
  Mail, Phone, Camera, Save, X, Loader2, 
  Key, Smartphone, LogOut, Trash2, ChevronRight,
  CheckCircle, AlertCircle, Info, Package,
  Activity, ShoppingBag, ArrowLeft
} from 'lucide-react';
import Navigation from '../components/Navigation';

type TabType = 'profile' | 'security' | 'preferences' | 'notifications' | 'orders' | 'activity';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface UserSession {
  id: string;
  browser?: string;
  os?: string;
  device?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  lastActive: string;
  createdAt: string;
  isActive: boolean;
}

export default function AccountView() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
  });

  useEffect(() => {
    if (isLoaded && user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (activeTab === 'security' && user) {
      fetchSessions();
    }
  }, [activeTab, user]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch('/api/account/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/account/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchSessions();
        setMessage({ type: 'success', text: 'Session revoked successfully' });
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      setMessage({ type: 'error', text: 'Failed to revoke session' });
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to sign out all other sessions?')) return;
    
    try {
      const response = await fetch('/api/account/sessions/revoke-all', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchSessions();
        setMessage({ type: 'success', text: 'All other sessions have been signed out' });
      }
    } catch (error) {
      console.error('Error revoking sessions:', error);
      setMessage({ type: 'error', text: 'Failed to revoke sessions' });
    }
  };

  const tabs: TabConfig[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={20} />,
      description: 'Personal information'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <Package size={20} />,
      description: 'Track purchases'
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity size={20} />,
      description: 'Recent activity'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield size={20} />,
      description: 'Password & auth'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Palette size={20} />,
      description: 'Customize'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={20} />,
      description: 'Email & alerts'
    }
  ];

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      await user.update({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0'
    },
    header: {
      padding: '20px 0',
      marginBottom: '20px'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px 48px'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gap: '24px',
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr'
      }
    },
    sidebar: {
      background: 'rgba(30, 41, 59, 0.95)',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '20px',
      height: 'fit-content'
    },
    mainPanel: {
      background: 'rgba(30, 41, 59, 0.95)',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '32px'
    },
    tabButton: {
      width: '100%',
      padding: '10px 12px',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: '#94a3b8',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.2s',
      marginBottom: '4px',
      textAlign: 'left' as const
    },
    activeTab: {
      background: 'rgba(249, 115, 22, 0.1)',
      color: '#fdba74',
      borderLeft: '3px solid #f97316'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    button: {
      padding: '10px 20px',
      background: '#f97316',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    secondaryButton: {
      padding: '10px 20px',
      background: 'transparent',
      color: '#94a3b8',
      border: '1px solid #334155',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    }
  };

  if (!isLoaded) {
    return (
      <>
        <Navigation />
        <div style={styles.container}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '80vh' 
          }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#f97316' }} />
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <>
      <Navigation />
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.color = '#fdba74';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fdba74' }}>
                  My Account
                </h1>
              </div>
            </div>
            <p style={{ fontSize: '18px', color: '#94a3b8', marginLeft: '44px' }}>
              Manage your Full Uproar account and preferences
            </p>
          </div>
        </div>

        <div style={styles.content}>
          {message && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                         message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                         'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${
                message.type === 'success' ? '#10b981' : 
                message.type === 'error' ? '#ef4444' : 
                '#3b82f6'
              }`
            }}>
              {message.type === 'success' && <CheckCircle size={20} color="#10b981" />}
              {message.type === 'error' && <AlertCircle size={20} color="#ef4444" />}
              {message.type === 'info' && <Info size={20} color="#3b82f6" />}
              <span>{message.text}</span>
            </div>
          )}

          <div style={styles.mainGrid}>
            {/* Sidebar Navigation */}
            <div style={styles.sidebar}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '12px' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #f97316'
                  }}>
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || ''}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '50%',
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <User size={24} style={{ color: '#94a3b8' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.fullName || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                </div>
              </div>

              <nav>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      ...styles.tabButton,
                      ...(activeTab === tab.id ? styles.activeTab : {})
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {tab.icon}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{tab.label}</div>
                      <div style={{ fontSize: '11px', opacity: 0.8 }}>
                        {tab.description}
                      </div>
                    </div>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </nav>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #334155' }}>
                <button
                  onClick={handleSignOut}
                  style={{...styles.secondaryButton, fontSize: '14px', padding: '8px 16px'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Main Content Panel */}
            <div style={styles.mainPanel}>
              {activeTab === 'profile' && (
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    Profile Information
                  </h2>
                  
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your first name"
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                          Username
                        </label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          style={styles.input}
                          placeholder="Choose a username"
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          style={{ ...styles.input, opacity: 0.7, cursor: 'not-allowed' }}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: '1px solid #334155',
                    paddingTop: '24px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                      Profile Photo
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #334155',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.fullName || ''}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover' 
                            }}
                          />
                        ) : (
                          <User size={40} style={{ color: '#64748b' }} />
                        )}
                      </div>
                      <div>
                        <button style={styles.secondaryButton}>
                          <Camera size={18} />
                          Change Photo
                        </button>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                          JPG, PNG or GIF. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleProfileUpdate}
                      disabled={saving}
                      style={{
                        ...styles.button,
                        opacity: saving ? 0.7 : 1,
                        cursor: saving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    Order History
                  </h2>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      background: 'rgba(51, 65, 85, 0.5)',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Order #1234
                          </h3>
                          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                            Placed on December 15, 2024
                          </p>
                        </div>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          Delivered
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '14px', marginBottom: '4px' }}>Chaos Cards: Fantasy Edition</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fdba74' }}>$24.99</p>
                        </div>
                        <button style={styles.secondaryButton}>
                          <Package size={18} />
                          View Details
                        </button>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(51, 65, 85, 0.5)',
                      borderRadius: '8px',
                      padding: '20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Order #1235
                          </h3>
                          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                            Placed on December 20, 2024
                          </p>
                        </div>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          In Transit
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '14px', marginBottom: '4px' }}>Fugly Approved T-Shirt</p>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fdba74' }}>$29.99</p>
                        </div>
                        <button style={styles.secondaryButton}>
                          <Package size={18} />
                          Track Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    Recent Activity
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      background: 'rgba(51, 65, 85, 0.3)',
                      borderRadius: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(249, 115, 22, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShoppingBag size={20} style={{ color: '#f97316' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold' }}>Order Placed</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>You ordered Fugly Approved T-Shirt</p>
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>2 hours ago</p>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      background: 'rgba(51, 65, 85, 0.3)',
                      borderRadius: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold' }}>Order Delivered</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Order #1234 was delivered</p>
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>5 days ago</p>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      background: 'rgba(51, 65, 85, 0.3)',
                      borderRadius: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={20} style={{ color: '#3b82f6' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold' }}>Profile Updated</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8' }}>You updated your profile information</p>
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>1 week ago</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    Security Settings
                  </h2>

                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                      Password
                    </h3>
                    <div style={{
                      background: 'rgba(51, 65, 85, 0.5)',
                      borderRadius: '8px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          Password
                        </div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                          Last changed 3 months ago
                        </div>
                      </div>
                      <button style={styles.secondaryButton}>
                        <Key size={18} />
                        Change Password
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                      Two-Factor Authentication
                    </h3>
                    <div style={{
                      background: 'rgba(51, 65, 85, 0.5)',
                      borderRadius: '8px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          Two-Factor Authentication
                        </div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                          Add an extra layer of security to your account
                        </div>
                      </div>
                      <button style={styles.button}>
                        <Smartphone size={18} />
                        Enable 2FA
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                      Active Sessions
                    </h3>
                    {loadingSessions ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#fdba74' }} />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div style={{
                        background: 'rgba(51, 65, 85, 0.5)',
                        borderRadius: '8px',
                        padding: '20px',
                        textAlign: 'center',
                        color: '#94a3b8'
                      }}>
                        No active sessions found
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sessions.map((session, index) => (
                          <div
                            key={session.id}
                            style={{
                              background: 'rgba(51, 65, 85, 0.5)',
                              borderRadius: '8px',
                              padding: '20px',
                              border: index === 0 ? '2px solid rgba(249, 115, 22, 0.3)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                  {index === 0 ? 'Current Session' : `${session.device || 'Desktop'} Session`}
                                </div>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                                  {session.os || 'Unknown OS'} • {session.browser || 'Unknown Browser'}
                                </div>
                                {session.ipAddress && (
                                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                                    IP: {session.ipAddress}
                                    {session.city && session.country && ` • ${session.city}, ${session.country}`}
                                  </div>
                                )}
                                <div style={{ fontSize: '13px', color: '#64748b' }}>
                                  Last active: {new Date(session.lastActive).toLocaleString()}
                                </div>
                              </div>
                              {index !== 0 && (
                                <button
                                  onClick={() => handleRevokeSession(session.id)}
                                  style={{
                                    ...styles.secondaryButton,
                                    padding: '6px 12px',
                                    fontSize: '13px'
                                  }}
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {sessions.length > 1 && (
                          <button
                            onClick={handleRevokeAllSessions}
                            style={styles.secondaryButton}
                          >
                            <LogOut size={18} />
                            Sign Out All Other Sessions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    Preferences
                  </h2>

                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Theme
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                      style={styles.input}
                    >
                      <option value="dark">Dark (Fugly Approved)</option>
                      <option value="light">Light (Not Recommended)</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      style={styles.input}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      style={styles.input}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>

                  <button style={styles.button}>
                    <Save size={18} />
                    Save Preferences
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    Notification Settings
                  </h2>

                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                      Email Notifications
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>Order Updates</div>
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                            Get notified about your order status
                          </div>
                        </div>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={preferences.marketingEmails}
                          onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>Marketing Emails</div>
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                            Receive updates about new games and merch
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                      Push Notifications
                    </h3>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={preferences.pushNotifications}
                        onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>Browser Notifications</div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                          Get notified in your browser
                        </div>
                      </div>
                    </label>
                  </div>

                  <button style={styles.button}>
                    <Save size={18} />
                    Save Notification Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}