'use client';

import React, { useState, useEffect } from 'react';
import {
  Package, ShoppingBag, ShoppingCart, DollarSign, TrendingUp,
  Plus, Gamepad2, BookOpen, Palette, Database, Settings, MessageSquare,
  RotateCcw, Box, HelpCircle, BarChart3, Layers, Truck
} from 'lucide-react';
import Link from 'next/link';
import { adminStyles } from '../styles/adminStyles';
import DeploymentInfo from '../../components/DeploymentInfo';
import TestModeToggle from './TestModeToggle';

interface Stats {
  totalGames: number;
  totalMerch: number;
  totalOrders: number;
  totalRevenue: number;
  totalArtwork: number;
  totalComics: number;
}

interface DashboardViewProps {
  onNavigate: (view: any, label: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    totalMerch: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalArtwork: 0,
    totalComics: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [gamesRes, merchRes, ordersRes] = await Promise.all([
        fetch('/api/admin/games'),
        fetch('/api/admin/merch'),
        fetch('/api/admin/orders'),
      ]);

      const games = await gamesRes.json();
      const merch = await merchRes.json();
      const ordersData = await ordersRes.json();

      // Extract orders array from the response object
      const orders = ordersData.orders || [];
      const totalRevenue = ordersData.stats?.totalRevenue || 0;

      setStats({
        totalGames: games.length || 0,
        totalMerch: merch.length || 0,
        totalOrders: ordersData.stats?.totalOrders || orders.length || 0,
        totalRevenue: totalRevenue / 100,
        totalArtwork: 0,
        totalComics: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const menuItems = [
    {
      title: 'Games',
      icon: <Gamepad2 size={24} />,
      view: { type: 'games-list' },
      count: stats.totalGames,
      color: '#f97316',
      description: 'Manage game catalog'
    },
    {
      title: 'Merchandise',
      icon: <ShoppingBag size={24} />,
      view: { type: 'merch-list' },
      count: stats.totalMerch,
      color: '#8b5cf6',
      description: 'Manage merch & apparel'
    },
    {
      title: 'Orders',
      icon: <ShoppingCart size={24} />,
      view: { type: 'orders-list' },
      count: stats.totalOrders,
      color: '#10b981',
      description: 'Process & track orders'
    },
    {
      title: 'Analytics',
      icon: <BarChart3 size={24} />,
      view: { type: 'analytics' },
      count: null,
      color: '#06b6d4',
      description: 'View insights & metrics'
    },
    {
      title: 'Fulfillment',
      icon: <Box size={24} />,
      view: { type: 'fulfillment' },
      count: null,
      color: '#f97316',
      description: 'Pick, pack & ship orders'
    },
    {
      title: 'ShipStation',
      icon: <Truck size={24} />,
      href: '/admin/shipstation',
      count: null,
      color: '#06b6d4',
      description: 'Shipping integration setup'
    },
    {
      title: 'Returns',
      icon: <RotateCcw size={24} />,
      view: { type: 'returns' },
      count: null,
      color: '#ef4444',
      description: 'Manage returns & RMAs'
    },
    {
      title: 'Support',
      icon: <HelpCircle size={24} />,
      view: { type: 'support' },
      count: null,
      color: '#a78bfa',
      description: 'Customer support tickets'
    },
    {
      title: 'Comics',
      icon: <BookOpen size={24} />,
      view: { type: 'comics-list' },
      count: stats.totalComics,
      color: '#3b82f6',
      description: 'Manage comic series'
    },
    {
      title: 'Artwork',
      icon: <Palette size={24} />,
      view: { type: 'artwork-list' },
      count: stats.totalArtwork,
      color: '#ec4899',
      description: 'Manage art gallery'
    },
    {
      title: 'Migrations',
      icon: <Database size={24} />,
      view: { type: 'migrations' },
      count: null,
      color: '#6366f1',
      description: 'Database updates'
    },
  ];

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarSign size={20} />,
    },
    {
      title: 'Active Products',
      value: stats.totalGames + stats.totalMerch,
      icon: <Package size={20} />,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingCart size={20} />,
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'quick-actions', label: 'Quick Actions', icon: <Plus size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Admin Dashboard</h1>
        <p style={adminStyles.subtitle}>
          Welcome to your Full Uproar admin panel
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        ...adminStyles.section,
        padding: '0',
        marginBottom: '32px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid rgba(249, 115, 22, 0.2)' 
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 24px',
                background: 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#fdba74' : '#94a3b8',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: activeTab === tab.id ? '2px solid #fdba74' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#fde68a';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test Mode Toggle */}
      <TestModeToggle />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Overview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            {statCards.map((stat, index) => (
              <div
                key={index}
                style={{
                  ...adminStyles.card,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                {...adminStyles.hoverEffects.card}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start' 
                }}>
                  <div>
                    <p style={{ 
                      color: '#94a3b8', 
                      fontSize: '14px', 
                      marginBottom: '4px' 
                    }}>
                      {stat.title}
                    </p>
                    <h3 style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold', 
                      color: '#fde68a' 
                    }}>
                      {stat.value}
                    </h3>
                  </div>
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.2)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#fdba74',
                  }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Menu Grid */}
          <div style={adminStyles.section}>
            <h2 style={adminStyles.sectionTitle}>Management</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {menuItems.map((item) => {
                const cardStyle = {
                  ...adminStyles.card,
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: '12px',
                  padding: '32px 24px',
                  textAlign: 'center' as const,
                  position: 'relative' as const,
                  overflow: 'hidden' as const,
                  border: '2px solid rgba(249, 115, 22, 0.3)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  cursor: 'pointer',
                };
                const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.borderColor = `${item.color}66`;
                  e.currentTarget.style.boxShadow = `0 4px 20px ${item.color}33`;
                  const icon = e.currentTarget.querySelector('.menu-icon');
                  if (icon) {
                    (icon as HTMLElement).style.transform = 'scale(1.1)';
                  }
                };
                const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                  const icon = e.currentTarget.querySelector('.menu-icon');
                  if (icon) {
                    (icon as HTMLElement).style.transform = 'scale(1)';
                  }
                };
                const cardContent = (
                  <>
                  <div 
                    className="menu-icon"
                    style={{
                      color: item.color,
                      transition: 'transform 0.2s',
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#fde68a',
                    margin: 0,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    margin: 0,
                  }}>
                    {item.description}
                  </p>
                  {item.count !== null && (
                    <div style={{
                      ...adminStyles.badge,
                      background: `${item.color}20`,
                      borderColor: `${item.color}66`,
                      color: item.color,
                    }}>
                      {item.count} items
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle, ${item.color}11 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                  </>
                );

                // Render as Link for items with href, button for items with view
                if ('href' in item && item.href) {
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      style={cardStyle}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.title}
                    onClick={() => 'view' in item && item.view && onNavigate(item.view, item.title)}
                    style={cardStyle}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {cardContent}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'quick-actions' && (
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Quick Actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => onNavigate({ type: 'games-new' }, 'New Game')}
              style={adminStyles.button}
              {...adminStyles.hoverEffects.button}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              New Game
            </button>
            <button
              onClick={() => onNavigate({ type: 'merch-new' }, 'New Merch')}
              style={adminStyles.button}
              {...adminStyles.hoverEffects.button}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              New Merch
            </button>
            <button
              onClick={() => onNavigate({ type: 'inventory' }, 'Inventory')}
              style={adminStyles.outlineButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Package size={16} style={{ marginRight: '4px' }} />
              Manage Inventory
            </button>
            <button
              onClick={() => onNavigate({ type: 'printify' }, 'Printify Import')}
              style={adminStyles.outlineButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ShoppingBag size={16} style={{ marginRight: '4px' }} />
              Printify Import
            </button>
            <button
              onClick={async () => {
                if (confirm('This will create sample forum boards and posts. Continue?')) {
                  try {
                    const response = await fetch('/api/admin/seed-forum', {
                      method: 'POST'
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert(`Forum seeded successfully! Created ${data.boards} boards.`);
                    } else {
                      alert(`Error: ${data.error}`);
                    }
                  } catch (error) {
                    alert('Failed to seed forum');
                  }
                }
              }}
              style={adminStyles.outlineButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <MessageSquare size={16} style={{ marginRight: '4px' }} />
              Seed Forum
            </button>
            <Link
              href="/admin/figma"
              style={{
                ...adminStyles.outlineButton,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                borderColor: '#a855f7',
                color: '#a855f7',
              }}
            >
              <Layers size={16} style={{ marginRight: '4px' }} />
              Figma Integration
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Settings</h2>
          <p style={{ color: '#94a3b8' }}>Settings and configuration options coming soon...</p>
        </div>
      )}

      {/* Deployment Info */}
      <div style={{ marginTop: '40px' }}>
        <DeploymentInfo isVisible={true} />
      </div>
    </>
  );
}