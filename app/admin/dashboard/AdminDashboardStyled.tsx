'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, ShoppingBag, Newspaper, Image, ShoppingCart, Settings, 
  Plus, Edit2, Trash2, Eye, Database, ArrowLeft, Menu,
  Gamepad2, BookOpen, Palette, DollarSign, Users, TrendingUp
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Stats {
  totalGames: number;
  totalMerch: number;
  totalOrders: number;
  totalRevenue: number;
  totalArtwork: number;
  totalComics: number;
}

export default function AdminDashboardStyled() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    totalMerch: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalArtwork: 0,
    totalComics: 0,
  });

  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
  }, [user, isLoaded]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch counts from various endpoints
      const [gamesRes, merchRes, ordersRes] = await Promise.all([
        fetch('/api/admin/games'),
        fetch('/api/admin/merch'),
        fetch('/api/admin/orders'),
      ]);

      const games = await gamesRes.json();
      const merch = await merchRes.json();
      const orders = await ordersRes.json();

      setStats({
        totalGames: games.length || 0,
        totalMerch: merch.length || 0,
        totalOrders: orders.length || 0,
        totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.totalCents || 0), 0) / 100,
        totalArtwork: 0, // TODO: Fetch from artwork endpoint
        totalComics: 0, // TODO: Fetch from comics endpoint
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const menuItems = [
    {
      title: 'Games',
      icon: <Gamepad2 size={24} />,
      href: '/admin/games',
      count: stats.totalGames,
      color: '#f97316',
    },
    {
      title: 'Merchandise',
      icon: <ShoppingBag size={24} />,
      href: '/admin/merch',
      count: stats.totalMerch,
      color: '#8b5cf6',
    },
    {
      title: 'Orders',
      icon: <ShoppingCart size={24} />,
      href: '/admin/orders',
      count: stats.totalOrders,
      color: '#10b981',
    },
    {
      title: 'Comics',
      icon: <BookOpen size={24} />,
      href: '/admin/comics',
      count: stats.totalComics,
      color: '#3b82f6',
    },
    {
      title: 'Artwork',
      icon: <Palette size={24} />,
      href: '/admin/artwork',
      count: stats.totalArtwork,
      color: '#ec4899',
    },
    {
      title: 'Migrations',
      icon: <Database size={24} />,
      href: '/admin/migrations',
      count: null,
      color: '#6366f1',
    },
  ];

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarSign size={20} />,
      change: '+12.5%',
      positive: true,
    },
    {
      title: 'Active Products',
      value: stats.totalGames + stats.totalMerch,
      icon: <Package size={20} />,
      change: '+8 this month',
      positive: true,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingCart size={20} />,
      change: '+23.1%',
      positive: true,
    },
    {
      title: 'Site Visitors',
      value: '1,234',
      icon: <Users size={20} />,
      change: '+5.7%',
      positive: true,
    },
  ];

  if (!isLoaded) {
    return (
      <div style={adminStyles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <div style={{ color: '#fdba74', fontSize: '18px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <div style={adminStyles.header}>
          <h1 style={adminStyles.title}>Admin Dashboard</h1>
          <p style={adminStyles.subtitle}>
            Welcome back, {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>

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
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '13px',
                color: stat.positive ? '#86efac' : '#fca5a5',
              }}>
                <TrendingUp size={14} />
                {stat.change}
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
            {menuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                style={{
                  ...adminStyles.card,
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${item.color}66`;
                  e.currentTarget.style.boxShadow = `0 4px 20px ${item.color}33`;
                  const icon = e.currentTarget.querySelector('.menu-icon');
                  if (icon) {
                    (icon as HTMLElement).style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                  const icon = e.currentTarget.querySelector('.menu-icon');
                  if (icon) {
                    (icon as HTMLElement).style.transform = 'scale(1)';
                  }
                }}
              >
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
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={adminStyles.section}>
          <h2 style={adminStyles.sectionTitle}>Quick Actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link
              href="/admin/games/new"
              style={adminStyles.button}
              {...adminStyles.hoverEffects.button}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              New Game
            </Link>
            <Link
              href="/admin/merch/new"
              style={adminStyles.button}
              {...adminStyles.hoverEffects.button}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              New Merch
            </Link>
            <Link
              href="/admin/inventory"
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
            </Link>
            <Link
              href="/admin/settings"
              style={adminStyles.outlineButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Settings size={16} style={{ marginRight: '4px' }} />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}