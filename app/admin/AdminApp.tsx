'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import {
  Package, ShoppingBag, Newspaper, Image, ShoppingCart, Settings,
  Plus, Edit2, Trash2, Eye, Database, ArrowLeft, Menu, Home,
  Dices, BookOpen, Palette, DollarSign, Users, TrendingUp,
  X, Check, AlertCircle, Search, ChevronDown, ChevronRight,
  Clock, Filter, Calendar, Tag, Save, TestTube, UserCog, Heart,
  BarChart3, Shield, Target, Calculator, Crown, GraduationCap, Briefcase,
  Landmark, FileText, Building, Zap, QrCode, MessageSquare
} from 'lucide-react';
import { adminStyles } from './styles/adminStyles';

// Import components
import GamesListView from './components/GamesListView';
import GameEditForm from './components/GameEditForm';
import OrdersListView from './components/OrdersListView';
import MerchListView from './components/MerchListView';
import MerchEditForm from './components/MerchEditForm';
import MigrationsView from './components/MigrationsView';
import DashboardView from './components/DashboardView';
import TestModesView from './components/TestModesView';
import UsersListView from './components/UsersListView';
import UserModerationView from './components/UserModerationView';
import RolesManagement from './components/RolesManagement';
import MembershipManagement from './components/MembershipManagement';
import ComicsListView from './components/ComicsListView';
import NewsListView from './components/NewsListView';
import NewsEditForm from './components/NewsEditForm';
import ArtworkListView from './components/ArtworkListView';
import ArtworkEditForm from './components/ArtworkEditForm';
import SettingsView from './components/SettingsView';
import IntegrationsManager from './components/IntegrationsManager';
import DiagnosticsView from './components/DiagnosticsView';
import AnalyticsView from './components/AnalyticsView';
import ComplianceView from './components/ComplianceView';
import PowerDashboard from './components/PowerDashboard';
import CustomerManagement from './components/CustomerManagement';
import EmailCampaigns from './components/EmailCampaigns';
import MarketingWarRoom from './components/MarketingWarRoom';
import ProductIntelligence from './components/ProductIntelligence';
import Afterroar from './components/Afterroar';
import OperatorManual from './components/OperatorManual';
import EmployeeHub from './components/EmployeeHub';
import FinancialIntelligence from './components/FinancialIntelligence';
import InvoiceSystem from './components/InvoiceSystem';
import B2BPortal from './components/B2BPortal';
import FulfillmentCenter from './components/FulfillmentCenter';
import DesignComponentsView from './components/DesignComponentsView';
import SiteIssuesPage from './site-issues/page';
import WarRoomDashboard from './components/WarRoomDashboard';

type ViewType =
  | 'dashboard'
  | 'power-dashboard'
  | 'war-room'
  | 'customers'
  | 'email-campaigns'
  | 'marketing-war-room'
  | 'product-intelligence'
  | 'afterroar-plus'
  | 'operator-manual'
  | 'employee-hub'
  | 'financial-intelligence'
  | 'invoice-system'
  | 'b2b-portal'
  | 'games-list'
  | 'games-edit'
  | 'games-new'
  | 'design-components'
  | 'merch-list'
  | 'merch-edit'
  | 'merch-new'
  | 'orders-list'
  | 'orders-detail'
  | 'fulfillment'
  | 'returns'
  | 'support'
  | 'comics-list'
  | 'comics-edit'
  | 'comics-new'
  | 'news-list'
  | 'news-edit'
  | 'news-new'
  | 'artwork-list'
  | 'artwork-edit'
  | 'artwork-new'
  | 'migrations'
  | 'integrations'
  | 'settings'
  | 'test-modes'
  | 'users-list'
  | 'users-edit'
  | 'users-new'
  | 'users-moderation'
  | 'roles'
  | 'memberships'
  | 'diagnostics'
  | 'analytics'
  | 'compliance'
  | 'site-issues'
  | 'redirects';

interface ViewState {
  type: ViewType;
  data?: any;
}

export default function AdminApp() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; view: ViewState }>>([
    { label: 'Dashboard', view: { type: 'dashboard' } }
  ]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isLoadingViewData, setIsLoadingViewData] = useState(false);
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Verify admin permissions
  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
    
    if (isLoaded && user) {
      // Verify admin status via API
      fetch('/api/admin/whoami')
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin || data.isSuperAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            // Redirect non-admins
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

  // Helper to build URL from view state
  const buildUrlFromView = useCallback((view: ViewState): string => {
    const params = new URLSearchParams();
    params.set('view', view.type);

    // Add ID for views that need it
    if (view.data?.id) {
      params.set('id', String(view.data.id));
    }

    return `/admin?${params.toString()}`;
  }, []);

  // Helper to get label for a view type
  const getLabelForView = useCallback((viewType: ViewType, data?: any): string => {
    // Check menu sections for the view
    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.view.type === viewType) {
          return item.label;
        }
        if (item.subItems) {
          for (const subItem of item.subItems) {
            if (subItem.view.type === viewType) {
              return subItem.label;
            }
          }
        }
      }
    }

    // Special labels for edit views
    if (viewType.endsWith('-edit') && data) {
      const name = data.title || data.name || data.id;
      return `Edit: ${name}`;
    }
    if (viewType.endsWith('-detail') && data) {
      const id = data.id ? String(data.id).slice(0, 8) : 'Item';
      return `Order: ${id}`;
    }
    if (viewType.endsWith('-new')) {
      return 'New';
    }

    return viewType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, []);

  // Fetch data for edit views when loading from URL
  const fetchViewData = useCallback(async (viewType: ViewType, id: string): Promise<any> => {
    try {
      switch (viewType) {
        case 'games-edit': {
          const res = await fetch(`/api/admin/games/${id}`);
          if (res.ok) return await res.json();
          break;
        }
        case 'merch-edit': {
          const res = await fetch(`/api/admin/merch/${id}`);
          if (res.ok) return await res.json();
          break;
        }
        case 'orders-detail': {
          const res = await fetch(`/api/admin/orders/${id}`);
          if (res.ok) return await res.json();
          break;
        }
        case 'news-edit': {
          const res = await fetch(`/api/admin/news/${id}`);
          if (res.ok) {
            const data = await res.json();
            return data.post || data;
          }
          break;
        }
        case 'artwork-edit': {
          const res = await fetch(`/api/admin/artwork/${id}`);
          if (res.ok) {
            const data = await res.json();
            return data.artwork || data;
          }
          break;
        }
        case 'users-edit': {
          const res = await fetch(`/api/admin/users/${id}`);
          if (res.ok) {
            const data = await res.json();
            return data.user || data;
          }
          break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${viewType}:`, error);
    }
    return null;
  }, []);

  // Initialize view from URL params on mount
  useEffect(() => {
    if (urlInitialized || !isAdmin) return;

    const initViewFromUrl = async () => {
      const viewParam = searchParams.get('view');
      const idParam = searchParams.get('id');

      if (!viewParam) {
        setUrlInitialized(true);
        return;
      }

      // Validate view type
      const validViews: ViewType[] = [
        'dashboard', 'power-dashboard', 'war-room', 'customers', 'email-campaigns',
        'marketing-war-room', 'product-intelligence', 'afterroar-plus', 'operator-manual',
        'employee-hub', 'financial-intelligence', 'invoice-system', 'b2b-portal',
        'games-list', 'games-edit', 'games-new', 'design-components',
        'merch-list', 'merch-edit', 'merch-new',
        'orders-list', 'orders-detail', 'fulfillment', 'returns', 'support',
        'comics-list', 'comics-edit', 'comics-new',
        'news-list', 'news-edit', 'news-new',
        'artwork-list', 'artwork-edit', 'artwork-new',
        'migrations', 'integrations', 'settings', 'test-modes',
        'users-list', 'users-edit', 'users-new', 'users-moderation',
        'roles', 'memberships', 'diagnostics', 'analytics', 'compliance',
        'site-issues', 'redirects'
      ];

      if (!validViews.includes(viewParam as ViewType)) {
        setUrlInitialized(true);
        return;
      }

      const viewType = viewParam as ViewType;

      // Check if this view needs data
      const needsData = viewType.endsWith('-edit') || viewType === 'orders-detail';

      if (needsData && idParam) {
        setIsLoadingViewData(true);
        const data = await fetchViewData(viewType, idParam);
        setIsLoadingViewData(false);

        if (data) {
          const label = getLabelForView(viewType, data);
          const view: ViewState = { type: viewType, data };
          setCurrentView(view);

          // Build breadcrumbs
          const newBreadcrumbs = [{ label: 'Dashboard', view: { type: 'dashboard' as ViewType } }];
          const prefix = viewType.split('-')[0];
          const listView = `${prefix}-list` as ViewType;

          // Find parent label
          for (const section of menuSections) {
            const item = section.items.find(i => i.id === prefix);
            if (item) {
              newBreadcrumbs.push({ label: item.label, view: { type: listView } });
              break;
            }
          }
          newBreadcrumbs.push({ label, view });
          setBreadcrumbs(newBreadcrumbs);
        }
      } else if (!needsData) {
        const label = getLabelForView(viewType);
        const view: ViewState = { type: viewType };
        setCurrentView(view);

        // Build breadcrumbs for non-data views
        if (viewType !== 'dashboard') {
          const newBreadcrumbs = [{ label: 'Dashboard', view: { type: 'dashboard' as ViewType } }];
          newBreadcrumbs.push({ label, view });
          setBreadcrumbs(newBreadcrumbs);
        }
      }

      setUrlInitialized(true);
    };

    initViewFromUrl();
  }, [searchParams, isAdmin, urlInitialized, fetchViewData, getLabelForView]);

  const navigateTo = useCallback((view: ViewState, label: string) => {
    setCurrentView(view);

    // Update URL (shallow navigation - no page reload)
    const url = buildUrlFromView(view);
    router.push(url, { scroll: false });

    // Update breadcrumbs
    if (view.type === 'dashboard') {
      setBreadcrumbs([{ label: 'Dashboard', view: { type: 'dashboard' } }]);
    } else {
      // Always start with Dashboard
      let newBreadcrumbs = [{ label: 'Dashboard', view: { type: 'dashboard' as ViewType } }];

      // Determine parent for sub-views
      const viewTypePrefix = view.type.split('-')[0]; // e.g., 'games' from 'games-edit'
      const viewTypeSuffix = view.type.split('-')[1]; // e.g., 'edit' from 'games-edit'

      // Find parent item across all sections
      let parentItem: any = null;
      for (const section of menuSections) {
        const found = section.items.find(item => item.id === viewTypePrefix);
        if (found) {
          parentItem = found;
          break;
        }
      }

      // Only add parent breadcrumb if this is actually a sub-view (edit/new/detail)
      if (parentItem && viewTypeSuffix && viewTypeSuffix !== 'list') {
        newBreadcrumbs.push({ label: parentItem.label, view: parentItem.view });
        // Add current breadcrumb with specific label
        newBreadcrumbs.push({ label, view });
      } else if (parentItem && view.type === parentItem.view.type) {
        // This is the parent view itself, just add it once
        newBreadcrumbs.push({ label: parentItem.label, view });
      } else {
        // Add current breadcrumb for any other case
        newBreadcrumbs.push({ label, view });
      }

      setBreadcrumbs(newBreadcrumbs);
    }
  }, [router, buildUrlFromView]);

  // Organized menu sections
  const menuSections = [
    {
      id: 'overview',
      label: 'Overview',
      expanded: true, // Default expanded
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <Home size={20} />,
          view: { type: 'dashboard' as ViewType },
          color: '#fdba74',
        },
        {
          id: 'power-dashboard',
          label: 'Command Center',
          icon: <TrendingUp size={20} />,
          view: { type: 'power-dashboard' as ViewType },
          color: '#10b981',
          badge: 'NEW',
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <BarChart3 size={20} />,
          view: { type: 'analytics' as ViewType },
          color: '#06b6d4',
        },
        {
          id: 'war-room',
          label: 'War Room',
          icon: <Target size={20} />,
          view: { type: 'war-room' as ViewType },
          color: '#f97316',
          badge: 'LIVE',
        },
      ]
    },
    {
      id: 'commerce',
      label: 'E-Commerce',
      expanded: true,
      items: [
        {
          id: 'orders',
          label: 'Orders',
          icon: <ShoppingCart size={20} />,
          view: { type: 'orders-list' as ViewType },
          color: '#10b981',
        },
        {
          id: 'fulfillment',
          label: 'Fulfillment Center',
          icon: <Package size={20} />,
          view: { type: 'fulfillment' as ViewType },
          color: '#f97316',
          badge: 'SHIP',
        },
        {
          id: 'games',
          label: 'Games',
          icon: <Dices size={20} />,
          view: { type: 'games-list' as ViewType },
          color: '#f97316',
          subItems: [
            { label: 'All Games', view: { type: 'games-list' as ViewType } },
            { label: 'New Game', view: { type: 'games-new' as ViewType } },
            { label: 'Design Components', view: { type: 'design-components' as ViewType } },
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
          id: 'product-intelligence',
          label: 'Product Intel',
          icon: <Calculator size={20} />,
          view: { type: 'product-intelligence' as ViewType },
          color: '#14b8a6',
          badge: 'COGS',
        },
      ]
    },
    {
      id: 'crm',
      label: 'Customer Relations',
      expanded: false,
      items: [
        {
          id: 'support-tickets',
          label: 'Support Tickets',
          icon: <MessageSquare size={20} />,
          view: { type: 'support' as ViewType },
          color: '#f97316',
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: <Users size={20} />,
          view: { type: 'customers' as ViewType },
          color: '#8b5cf6',
          badge: 'PRO',
        },
        {
          id: 'email-campaigns',
          label: 'Email Marketing',
          icon: <Menu size={20} />,
          view: { type: 'email-campaigns' as ViewType },
          color: '#ec4899',
          badge: 'HOT',
        },
        {
          id: 'marketing-war-room',
          label: 'War Room',
          icon: <Target size={20} />,
          view: { type: 'marketing-war-room' as ViewType },
          color: '#06b6d4',
          badge: 'INTEL',
        },
        {
          id: 'afterroar-plus',
          label: 'Afterroar+',
          icon: <Crown size={20} />,
          view: { type: 'afterroar-plus' as ViewType },
          color: '#f97316',
          badge: 'SOON',
        },
      ]
    },
    {
      id: 'finance',
      label: 'Finance & Billing',
      expanded: false,
      items: [
        {
          id: 'financial-intelligence',
          label: 'Financials',
          icon: <Landmark size={20} />,
          view: { type: 'financial-intelligence' as ViewType },
          color: '#10b981',
          badge: 'CFO',
        },
        {
          id: 'invoice-system',
          label: 'Invoicing',
          icon: <FileText size={20} />,
          view: { type: 'invoice-system' as ViewType },
          color: '#3b82f6',
          badge: 'PAY',
        },
        {
          id: 'b2b-portal',
          label: 'B2B Portal',
          icon: <Building size={20} />,
          view: { type: 'b2b-portal' as ViewType },
          color: '#8b5cf6',
          badge: 'B2B',
        },
      ]
    },
    {
      id: 'hr',
      label: 'Human Resources',
      expanded: false,
      items: [
        {
          id: 'employee-hub',
          label: 'Employee Hub',
          icon: <Briefcase size={20} />,
          view: { type: 'employee-hub' as ViewType },
          color: '#a855f7',
          badge: 'HR',
        },
        {
          id: 'operator-manual',
          label: 'Training Hub',
          icon: <GraduationCap size={20} />,
          view: { type: 'operator-manual' as ViewType },
          color: '#22d3ee',
          badge: 'DOCS',
        },
      ]
    },
    {
      id: 'content',
      label: 'Content Management',
      expanded: false,
      items: [
        {
          id: 'news',
          label: 'News',
          icon: <Newspaper size={20} />,
          view: { type: 'news-list' as ViewType },
          color: '#f97316',
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
      ]
    },
    {
      id: 'users-section',
      label: 'User Management',
      expanded: false,
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: <UserCog size={20} />,
          view: { type: 'users-list' as ViewType },
          color: '#3b82f6',
          subItems: [
            { label: 'All Users', view: { type: 'users-list' as ViewType } },
            { label: 'Memberships', view: { type: 'memberships' as ViewType } },
            { label: 'Roles & Permissions', view: { type: 'roles' as ViewType } },
            { label: 'New User', view: { type: 'users-new' as ViewType } },
            { label: 'Moderation', view: { type: 'users-moderation' as ViewType } },
          ]
        },
      ]
    },
    {
      id: 'system',
      label: 'System & Settings',
      expanded: false,
      items: [
        {
          id: 'integrations',
          label: 'Integrations',
          icon: <Zap size={20} />,
          view: { type: 'integrations' as ViewType },
          color: '#fbbf24',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings size={20} />,
          view: { type: 'settings' as ViewType },
          color: '#94a3b8',
        },
        {
          id: 'migrations',
          label: 'Migrations',
          icon: <Database size={20} />,
          view: { type: 'migrations' as ViewType },
          color: '#6366f1',
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
        {
          id: 'compliance',
          label: 'Legal Compliance',
          icon: <Shield size={20} />,
          view: { type: 'compliance' as ViewType },
          color: '#10b981',
        },
        {
          id: 'site-issues',
          label: 'Site Issues',
          icon: <AlertCircle size={20} />,
          view: { type: 'site-issues' as ViewType },
          color: '#f59e0b',
        },
        {
          id: 'redirects',
          label: 'URL Redirects',
          icon: <QrCode size={20} />,
          view: { type: 'redirects' as ViewType },
          color: '#22d3ee',
          badge: 'QR',
        },
      ]
    },
  ];

  // Track expanded sections and menu items
  const [expandedSections, setExpandedSections] = useState<string[]>(
    menuSections.filter(s => s.expanded).map(s => s.id)
  );
  const [expandedMenuItems, setExpandedMenuItems] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

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
      
      case 'power-dashboard':
        return <PowerDashboard onNavigate={navigateTo} />;

      case 'war-room':
        return <WarRoomDashboard />;

      case 'customers':
        return <CustomerManagement onNavigate={navigateTo} />;
      
      case 'email-campaigns':
        return <EmailCampaigns onNavigate={navigateTo} />;
      
      case 'marketing-war-room':
        return <MarketingWarRoom onNavigate={navigateTo} />;
      
      case 'product-intelligence':
        return <ProductIntelligence onNavigate={navigateTo} />;
      
      case 'afterroar-plus':
        return <Afterroar onNavigate={navigateTo} />;
      
      case 'operator-manual':
        return <OperatorManual onNavigate={navigateTo} />;
      
      case 'employee-hub':
        return <EmployeeHub onNavigate={navigateTo} />;
      
      case 'financial-intelligence':
        return <FinancialIntelligence onNavigate={navigateTo} />;
      
      case 'invoice-system':
        return <InvoiceSystem onNavigate={navigateTo} />;
      
      case 'b2b-portal':
        return <B2BPortal onNavigate={navigateTo} />;
      
      case 'analytics':
        return <AnalyticsView />;
      
      case 'compliance':
        return <ComplianceView />;
      
      case 'site-issues':
        return <SiteIssuesPage />;

      case 'redirects':
        return (
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <iframe
              src="/admin/redirects"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#111827'
              }}
            />
          </div>
        );
      
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
      
      case 'design-components':
        return <DesignComponentsView />;
      
      case 'merch-list':
        return (
          <MerchListView 
            onEdit={(merch) => navigateTo({ type: 'merch-edit', data: merch }, `Edit: ${merch.name}`)}
            onNew={() => navigateTo({ type: 'merch-new' }, 'New Merch')}
          />
        );
      
      case 'merch-edit':
        return (
          <MerchEditForm 
            merch={currentView.data}
            onSave={() => navigateTo({ type: 'merch-list' }, 'Merchandise')}
            onCancel={() => navigateTo({ type: 'merch-list' }, 'Merchandise')}
          />
        );
      
      case 'merch-new':
        return (
          <MerchEditForm 
            onSave={() => navigateTo({ type: 'merch-list' }, 'Merchandise')}
            onCancel={() => navigateTo({ type: 'merch-list' }, 'Merchandise')}
          />
        );
      
      case 'orders-list':
        return (
          <OrdersListView 
            onViewDetails={(order) => navigateTo({ type: 'orders-detail', data: order }, `Order: ${order.id.slice(0, 8)}`)}
          />
        );
      
      case 'fulfillment':
        return <FulfillmentCenter onNavigate={navigateTo} />;
      
      case 'returns':
        return (
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <iframe 
              src="/admin/returns" 
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                background: '#111827'
              }} 
            />
          </div>
        );
      
      case 'support':
        return (
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <iframe 
              src="/admin/support" 
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                background: '#111827'
              }} 
            />
          </div>
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
      
      case 'users-moderation':
        return (
          <UserModerationView 
            onBack={() => navigateTo({ type: 'users-list' }, 'Users')}
          />
        );
      
      case 'roles':
        return <RolesManagement />;
      
      case 'memberships':
        return <MembershipManagement />;
      
      case 'comics-list':
        return (
          <ComicsListView
            onEdit={(comic) => navigateTo({ type: 'comics-edit', data: comic }, `Edit: ${comic.title}`)}
            onNew={() => navigateTo({ type: 'comics-new' }, 'New Comic')}
          />
        );

      case 'news-list':
        return (
          <NewsListView
            onEdit={(post) => navigateTo({ type: 'news-edit', data: post }, `Edit: ${post.title}`)}
            onNew={() => navigateTo({ type: 'news-new' }, 'New News Post')}
          />
        );

      case 'news-new':
        return (
          <NewsEditForm
            onBack={() => navigateTo({ type: 'news-list' }, 'News')}
            onSave={() => navigateTo({ type: 'news-list' }, 'News')}
          />
        );

      case 'news-edit':
        return (
          <NewsEditForm
            post={currentView.data}
            onBack={() => navigateTo({ type: 'news-list' }, 'News')}
            onSave={() => navigateTo({ type: 'news-list' }, 'News')}
          />
        );

      case 'artwork-list':
        return (
          <ArtworkListView
            onEdit={(artwork) => navigateTo({ type: 'artwork-edit', data: artwork }, `Edit: ${artwork.name}`)}
            onNew={() => navigateTo({ type: 'artwork-new' }, 'New Artwork')}
          />
        );
      
      case 'artwork-new':
        return (
          <ArtworkEditForm
            onBack={() => navigateTo({ type: 'artwork-list' }, 'Artwork')}
            onSave={() => navigateTo({ type: 'artwork-list' }, 'Artwork')}
          />
        );
      
      case 'artwork-edit':
        return (
          <ArtworkEditForm
            artwork={currentView.data}
            onBack={() => navigateTo({ type: 'artwork-list' }, 'Artwork')}
            onSave={() => navigateTo({ type: 'artwork-list' }, 'Artwork')}
          />
        );
      
      case 'integrations':
        return <IntegrationsManager />;
      
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

  if (!isLoaded || isVerifying || isLoadingViewData) {
    return (
      <div style={adminStyles.container}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ color: '#fdba74', fontSize: '18px' }}>
            {!isLoaded ? 'Loading admin panel...' : isVerifying ? 'Verifying admin permissions...' : 'Loading view...'}
          </div>
        </div>
      </div>
    );
  }

  // Additional check - shouldn't reach here if not admin, but just in case
  if (isAdmin === false) {
    return (
      <div style={adminStyles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ color: '#ef4444', fontSize: '18px' }}>Access Denied</div>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>You do not have permission to access the admin panel.</div>
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
          {menuSections.map((section) => (
            <div key={section.id} style={{ marginBottom: '12px' }}>
              {/* Section Header */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fdba74';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <ChevronRight 
                    size={14} 
                    style={{
                      transform: expandedSections.includes(section.id) ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                  <span>{section.label}</span>
                </button>
              )}

              {/* Section Items */}
              {(sidebarCollapsed || expandedSections.includes(section.id)) && (
                <div style={{ marginTop: sidebarCollapsed ? 0 : '4px' }}>
                  {section.items.map((item) => (
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
                          padding: sidebarCollapsed ? '10px' : '10px 12px',
                          paddingLeft: sidebarCollapsed ? '10px' : '28px',
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
                          marginBottom: '2px',
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
                        <div style={{ color: item.color, flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        {!sidebarCollapsed && (
                          <>
                            <span style={{ flex: 1, textAlign: 'left', fontWeight: '500' }}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                background: item.color,
                                color: '#0a0a0a',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                              }}>
                                {item.badge}
                              </span>
                            )}
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
                        <div style={{ marginLeft: '48px', marginTop: '2px' }}>
                          {item.subItems.map((subItem, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                navigateTo(subItem.view, subItem.label);
                                if (isMobile) {
                                  setMobileMenuOpen(false);
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
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
                                fontSize: '13px',
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