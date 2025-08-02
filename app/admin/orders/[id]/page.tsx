'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Package, Truck, DollarSign, CreditCard, MapPin,
  Calendar, User, Mail, Phone, FileText, MessageSquare, 
  Edit, Save, X, Plus, Clock, CheckCircle, AlertCircle,
  RotateCcw, Download, Send, Printer, Copy, ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { adminStyles } from '../../styles/adminStyles';

interface OrderDetail {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  billingAddress?: string;
  status: string;
  totalCents: number;
  shippingCents: number;
  taxCents: number;
  refundAmountCents: number;
  paymentIntentId?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingMethod?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  items: Array<{
    id: number;
    gameId?: number;
    merchId?: number;
    merchSize?: string;
    quantity: number;
    priceCents: number;
    game?: { name: string; slug: string; };
    merch?: { name: string; slug: string; };
  }>;
  statusHistory: Array<{
    id: number;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
  shippingLabels?: Array<{
    id: number;
    carrier: string;
    trackingNumber: string;
    labelUrl: string;
    costCents: number;
    createdAt: string;
  }>;
  returns?: Array<{
    id: number;
    rmaNumber: string;
    status: string;
    reason: string;
    createdAt: string;
  }>;
  tickets?: Array<{
    id: number;
    ticketNumber: string;
    subject: string;
    status: string;
    createdAt: string;
  }>;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const data = await response.json();
      setOrder(data);
      setInternalNotes(data.internalNotes || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      // TODO: Show error message
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string, notes?: string) => {
    setProcessingAction('status');
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, statusNote: notes })
      });

      if (response.ok) {
        await fetchOrder();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const updateInternalNotes = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes })
      });

      if (response.ok) {
        setEditingNotes(false);
        await fetchOrder();
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const addOrderNote = async () => {
    if (!newNote.trim()) return;
    
    setProcessingAction('note');
    try {
      const response = await fetch(`/api/admin/orders/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, noteType: 'general' })
      });

      if (response.ok) {
        setNewNote('');
        setAddingNote(false);
        await fetchOrder();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const createShippingLabel = async () => {
    setProcessingAction('shipping');
    try {
      // TODO: Implement actual shipping label creation
      alert('Shipping label creation will be implemented with carrier integration');
    } finally {
      setProcessingAction(null);
    }
  };

  const processRefund = async (amount?: number) => {
    setProcessingAction('refund');
    try {
      const refundAmount = amount || order?.totalCents;
      const response = await fetch(`/api/admin/orders/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: refundAmount })
      });

      if (response.ok) {
        await fetchOrder();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#fbbf24',
      paid: '#10b981',
      processing: '#3b82f6',
      shipped: '#a78bfa',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refunded: '#f97316',
      payment_failed: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={adminStyles.container}>
        <div style={adminStyles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Package size={48} style={{ color: '#fdba74', marginBottom: '16px', animation: 'pulse 2s infinite' }} />
            <p style={{ color: '#94a3b8' }}>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={adminStyles.container}>
        <div style={adminStyles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Order Not Found</h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>The order you're looking for doesn't exist.</p>
            <Link href="/admin/orders" style={adminStyles.primaryButton}>
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <Link 
          href="/admin/orders"
          style={adminStyles.backButton}
        >
          <ArrowLeft size={20} />
          Back to Orders
        </Link>

        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ ...adminStyles.title, marginBottom: '8px' }}>
              Order {order.id}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                background: `${getStatusColor(order.status)}20`,
                color: getStatusColor(order.status),
                border: `2px solid ${getStatusColor(order.status)}40`
              }}>
                {order.status.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              style={adminStyles.outlineButton}
              onClick={() => copyToClipboard(order.id)}
            >
              <Copy size={16} />
              Copy ID
            </button>
            <button
              style={adminStyles.outlineButton}
              onClick={() => window.print()}
            >
              <Printer size={16} />
              Print
            </button>
            <button
              style={adminStyles.primaryButton}
              onClick={createShippingLabel}
              disabled={processingAction === 'shipping'}
            >
              <Truck size={16} />
              Create Shipping Label
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Customer Information */}
          <div style={adminStyles.section}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#fdba74', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <User size={20} />
              Customer Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Name</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>
                  {order.customerName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Email</p>
                <p style={{ fontSize: '14px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} />
                  <a href={`mailto:${order.customerEmail}`} style={{ color: '#fdba74', textDecoration: 'none' }}>
                    {order.customerEmail}
                  </a>
                </p>
              </div>
              {order.customerPhone && (
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Phone</p>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} />
                    <a href={`tel:${order.customerPhone}`} style={{ color: '#fdba74', textDecoration: 'none' }}>
                      {order.customerPhone}
                    </a>
                  </p>
                </div>
              )}
              {order.userId && (
                <Link 
                  href={`/admin/users/${order.userId}`}
                  style={{
                    ...adminStyles.outlineButton,
                    fontSize: '13px',
                    padding: '6px 12px',
                    marginTop: '8px'
                  }}
                >
                  View Customer Profile
                </Link>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div style={adminStyles.section}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#fdba74', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin size={20} />
              Shipping Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Shipping Address</p>
                <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>
                  {order.shippingAddress}
                </p>
              </div>
              {order.billingAddress && order.billingAddress !== order.shippingAddress && (
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Billing Address</p>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>
                    {order.billingAddress}
                  </p>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Tracking</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={14} />
                    <span style={{ fontWeight: '600', color: '#fdba74' }}>
                      {order.trackingNumber}
                    </span>
                    {order.shippingCarrier && (
                      <span style={{ color: '#94a3b8' }}>({order.shippingCarrier})</span>
                    )}
                    <button
                      style={{ 
                        ...adminStyles.outlineButton, 
                        padding: '2px 8px', 
                        fontSize: '12px' 
                      }}
                      onClick={() => {
                        // TODO: Open tracking URL
                        alert('Tracking URL integration coming soon');
                      }}
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div style={adminStyles.section}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#fdba74', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CreditCard size={20} />
              Payment Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
              }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Subtotal</p>
                  <p style={{ fontSize: '16px', color: '#e2e8f0' }}>
                    ${((order.totalCents - order.shippingCents - order.taxCents) / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Shipping</p>
                  <p style={{ fontSize: '16px', color: '#e2e8f0' }}>
                    ${(order.shippingCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Tax</p>
                  <p style={{ fontSize: '16px', color: '#e2e8f0' }}>
                    ${(order.taxCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#fde68a' }}>
                    ${(order.totalCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {order.refundAmountCents > 0 && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(249, 115, 22, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  <p style={{ fontSize: '14px', color: '#f97316', fontWeight: '600' }}>
                    Refunded: ${(order.refundAmountCents / 100).toFixed(2)}
                  </p>
                  {order.refundedAt && (
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      on {new Date(order.refundedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {order.paymentMethod && (
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Payment Method</p>
                  <p style={{ fontSize: '14px', color: '#e2e8f0' }}>{order.paymentMethod}</p>
                </div>
              )}

              {order.paidAt && (
                <div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Paid At</p>
                  <p style={{ fontSize: '14px', color: '#e2e8f0' }}>
                    {new Date(order.paidAt).toLocaleString()}
                  </p>
                </div>
              )}

              <button
                style={{
                  ...adminStyles.outlineButton,
                  marginTop: '8px'
                }}
                onClick={() => processRefund()}
                disabled={processingAction === 'refund' || order.refundAmountCents >= order.totalCents}
              >
                <RotateCcw size={16} />
                {processingAction === 'refund' ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div style={adminStyles.section}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#fdba74', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Package size={20} />
            Order Items ({order.items.length})
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={adminStyles.table}>
              <thead>
                <tr style={adminStyles.tableHeader}>
                  <th style={adminStyles.tableHeaderCell}>Item</th>
                  <th style={adminStyles.tableHeaderCell}>Type</th>
                  <th style={adminStyles.tableHeaderCell}>Size</th>
                  <th style={adminStyles.tableHeaderCell}>Quantity</th>
                  <th style={adminStyles.tableHeaderCell}>Price</th>
                  <th style={adminStyles.tableHeaderCell}>Total</th>
                  <th style={adminStyles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} style={adminStyles.tableRow}>
                    <td style={adminStyles.tableCell}>
                      <p style={{ fontWeight: '600', color: '#e2e8f0' }}>
                        {item.game?.name || item.merch?.name || 'Unknown Item'}
                      </p>
                    </td>
                    <td style={adminStyles.tableCell}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: item.gameId ? 'rgba(59, 130, 246, 0.2)' : 'rgba(167, 139, 250, 0.2)',
                        color: item.gameId ? '#3b82f6' : '#a78bfa'
                      }}>
                        {item.gameId ? 'Game' : 'Merch'}
                      </span>
                    </td>
                    <td style={adminStyles.tableCell}>
                      {item.merchSize || '-'}
                    </td>
                    <td style={adminStyles.tableCell}>
                      {item.quantity}
                    </td>
                    <td style={adminStyles.tableCell}>
                      ${(item.priceCents / 100).toFixed(2)}
                    </td>
                    <td style={adminStyles.tableCell}>
                      <span style={{ fontWeight: '600', color: '#fde68a' }}>
                        ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td style={adminStyles.tableCell}>
                      {item.game && (
                        <Link
                          href={`/games/${item.game.slug}`}
                          target="_blank"
                          style={{
                            ...adminStyles.outlineButton,
                            padding: '4px 8px',
                            fontSize: '12px'
                          }}
                        >
                          <ExternalLink size={12} />
                        </Link>
                      )}
                      {item.merch && (
                        <Link
                          href={`/merch/${item.merch.slug}`}
                          target="_blank"
                          style={{
                            ...adminStyles.outlineButton,
                            padding: '4px 8px',
                            fontSize: '12px'
                          }}
                        >
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status History & Notes */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Status History */}
          <div style={adminStyles.section}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#fdba74', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} />
                Status History
              </span>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(e.target.value)}
                style={{
                  ...adminStyles.input,
                  padding: '6px 12px',
                  fontSize: '13px',
                  width: 'auto'
                }}
                disabled={processingAction === 'status'}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.statusHistory.map((history, index) => (
                <div 
                  key={history.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${getStatusColor(history.status)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: getStatusColor(history.status),
                      textTransform: 'capitalize'
                    }}>
                      {history.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {formatDistanceToNow(new Date(history.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {history.notes && (
                    <p style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '4px' }}>
                      {history.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          <div style={adminStyles.section}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#fdba74', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} />
                Internal Notes
              </span>
              {!editingNotes && (
                <button
                  style={{
                    ...adminStyles.outlineButton,
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                  onClick={() => setEditingNotes(true)}
                >
                  <Edit size={12} />
                </button>
              )}
            </h2>
            
            {editingNotes ? (
              <div>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  style={{
                    ...adminStyles.input,
                    width: '100%',
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                  placeholder="Add internal notes about this order..."
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    style={adminStyles.primaryButton}
                    onClick={updateInternalNotes}
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    style={adminStyles.outlineButton}
                    onClick={() => {
                      setEditingNotes(false);
                      setInternalNotes(order.internalNotes || '');
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {internalNotes ? (
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#e2e8f0', 
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {internalNotes}
                  </p>
                ) : (
                  <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No internal notes yet
                  </p>
                )}
              </div>
            )}

            {/* Add Note Button */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(249, 115, 22, 0.2)' }}>
              {addingNote ? (
                <div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{
                      ...adminStyles.input,
                      width: '100%',
                      minHeight: '80px'
                    }}
                    placeholder="Add a note..."
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      style={adminStyles.primaryButton}
                      onClick={addOrderNote}
                      disabled={!newNote.trim() || processingAction === 'note'}
                    >
                      <Plus size={16} />
                      Add Note
                    </button>
                    <button
                      style={adminStyles.outlineButton}
                      onClick={() => {
                        setAddingNote(false);
                        setNewNote('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={adminStyles.outlineButton}
                  onClick={() => setAddingNote(true)}
                >
                  <Plus size={16} />
                  Add Note
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Items (Returns, Tickets, etc.) */}
        {(order.returns?.length || order.tickets?.length) && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '24px'
          }}>
            {order.returns && order.returns.length > 0 && (
              <div style={adminStyles.section}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#fdba74', 
                  marginBottom: '12px' 
                }}>
                  Returns ({order.returns.length})
                </h3>
                {order.returns.map(ret => (
                  <div key={ret.id} style={{
                    padding: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#e2e8f0' }}>
                        RMA #{ret.rmaNumber}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: 'rgba(249, 115, 22, 0.2)',
                        color: '#f97316'
                      }}>
                        {ret.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>{ret.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {order.tickets && order.tickets.length > 0 && (
              <div style={adminStyles.section}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#fdba74', 
                  marginBottom: '12px' 
                }}>
                  Support Tickets ({order.tickets.length})
                </h3>
                {order.tickets.map(ticket => (
                  <div key={ticket.id} style={{
                    padding: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#e2e8f0' }}>
                        #{ticket.ticketNumber}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: ticket.status === 'open' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: ticket.status === 'open' ? '#fbbf24' : '#10b981'
                      }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>{ticket.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}