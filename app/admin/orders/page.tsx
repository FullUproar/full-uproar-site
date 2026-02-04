'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  Truck, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Eye,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { adminStyles } from '../styles/adminStyles';
import { useToastStore } from '@/lib/toastStore';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  totalCents: number;
  shippingCents: number;
  taxCents: number;
  refundAmountCents: number;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  paymentMethod?: string;
  items: any[];
  statusHistory?: any[];
}

const statusConfig = {
  pending: { icon: Clock, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  payment_pending: { icon: Clock, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  paid: { icon: DollarSign, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  processing: { icon: Package, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  shipped: { icon: Truck, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
  delivered: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  cancelled: { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  refunded: { icon: RotateCcw, color: '#FF8200', bg: 'rgba(255, 130, 0, 0.1)' },
  partially_refunded: { icon: RotateCcw, color: '#FF8200', bg: 'rgba(255, 130, 0, 0.1)' },
  payment_failed: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
};

export default function OrdersPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedToday: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Old API format - just an array of orders
        setOrders(data);
        setTotalPages(1);
        calculateStats(data);
      } else {
        // New API format with pagination
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
        setStats(data.stats || calculateStats(data.orders || []));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderList: Order[]) => {
    const stats = {
      totalOrders: orderList.length,
      totalRevenue: orderList.reduce((sum, order) => sum + order.totalCents, 0),
      pendingOrders: orderList.filter(o => ['pending', 'payment_pending', 'processing'].includes(o.status)).length,
      shippedToday: orderList.filter(o => {
        if (!o.shippedAt) return false;
        const shipped = new Date(o.shippedAt);
        const today = new Date();
        return shipped.toDateString() === today.toDateString();
      }).length
    };
    setStats(stats);
    return stats;
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.customerEmail.toLowerCase().includes(search) ||
      order.trackingNumber?.toLowerCase().includes(search)
    );
  });

  const getStatusDisplay = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: '600',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}40`
      }}>
        <Icon size={14} />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const exportOrders = () => {
    // TODO: Implement CSV export
    addToast({ message: '📦 Export functionality coming soon!', type: 'info' });
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <Link 
          href="/admin"
          style={adminStyles.backButton}
        >
          <ArrowLeft size={20} />
          Back to Admin Dashboard
        </Link>

        <div style={adminStyles.header}>
          <h1 style={adminStyles.title}>Order Management</h1>
          <p style={adminStyles.subtitle}>
            Manage orders, process shipments, and handle returns
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Orders</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65' }}>{stats.totalOrders}</p>
              </div>
              <Package size={32} style={{ color: '#FBDB65' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Revenue</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65' }}>
                  ${(stats.totalRevenue / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign size={32} style={{ color: '#10b981' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65' }}>{stats.pendingOrders}</p>
              </div>
              <Clock size={32} style={{ color: '#fbbf24' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Shipped Today</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65' }}>{stats.shippedToday}</p>
              </div>
              <Truck size={32} style={{ color: '#a78bfa' }} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={adminStyles.section}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
                <Search size={20} style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  placeholder="Search by order ID, customer, email, or tracking number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    ...adminStyles.input,
                    paddingLeft: '44px',
                    width: '100%'
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={adminStyles.input}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                onClick={exportOrders}
                style={adminStyles.secondaryButton}
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={fetchOrders}
                style={adminStyles.primaryButton}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div style={adminStyles.section}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <RefreshCw size={32} style={{ 
                color: '#FBDB65', 
                marginBottom: '16px',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: '#94a3b8' }}>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Package size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No orders found</h3>
              <p style={{ color: '#94a3b8' }}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Orders will appear here when customers make purchases'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={adminStyles.table}>
                  <thead>
                    <tr style={adminStyles.tableHeader}>
                      <th style={adminStyles.tableHeaderCell}>Order</th>
                      <th style={adminStyles.tableHeaderCell}>Customer</th>
                      <th style={adminStyles.tableHeaderCell}>Status</th>
                      <th style={adminStyles.tableHeaderCell}>Total</th>
                      <th style={adminStyles.tableHeaderCell}>Date</th>
                      <th style={adminStyles.tableHeaderCell}>Items</th>
                      <th style={adminStyles.tableHeaderCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <>
                        <tr 
                          key={order.id}
                          style={{
                            ...adminStyles.tableRow,
                            cursor: 'pointer'
                          }}
                          onClick={() => setExpandedOrder(
                            expandedOrder === order.id ? null : order.id
                          )}
                        >
                          <td style={adminStyles.tableCell}>
                            <div>
                              <p style={{ 
                                fontFamily: 'monospace', 
                                fontSize: '13px',
                                color: '#FBDB65',
                                fontWeight: '600'
                              }}>
                                {order.id.slice(0, 8)}...
                              </p>
                              {order.trackingNumber && (
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                  <Truck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                  {order.trackingNumber}
                                </p>
                              )}
                            </div>
                          </td>
                          <td style={adminStyles.tableCell}>
                            <div>
                              <p style={{ fontWeight: '600', color: '#e2e8f0' }}>{order.customerName}</p>
                              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{order.customerEmail}</p>
                            </div>
                          </td>
                          <td style={adminStyles.tableCell}>
                            {getStatusDisplay(order.status)}
                          </td>
                          <td style={adminStyles.tableCell}>
                            <div>
                              <p style={{ fontWeight: '600', color: '#FBDB65' }}>
                                ${(order.totalCents / 100).toFixed(2)}
                              </p>
                              {order.refundAmountCents > 0 && (
                                <p style={{ fontSize: '12px', color: '#ef4444' }}>
                                  Refunded: ${(order.refundAmountCents / 100).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td style={adminStyles.tableCell}>
                            <div>
                              <p style={{ fontSize: '13px', color: '#e2e8f0' }}>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </td>
                          <td style={adminStyles.tableCell}>
                            <p style={{ fontSize: '13px' }}>{order.items.length} items</p>
                          </td>
                          <td style={adminStyles.tableCell}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Link
                                href={`/admin/orders/${order.id}`}
                                style={{
                                  ...adminStyles.outlineButton,
                                  padding: '6px 12px',
                                  fontSize: '13px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye size={14} />
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Order Details */}
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={7} style={{ padding: 0 }}>
                              <div style={{
                                background: 'rgba(255, 130, 0, 0.05)',
                                padding: '24px',
                                borderBottom: '2px solid rgba(255, 130, 0, 0.2)'
                              }}>
                                <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '24px',
                                  marginBottom: '24px'
                                }}>
                                  {/* Order Items */}
                                  <div>
                                    <h4 style={{ 
                                      color: '#FBDB65', 
                                      marginBottom: '12px',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <Package size={16} />
                                      Order Items
                                    </h4>
                                    {order.items.map((item: any, index: number) => (
                                      <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 0',
                                        borderBottom: '1px solid rgba(255, 130, 0, 0.1)'
                                      }}>
                                        <div>
                                          <span style={{ color: '#e2e8f0' }}>
                                            {item.game?.name || item.merch?.name || item.productName || 'Unknown Item'}
                                          </span>
                                          {item.merchSize && (
                                            <span style={{ color: '#94a3b8', marginLeft: '8px' }}>
                                              Size: {item.merchSize}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ color: '#FBDB65' }}>
                                          {item.quantity} × ${(item.priceCents / 100).toFixed(2)}
                                        </div>
                                      </div>
                                    ))}
                                    <div style={{ 
                                      marginTop: '12px', 
                                      paddingTop: '12px', 
                                      borderTop: '1px solid rgba(255, 130, 0, 0.2)' 
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#94a3b8' }}>Subtotal:</span>
                                        <span style={{ color: '#e2e8f0' }}>
                                          ${((order.totalCents - order.shippingCents - order.taxCents) / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#94a3b8' }}>Shipping:</span>
                                        <span style={{ color: '#e2e8f0' }}>
                                          ${(order.shippingCents / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#94a3b8' }}>Tax:</span>
                                        <span style={{ color: '#e2e8f0' }}>
                                          ${(order.taxCents / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        fontWeight: 'bold',
                                        fontSize: '16px'
                                      }}>
                                        <span style={{ color: '#FBDB65' }}>Total:</span>
                                        <span style={{ color: '#FBDB65' }}>
                                          ${(order.totalCents / 100).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Info */}
                                  <div>
                                    <h4 style={{ 
                                      color: '#FBDB65', 
                                      marginBottom: '12px',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <FileText size={16} />
                                      Order Information
                                    </h4>
                                    <div style={{ fontSize: '13px', color: '#e2e8f0' }}>
                                      {order.paymentMethod && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <CreditCard size={14} style={{ display: 'inline', marginRight: '8px', color: '#94a3b8' }} />
                                          Payment: {order.paymentMethod}
                                        </div>
                                      )}
                                      {order.paidAt && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <DollarSign size={14} style={{ display: 'inline', marginRight: '8px', color: '#94a3b8' }} />
                                          Paid: {new Date(order.paidAt).toLocaleString()}
                                        </div>
                                      )}
                                      {order.shippedAt && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <Truck size={14} style={{ display: 'inline', marginRight: '8px', color: '#94a3b8' }} />
                                          Shipped: {new Date(order.shippedAt).toLocaleString()}
                                        </div>
                                      )}
                                      {order.deliveredAt && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <CheckCircle size={14} style={{ display: 'inline', marginRight: '8px', color: '#94a3b8' }} />
                                          Delivered: {new Date(order.deliveredAt).toLocaleString()}
                                        </div>
                                      )}
                                      {order.customerPhone && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <MessageSquare size={14} style={{ display: 'inline', marginRight: '8px', color: '#94a3b8' }} />
                                          Phone: {order.customerPhone}
                                        </div>
                                      )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div style={{ marginTop: '16px' }}>
                                      <h5 style={{ color: '#FBDB65', marginBottom: '8px', fontSize: '14px' }}>
                                        Quick Actions
                                      </h5>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <select
                                          value={order.status}
                                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                          style={{
                                            ...adminStyles.input,
                                            padding: '6px 12px',
                                            fontSize: '13px'
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="paid">Paid</option>
                                          <option value="processing">Processing</option>
                                          <option value="shipped">Shipped</option>
                                          <option value="delivered">Delivered</option>
                                          <option value="cancelled">Cancelled</option>
                                          <option value="refunded">Refunded</option>
                                        </select>
                                        <button
                                          style={{
                                            ...adminStyles.outlineButton,
                                            padding: '6px 12px',
                                            fontSize: '13px'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement shipping label generation
                                            addToast({ message: '🚚 Shipping label generation coming soon!', type: 'info' });
                                          }}
                                        >
                                          <Truck size={14} />
                                          Create Label
                                        </button>
                                        <button
                                          style={{
                                            ...adminStyles.outlineButton,
                                            padding: '6px 12px',
                                            fontSize: '13px'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement refund processing
                                            addToast({ message: '💰 Refund processing coming soon!', type: 'info' });
                                          }}
                                        >
                                          <RotateCcw size={14} />
                                          Process Refund
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '24px',
                  padding: '16px',
                  borderTop: '1px solid rgba(255, 130, 0, 0.2)'
                }}>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Page {currentPage} of {totalPages}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      style={{
                        ...adminStyles.outlineButton,
                        padding: '6px 12px',
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        ...adminStyles.outlineButton,
                        padding: '6px 12px',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}