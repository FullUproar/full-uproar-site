'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import {
  Package, ShoppingBag, ShoppingCart, Settings,
  Plus, Eye, ArrowLeft, Menu, Home, Dices, Tag, X,
  ChevronRight, Box, Loader2
} from 'lucide-react';

// Import components - Core only
import GamesListView from './components/GamesListView';
import OrdersListView from './components/OrdersListView';
import MerchListView from './components/MerchListView';
import MerchEditForm from './components/MerchEditForm';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';

type ViewType =
  | 'dashboard'
  | 'orders-list'
  | 'orders-detail'
  | 'games-list'
  | 'games-edit'
  | 'games-new'
  | 'merch-list'
  | 'merch-edit'
  | 'merch-new'
  | 'promo-codes'
  | 'packaging'
  | 'settings';

interface ViewState {
  type: ViewType;
  data?: any;
}

// Streamlined menu - 6 core items
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, view: 'dashboard' as ViewType },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, view: 'orders-list' as ViewType },
  { id: 'games', label: 'Games', icon: Dices, view: 'games-list' as ViewType },
  { id: 'merch', label: 'Merch', icon: ShoppingBag, view: 'merch-list' as ViewType },
  { id: 'promo', label: 'Promos', icon: Tag, view: 'promo-codes' as ViewType },
  { id: 'packaging', label: 'Packaging', icon: Box, view: 'packaging' as ViewType },
];

export default function AdminApp() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Verify admin permissions
  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }

    if (isLoaded && user) {
      fetch('/api/admin/whoami')
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin || data.isSuperAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            redirect('/');
          }
          setIsVerifying(false);
        })
        .catch(() => {
          setIsAdmin(false);
          setIsVerifying(false);
          redirect('/');
        });
    }
  }, [user, isLoaded]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize view from URL
  useEffect(() => {
    if (urlInitialized || !isAdmin) return;

    const viewParam = searchParams.get('view');
    const idParam = searchParams.get('id');

    if (viewParam) {
      const validViews: ViewType[] = [
        'dashboard', 'orders-list', 'orders-detail', 'games-list', 'games-edit',
        'games-new', 'merch-list', 'merch-edit', 'merch-new', 'promo-codes',
        'packaging', 'settings'
      ];

      if (validViews.includes(viewParam as ViewType)) {
        // Redirect game edit/new to dedicated pages
        if (viewParam === 'games-edit' && idParam) {
          router.push(`/admin/games/${idParam}/edit`);
        } else if (viewParam === 'games-new') {
          router.push('/admin/games/new');
        } else {
          setCurrentView({ type: viewParam as ViewType, data: idParam ? { id: idParam } : undefined });
        }
      }
    }
    setUrlInitialized(true);
  }, [searchParams, isAdmin, urlInitialized, router]);

  const navigateTo = useCallback((view: ViewState, label?: string) => {
    setCurrentView(view);
    const params = new URLSearchParams();
    params.set('view', view.type);
    if (view.data?.id) params.set('id', String(view.data.id));
    router.push(`/admin?${params.toString()}`, { scroll: false });
    if (isMobile) setMobileMenuOpen(false);
  }, [router, isMobile]);

  const renderContent = () => {
    switch (currentView.type) {
      case 'dashboard':
        return <DashboardView onNavigate={navigateTo} />;

      case 'orders-list':
        return (
          <OrdersListView
            onViewDetails={(order) => navigateTo({ type: 'orders-detail', data: order })}
          />
        );

      case 'games-list':
        return (
          <GamesListView
            onEdit={(game) => router.push(`/admin/games/${game.id}/edit`)}
            onNew={() => router.push('/admin/games/new')}
          />
        );

      case 'merch-list':
        return (
          <MerchListView
            onEdit={(merch) => navigateTo({ type: 'merch-edit', data: merch })}
            onNew={() => navigateTo({ type: 'merch-new' })}
          />
        );

      case 'merch-edit':
        return (
          <MerchEditForm
            merch={currentView.data}
            onSave={() => navigateTo({ type: 'merch-list' })}
            onCancel={() => navigateTo({ type: 'merch-list' })}
          />
        );

      case 'merch-new':
        return (
          <MerchEditForm
            onSave={() => navigateTo({ type: 'merch-list' })}
            onCancel={() => navigateTo({ type: 'merch-list' })}
          />
        );

      case 'promo-codes':
        return (
          <iframe
            src="/admin/promo-codes"
            style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', background: '#0a0a0a' }}
          />
        );

      case 'packaging':
        return (
          <iframe
            src="/admin/packaging"
            style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', background: '#0a0a0a' }}
          />
        );

      case 'settings':
        return <SettingsView />;

      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            View not found
          </div>
        );
    }
  };

  // Loading state
  if (!isLoaded || isVerifying) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={32} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
          {!isLoaded ? 'Loading...' : 'Verifying permissions...'}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: '#ef4444' }}>Access Denied</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={styles.mobileHeader}>
          <button onClick={() => setMobileMenuOpen(true)} style={styles.menuButton}>
            <Menu size={24} />
          </button>
          <span style={styles.headerTitle}>Admin</span>
          <a href="/" style={styles.backLink}>
            <ArrowLeft size={20} />
          </a>
        </header>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div style={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
          <nav style={styles.mobileNav}>
            <div style={styles.mobileNavHeader}>
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView.type.startsWith(item.id) || currentView.type === item.view;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo({ type: item.view })}
                  style={{
                    ...styles.mobileNavItem,
                    background: isActive ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    color: isActive ? '#f97316' : '#e2e8f0',
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div style={styles.mobileNavDivider} />
            <button
              onClick={() => navigateTo({ type: 'settings' })}
              style={{
                ...styles.mobileNavItem,
                color: currentView.type === 'settings' ? '#f97316' : '#94a3b8',
              }}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </nav>
        </>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.logo}>Admin</span>
          </div>
          <nav style={styles.sidebarNav}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView.type.startsWith(item.id) || currentView.type === item.view;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo({ type: item.view })}
                  style={{
                    ...styles.navItem,
                    background: isActive ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    color: isActive ? '#f97316' : '#e2e8f0',
                    borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent',
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div style={styles.sidebarFooter}>
            <button
              onClick={() => navigateTo({ type: 'settings' })}
              style={{
                ...styles.navItem,
                color: currentView.type === 'settings' ? '#f97316' : '#94a3b8',
              }}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <a href="/" style={styles.backToSite}>
              <ArrowLeft size={18} />
              <span>Back to Site</span>
            </a>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main style={{
        ...styles.main,
        marginLeft: isMobile ? 0 : '220px',
        paddingTop: isMobile ? '60px' : 0,
      }}>
        {renderContent()}
      </main>
    </div>
  );
}

// Clean, sober styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
  },
  loadingContainer: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mobile
  mobileHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    background: '#111',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 100,
  },
  menuButton: {
    background: 'transparent',
    border: 'none',
    color: '#e2e8f0',
    padding: '8px',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: '18px',
  },
  backLink: {
    color: '#94a3b8',
    padding: '8px',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 200,
  },
  mobileNav: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    background: '#111',
    zIndex: 300,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
  },
  mobileNavHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #222',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '8px',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#e2e8f0',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '4px',
    minHeight: '48px',
    width: '100%',
    textAlign: 'left',
  },
  mobileNavDivider: {
    height: '1px',
    background: '#222',
    margin: '16px 0',
  },

  // Desktop Sidebar
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '220px',
    background: '#111',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid #222',
  },
  logo: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: '20px',
  },
  sidebarNav: {
    flex: 1,
    padding: '16px 8px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '4px',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  sidebarFooter: {
    padding: '16px 8px',
    borderTop: '1px solid #222',
  },
  backToSite: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    marginTop: '8px',
  },

  // Main content
  main: {
    minHeight: '100vh',
    background: '#0a0a0a',
  },
};
