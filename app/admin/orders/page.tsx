'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Package, Clock, CheckCircle, XCircle, 
  Truck, DollarSign, User, Calendar, Eye, Filter
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  status: string;
  totalCents: number;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    gameId: number | null;
    merchId: number | null;
    productName: string;
    quantity: number;
    priceCents: number;
    size: string | null;
  }>;
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'shipped': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle size={16} />;
      case 'processing': return <Clock size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filterStatus);

  const orderStats = {
    total: orders.length,
    completed: orders.filter(o => o.status.toLowerCase() === 'completed').length,
    processing: orders.filter(o => o.status.toLowerCase() === 'processing').length,
    shipped: orders.filter(o => o.status.toLowerCase() === 'shipped').length,
    revenue: orders.reduce((sum, order) => sum + order.totalCents, 0) / 100,
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <Link 
          href="/admin/dashboard" 
          style={adminStyles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div style={adminStyles.header}>
          <h1 style={adminStyles.title}>Orders Management</h1>
          <p style={adminStyles.subtitle}>
            Track and manage customer orders
          </p>
        </div>

        {/* Stats Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Orders</p>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{orderStats.total}</h3>
              </div>
              <Package size={24} style={{ color: '#fdba74' }} />
            </div>
          </div>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Processing</p>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{orderStats.processing}</h3>
              </div>
              <Clock size={24} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Completed</p>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{orderStats.completed}</h3>
              </div>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
            </div>
          </div>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Revenue</p>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>${orderStats.revenue.toFixed(2)}</h3>
              </div>
              <DollarSign size={24} style={{ color: '#10b981' }} />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={adminStyles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Filter size={20} style={{ color: '#fdba74' }} />
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                ...adminStyles.outlineButton,
                background: filterStatus === 'all' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              }}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilterStatus('processing')}
              style={{
                ...adminStyles.outlineButton,
                background: filterStatus === 'processing' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              }}
            >
              Processing
            </button>
            <button
              onClick={() => setFilterStatus('shipped')}
              style={{
                ...adminStyles.outlineButton,
                background: filterStatus === 'shipped' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              }}
            >
              Shipped
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              style={{
                ...adminStyles.outlineButton,
                background: filterStatus === 'completed' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              }}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div style={adminStyles.section}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Package size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No orders found</h3>
              <p style={{ color: '#94a3b8' }}>
                {filterStatus !== 'all' ? 'Try changing the filter' : 'Orders will appear here'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={adminStyles.table}>
                <thead>
                  <tr style={adminStyles.tableHeader}>
                    <th style={adminStyles.tableHeaderCell}>Order ID</th>
                    <th style={adminStyles.tableHeaderCell}>Customer</th>
                    <th style={adminStyles.tableHeaderCell}>Date</th>
                    <th style={adminStyles.tableHeaderCell}>Items</th>
                    <th style={adminStyles.tableHeaderCell}>Total</th>
                    <th style={adminStyles.tableHeaderCell}>Status</th>
                    <th style={adminStyles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr 
                        style={adminStyles.tableRow}
                        {...adminStyles.hoverEffects.row}
                      >
                        <td style={adminStyles.tableCell}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                            {order.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div>
                            <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{order.customerEmail}</div>
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} style={{ color: '#94a3b8' }} />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          {order.items.length} items
                        </td>
                        <td style={adminStyles.tableCell}>
                          <span style={{ fontWeight: '600', color: '#fde68a' }}>
                            ${(order.totalCents / 100).toFixed(2)}
                          </span>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div style={{
                            ...adminStyles.badge,
                            background: `${getStatusColor(order.status)}20`,
                            borderColor: getStatusColor(order.status),
                            color: getStatusColor(order.status),
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <button
                            onClick={() => setExpandedOrder(
                              expandedOrder === order.id ? null : order.id
                            )}
                            style={{
                              ...adminStyles.outlineButton,
                              padding: '6px 12px',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={14} />
                            Details
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{
                              background: 'rgba(249, 115, 22, 0.05)',
                              padding: '24px',
                              borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
                            }}>
                              <h4 style={{ 
                                color: '#fdba74', 
                                marginBottom: '16px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                              }}>
                                Order Items
                              </h4>
                              <div style={{ marginBottom: '16px' }}>
                                {order.items.map((item) => (
                                  <div key={item.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                                  }}>
                                    <div>
                                      <span style={{ color: '#e2e8f0' }}>{item.productName}</span>
                                      {item.size && (
                                        <span style={{ color: '#94a3b8', marginLeft: '8px' }}>
                                          Size: {item.size}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ color: '#fde68a' }}>
                                      {item.quantity} × ${(item.priceCents / 100).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {order.trackingNumber && (
                                <div style={{ marginBottom: '16px' }}>
                                  <strong style={{ color: '#fdba74' }}>Tracking:</strong>
                                  <span style={{ marginLeft: '8px', color: '#e2e8f0' }}>
                                    {order.trackingNumber} ({order.shippingCarrier})
                                  </span>
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  style={{
                                    ...adminStyles.input,
                                    width: 'auto',
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}