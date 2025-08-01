'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Settings, Camera, Save, X, Loader2, 
  Quote, MapPin, Globe, Twitter, Gamepad2
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  favoriteQuote?: string;
  role: string;
  profile?: {
    location?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    favoriteGame?: string;
    gamerTag?: string;
    backgroundColor?: string;
    accentColor?: string;
    showEmail: boolean;
    showActivity: boolean;
    emailNotifications: boolean;
  };
}

export default function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    favoriteQuote: '',
    location: '',
    website: '',
    twitter: '',
    discord: '',
    favoriteGame: '',
    gamerTag: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        router.push('/');
        return;
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        username: data.username || '',
        displayName: data.displayName || '',
        bio: data.bio || '',
        favoriteQuote: data.favoriteQuote || '',
        location: data.profile?.location || '',
        website: data.profile?.website || '',
        twitter: data.profile?.twitter || '',
        discord: data.profile?.discord || '',
        favoriteGame: data.profile?.favoriteGame || '',
        gamerTag: data.profile?.gamerTag || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        
        const avatarResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData
        });
        
        if (avatarResponse.ok) {
          const { avatarUrl } = await avatarResponse.json();
          setProfile(prev => prev ? { ...prev, avatarUrl } : null);
        }
      }

      // Update profile data
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio,
          favoriteQuote: formData.favoriteQuote,
          profile: {
            location: formData.location,
            website: formData.website,
            twitter: formData.twitter,
            discord: formData.discord,
            favoriteGame: formData.favoriteGame,
            gamerTag: formData.gamerTag
          }
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0'
    },
    header: {
      background: 'rgba(17, 24, 39, 0.95)',
      borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
      padding: '80px 0 120px',
      position: 'relative' as const
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      marginTop: '-60px',
      position: 'relative' as const,
      zIndex: 10
    },
    profileCard: {
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid #334155',
      padding: '32px',
      marginBottom: '24px'
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '4px solid #f97316',
      marginBottom: '16px',
      position: 'relative' as const,
      overflow: 'hidden' as const
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '14px',
      minHeight: '100px',
      resize: 'vertical' as const
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#f97316' }} />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#fdba74' }}>
            My Profile
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8' }}>
            Manage your Full Uproar account
          </p>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.profileCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={styles.avatar}>
                  {avatarPreview || profile.avatarUrl ? (
                    <img
                      src={avatarPreview || profile.avatarUrl}
                      alt={profile.displayName || profile.username || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      color: '#94a3b8'
                    }}>
                      <User size={48} />
                    </div>
                  )}
                  {editing && (
                    <label style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Camera size={20} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {profile.displayName || profile.username || 'Unnamed User'}
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '8px' }}>{profile.email}</p>
                <span style={{
                  background: '#f97316',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {profile.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={styles.button}
              >
                <Settings size={18} />
                Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSave}
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
                <button
                  onClick={() => {
                    setEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    fetchProfile();
                  }}
                  style={styles.secondaryButton}
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Basic Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Enter display name"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      style={styles.textarea}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      Favorite Quote
                    </label>
                    <textarea
                      value={formData.favoriteQuote}
                      onChange={(e) => setFormData({ ...formData, favoriteQuote: e.target.value })}
                      placeholder="Share your favorite quote"
                      style={styles.textarea}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Additional Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      <Globe size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      <Twitter size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="@username"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                      <Gamepad2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Favorite Game
                    </label>
                    <input
                      type="text"
                      value={formData.favoriteGame}
                      onChange={(e) => setFormData({ ...formData, favoriteGame: e.target.value })}
                      placeholder="Your favorite game"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {profile.favoriteQuote && (
                <div style={{ 
                  background: 'rgba(249, 115, 22, 0.1)', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  marginBottom: '24px'
                }}>
                  <Quote size={20} style={{ color: '#f97316', marginBottom: '8px' }} />
                  <p style={{ fontStyle: 'italic', color: '#fdba74' }}>
                    "{profile.favoriteQuote}"
                  </p>
                </div>
              )}

              {profile.bio && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8' }}>
                    About Me
                  </h3>
                  <p style={{ lineHeight: 1.6 }}>{profile.bio}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {profile.profile?.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                    <MapPin size={16} />
                    <span>{profile.profile.location}</span>
                  </div>
                )}
                {profile.profile?.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                    <Globe size={16} />
                    <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#f97316', textDecoration: 'none' }}>
                      Website
                    </a>
                  </div>
                )}
                {profile.profile?.twitter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                    <Twitter size={16} />
                    <a href={`https://twitter.com/${profile.profile.twitter.replace('@', '')}`} 
                       target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#f97316', textDecoration: 'none' }}>
                      {profile.profile.twitter}
                    </a>
                  </div>
                )}
                {profile.profile?.favoriteGame && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                    <Gamepad2 size={16} />
                    <span>{profile.profile.favoriteGame}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}