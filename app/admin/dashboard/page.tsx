'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ImageUpload from '../../components/ImageUpload';
import DeploymentInfo from '../../components/DeploymentInfo';

interface Game {
  id: number;
  title: string;
  tagline: string;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  imageUrl?: string;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo?: string;
}

interface Comic {
  id: number;
  title: string;
  episode: string;
  description?: string;
  imageUrl?: string;
}

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
}

interface Artwork {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags?: string;
}

type EditMode = 'create' | 'edit' | null;

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState<Game[]>([]);
  const [comics, setComics] = useState<Comic[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [artwork, setArtwork] = useState<Artwork[]>([]);
  const [message, setMessage] = useState('');
  
  // Modal states
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [gameForm, setGameForm] = useState({
    title: '', tagline: '', description: '', priceCents: '', players: '', timeToPlay: '', 
    ageRating: '', imageUrl: '', isBundle: false, isPreorder: true, featured: false, bundleInfo: ''
  });
  const [comicForm, setComicForm] = useState({
    title: '', episode: '', description: '', imageUrl: ''
  });
  const [newsForm, setNewsForm] = useState({
    title: '', excerpt: '', content: ''
  });
  const [artworkForm, setArtworkForm] = useState({
    name: '', description: '', imageUrl: '', category: '', tags: ''
  });

  // Basic admin check
  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
  }, [user, isLoaded]);

  useEffect(() => {
    fetchGames();
    fetchComics();
    fetchNews();
    fetchArtwork();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchComics = async () => {
    try {
      const response = await fetch('/api/comics');
      const data = await response.json();
      setComics(data);
    } catch (error) {
      console.error('Error fetching comics:', error);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchArtwork = async () => {
    try {
      const response = await fetch('/api/artwork');
      const data = await response.json();
      setArtwork(data);
    } catch (error) {
      console.error('Error fetching artwork:', error);
    }
  };

  const openCreateModal = () => {
    setEditMode('create');
    setEditingItem(null);
    // Reset forms
    setGameForm({
      title: '', tagline: '', description: '', priceCents: '', players: '', timeToPlay: '', 
      ageRating: '', imageUrl: '', isBundle: false, isPreorder: true, featured: false, bundleInfo: ''
    });
    setComicForm({ title: '', episode: '', description: '', imageUrl: '' });
    setNewsForm({ title: '', excerpt: '', content: '' });
    setArtworkForm({ name: '', description: '', imageUrl: '', category: '', tags: '' });
  };

  const openEditModal = (item: any) => {
    setEditMode('edit');
    setEditingItem(item);
    
    if (activeTab === 'games') {
      setGameForm({
        title: item.title || '',
        tagline: item.tagline || '',
        description: item.description || '',
        priceCents: item.priceCents ? (item.priceCents / 100).toString() : '',
        players: item.players || '',
        timeToPlay: item.timeToPlay || '',
        ageRating: item.ageRating || '',
        imageUrl: item.imageUrl || '',
        isBundle: item.isBundle || false,
        isPreorder: item.isPreorder || false,
        featured: item.featured || false,
        bundleInfo: item.bundleInfo || ''
      });
    } else if (activeTab === 'comics') {
      setComicForm({
        title: item.title || '',
        episode: item.episode || '',
        description: item.description || '',
        imageUrl: item.imageUrl || ''
      });
    } else if (activeTab === 'news') {
      setNewsForm({
        title: item.title || '',
        excerpt: item.excerpt || '',
        content: item.content || ''
      });
    } else if (activeTab === 'artwork') {
      setArtworkForm({
        name: item.name || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        category: item.category || '',
        tags: item.tags || ''
      });
    }
  };

  const closeModal = () => {
    setEditMode(null);
    setEditingItem(null);
    setMessage('');
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    try {
      let endpoint = '';
      if (activeTab === 'games') {
        endpoint = `/api/games?id=${item.id}`;
      } else if (activeTab === 'comics') {
        endpoint = `/api/comics?id=${item.id}`;
      } else if (activeTab === 'news') {
        endpoint = `/api/news?id=${item.id}`;
      } else if (activeTab === 'artwork') {
        endpoint = `/api/artwork?id=${item.id}`;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage(`✅ ${activeTab.slice(0, -1)} deleted successfully!`);
        
        // Refresh data
        if (activeTab === 'games') fetchGames();
        else if (activeTab === 'comics') fetchComics();
        else if (activeTab === 'news') fetchNews();
        else if (activeTab === 'artwork') fetchArtwork();
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error deleting ${activeTab.slice(0, -1)}`);
      }
    } catch (error) {
      setMessage(`❌ Error deleting ${activeTab.slice(0, -1)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      let endpoint = '';
      let body = {};
      
      if (activeTab === 'games') {
        endpoint = '/api/games';
        body = { ...gameForm, priceCents: Math.round(parseFloat(gameForm.priceCents) * 100) };
      } else if (activeTab === 'comics') {
        endpoint = '/api/comics';
        body = comicForm;
      } else if (activeTab === 'news') {
        endpoint = '/api/news';
        body = newsForm;
      } else if (activeTab === 'artwork') {
        endpoint = '/api/artwork';
        body = artworkForm;
      }

      const method = editMode === 'create' ? 'POST' : 'PUT';
      const url = editMode === 'edit' ? `${endpoint}?id=${editingItem.id}` : endpoint;
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setMessage(`✅ ${activeTab.slice(0, -1)} ${editMode === 'create' ? 'created' : 'updated'} successfully!`);
        
        // Refresh data
        if (activeTab === 'games') fetchGames();
        else if (activeTab === 'comics') fetchComics();
        else if (activeTab === 'news') fetchNews();
        else if (activeTab === 'artwork') fetchArtwork();
        
        setTimeout(closeModal, 1000);
      } else {
        setMessage(`❌ Error ${editMode === 'create' ? 'creating' : 'updating'} ${activeTab.slice(0, -1)}`);
      }
    } catch (error) {
      setMessage(`❌ Error ${editMode === 'create' ? 'creating' : 'updating'} ${activeTab.slice(0, -1)}`);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div style={{ padding: '2rem', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)', minHeight: '100vh' }}>
        <div style={{ color: '#f97316', fontSize: '1.5rem', fontWeight: 'bold' }}>Loading Fugly's chaos control panel...</div>
      </div>
    );
  }

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' },
    header: { background: '#f97316', color: 'white', padding: '1.5rem' },
    headerTitle: { fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' },
    headerSubtitle: { color: '#fed7aa' },
    main: { maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' },
    
    // Navigation
    tabContainer: { background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem' },
    tabNav: { display: 'flex', borderBottom: '1px solid #e5e7eb', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem' },
    tabList: { display: 'flex' },
    tab: { padding: '1rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: 'transparent' },
    activeTab: { borderBottom: '2px solid #f97316', color: '#ea580c' },
    inactiveTab: { color: '#6b7280' },
    
    // Create button
    createButton: {
      background: '#f97316', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
      fontWeight: 'bold', border: 'none', cursor: 'pointer', margin: '1rem'
    },
    
    // Table
    tableContainer: { background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { background: '#f9fafb', padding: '1rem', textAlign: 'left' as const, fontWeight: 'bold', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '1rem', borderBottom: '1px solid #e5e7eb' },
    
    // Modal
    modalOverlay: {
      position: 'fixed' as const, inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem'
    },
    modal: {
      background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto'
    },
    modalHeader: { padding: '1.5rem', borderBottom: '1px solid #e5e7eb' },
    modalTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' },
    modalBody: { padding: '1.5rem' },
    modalFooter: { padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '1rem' },
    
    // Form
    form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
    formGroup: { display: 'flex', flexDirection: 'column' as const },
    label: { fontWeight: 600, marginBottom: '0.5rem', color: '#374151' },
    input: { padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' },
    textarea: { padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', minHeight: '6rem', resize: 'vertical' as const },
    gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    checkboxGroup: { display: 'flex', gap: '1rem', alignItems: 'center' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
    
    // Buttons
    primaryButton: { background: '#f97316', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
    secondaryButton: { background: '#6b7280', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
    editButton: { background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', border: 'none', cursor: 'pointer' },
    deleteButton: { background: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', border: 'none', cursor: 'pointer', marginLeft: '0.5rem' },
    
    // Message
    message: { background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' },
    
    // Image preview
    imagePreview: { width: '60px', height: '60px', objectFit: 'cover' as const, borderRadius: '0.375rem' }
  };

  const getCurrentData = () => {
    if (activeTab === 'games') return games;
    if (activeTab === 'comics') return comics;
    if (activeTab === 'news') return news;
    return artwork;
  };

  const renderTableHeaders = () => {
    if (activeTab === 'games') {
      return (
        <tr>
          <th style={styles.th}>Image</th>
          <th style={styles.th}>Title</th>
          <th style={styles.th}>Price</th>
          <th style={styles.th}>Players</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Actions</th>
        </tr>
      );
    }
    if (activeTab === 'comics') {
      return (
        <tr>
          <th style={styles.th}>Image</th>
          <th style={styles.th}>Title</th>
          <th style={styles.th}>Episode</th>
          <th style={styles.th}>Description</th>
          <th style={styles.th}>Actions</th>
        </tr>
      );
    }
    if (activeTab === 'artwork') {
      return (
        <tr>
          <th style={styles.th}>Image</th>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Tags</th>
          <th style={styles.th}>Actions</th>
        </tr>
      );
    }
    return (
      <tr>
        <th style={styles.th}>Title</th>
        <th style={styles.th}>Excerpt</th>
        <th style={styles.th}>Date</th>
        <th style={styles.th}>Actions</th>
      </tr>
    );
  };

  const renderTableRow = (item: any) => {
    if (activeTab === 'games') {
      return (
        <tr key={item.id}>
          <td style={styles.td}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} style={styles.imagePreview} />
            ) : (
              <div style={{ ...styles.imagePreview, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                No image
              </div>
            )}
          </td>
          <td style={styles.td}>
            <div style={{ fontWeight: 'bold' }}>{item.title}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.tagline}</div>
          </td>
          <td style={styles.td}>${(item.priceCents / 100).toFixed(2)}</td>
          <td style={styles.td}>{item.players}</td>
          <td style={styles.td}>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {item.isBundle && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Bundle</span>}
              {item.isPreorder && <span style={{ background: '#fed7aa', color: '#c2410c', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Preorder</span>}
              {item.featured && <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Featured</span>}
            </div>
          </td>
          <td style={styles.td}>
            <button onClick={() => openEditModal(item)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(item)} style={styles.deleteButton}>Delete</button>
          </td>
        </tr>
      );
    }
    
    if (activeTab === 'comics') {
      return (
        <tr key={item.id}>
          <td style={styles.td}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} style={styles.imagePreview} />
            ) : (
              <div style={{ ...styles.imagePreview, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                No image
              </div>
            )}
          </td>
          <td style={{ ...styles.td, fontWeight: 'bold' }}>{item.title}</td>
          <td style={styles.td}>{item.episode}</td>
          <td style={{ ...styles.td, fontSize: '0.875rem', color: '#6b7280' }}>{item.description}</td>
          <td style={styles.td}>
            <button onClick={() => openEditModal(item)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(item)} style={styles.deleteButton}>Delete</button>
          </td>
        </tr>
      );
    }
    
    if (activeTab === 'artwork') {
      return (
        <tr key={item.id}>
          <td style={styles.td}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={styles.imagePreview} />
            ) : (
              <div style={{ ...styles.imagePreview, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                No image
              </div>
            )}
          </td>
          <td style={{ ...styles.td, fontWeight: 'bold' }}>{item.name}</td>
          <td style={styles.td}>{item.category}</td>
          <td style={{ ...styles.td, fontSize: '0.875rem', color: '#6b7280' }}>{item.tags || 'No tags'}</td>
          <td style={styles.td}>
            <button onClick={() => openEditModal(item)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(item)} style={styles.deleteButton}>Delete</button>
          </td>
        </tr>
      );
    }
    
    return (
      <tr key={item.id}>
        <td style={{ ...styles.td, fontWeight: 'bold' }}>{item.title}</td>
        <td style={{ ...styles.td, fontSize: '0.875rem', color: '#6b7280' }}>{item.excerpt}</td>
        <td style={{ ...styles.td, fontSize: '0.875rem' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
        <td style={styles.td}>
          <button onClick={() => openEditModal(item)} style={styles.editButton}>Edit</button>
        </td>
      </tr>
    );
  };

  const renderForm = () => {
    if (activeTab === 'games') {
      return (
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input type="text" value={gameForm.title} onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })} style={styles.input} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tagline</label>
            <input type="text" value={gameForm.tagline} onChange={(e) => setGameForm({ ...gameForm, tagline: e.target.value })} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea value={gameForm.description} onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })} style={styles.textarea} required />
          </div>
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($)</label>
              <input type="number" step="0.01" value={gameForm.priceCents} onChange={(e) => setGameForm({ ...gameForm, priceCents: e.target.value })} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Players</label>
              <input type="text" value={gameForm.players} onChange={(e) => setGameForm({ ...gameForm, players: e.target.value })} style={styles.input} required />
            </div>
          </div>
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Play Time</label>
              <input type="text" value={gameForm.timeToPlay} onChange={(e) => setGameForm({ ...gameForm, timeToPlay: e.target.value })} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Age Rating</label>
              <input type="text" value={gameForm.ageRating} onChange={(e) => setGameForm({ ...gameForm, ageRating: e.target.value })} style={styles.input} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Game Image</label>
            <ImageUpload onImageUploaded={(imageUrl) => setGameForm({ ...gameForm, imageUrl })} currentImageUrl={gameForm.imageUrl} />
            <input type="text" value={gameForm.imageUrl} onChange={(e) => setGameForm({ ...gameForm, imageUrl: e.target.value })} style={{...styles.input, marginTop: '0.5rem'}} placeholder="Or enter image URL manually" />
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={gameForm.isBundle} onChange={(e) => setGameForm({ ...gameForm, isBundle: e.target.checked })} />
              Is Bundle
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={gameForm.isPreorder} onChange={(e) => setGameForm({ ...gameForm, isPreorder: e.target.checked })} />
              Is Preorder
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={gameForm.featured} onChange={(e) => setGameForm({ ...gameForm, featured: e.target.checked })} />
              Featured
            </label>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'comics') {
      return (
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input type="text" value={comicForm.title} onChange={(e) => setComicForm({ ...comicForm, title: e.target.value })} style={styles.input} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Episode</label>
            <input type="text" value={comicForm.episode} onChange={(e) => setComicForm({ ...comicForm, episode: e.target.value })} style={styles.input} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea value={comicForm.description} onChange={(e) => setComicForm({ ...comicForm, description: e.target.value })} style={styles.textarea} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Comic Image</label>
            <ImageUpload onImageUploaded={(imageUrl) => setComicForm({ ...comicForm, imageUrl })} currentImageUrl={comicForm.imageUrl} />
            <input type="text" value={comicForm.imageUrl} onChange={(e) => setComicForm({ ...comicForm, imageUrl: e.target.value })} style={{...styles.input, marginTop: '0.5rem'}} placeholder="Or enter image URL manually" />
          </div>
        </div>
      );
    }
    
    if (activeTab === 'artwork') {
      return (
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input type="text" value={artworkForm.name} onChange={(e) => setArtworkForm({ ...artworkForm, name: e.target.value })} style={styles.input} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea value={artworkForm.description} onChange={(e) => setArtworkForm({ ...artworkForm, description: e.target.value })} style={styles.textarea} />
          </div>
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select value={artworkForm.category} onChange={(e) => setArtworkForm({ ...artworkForm, category: e.target.value })} style={styles.input} required>
                <option value="">Select category...</option>
                <option value="character">Character Art</option>
                <option value="background">Background</option>
                <option value="logo">Logo/Branding</option>
                <option value="decoration">Decoration</option>
                <option value="icon">Icon</option>
                <option value="banner">Banner</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tags (comma-separated)</label>
              <input type="text" value={artworkForm.tags} onChange={(e) => setArtworkForm({ ...artworkForm, tags: e.target.value })} style={styles.input} placeholder="fugly, chaos, orange" />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Artwork Image</label>
            <ImageUpload onImageUploaded={(imageUrl) => setArtworkForm({ ...artworkForm, imageUrl })} currentImageUrl={artworkForm.imageUrl} />
            <input type="text" value={artworkForm.imageUrl} onChange={(e) => setArtworkForm({ ...artworkForm, imageUrl: e.target.value })} style={{...styles.input, marginTop: '0.5rem'}} placeholder="Or enter image URL manually" />
          </div>
        </div>
      );
    }
    
    return (
      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Title</label>
          <input type="text" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} style={styles.input} required />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Excerpt</label>
          <textarea value={newsForm.excerpt} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })} style={styles.textarea} required />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Full Content</label>
          <textarea value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} style={{ ...styles.textarea, minHeight: '8rem' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.headerTitle}>FUGLY'S DATABASE CHAOS CENTER</h1>
            <p style={styles.headerSubtitle}>Browse, edit, and create mayhem - {user.firstName}</p>
          </div>
          <button 
            onClick={() => {
              sessionStorage.setItem('fugly-auth', 'true');
              window.location.href = '/';
            }}
            style={{ color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Store
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {/* Navigation */}
        <div style={styles.tabContainer}>
          <div style={styles.tabNav}>
            <div style={styles.tabList}>
              {[
                { key: 'games', label: 'Games', count: games.length },
                { key: 'comics', label: 'Comics', count: comics.length },
                { key: 'news', label: 'News', count: news.length },
                { key: 'artwork', label: 'Artwork', count: artwork.length }
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  ...styles.tab,
                  ...(activeTab === tab.key ? styles.activeTab : styles.inactiveTab)
                }}>
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <button onClick={openCreateModal} style={styles.createButton}>
              + Create New {activeTab.slice(0, -1)}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody>
              {getCurrentData().map(renderTableRow)}
            </tbody>
          </table>
        </div>

        {/* Edit/Create Modal */}
        {editMode && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {editMode === 'create' ? 'Create New' : 'Edit'} {activeTab.slice(0, -1)}
                </h2>
              </div>
              
              <div style={styles.modalBody}>
                {message && <div style={styles.message}>{message}</div>}
                <form onSubmit={handleSubmit}>
                  {renderForm()}
                </form>
              </div>
              
              <div style={styles.modalFooter}>
                <button type="button" onClick={closeModal} style={styles.secondaryButton}>Cancel</button>
                <button type="submit" onClick={handleSubmit} style={styles.primaryButton}>
                  {editMode === 'create' ? 'Create' : 'Update'} {activeTab.slice(0, -1)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Deployment info for admins */}
      <DeploymentInfo isVisible={true} />
    </div>
  );
}