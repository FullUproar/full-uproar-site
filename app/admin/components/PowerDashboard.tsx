'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package,
  Target, Zap, Award, AlertTriangle, Activity, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Minus, Clock, Calendar, Filter,
  Mail, MessageSquare, Sparkles, Brain, Rocket, Globe, Star
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
  sparkline?: number[];
}

interface CustomerSegment {
  name: string;
  count: number;
  value: number;
  growth: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
  velocity: number;
  stockLevel: number;
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

  // Real-time counter animation
  const [realtimeRevenue, setRealtimeRevenue] = useState(0);
  
  useEffect(() => {
    fetchDashboardData();
    // Simulate real-time revenue updates
    const interval = setInterval(() => {
      setRealtimeRevenue(prev => prev + Math.random() * 100);
    }, 5000);
    return () => clearInterval(interval);
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
    // Calculate key metrics
    const totalRevenue = orders.orders?.reduce((sum: number, order: any) => 
      sum + (order.totalCents / 100), 0) || 0;
    
    const newCustomers = users.filter((u: any) => {
      const createdDate = new Date(u.createdAt);
      const daysAgo = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;

    setMetrics({
      revenue: {
        current: totalRevenue,
        previous: totalRevenue * 0.8, // Mock previous period
        target: totalRevenue * 1.2,
        growth: 25,
      },
      customers: {
        total: users.length,
        new: newCustomers,
        returning: users.length - newCustomers,
        churn: 2.3,
        lifetime: 487,
      },
      orders: {
        count: orders.orders?.length || 0,
        value: totalRevenue / (orders.orders?.length || 1),
        conversion: 3.4,
        abandoned: 127,
      },
      products: products,
      marketing: {
        emailOpen: 24.7,
        clickThrough: 3.2,
        campaigns: 5,
        roi: 4.2,
      },
    });

    setRealtimeRevenue(totalRevenue);
  };

  const kpiCards: MetricCard[] = [
    {
      title: "Total Revenue",
      value: `$${realtimeRevenue.toFixed(2)}`,
      change: 25.4,
      changeLabel: "vs last period",
      icon: <DollarSign size={24} />,
      color: "#10b981",
      sparkline: [30, 45, 28, 65, 78, 92, 88, 102]
    },
    {
      title: "Active Customers",
      value: metrics.customers.total,
      change: 12.3,
      changeLabel: "new this month",
      icon: <Users size={24} />,
      color: "#3b82f6",
    },
    {
      title: "Conversion Rate",
      value: `${metrics.orders.conversion}%`,
      change: 0.8,
      changeLabel: "improvement",
      icon: <Target size={24} />,
      color: "#8b5cf6",
    },
    {
      title: "Avg Order Value",
      value: `$${(metrics.orders.value || 0).toFixed(2)}`,
      change: -2.1,
      changeLabel: "needs attention",
      icon: <ShoppingCart size={24} />,
      color: "#f59e0b",
    },
  ];

  const customerSegments: CustomerSegment[] = [
    { name: "Champions", count: 45, value: 28900, growth: 15 },
    { name: "Loyal", count: 123, value: 45600, growth: 8 },
    { name: "Potential", count: 89, value: 12300, growth: 32 },
    { name: "New", count: 234, value: 8900, growth: 45 },
    { name: "At Risk", count: 67, value: 23400, growth: -12 },
  ];

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const width = 100;
    const height = 30;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} style={{ marginTop: '8px' }}>
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

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
            
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                {card.title}
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: card.color }}>
                {card.value}
              </h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {card.change > 0 ? (
                <TrendingUp size={16} style={{ color: '#10b981' }} />
              ) : card.change < 0 ? (
                <TrendingDown size={16} style={{ color: '#ef4444' }} />
              ) : (
                <Minus size={16} style={{ color: '#94a3b8' }} />
              )}
              <span style={{ 
                fontSize: '0.875rem',
                color: card.change > 0 ? '#10b981' : card.change < 0 ? '#ef4444' : '#94a3b8'
              }}>
                {Math.abs(card.change)}% {card.changeLabel}
              </span>
            </div>
            
            {card.sparkline && renderSparkline(card.sparkline)}
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
          
          {customerSegments.map((segment, index) => (
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
              Low Stock Alerts (3)
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
            Live Activity Feed
          </h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {[
              { time: '2 min ago', action: 'New order', detail: 'Fugly Complete Bundle - $89.99', icon: <ShoppingCart size={16} /> },
              { time: '5 min ago', action: 'Customer signup', detail: 'jane.doe@email.com', icon: <Users size={16} /> },
              { time: '12 min ago', action: 'Review posted', detail: '5 stars for Chaos Cards', icon: <Star size={16} /> },
              { time: '23 min ago', action: 'Cart abandoned', detail: '$124.50 - Send recovery email?', icon: <AlertTriangle size={16} /> },
              { time: '45 min ago', action: 'Campaign opened', detail: 'Holiday Sale - 67% open rate', icon: <Mail size={16} /> },
            ].map((event, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem',
                borderLeft: '2px solid #3b82f6',
                marginBottom: '0.75rem',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '0 0.5rem 0.5rem 0'
              }}>
                <div style={{ 
                  color: '#3b82f6',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  height: 'fit-content'
                }}>
                  {event.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{event.action}</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    {event.detail}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{event.time}</p>
                </div>
              </div>
            ))}
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                type: 'opportunity',
                title: 'Cross-sell opportunity detected',
                detail: 'Customers who buy Fugly also purchase expansion packs 73% of the time',
                action: 'Create bundle',
                color: '#10b981'
              },
              {
                type: 'warning',
                title: 'Churn risk identified',
                detail: '12 VIP customers haven\'t purchased in 60+ days',
                action: 'Send win-back email',
                color: '#f59e0b'
              },
              {
                type: 'trend',
                title: 'Trending product category',
                detail: 'Party games sales up 145% this month',
                action: 'Increase inventory',
                color: '#3b82f6'
              },
            ].map((insight, index) => (
              <div key={index} style={{
                padding: '1rem',
                background: `linear-gradient(135deg, ${insight.color}10 0%, transparent 100%)`,
                borderLeft: `3px solid ${insight.color}`,
                borderRadius: '0 0.5rem 0.5rem 0'
              }}>
                <h4 style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem',
                  color: insight.color 
                }}>
                  {insight.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  {insight.detail}
                </p>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: insight.color,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}>
                  {insight.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}