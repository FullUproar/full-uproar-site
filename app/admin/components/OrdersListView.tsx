'use client';

import React, { useState, useEffect } from 'react';
import { Package, Eye, Search, Calendar, DollarSign } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Order {
  id: string;
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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      
      if (!response.ok) {
        console.error('Failed to fetch orders:', response.status);
        setOrders([]);
        return;
      }
      
      const data = await response.json();
      
      // Check if it's an error response
      if (data.error) {
        console.error('API error:', data.error);
        setOrders([]);
        return;
      }
      
      // The API returns an object with orders array
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
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'processing':
        return '#FF8200';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#FBDB65' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Orders</h1>
        <p style={adminStyles.subtitle}>View and manage customer orders</p>
      </div>

      {/* Filters */}
      <div style={{
        ...adminStyles.section,
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{
          position: 'relative',
          flex: 1,
          maxWidth: '400px',
        }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
          }} />
          <input
            type="text"
            placeholder="Search by email, name, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...adminStyles.input,
              paddingLeft: '40px',
              width: '100%',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={adminStyles.select}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div style={adminStyles.section}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{
                borderBottom: '2px solid rgba(255, 130, 0, 0.3)',
              }}>
                <th style={adminStyles.tableHeader}>Order ID</th>
                <th style={adminStyles.tableHeader}>Customer</th>
                <th style={adminStyles.tableHeader}>Date</th>
                <th style={adminStyles.tableHeader}>Items</th>
                <th style={adminStyles.tableHeader}>Total</th>
                <th style={adminStyles.tableHeader}>Status</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
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
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '13px',
                      color: '#94a3b8',
                    }}>
                      {order.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#FBDB65' }}>
                        {order.customerName || 'Guest'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {order.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '13px' }}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} style={{ color: '#94a3b8' }} />
                      <span>{order.items.length} items</span>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DollarSign size={14} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: 'bold', color: '#86efac' }}>
                        ${(order.totalCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{
                      ...adminStyles.badge,
                      background: `${getStatusColor(order.status)}20`,
                      borderColor: getStatusColor(order.status),
                      color: getStatusColor(order.status),
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <button
                      onClick={() => onViewDetails(order)}
                      style={adminStyles.iconButton}
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
          }}>
            <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No orders found</p>
          </div>
        )}
      </div>
    </>
  );
}