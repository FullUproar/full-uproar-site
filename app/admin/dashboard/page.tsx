'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ImageUpload from '../../components/ImageUpload';
import ArtworkImageUpload from '../../components/ArtworkImageUpload';
import { ImageSizes } from '@/lib/imageUtils';
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
  thumbnailUrl?: string;
  largeUrl?: string;
  category: string;
  tags?: string;
  chaosMode?: boolean;
}

interface Merch {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl?: string;
  sizes?: string;
  featured: boolean;
  totalStock?: number;
  inventory?: any[];
  isPrintify?: boolean;
  printifyId?: string;
}

interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  status: string;
  totalCents: number;
  trackingNumber?: string;
  createdAt: string;
  items: any[];
}

type EditMode = 'create' | 'edit' | null;

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('games');
  const [printifySettings, setPrintifySettings] = useState<any>({});
  const [printifyProducts, setPrintifyProducts] = useState<any[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [comics, setComics] = useState<Comic[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [artwork, setArtwork] = useState<Artwork[]>([]);
  const [merch, setMerch] = useState<Merch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [showPrintifyProducts, setShowPrintifyProducts] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Modal states
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  
  // Database tools states
  const [showDbTools, setShowDbTools] = useState(false);
  const [dbToolsResult, setDbToolsResult] = useState<any>(null);
  const [dbToolsLoading, setDbToolsLoading] = useState(false);

  // Form states
  const [gameForm, setGameForm] = useState({
    title: '', tagline: '', description: '', priceCents: '', players: '', timeToPlay: '', 
    ageRating: '', imageUrl: '', isBundle: false, isPreorder: true, featured: false, bundleInfo: '', stock: ''
  });
  const [comicForm, setComicForm] = useState({
    title: '', episode: '', description: '', imageUrl: ''
  });
  const [newsForm, setNewsForm] = useState({
    title: '', excerpt: '', content: ''
  });
  const [artworkForm, setArtworkForm] = useState({
    name: '', description: '', imageUrl: '', thumbnailUrl: '', largeUrl: '', category: '', tags: '', chaosMode: false
  });
  const [merchForm, setMerchForm] = useState({
    name: '', slug: '', description: '', category: 'apparel', priceCents: '', imageUrl: '', sizes: '["S", "M", "L", "XL"]', featured: false
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
    fetchMerch();
    fetchOrders();
    fetchPrintifySettings();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDbTools && !(e.target as HTMLElement).closest('[data-db-tools-menu]')) {
        setShowDbTools(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDbTools]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setGames(data);
      } else {
        console.error('Error fetching games:', data);
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    }
  };

  const fetchComics = async () => {
    try {
      const response = await fetch('/api/comics');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setComics(data);
      } else {
        console.error('Error fetching comics:', data);
        setComics([]);
      }
    } catch (error) {
      console.error('Error fetching comics:', error);
      setComics([]);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setNews(data);
      } else {
        console.error('Error fetching news:', data);
        setNews([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    }
  };

  const fetchArtwork = async () => {
    try {
      const response = await fetch('/api/artwork');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setArtwork(data);
      } else {
        console.error('Error fetching artwork:', data);
        setArtwork([]);
      }
    } catch (error) {
      console.error('Error fetching artwork:', error);
      setArtwork([]);
    }
  };

  const fetchMerch = async () => {
    try {
      const response = await fetch('/api/merch');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setMerch(data);
      } else {
        console.error('Error fetching merch:', data);
        setMerch([]);
      }
    } catch (error) {
      console.error('Error fetching merch:', error);
      setMerch([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('Error fetching orders:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };
  
  const fetchPrintifySettings = async () => {
    try {
      console.log('Fetching Printify settings...');
      const response = await fetch('/api/printify/settings');
      const data = await response.json();
      console.log('Printify settings received:', data);
      if (response.ok) {
        setPrintifySettings(data);
      }
    } catch (error) {
      console.error('Error fetching Printify settings:', error);
    }
  };
  
  const fetchPrintifyProducts = async () => {
    try {
      setMessage('Loading Printify products...');
      const response = await fetch('/api/printify/import');
      const data = await response.json();
      if (response.ok) {
        setPrintifyProducts(data.products || []);
        setMessage('');
      } else {
        setMessage('❌ Failed to load Printify products');
      }
    } catch (error) {
      console.error('Error fetching Printify products:', error);
      setMessage('❌ Error loading Printify products');
    }
  };

  // Database tool functions
  const runDbTool = async (endpoint: string, method: string = 'GET') => {
    setDbToolsLoading(true);
    setDbToolsResult(null);
    try {
      const response = await fetch(endpoint, { method });
      const data = await response.json();
      setDbToolsResult(data);
    } catch (error) {
      setDbToolsResult({ error: error instanceof Error ? error.message : 'Tool execution failed' });
    }
    setDbToolsLoading(false);
  };

  const openCreateModal = () => {
    setEditMode('create');
    setEditingItem(null);
    // Reset forms
    setGameForm({
      title: '', tagline: '', description: '', priceCents: '', players: '', timeToPlay: '', 
      ageRating: '', imageUrl: '', isBundle: false, isPreorder: true, featured: false, bundleInfo: '', stock: ''
    });
    setComicForm({ title: '', episode: '', description: '', imageUrl: '' });
    setNewsForm({ title: '', excerpt: '', content: '' });
    setArtworkForm({ name: '', description: '', imageUrl: '', thumbnailUrl: '', largeUrl: '', category: '', tags: '', chaosMode: false });
    setMerchForm({ name: '', slug: '', description: '', category: 'apparel', priceCents: '', imageUrl: '', sizes: '["S", "M", "L", "XL"]', featured: false });
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
        bundleInfo: item.bundleInfo || '',
        stock: item.stock !== undefined ? item.stock.toString() : '0'
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
        thumbnailUrl: item.thumbnailUrl || '',
        largeUrl: item.largeUrl || '',
        category: item.category || '',
        tags: item.tags || '',
        chaosMode: item.chaosMode || false
      });
    } else if (activeTab === 'merch') {
      setMerchForm({
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        category: item.category || 'apparel',
        priceCents: item.priceCents ? (item.priceCents / 100).toString() : '',
        imageUrl: item.imageUrl || '',
        sizes: item.sizes || '[]',
        featured: item.featured || false
      });
    }
  };

  const closeModal = () => {
    setEditMode(null);
    setEditingItem(null);
    setMessage('');
  };

  const openInventoryModal = async (item: any, type: 'game' | 'merch' = 'merch') => {
    setInventoryItem({ ...item, itemType: type });
    setInventoryModalOpen(true);
    
    // Fetch inventory data
    try {
      const endpoint = type === 'game' 
        ? `/api/inventory?gameId=${item.id}`
        : `/api/inventory?merchId=${item.id}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setInventoryData(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setInventoryItem(null);
    setInventoryData([]);
  };

  const updateInventory = async (inventoryId: number, itemId: number, size: string | null, newQuantity: number, itemType: 'game' | 'merch') => {
    try {
      const body: any = { quantity: newQuantity };
      if (itemType === 'game') {
        body.gameId = itemId;
      } else {
        body.merchId = itemId;
        body.size = size;
      }
      
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // Refresh inventory data
        const endpoint = itemType === 'game' 
          ? `/api/inventory?gameId=${itemId}`
          : `/api/inventory?merchId=${itemId}`;
        const refreshResponse = await fetch(endpoint);
        const data = await refreshResponse.json();
        setInventoryData(data);
        
        // Also refresh the appropriate data
        if (itemType === 'game') {
          fetchGames();
        } else {
          fetchMerch();
        }
      } else {
        console.error('Failed to update inventory');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
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
      } else if (activeTab === 'merch') {
        endpoint = `/api/merch?id=${item.id}`;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage(`✅ ${getSingularForm(activeTab)} deleted successfully!`);
        
        // Refresh data
        if (activeTab === 'games') fetchGames();
        else if (activeTab === 'comics') fetchComics();
        else if (activeTab === 'news') fetchNews();
        else if (activeTab === 'artwork') fetchArtwork();
        else if (activeTab === 'merch') fetchMerch();
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error deleting ${getSingularForm(activeTab)}`);
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
        body = { 
          ...gameForm, 
          priceCents: Math.round(parseFloat(gameForm.priceCents) * 100),
          stock: parseInt(gameForm.stock) || 0
        };
      } else if (activeTab === 'comics') {
        endpoint = '/api/comics';
        body = comicForm;
      } else if (activeTab === 'news') {
        endpoint = '/api/news';
        body = newsForm;
      } else if (activeTab === 'artwork') {
        endpoint = '/api/artwork';
        body = artworkForm;
      } else if (activeTab === 'merch') {
        endpoint = '/api/merch';
        body = { 
          ...merchForm, 
          priceCents: Math.round(parseFloat(merchForm.priceCents) * 100),
          slug: merchForm.slug || merchForm.name.toLowerCase().replace(/\s+/g, '-')
        };
      }

      const method = editMode === 'create' ? 'POST' : 'PUT';
      const url = editMode === 'edit' ? `${endpoint}?id=${editingItem.id}` : endpoint;
      
      // Special handling for orders - only update status
      if (activeTab === 'orders' && editMode === 'edit') {
        const orderBody = {
          status: editingItem.status,
          trackingNumber: editingItem.trackingNumber,
          statusNote: `Status updated to ${editingItem.status}`
        };
        const response = await fetch(`/api/orders?id=${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderBody)
        });
        
        if (response.ok) {
          setMessage(`✅ Order updated successfully!`);
          fetchOrders();
          setTimeout(closeModal, 1000);
        } else {
          setMessage(`❌ Error updating order`);
        }
        return;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setMessage(`✅ ${getSingularForm(activeTab)} ${editMode === 'create' ? 'created' : 'updated'} successfully!`);
        
        // Refresh data
        if (activeTab === 'games') fetchGames();
        else if (activeTab === 'comics') fetchComics();
        else if (activeTab === 'news') fetchNews();
        else if (activeTab === 'artwork') fetchArtwork();
        else if (activeTab === 'merch') fetchMerch();
        
        setTimeout(closeModal, 1000);
      } else {
        setMessage(`❌ Error ${editMode === 'create' ? 'creating' : 'updating'} ${getSingularForm(activeTab)}`);
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
      width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const
    },
    modalHeader: { padding: '1.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
    modalTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 },
    modalBody: { padding: '1.5rem', flex: 1, overflow: 'auto', minHeight: 0 },
    modalFooter: { padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexShrink: 0 },
    
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
    if (activeTab === 'artwork') return artwork;
    if (activeTab === 'merch') {
      // Filter based on Printify toggle
      return showPrintifyProducts ? merch : merch.filter(m => !m.isPrintify);
    }
    if (activeTab === 'orders') return orders;
    return [];
  };

  const getSingularForm = (plural: string) => {
    if (plural === 'games') return 'game';
    if (plural === 'comics') return 'comic';
    if (plural === 'news') return 'news post';
    if (plural === 'artwork') return 'artwork';
    if (plural === 'merch') return 'merch item';
    if (plural === 'orders') return 'order';
    return plural;
  };

  const renderTableHeaders = () => {
    if (activeTab === 'games') {
      return (
        <tr>
          <th style={styles.th}>Image</th>
          <th style={styles.th}>Title</th>
          <th style={styles.th}>Price</th>
          <th style={styles.th}>Stock</th>
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
          <th style={styles.th}>Chaos</th>
          <th style={styles.th}>Actions</th>
        </tr>
      );
    }
    if (activeTab === 'merch') {
      return (
        <tr>
          <th style={styles.th}>Image</th>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Price</th>
          <th style={styles.th}>Stock</th>
          <th style={styles.th}>Featured</th>
          <th style={styles.th}>Actions</th>
        </tr>
      );
    }
    if (activeTab === 'orders') {
      return (
        <tr>
          <th style={styles.th}>Order ID</th>
          <th style={styles.th}>Customer</th>
          <th style={styles.th}>Total</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Date</th>
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
          <td style={styles.td}>
            <span style={{ 
              background: item.stock > 0 ? '#dcfce7' : '#fee2e2', 
              color: item.stock > 0 ? '#15803d' : '#dc2626', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '0.25rem', 
              fontSize: '0.875rem', 
              fontWeight: 'bold' 
            }}>
              {item.stock || 0}
            </span>
          </td>
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
            <button onClick={() => window.open(`/admin/manage-images/game/${item.id}`, '_blank')} style={{ ...styles.editButton, background: '#8b5cf6' }}>Images</button>
            <button onClick={() => openInventoryModal(item, 'game')} style={{ ...styles.editButton, background: '#10b981' }}>Inventory</button>
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
              <img src={item.thumbnailUrl || item.imageUrl} alt={item.name} style={styles.imagePreview} />
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
            {item.chaosMode ? (
              <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ✓ ON
              </span>
            ) : (
              <span style={{ background: '#6b7280', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem' }}>
                OFF
              </span>
            )}
          </td>
          <td style={styles.td}>
            <button onClick={() => openEditModal(item)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(item)} style={styles.deleteButton}>Delete</button>
          </td>
        </tr>
      );
    }
    
    if (activeTab === 'merch') {
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
          <td style={styles.td}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.slug}</div>
              </div>
              {item.isPrintify && (
                <span style={{ 
                  background: '#8b5cf6', 
                  color: 'white', 
                  fontSize: '0.625rem', 
                  padding: '0.125rem 0.375rem', 
                  borderRadius: '0.25rem',
                  fontWeight: 'bold'
                }}>
                  POD
                </span>
              )}
            </div>
          </td>
          <td style={styles.td}>{item.category}</td>
          <td style={{ ...styles.td, fontWeight: 'bold', color: '#f97316' }}>${(item.priceCents / 100).toFixed(2)}</td>
          <td style={styles.td}>
            <span style={{ 
              background: item.totalStock > 0 ? '#dcfce7' : '#fee2e2', 
              color: item.totalStock > 0 ? '#15803d' : '#dc2626', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '0.25rem', 
              fontSize: '0.875rem', 
              fontWeight: 'bold' 
            }}>
              {item.totalStock || 0}
            </span>
          </td>
          <td style={styles.td}>
            {item.featured ? (
              <span style={{ background: '#fbbf24', color: '#78350f', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ⭐ Featured
              </span>
            ) : (
              <span style={{ background: '#e5e7eb', color: '#6b7280', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem' }}>
                Standard
              </span>
            )}
          </td>
          <td style={styles.td}>
            <button onClick={() => openEditModal(item)} style={styles.editButton}>Edit</button>
            <button onClick={() => window.open(`/admin/manage-images/merch/${item.id}`, '_blank')} style={{ ...styles.editButton, background: '#8b5cf6' }}>Images</button>
            <button onClick={() => openInventoryModal(item)} style={{ ...styles.editButton, background: '#10b981' }}>Inventory</button>
            <button onClick={() => handleDelete(item)} style={styles.deleteButton}>Delete</button>
          </td>
        </tr>
      );
    }
    
    if (activeTab === 'orders') {
      return (
        <tr key={item.id}>
          <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.875rem' }}>{item.id.slice(0, 8)}...</td>
          <td style={styles.td}>
            <div style={{ fontWeight: 'bold' }}>{item.customerName}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.customerEmail}</div>
          </td>
          <td style={{ ...styles.td, fontWeight: 'bold', color: '#059669' }}>${(item.totalCents / 100).toFixed(2)}</td>
          <td style={styles.td}>
            <span style={{ 
              background: item.status === 'pending' ? '#fef3c7' : item.status === 'shipped' ? '#dbeafe' : item.status === 'delivered' ? '#dcfce7' : '#fee2e2',
              color: item.status === 'pending' ? '#92400e' : item.status === 'shipped' ? '#1e40af' : item.status === 'delivered' ? '#15803d' : '#dc2626',
              padding: '0.25rem 0.75rem', 
              borderRadius: '0.25rem', 
              fontSize: '0.875rem', 
              fontWeight: 'bold',
              textTransform: 'uppercase' as const
            }}>
              {item.status}
            </span>
          </td>
          <td style={{ ...styles.td, fontSize: '0.875rem' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
          <td style={styles.td}>
            <button onClick={() => openEditModal(item)} style={styles.editButton}>View</button>
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
              <label style={styles.label}>Stock</label>
              <input type="number" value={gameForm.stock} onChange={(e) => setGameForm({ ...gameForm, stock: e.target.value })} style={styles.input} required />
            </div>
          </div>
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Players</label>
              <input type="text" value={gameForm.players} onChange={(e) => setGameForm({ ...gameForm, players: e.target.value })} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Age Rating</label>
              <input type="text" value={gameForm.ageRating} onChange={(e) => setGameForm({ ...gameForm, ageRating: e.target.value })} style={styles.input} required />
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
            <label style={styles.label}>Primary Game Image</label>
            <ImageUpload onImageUploaded={(imageUrl) => setGameForm({ ...gameForm, imageUrl })} currentImageUrl={gameForm.imageUrl} />
            <input type="text" value={gameForm.imageUrl} onChange={(e) => setGameForm({ ...gameForm, imageUrl: e.target.value })} style={{...styles.input, marginTop: '0.5rem'}} placeholder="Or enter image URL manually" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Images</label>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Additional images can be managed after creating the game using the "Manage Images" button in the games list.
            </div>
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
            <ArtworkImageUpload 
              onImageSizesGenerated={(imageSizes) => setArtworkForm({ 
                ...artworkForm, 
                imageUrl: imageSizes.medium,
                thumbnailUrl: imageSizes.thumbnail,
                largeUrl: imageSizes.large
              })} 
              currentImageUrl={artworkForm.imageUrl} 
            />
            <input 
              type="text" 
              value={artworkForm.imageUrl} 
              onChange={(e) => setArtworkForm({ ...artworkForm, imageUrl: e.target.value })} 
              style={{...styles.input, marginTop: '0.5rem'}} 
              placeholder="Or enter original image URL manually" 
            />
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={artworkForm.chaosMode} 
                onChange={(e) => setArtworkForm({ ...artworkForm, chaosMode: e.target.checked })} 
              />
              <span style={{ fontWeight: 'bold', color: '#f97316' }}>Use in Chaos Mode</span>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                (Appears randomly when chaos mode is activated)
              </span>
            </label>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'merch') {
      return (
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input type="text" value={merchForm.name} onChange={(e) => setMerchForm({ ...merchForm, name: e.target.value })} style={styles.input} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Slug (URL-friendly name)</label>
            <input type="text" value={merchForm.slug} onChange={(e) => setMerchForm({ ...merchForm, slug: e.target.value })} style={styles.input} placeholder="auto-generated from name" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea value={merchForm.description} onChange={(e) => setMerchForm({ ...merchForm, description: e.target.value })} style={styles.textarea} required />
          </div>
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select value={merchForm.category} onChange={(e) => setMerchForm({ ...merchForm, category: e.target.value })} style={styles.input} required>
                <option value="apparel">Apparel</option>
                <option value="accessories">Accessories</option>
                <option value="collectibles">Collectibles</option>
                <option value="stickers">Stickers</option>
                <option value="prints">Prints</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($)</label>
              <input type="number" step="0.01" value={merchForm.priceCents} onChange={(e) => setMerchForm({ ...merchForm, priceCents: e.target.value })} style={styles.input} required />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Sizes (JSON array - leave empty for non-sized items)</label>
            <input type="text" value={merchForm.sizes} onChange={(e) => setMerchForm({ ...merchForm, sizes: e.target.value })} style={styles.input} placeholder='["S", "M", "L", "XL"]' />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Primary Product Image</label>
            <ImageUpload onImageUploaded={(imageUrl) => setMerchForm({ ...merchForm, imageUrl })} currentImageUrl={merchForm.imageUrl} />
            <input type="text" value={merchForm.imageUrl} onChange={(e) => setMerchForm({ ...merchForm, imageUrl: e.target.value })} style={{...styles.input, marginTop: '0.5rem'}} placeholder="Or enter image URL manually" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Additional Images</label>
            <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Additional images can be managed after creating the product using the "Manage Images" button in the merch list.
            </div>
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={merchForm.featured} onChange={(e) => setMerchForm({ ...merchForm, featured: e.target.checked })} />
              <span style={{ fontWeight: 'bold', color: '#f97316' }}>Featured Product</span>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                (Shows prominently on the home page)
              </span>
            </label>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'orders') {
      return (
        <div style={styles.form}>
          <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <p style={{ color: '#92400e', fontWeight: 'bold' }}>Order Management</p>
            <p style={{ color: '#78350f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              You can view order details and update order status. Inventory will be automatically adjusted when status changes.
            </p>
          </div>
          {editingItem && (
            <>
              <div style={styles.gridTwo}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Order ID</label>
                  <input type="text" value={editingItem.id} disabled style={{...styles.input, background: '#f3f4f6'}} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select value={editingItem.status} onChange={(e) => setEditingItem({...editingItem, status: e.target.value})} style={styles.input}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Customer</label>
                <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{editingItem.customerName}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{editingItem.customerEmail}</div>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Shipping Address</label>
                <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.375rem', whiteSpace: 'pre-wrap' }}>
                  {editingItem.shippingAddress}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tracking Number</label>
                <input type="text" value={editingItem.trackingNumber || ''} onChange={(e) => setEditingItem({...editingItem, trackingNumber: e.target.value})} style={styles.input} placeholder="Enter tracking number when shipped" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Order Items</label>
                <div style={{ background: '#f9fafb', borderRadius: '0.375rem', padding: '1rem' }}>
                  {editingItem.items?.map((item: any, index: number) => (
                    <div key={index} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: index < editingItem.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.game?.title || item.merch?.name} {item.merchSize ? `(${item.merchSize})` : ''}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Qty: {item.quantity} × ${(item.priceCents / 100).toFixed(2)} = ${((item.quantity * item.priceCents) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Total:</span>
                      <span style={{ color: '#059669' }}>${(editingItem.totalCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Printify Fulfillment */}
              {editingItem.items?.some((item: any) => item.merch?.isPrintify) && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Printify Fulfillment</label>
                  <div style={{ background: '#f3e8ff', borderRadius: '0.375rem', padding: '1rem' }}>
                    <p style={{ marginBottom: '1rem', color: '#7c3aed' }}>
                      This order contains Print-on-Demand items from Printify.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          setMessage('Sending order to Printify...');
                          const response = await fetch('/api/printify/fulfill', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: editingItem.id })
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setMessage(`✅ Order sent to Printify! Order ID: ${data.printifyOrderId}`);
                            // Update order status
                            setEditingItem({ ...editingItem, status: 'processing' });
                          } else {
                            setMessage(`❌ Error: ${data.error}`);
                          }
                        } catch (error) {
                          setMessage('❌ Failed to send to Printify');
                        }
                      }}
                      style={{ ...styles.primaryButton, background: '#7c3aed' }}
                    >
                      📦 Fulfill with Printify
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Database Tools Menu */}
            <div style={{ position: 'relative' }} data-db-tools-menu>
              <button 
                onClick={() => setShowDbTools(!showDbTools)}
                style={{ 
                  color: 'white', 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  fontWeight: 'bold', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>☰</span> DB Tools
              </button>
              
              {showDbTools && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  minWidth: '250px',
                  zIndex: 100
                }}>
                  <div style={{ padding: '0.5rem 0' }}>
                    <button
                      onClick={() => runDbTool('/api/health')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🏥 Health Check
                    </button>
                    <button
                      onClick={() => runDbTool('/api/debug-db')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🔍 Debug Database
                    </button>
                    <hr style={{ margin: '0.5rem 0', border: '1px solid #e5e7eb' }} />
                    <button
                      onClick={() => runDbTool('/api/migrate-missing-fields?secret=emergency-init-2024', 'POST')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#f97316',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef3c7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🔧 Migrate Missing Fields
                    </button>
                    <button
                      onClick={() => runDbTool('/api/init-game-inventory', 'POST')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#dc2626',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🎮 Initialize Game Inventory
                    </button>
                    <button
                      onClick={() => runDbTool('/api/init-db?secret=emergency-init-2024', 'POST')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#3b82f6',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🗄️ Initialize Database
                    </button>
                    <button
                      onClick={() => runDbTool('/api/seed-data?secret=seed-2024', 'POST')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#10b981',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#d1fae5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🌱 Seed Sample Data
                    </button>
                    <button
                      onClick={() => runDbTool('/api/migrate-game-inventory?secret=migrate-game-inventory-2024', 'POST')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#9333ea',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3e8ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      📦 Migrate Game Inventory
                    </button>
                    <button
                      onClick={() => runDbTool('/api/migrate-printify', 'POST')}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#ec4899',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fce7f3'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🎨 Enable Printify Integration
                    </button>
                    <hr style={{ margin: '0.5rem 0', border: '1px solid #e5e7eb' }} />
                    <button
                      onClick={() => {
                        setShowDbTools(false);
                        window.open('/migrate', '_blank');
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        textAlign: 'left', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      🚀 Advanced Migration Tool
                    </button>
                  </div>
                </div>
              )}
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
      </div>

      <div style={styles.main}>
        {/* Database Tools Result */}
        {(dbToolsResult || dbToolsLoading) && (
          <div style={{
            background: dbToolsResult?.error ? '#fee2e2' : '#dcfce7',
            border: `1px solid ${dbToolsResult?.error ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setDbToolsResult(null);
                setDbToolsLoading(false);
              }}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
            {dbToolsLoading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                <div>Running database tool...</div>
              </div>
            ) : (
              <>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {dbToolsResult?.error ? '❌ Error' : '✅ Success'}
                </h3>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  maxHeight: '400px',
                  overflow: 'auto',
                  background: 'rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem',
                  borderRadius: '0.25rem'
                }}>
                  {JSON.stringify(dbToolsResult, null, 2)}
                </pre>
                {dbToolsResult?.success && (
                  <button
                    onClick={() => {
                      fetchGames();
                      fetchMerch();
                      fetchComics();
                      fetchNews();
                      fetchArtwork();
                      fetchOrders();
                    }}
                    style={{
                      marginTop: '1rem',
                      background: '#f97316',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🔄 Refresh All Data
                  </button>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Navigation */}
        <div style={styles.tabContainer}>
          <div style={styles.tabNav}>
            <div style={styles.tabList}>
              {[
                { key: 'games', label: 'Games', count: games.length },
                { key: 'merch', label: 'Merch', count: merch.length },
                { key: 'orders', label: 'Orders', count: orders.length },
                { key: 'comics', label: 'Comics', count: comics.length },
                { key: 'news', label: 'News', count: news.length },
                { key: 'artwork', label: 'Artwork', count: artwork.length },
                { key: 'printify', label: 'Printify', count: 0 }
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  ...styles.tab,
                  ...(activeTab === tab.key ? styles.activeTab : styles.inactiveTab)
                }}>
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            {activeTab !== 'orders' && activeTab !== 'printify' && (
              <button onClick={openCreateModal} style={styles.createButton}>
                + Create New {getSingularForm(activeTab)}
              </button>
            )}
          </div>
        </div>

        {/* Toggle for Printify products in Merch tab */}
        {activeTab === 'merch' && (
          <div style={{ padding: '1rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showPrintifyProducts}
                onChange={(e) => setShowPrintifyProducts(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Show Printify Products</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                ({merch.filter(m => m.isPrintify).length} Printify products / {merch.filter(m => !m.isPrintify).length} regular products)
              </span>
            </label>
          </div>
        )}

        {/* Data Table or Printify UI */}
        {activeTab === 'printify' ? (
          <div style={styles?.tableContainer || { background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Printify Integration</h2>
              
              {message && (
                <div style={{ 
                  padding: '1rem', 
                  marginBottom: '1rem', 
                  borderRadius: '0.5rem',
                  background: message.includes('✅') ? '#d1fae5' : message.includes('🔄') ? '#dbeafe' : '#fee2e2',
                  color: message.includes('✅') ? '#065f46' : message.includes('🔄') ? '#1e40af' : '#991b1b'
                }}>
                  {message}
                </div>
              )}
              
              {/* Settings Section */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Settings</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>API Key</label>
                    <input
                      type="text"
                      value={printifySettings.printify_api_key || ''}
                      onChange={(e) => setPrintifySettings({ ...printifySettings, printify_api_key: e.target.value })}
                      placeholder="Enter your Printify API key"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Get your API key from Printify → Settings → API
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Shop ID</label>
                    <input
                      type="text"
                      value={printifySettings.printify_shop_id || ''}
                      onChange={(e) => setPrintifySettings({ ...printifySettings, printify_shop_id: e.target.value })}
                      placeholder="Enter your Printify Shop ID"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={printifySettings.printify_enabled === 'true'}
                        onChange={(e) => setPrintifySettings({ ...printifySettings, printify_enabled: String(e.target.checked) })}
                      />
                      <span style={{ fontWeight: 'bold' }}>Enable Printify Integration</span>
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Save button clicked!');
                        console.log('Current settings:', printifySettings);
                        
                        const saveSettings = async () => {
                          try {
                            setSavingSettings(true);
                            setMessage('Saving...');
                            const response = await fetch('/api/printify/settings', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(printifySettings)
                            });
                            console.log('Response:', response);
                            if (response.ok) {
                              setMessage('✅ Settings saved successfully!');
                              setTimeout(() => setMessage(''), 3000);
                            } else {
                              setMessage('❌ Error saving settings');
                            }
                          } catch (error) {
                            console.error('Save error:', error);
                            setMessage('❌ Error saving settings');
                          } finally {
                            setSavingSettings(false);
                          }
                        };
                        
                        saveSettings();
                      }}
                      style={{ 
                        background: savingSettings ? '#9ca3af' : '#f97316', 
                        color: 'white', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '0.5rem', 
                        fontWeight: 'bold', 
                        border: 'none', 
                        cursor: savingSettings ? 'not-allowed' : 'pointer' 
                      }}
                      disabled={savingSettings}
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Import Products Section */}
              <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Import Products</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  This will import all products from your Printify store. Products are automatically updated if they already exist.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Import button clicked!');
                      
                      const importProducts = async () => {
                        try {
                          setImporting(true);
                          setMessage('🔄 Importing all products from Printify... This may take a moment.');
                          console.log('Starting import...');
                          const response = await fetch('/api/printify/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ importAll: true })
                          });
                          console.log('Import response:', response);
                          const data = await response.json();
                          console.log('Import data:', data);
                          if (response.ok) {
                            setMessage(`✅ ${data.message}`);
                            // Don't clear the message immediately so user can see it
                            setTimeout(() => {
                              fetchMerch(); // Refresh merch list
                            }, 1000);
                            setTimeout(() => {
                              setMessage('');
                            }, 5000);
                          } else {
                            setMessage(`❌ Import failed: ${data.details || data.error || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Import error:', error);
                          setMessage('❌ Import error: ' + error);
                        } finally {
                          setImporting(false);
                        }
                      };
                      
                      importProducts();
                    }}
                    style={{ 
                      background: importing ? '#9ca3af' : '#10b981', 
                      color: 'white', 
                      padding: '0.75rem 2rem', 
                      borderRadius: '0.5rem', 
                      fontWeight: 'bold', 
                      border: 'none', 
                      cursor: importing ? 'not-allowed' : 'pointer', 
                      fontSize: '1rem' 
                    }}
                    disabled={importing}
                  >
                    {importing ? '⏳ Importing...' : '🔄 Import All Products from Printify'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setMessage('🔍 Debugging Printify connection...');
                        const response = await fetch('/api/printify/debug');
                        const data = await response.json();
                        console.log('Debug info:', data);
                        setMessage('📋 Debug info logged to console');
                        
                        // Show debug info in alert for easy viewing
                        alert(JSON.stringify(data, null, 2));
                      } catch (error) {
                        console.error('Debug error:', error);
                        setMessage('❌ Debug error: ' + error);
                      }
                    }}
                    style={{ 
                      background: '#6366f1', 
                      color: 'white', 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: '0.5rem', 
                      fontWeight: 'bold', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '0.875rem' 
                    }}
                  >
                    🔍 Debug Connection
                  </button>
                </div>
                
                {/* Product List */}
                {printifyProducts.length > 0 && (
                  <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                    {printifyProducts.map((product) => (
                      <div key={product.id} style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center'
                      }}>
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.375rem' }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{product.title}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {product.variantCount} variants • ID: {product.id}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              setMessage(`Importing ${product.title}...`);
                              const response = await fetch('/api/printify/import', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ productIds: [product.id] })
                              });
                              const data = await response.json();
                              if (response.ok) {
                                setMessage(`✅ Imported ${product.title}`);
                                fetchMerch();
                              } else {
                                setMessage('❌ Import failed');
                              }
                            } catch (error) {
                              setMessage('❌ Import error');
                            }
                          }}
                          style={{ ...styles.editButton, background: '#10b981' }}
                        >
                          Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Info Section */}
              <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#92400e' }}>How It Works</h3>
                <ul style={{ marginLeft: '1.5rem', color: '#78350f', lineHeight: 1.6 }}>
                  <li>Import products from Printify to your store catalog</li>
                  <li>Products marked as Printify will have unlimited inventory (POD)</li>
                  <li>When orders are placed, you can manually fulfill them through Printify</li>
                  <li>Track order status and shipping information</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {/* Edit/Create Modal */}
        {editMode && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <form onSubmit={handleSubmit} style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={styles.modalTitle}>
                    {editMode === 'create' ? 'Create New' : 'Edit'} {getSingularForm(activeTab)}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={closeModal} style={{...styles.secondaryButton, padding: '0.5rem 1rem'}}>Cancel</button>
                    <button type="submit" style={{...styles.primaryButton, padding: '0.5rem 1rem'}}>
                      {editMode === 'create' ? 'Create' : 'Update'} {getSingularForm(activeTab)}
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={styles.modalBody}>
                {message && <div style={styles.message}>{message}</div>}
                {renderForm()}
              </div>
            </form>
          </div>
        )}

        {/* Inventory Modal */}
        {inventoryModalOpen && inventoryItem && (
          <div style={styles.modalOverlay} onClick={closeInventoryModal}>
            <div style={{ ...styles.modal, maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={styles.modalTitle}>
                    Inventory Management: {inventoryItem.title || inventoryItem.name}
                  </h2>
                  <button type="button" onClick={closeInventoryModal} style={{...styles.secondaryButton, padding: '0.5rem 1rem'}}>Close</button>
                </div>
              </div>
              
              <div style={styles.modalBody}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                    {inventoryItem.itemType === 'game' 
                      ? 'Manage stock levels for this game. Changes are saved automatically.'
                      : 'Manage stock levels for each size/variant. Changes are saved automatically.'}
                  </p>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ ...styles.th, textAlign: 'left' }}>{inventoryItem.itemType === 'game' ? 'Product' : 'Size/Variant'}</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Current Stock</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Reserved</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Available</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Update Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                          No inventory records found. Create the {inventoryItem.itemType === 'game' ? 'game' : 'merch item'} first.
                        </td>
                      </tr>
                    ) : (
                      inventoryData.map((inv: any) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ ...styles.td, fontWeight: 'bold' }}>
                            {inventoryItem.itemType === 'game' ? inventoryItem.title : (inv.size || 'One Size')}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {inv.quantity}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {inv.reserved}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={{ 
                              fontWeight: 'bold',
                              color: (inv.quantity - inv.reserved) > 0 ? '#059669' : '#dc2626'
                            }}>
                              {inv.quantity - inv.reserved}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                              <button 
                                onClick={() => updateInventory(inv.id, inventoryItem.id, inv.size, Math.max(0, inv.quantity - 1), inventoryItem.itemType)}
                                style={{ 
                                  ...styles.secondaryButton, 
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '1.25rem',
                                  lineHeight: 1
                                }}
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                value={inv.quantity}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 0;
                                  if (newValue >= 0) {
                                    updateInventory(inv.id, inventoryItem.id, inv.size, newValue, inventoryItem.itemType);
                                  }
                                }}
                                style={{ 
                                  ...styles.input, 
                                  width: '80px', 
                                  textAlign: 'center',
                                  margin: 0
                                }}
                              />
                              <button 
                                onClick={() => updateInventory(inv.id, inventoryItem.id, inv.size, inv.quantity + 1, inventoryItem.itemType)}
                                style={{ 
                                  ...styles.primaryButton, 
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '1.25rem',
                                  lineHeight: 1
                                }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#92400e', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    Note: Reserved stock is automatically managed when orders are placed or cancelled.
                  </p>
                  <p style={{ color: '#78350f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Available stock = Current stock - Reserved stock
                  </p>
                </div>
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