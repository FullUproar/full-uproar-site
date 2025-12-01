'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart,
  Award, AlertTriangle, Activity, ArrowUpRight,
  Mail, Sparkles, Brain, Rocket
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface CustomerSegment {
  name: string;
  count: number;
  value: number;
  growth: number;
}

export default function PowerDashboard({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({
    revenue: { current: 0, previous: 0, target: 0 },
    customers: { total: 0, new: 0, returning: 0, churn: 0 },
    orders: { count: 0, value: 0, items: 0, conversion: 0 },
    products: { topSellers: [], lowStock: [], velocity: {} },
    marketing: { emailOpen: 0, clickThrough: 0, campaigns: 0 },
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [ordersRes, usersRes, productsRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/orders?range=${dateRange}`),
        fetch('/api/admin/users'),
        fetch('/api/admin/analytics'),
        fetch('/api/analytics'),
      ]);

      const orders = await ordersRes.json();
      const users = await usersRes.json();
      const products = await productsRes.json();
      const analytics = await analyticsRes.json();

      // Process and set metrics
      processMetrics(orders, users, products, analytics);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMetrics = (orders: any, users: any, products: any, analytics: any) => {
    // Calculate key metrics from real data
    const totalRevenue = orders.orders?.reduce((sum: number, order: any) =>
      sum + (order.totalCents / 100), 0) || 0;

    const newCustomers = Array.isArray(users) ? users.filter((u: any) => {
      const createdDate = new Date(u.createdAt);
      const daysAgo = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length : 0;

    const totalUsers = Array.isArray(users) ? users.length : 0;
    const orderCount = orders.orders?.length || 0;

    setMetrics({
      revenue: {
        current: totalRevenue,
      },
      customers: {
        total: totalUsers,
        new: newCustomers,
        returning: totalUsers - newCustomers,
      },
      orders: {
        count: orderCount,
        value: orderCount > 0 ? totalRevenue / orderCount : 0,
      },
      products: products,
    });
  };

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `$${(metrics.revenue?.current || 0).toFixed(2)}`,
      icon: <DollarSign size={24} />,
      color: "#10b981",
    },
    {
      title: "Total Customers",
      value: metrics.customers?.total || 0,
      icon: <Users size={24} />,
      color: "#3b82f6",
    },
    {
      title: "Total Orders",
      value: metrics.orders?.count || 0,
      icon: <ShoppingCart size={24} />,
      color: "#8b5cf6",
    },
    {
      title: "Avg Order Value",
      value: `$${(metrics.orders?.value || 0).toFixed(2)}`,
      icon: <ShoppingCart size={24} />,
      color: "#f59e0b",
    },
  ];

  // Customer segments - will be populated when segmentation feature is built
  const customerSegments: CustomerSegment[] = [];

  return (
    <div style={adminStyles.container}>
      {/* Header with Date Range Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Business Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Real-time insights to dominate the board game industry
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              ...adminStyles.input,
              width: 'auto',
              cursor: 'pointer'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
          
          <button
            onClick={() => onNavigate({ type: 'analytics' }, 'Deep Analytics')}
            style={{
              ...adminStyles.button,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Brain size={18} />
            AI Insights
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {kpiCards.map((card, index) => (
          <div key={index} style={{
            ...adminStyles.card,
            background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
            borderLeft: `4px solid ${card.color}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: `${card.color}20`,
              borderRadius: '0.5rem',
              padding: '0.5rem'
            }}>
              <div style={{ color: card.color }}>
                {card.icon}
              </div>
            </div>
            
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                {card.title}
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: card.color }}>
                {card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Customer Segments */}
        <div style={adminStyles.card}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              Customer Segments
            </h3>
            <button
              onClick={() => onNavigate({ type: 'customers' }, 'Customer Management')}
              style={{ 
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }}
            >
              View all <ArrowUpRight size={16} />
            </button>
          </div>
          
          {customerSegments.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#64748b',
              background: '#1e293b',
              borderRadius: '0.5rem',
            }}>
              <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>Customer segmentation coming soon</p>
            </div>
          ) : customerSegments.map((segment, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: index % 2 === 0 ? '#1e293b' : 'transparent',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${
                    segment.growth > 20 ? '#10b981' :
                    segment.growth > 0 ? '#3b82f6' :
                    '#ef4444'
                  } 0%, ${
                    segment.growth > 20 ? '#059669' :
                    segment.growth > 0 ? '#2563eb' :
                    '#dc2626'
                  } 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {segment.name[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 'bold' }}>{segment.name}</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                    {segment.count} customers
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                  ${segment.value.toLocaleString()}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: segment.growth > 0 ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  justifyContent: 'flex-end'
                }}>
                  {segment.growth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(segment.growth)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={adminStyles.card}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Quick Actions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={() => onNavigate({ type: 'campaigns-new' }, 'New Campaign')}
              style={{
                ...adminStyles.button,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Rocket size={20} />
              Launch Campaign
            </button>
            
            <button
              onClick={() => onNavigate({ type: 'email-blast' }, 'Email Blast')}
              style={{
                ...adminStyles.secondaryButton,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Mail size={20} />
              Send Email Blast
            </button>
            
            <button
              onClick={() => onNavigate({ type: 'inventory-alert' }, 'Inventory Alerts')}
              style={{
                ...adminStyles.secondaryButton,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderColor: '#ef4444',
                color: '#ef4444'
              }}
            >
              <AlertTriangle size={20} />
              Low Stock Alerts
            </button>
            
            <button
              onClick={() => onNavigate({ type: 'loyalty-program' }, 'Loyalty Program')}
              style={{
                ...adminStyles.secondaryButton,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Award size={20} />
              Loyalty Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Activity Feed & Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Real-time Activity */}
        <div style={adminStyles.card}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Activity size={20} style={{ color: '#10b981' }} />
            Activity Feed
          </h3>

          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#64748b',
            background: '#1e293b',
            borderRadius: '0.5rem',
          }}>
            <Activity size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>No recent activity</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Activity tracking coming soon</p>
          </div>
        </div>

        {/* AI Insights */}
        <div style={adminStyles.card}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={20} style={{ color: '#8b5cf6' }} />
            AI-Powered Insights
          </h3>

          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#64748b',
            background: '#1e293b',
            borderRadius: '0.5rem',
          }}>
            <Sparkles size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>AI insights coming soon</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Requires more order data</p>
          </div>
        </div>
      </div>
    </div>
  );
}