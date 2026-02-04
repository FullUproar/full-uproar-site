'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, ShoppingCart, Eye, Package, 
  Activity, BarChart3, PieChart, ArrowUpRight, 
  ArrowDownRight, Calendar, RefreshCcw
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import SimpleChart from './SimpleChart';

interface AnalyticsData {
  overview?: {
    pageViews: number;
    uniqueVisitors: number;
    orders: number;
    conversions: number;
    conversionRate: string;
  };
  topProducts?: Array<{
    productId: string;
    productName: string;
    views: number;
  }>;
  funnel?: Array<{
    stage: string;
    count: number;
  }>;
  products?: any[];
  timeseries?: any[];
  recentActivity?: any[];
}

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    // Fetch time series data for overview
    if (activeTab === 'overview') {
      fetchTimeSeries();
    }
  }, [range, activeTab]);

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/admin/analytics?range=${range}&type=${activeTab}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchTimeSeries = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}&type=timeseries`);
      const result = await response.json();
      setData(prev => ({ ...prev, timeseries: result.timeseries }));
    } catch (error) {
      console.error('Failed to fetch time series:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const processTimeSeriesData = (events: any[]) => {
    // Group events by hour or day depending on range
    const groupBy = range === '24h' ? 'hour' : 'day';
    const grouped: Record<string, number> = {};
    
    events.forEach(event => {
      const date = new Date(event.timestamp);
      let key: string;
      
      if (groupBy === 'hour') {
        key = `${date.getHours()}:00`;
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    // Convert to array and sort
    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .slice(-20); // Show last 20 data points
  };

  const processRecentActivityData = (events: any[]) => {
    // Group events by minute for a detailed view
    const grouped: Record<string, number> = {};
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Filter to last hour and group by minute
    events
      .filter(event => new Date(event.timestamp).getTime() > oneHourAgo)
      .forEach(event => {
        const date = new Date(event.timestamp);
        const minutes = date.getMinutes();
        const key = `${date.getHours()}:${minutes.toString().padStart(2, '0')}`;
        grouped[key] = (grouped[key] || 0) + 1;
      });
    
    // Convert to array and sort by time
    const sortedData = Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        const [aHour, aMin] = a.label.split(':').map(Number);
        const [bHour, bMin] = b.label.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });
    
    // If we have less than 10 points, show individual minutes
    // Otherwise, show every 5 minutes
    if (sortedData.length > 10) {
      return sortedData.filter((_, index) => index % 5 === 0);
    }
    
    return sortedData;
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    
    return (
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '14px',
        color: isPositive ? '#10b981' : '#ef4444'
      }}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const renderOverview = () => {
    if (!data.overview) return null;

    const metrics = [
      {
        title: 'Page Views',
        value: formatNumber(data.overview.pageViews),
        icon: <Eye size={20} />,
        color: '#3b82f6'
      },
      {
        title: 'Unique Visitors',
        value: formatNumber(data.overview.uniqueVisitors),
        icon: <Users size={20} />,
        color: '#7D55C7'
      },
      {
        title: 'Orders',
        value: formatNumber(data.overview.orders),
        icon: <ShoppingCart size={20} />,
        color: '#10b981'
      },
      {
        title: 'Conversion Rate',
        value: `${data.overview.conversionRate}%`,
        icon: <TrendingUp size={20} />,
        color: '#FF8200'
      }
    ];

    return (
      <>
        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                ...adminStyles.card,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
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
                    {metric.title}
                  </p>
                  <h3 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#FBDB65'
                  }}>
                    {metric.value}
                  </h3>
                </div>
                <div style={{
                  background: `${metric.color}20`,
                  padding: '8px',
                  borderRadius: '8px',
                  color: metric.color,
                }}>
                  {metric.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Products */}
        {data.topProducts && data.topProducts.length > 0 && (
          <div style={adminStyles.section}>
            <h3 style={adminStyles.sectionTitle}>Top Viewed Products</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 130, 0, 0.3)' }}>
                    <th style={adminStyles.tableHeader}>Product</th>
                    <th style={adminStyles.tableHeader}>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.slice(0, 10).map((product, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid rgba(255, 130, 0, 0.2)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 130, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={adminStyles.tableCell}>
                        <div style={{ fontWeight: 'bold', color: '#FBDB65' }}>
                          {product.productName || 'Unknown Product'}
                        </div>
                      </td>
                      <td style={adminStyles.tableCell}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Eye size={14} style={{ color: '#94a3b8' }} />
                          <span>{formatNumber(product.views)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Series Chart */}
        {data.timeseries && data.timeseries.length > 0 && (
          <div style={adminStyles.section}>
            <h3 style={adminStyles.sectionTitle}>Activity Over Time</h3>
            <div style={{ padding: '20px' }}>
              <SimpleChart
                data={processTimeSeriesData(data.timeseries)}
                type="line"
                height={300}
                color="#FF8200"
              />
            </div>
          </div>
        )}

        {/* Recent Activity Chart */}
        {data.recentActivity && data.recentActivity.length > 0 && (
          <div style={adminStyles.section}>
            <h3 style={adminStyles.sectionTitle}>Recent Activity</h3>
            <div style={{ padding: '20px' }}>
              <SimpleChart
                data={processRecentActivityData(data.recentActivity)}
                type="line"
                height={250}
                color="#7D55C7"
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const renderFunnel = () => {
    if (!data.funnel) return null;

    const maxCount = Math.max(...data.funnel.map(f => f.count));

    return (
      <div style={adminStyles.section}>
        <h3 style={adminStyles.sectionTitle}>Conversion Funnel</h3>
        <div style={{ padding: '20px' }}>
          {data.funnel.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const dropoffPercent = index > 0 && data.funnel ? 
              ((data.funnel[index - 1].count - stage.count) / data.funnel[index - 1].count * 100) : 
              0;
            
            return (
              <div key={index} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#FBDB65' }}>
                    {stage.stage}
                  </span>
                  <span style={{ color: '#FBDB65' }}>
                    {formatNumber(stage.count)}
                    {index > 0 && dropoffPercent > 0 && (
                      <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '14px' }}>
                        (-{dropoffPercent.toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255, 130, 0, 0.1)',
                  borderRadius: '8px',
                  height: '24px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: `linear-gradient(to right, #FF8200, #FBDB65)`,
                    height: '100%',
                    width: `${percentage}%`,
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Analytics Dashboard</h1>
        <p style={adminStyles.subtitle}>
          Track performance and user behavior
        </p>
      </div>

      {/* Controls */}
      <div style={{
        ...adminStyles.section,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 130, 0, 0.1)',
            borderRadius: '8px',
            padding: '4px',
            gap: '4px'
          }}>
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
              { id: 'funnel', label: 'Funnel', icon: <Activity size={16} /> },
              { id: 'products', label: 'Products', icon: <Package size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? '#FF8200' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: activeTab === tab.id ? '#111827' : '#FBDB65',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Selector */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={adminStyles.select}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchAnalytics}
          disabled={isRefreshing}
          style={{
            ...adminStyles.iconButton,
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }}
          title="Refresh data"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={adminStyles.section}>
          <p style={{ color: '#FBDB65', textAlign: 'center' }}>Loading analytics...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'funnel' && renderFunnel()}
          {activeTab === 'products' && (
            <div style={adminStyles.section}>
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>
                Product analytics coming soon...
              </p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}