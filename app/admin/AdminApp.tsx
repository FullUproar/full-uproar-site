'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { 
  Package, ShoppingBag, Newspaper, Image, ShoppingCart, Settings, 
  Plus, Edit2, Trash2, Eye, Database, ArrowLeft, Menu, Home,
  Gamepad2, BookOpen, Palette, DollarSign, Users, TrendingUp,
  X, Check, AlertCircle, Search, ChevronDown, ChevronRight,
  Clock, Filter, Calendar, Tag, Save, TestTube, UserCog, Heart
} from 'lucide-react';
import { adminStyles } from './styles/adminStyles';

// Import components
import GamesListView from './components/GamesListView';
import GameEditForm from './components/GameEditForm';
import OrdersListView from './components/OrdersListView';
import MerchListView from './components/MerchListView';
import MigrationsView from './components/MigrationsView';
import DashboardView from './components/DashboardView';
import TestModesView from './components/TestModesView';
import UsersListView from './components/UsersListView';
import ComicsListView from './components/ComicsListView';
import ArtworkListView from './components/ArtworkListView';
import SettingsView from './components/SettingsView';
import DiagnosticsView from './components/DiagnosticsView';

type ViewType = 
  | 'dashboard'
  | 'games-list'
  | 'games-edit'
  | 'games-new'
  | 'merch-list'
  | 'merch-edit'
  | 'merch-new'
  | 'orders-list'
  | 'orders-detail'
  | 'comics-list'
  | 'comics-edit'
  | 'comics-new'
  | 'artwork-list'
  | 'artwork-edit'
  | 'artwork-new'
  | 'migrations'
  | 'settings'
  | 'test-modes'
  | 'users-list'
  | 'users-edit'
  | 'users-new'
  | 'diagnostics';

interface ViewState {
  type: ViewType;
  data?: any;
}

export default function AdminApp() {
  const { user, isLoaded } = useUser();
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; view: ViewState }>>([
    { label: 'Dashboard', view: { type: 'dashboard' } }
  ]);

  // Basic admin check
  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
  }, [user, isLoaded]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigateTo = (view: ViewState, label: string) => {
    setCurrentView(view);
    
    // Update breadcrumbs
    if (view.type === 'dashboard') {
      setBreadcrumbs([{ label: 'Dashboard', view: { type: 'dashboard' } }]);
    } else {
      const existingIndex = breadcrumbs.findIndex(b => b.view.type === view.type);
      if (existingIndex >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { label, view }]);
      }
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      view: { type: 'dashboard' as ViewType },
      color: '#fdba74',
    },
    {
      id: 'users',
      label: 'Users',
      icon: <UserCog size={20} />,
      view: { type: 'users-list' as ViewType },
      color: '#3b82f6',
      subItems: [
        { label: 'All Users', view: { type: 'users-list' as ViewType } },
        { label: 'New User', view: { type: 'users-new' as ViewType } },
      ]
    },
    {
      id: 'games',
      label: 'Games',
      icon: <Gamepad2 size={20} />,
      view: { type: 'games-list' as ViewType },
      color: '#f97316',
      subItems: [
        { label: 'All Games', view: { type: 'games-list' as ViewType } },
        { label: 'New Game', view: { type: 'games-new' as ViewType } },
      ]
    },
    {
      id: 'merch',
      label: 'Merchandise',
      icon: <ShoppingBag size={20} />,
      view: { type: 'merch-list' as ViewType },
      color: '#8b5cf6',
      subItems: [
        { label: 'All Merch', view: { type: 'merch-list' as ViewType } },
        { label: 'New Merch', view: { type: 'merch-new' as ViewType } },
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      view: { type: 'orders-list' as ViewType },
      color: '#10b981',
    },
    {
      id: 'comics',
      label: 'Comics',
      icon: <BookOpen size={20} />,
      view: { type: 'comics-list' as ViewType },
      color: '#3b82f6',
    },
    {
      id: 'artwork',
      label: 'Artwork',
      icon: <Palette size={20} />,
      view: { type: 'artwork-list' as ViewType },
      color: '#ec4899',
    },
    {
      id: 'migrations',
      label: 'Migrations',
      icon: <Database size={20} />,
      view: { type: 'migrations' as ViewType },
      color: '#6366f1',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      view: { type: 'settings' as ViewType },
      color: '#94a3b8',
    },
    {
      id: 'test-modes',
      label: 'Test Modes',
      icon: <TestTube size={20} />,
      view: { type: 'test-modes' as ViewType },
      color: '#f97316',
    },
    {
      id: 'diagnostics',
      label: 'System Health',
      icon: <Heart size={20} />,
      view: { type: 'diagnostics' as ViewType },
      color: '#ef4444',
    },
  ];

  const [expandedMenuItems, setExpandedMenuItems] = useState<string[]>([]);

  const toggleMenuItem = (itemId: string) => {
    setExpandedMenuItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'dashboard':
        return <DashboardView onNavigate={navigateTo} />;
      
      case 'games-list':
        return (
          <GamesListView 
            onEdit={(game) => navigateTo({ type: 'games-edit', data: game }, `Edit: ${game.title}`)}
            onNew={() => navigateTo({ type: 'games-new' }, 'New Game')}
          />
        );
      
      case 'games-edit':
        return (
          <GameEditForm 
            game={currentView.data}
            onSave={() => navigateTo({ type: 'games-list' }, 'Games')}
            onCancel={() => navigateTo({ type: 'games-list' }, 'Games')}
          />
        );
      
      case 'games-new':
        return (
          <GameEditForm 
            onSave={() => navigateTo({ type: 'games-list' }, 'Games')}
            onCancel={() => navigateTo({ type: 'games-list' }, 'Games')}
          />
        );
      
      case 'merch-list':
        return (
          <MerchListView 
            onEdit={(merch) => navigateTo({ type: 'merch-edit', data: merch }, `Edit: ${merch.name}`)}
            onNew={() => navigateTo({ type: 'merch-new' }, 'New Merch')}
          />
        );
      
      case 'orders-list':
        return (
          <OrdersListView 
            onViewDetails={(order) => navigateTo({ type: 'orders-detail', data: order }, `Order: ${order.id.slice(0, 8)}`)}
          />
        );
      
      case 'migrations':
        return <MigrationsView />;
      
      case 'test-modes':
        return <TestModesView />;
      
      case 'diagnostics':
        return <DiagnosticsView />;
      
      case 'users-list':
        return (
          <UsersListView 
            onEdit={(user) => navigateTo({ type: 'users-edit', data: user }, `Edit: ${user.displayName || user.username || user.email}`)}
            onNew={() => navigateTo({ type: 'users-new' }, 'New User')}
          />
        );
      
      case 'comics-list':
        return (
          <ComicsListView
            onEdit={(comic) => navigateTo({ type: 'comics-edit', data: comic }, `Edit: ${comic.title}`)}
            onNew={() => navigateTo({ type: 'comics-new' }, 'New Comic')}
          />
        );
      
      case 'artwork-list':
        return (
          <ArtworkListView
            onEdit={(artwork) => navigateTo({ type: 'artwork-edit', data: artwork }, `Edit: ${artwork.name}`)}
            onNew={() => navigateTo({ type: 'artwork-new' }, 'New Artwork')}
          />
        );
      
      case 'settings':
        return <SettingsView />;
      
      default:
        return (
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>{currentView.type.replace('-', ' ').toUpperCase()}</h2>
            <p style={{ color: '#94a3b8' }}>This view is coming soon...</p>
          </div>
        );
    }
  };

  if (!isLoaded) {
    return (
      <div style={adminStyles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <div style={{ color: '#fdba74', fontSize: '18px' }}>Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: adminStyles.container.background }}>
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: isMobile ? '260px' : (sidebarCollapsed ? '60px' : '260px'),
        background: 'rgba(17, 24, 39, 0.95)',
        borderRight: '2px solid rgba(249, 115, 22, 0.3)',
        transition: 'all 0.3s',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        left: isMobile ? (mobileMenuOpen ? 0 : '-260px') : 0,
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {!sidebarCollapsed && (
            <h2 style={{ 
              color: '#fdba74', 
              fontSize: '20px', 
              fontWeight: 'bold',
              margin: 0,
            }}>
              Admin Panel
            </h2>
          )}
          {!sidebarCollapsed && (
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              v1.1.0
            </div>
          )}
          <button
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen(!mobileMenuOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fdba74',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {isMobile && mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  navigateTo(item.view, item.label);
                  if (item.subItems) {
                    toggleMenuItem(item.id);
                  }
                  if (isMobile) {
                    setMobileMenuOpen(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: sidebarCollapsed ? '12px' : '12px 16px',
                  background: currentView.type.startsWith(item.id) 
                    ? 'rgba(249, 115, 22, 0.2)' 
                    : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: currentView.type.startsWith(item.id) ? '#fdba74' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '4px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!currentView.type.startsWith(item.id)) {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                    e.currentTarget.style.color = '#fde68a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!currentView.type.startsWith(item.id)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
              >
                <div style={{ color: item.color }}>
                  {item.icon}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: '500' }}>
                      {item.label}
                    </span>
                    {item.subItems && (
                      <ChevronRight 
                        size={16} 
                        style={{
                          transform: expandedMenuItems.includes(item.id) ? 'rotate(90deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Sub Items */}
              {!sidebarCollapsed && item.subItems && expandedMenuItems.includes(item.id) && (
                <div style={{ marginLeft: '32px', marginTop: '4px' }}>
                  {item.subItems.map((subItem, index) => (
                    <button
                      key={index}
                      onClick={() => navigateTo(subItem.view, subItem.label)}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        background: currentView.type === subItem.view.type 
                          ? 'rgba(249, 115, 22, 0.15)' 
                          : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: currentView.type === subItem.view.type ? '#fdba74' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '2px',
                        fontSize: '14px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fde68a';
                      }}
                      onMouseLeave={(e) => {
                        if (currentView.type !== subItem.view.type) {
                          e.currentTarget.style.color = '#94a3b8';
                        }
                      }}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Back to Site Link */}
        <div style={{
          padding: '12px',
          borderTop: '2px solid rgba(249, 115, 22, 0.2)',
        }}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '8px',
              color: '#fdba74',
              textDecoration: 'none',
              transition: 'all 0.2s',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
            }}
          >
            <ArrowLeft size={20} />
            {!sidebarCollapsed && <span style={{ fontWeight: '500' }}>Back to Site</span>}
          </a>
        </div>

        {/* User Info */}
        <div style={{
          padding: '16px',
          borderTop: '2px solid rgba(249, 115, 22, 0.2)',
        }}>
          {!sidebarCollapsed && (
            <div style={{ 
              color: '#94a3b8', 
              fontSize: '12px',
              textAlign: 'center',
            }}>
              {user?.emailAddresses[0]?.emailAddress}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? '60px' : '260px'),
        transition: 'margin-left 0.3s',
      }}>
        {/* Header with Breadcrumbs */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
          padding: isMobile ? '16px' : '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fdba74',
                cursor: 'pointer',
                padding: '4px',
                marginRight: '8px',
              }}
            >
              <Menu size={24} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                )}
                <button
                  onClick={() => navigateTo(crumb.view, crumb.label)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: index === breadcrumbs.length - 1 ? '#fdba74' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (index !== breadcrumbs.length - 1) {
                      e.currentTarget.style.color = '#fde68a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== breadcrumbs.length - 1) {
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ 
          padding: '32px',
          minHeight: 'calc(100vh - 100px)',
          color: '#e2e8f0'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}