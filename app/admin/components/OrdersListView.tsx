'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Eye, Search, PackageCheck, Loader2 } from 'lucide-react';

/**
 * Orders List - Mobile-First Responsive
 * ======================================
 * Card-based layout on mobile, table on desktop.
 */

import { formatOrderNumber } from '@/lib/utils/order-number';

interface Order {
  id: string;
  orderNumber?: number;
  paymentIntentId?: string;
  customerEmail: string;
  customerName: string;
  items: any[];
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
}

interface OrdersListViewProps {
  onViewDetails: (order: Order) => void;
}

export default function OrdersListView({ onViewDetails }: OrdersListViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        setOrders([]);
        return;
      }
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatOrderNumber(order.orderNumber, order.id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#f97316';
      case 'pending': return '#eab308';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={32} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Orders</h1>
        <p style={styles.subtitle}>{filteredOrders.length} orders</p>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List - Card layout for all, simpler on mobile */}
      <div style={styles.ordersList}>
        {filteredOrders.map((order) => (
          <div key={order.id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div style={styles.orderInfo}>
                <div style={styles.customerName}>
                  {order.customerName || 'Guest'}
                </div>
                <div style={styles.orderId}>
                  {formatOrderNumber(order.orderNumber, order.id)}
                </div>
              </div>
              <div style={styles.orderMeta}>
                <span style={{
                  ...styles.statusBadge,
                  background: `${getStatusColor(order.status)}20`,
                  color: getStatusColor(order.status),
                }}>
                  {order.status}
                </span>
              </div>
            </div>

            <div style={styles.orderDetails}>
              <div style={styles.orderStat}>
                <span style={styles.statLabel}>{formatDate(order.createdAt)}</span>
              </div>
              <div style={styles.orderStat}>
                <span style={styles.statLabel}>{order.items.length} items</span>
              </div>
              <div style={styles.orderTotal}>
                ${(order.totalCents / 100).toFixed(2)}
              </div>
            </div>

            <div style={styles.orderActions}>
              <button
                onClick={() => onViewDetails(order)}
                style={styles.actionButton}
              >
                <Eye size={18} />
                View
              </button>
              {(order.status === 'processing' || order.status === 'pending') && (
                <Link href={`/admin/fulfill/${order.id}`} style={styles.fulfillButton}>
                  <PackageCheck size={18} />
                  Fulfill
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div style={styles.emptyState}>
          <Package size={40} style={{ color: '#333', marginBottom: '12px' }} />
          <p style={{ color: '#64748b' }}>No orders found</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#e2e8f0',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },

  // Filters
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  searchWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    fontSize: '16px',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e2e8f0',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  select: {
    padding: '12px',
    fontSize: '16px',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e2e8f0',
    minHeight: '44px',
    minWidth: '100px',
  },

  // Orders
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  orderCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '16px',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '16px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  orderId: {
    fontSize: '13px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  orderMeta: {
    flexShrink: 0,
    marginLeft: '12px',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #1a1a1a',
  },
  orderStat: {
    fontSize: '14px',
  },
  statLabel: {
    color: '#64748b',
  },
  orderTotal: {
    marginLeft: 'auto',
    fontSize: '18px',
    fontWeight: '700',
    color: '#10b981',
  },
  orderActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    minHeight: '44px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  fulfillButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    minHeight: '44px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid #10b981',
    borderRadius: '6px',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
};
