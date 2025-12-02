'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RotateCcw, ArrowLeft, Package, Clock, CheckCircle, 
  XCircle, Search, Filter, Eye, MessageSquare,
  FileText, AlertCircle, Truck, DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { adminStyles } from '../styles/adminStyles';
import { useToastStore } from '@/lib/toastStore';

interface Return {
  id: number;
  rmaNumber: string;
  orderId: string;
  customerEmail: string;
  status: string;
  reason: string;
  condition?: string;
  customerNotes?: string;
  refundAmountCents?: number;
  createdAt: string;
  order: {
    id: string;
    customerName: string;
    totalCents: number;
  };
  items: Array<{
    quantity: number;
    orderItem: {
      game?: { name: string };
      merch?: { name: string };
    };
  }>;
}

const statusConfig = {
  requested: { icon: Clock, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  approved: { icon: CheckCircle, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  shipping: { icon: Truck, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
  received: { icon: Package, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  processing: { icon: RotateCcw, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  completed: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  rejected: { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
};

const returnReasons = {
  defective: 'Defective/Damaged',
  wrong_item: 'Wrong Item Sent',
  not_as_described: 'Not as Described',
  no_longer_needed: 'No Longer Needed',
  better_price: 'Found Better Price',
  other: 'Other'
};

export default function ReturnsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedReturn, setExpandedReturn] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    completedReturns: 0,
    totalRefunded: 0
  });

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/admin/returns?${params}`);
      const data = await response.json();
      
      setReturns(data.returns || []);
      setStats(data.stats || {
        totalReturns: 0,
        pendingReturns: 0,
        completedReturns: 0,
        totalRefunded: 0
      });
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReturnStatus = async (returnId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReturns(returns.map(ret => 
          ret.id === returnId ? { ...ret, status: newStatus } : ret
        ));
      }
    } catch (error) {
      console.error('Error updating return:', error);
    }
  };

  const filteredReturns = returns.filter(ret => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ret.rmaNumber.toLowerCase().includes(search) ||
      ret.orderId.toLowerCase().includes(search) ||
      ret.customerEmail.toLowerCase().includes(search) ||
      ret.order.customerName.toLowerCase().includes(search)
    );
  });

  const getStatusDisplay = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.requested;
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
        {status}
      </span>
    );
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
          <h1 style={adminStyles.title}>Returns & RMA Management</h1>
          <p style={adminStyles.subtitle}>
            Process returns, refunds, and exchanges
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
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Returns</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>{stats.totalReturns}</p>
              </div>
              <RotateCcw size={32} style={{ color: '#fdba74' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>{stats.pendingReturns}</p>
              </div>
              <Clock size={32} style={{ color: '#fbbf24' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Completed</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>{stats.completedReturns}</p>
              </div>
              <CheckCircle size={32} style={{ color: '#10b981' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Total Refunded</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>
                  ${(stats.totalRefunded / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign size={32} style={{ color: '#10b981' }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={adminStyles.section}>
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
                placeholder="Search by RMA, order ID, customer..."
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
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="shipping">Shipping</option>
              <option value="received">Received</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <Link
              href="/admin/returns/new"
              style={adminStyles.primaryButton}
            >
              <Package size={16} />
              Create RMA
            </Link>
          </div>
        </div>

        {/* Returns Table */}
        <div style={adminStyles.section}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <RotateCcw size={32} style={{ 
                color: '#fdba74', 
                marginBottom: '16px',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: '#94a3b8' }}>Loading returns...</p>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <RotateCcw size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No returns found</h3>
              <p style={{ color: '#94a3b8' }}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Return requests will appear here'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={adminStyles.table}>
                <thead>
                  <tr style={adminStyles.tableHeader}>
                    <th style={adminStyles.tableHeaderCell}>RMA #</th>
                    <th style={adminStyles.tableHeaderCell}>Order</th>
                    <th style={adminStyles.tableHeaderCell}>Customer</th>
                    <th style={adminStyles.tableHeaderCell}>Reason</th>
                    <th style={adminStyles.tableHeaderCell}>Status</th>
                    <th style={adminStyles.tableHeaderCell}>Value</th>
                    <th style={adminStyles.tableHeaderCell}>Date</th>
                    <th style={adminStyles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <>
                      <tr 
                        key={ret.id}
                        style={{
                          ...adminStyles.tableRow,
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedReturn(
                          expandedReturn === ret.id ? null : ret.id
                        )}
                      >
                        <td style={adminStyles.tableCell}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '13px',
                            color: '#fde68a',
                            fontWeight: '600'
                          }}>
                            {ret.rmaNumber}
                          </span>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <Link
                            href={`/admin/orders/${ret.orderId}`}
                            style={{ color: '#fdba74', textDecoration: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ret.orderId.slice(0, 8)}...
                          </Link>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div>
                            <p style={{ fontWeight: '600', color: '#e2e8f0' }}>
                              {ret.order.customerName}
                            </p>
                            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {ret.customerEmail}
                            </p>
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <span style={{ fontSize: '13px' }}>
                            {returnReasons[ret.reason as keyof typeof returnReasons] || ret.reason}
                          </span>
                        </td>
                        <td style={adminStyles.tableCell}>
                          {getStatusDisplay(ret.status)}
                        </td>
                        <td style={adminStyles.tableCell}>
                          <p style={{ fontWeight: '600', color: '#fde68a' }}>
                            ${(ret.order.totalCents / 100).toFixed(2)}
                          </p>
                          {ret.refundAmountCents && (
                            <p style={{ fontSize: '12px', color: '#10b981' }}>
                              Refund: ${(ret.refundAmountCents / 100).toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div>
                            <p style={{ fontSize: '13px', color: '#e2e8f0' }}>
                              {new Date(ret.createdAt).toLocaleDateString()}
                            </p>
                            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {formatDistanceToNow(new Date(ret.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link
                              href={`/admin/returns/${ret.id}`}
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

                      {/* Expanded Details */}
                      {expandedReturn === ret.id && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div style={{
                              background: 'rgba(249, 115, 22, 0.05)',
                              padding: '24px',
                              borderBottom: '2px solid rgba(249, 115, 22, 0.2)'
                            }}>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr',
                                gap: '24px'
                              }}>
                                <div>
                                  <h4 style={{ 
                                    color: '#fdba74', 
                                    marginBottom: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    Return Items
                                  </h4>
                                  {ret.items.map((item, index) => (
                                    <div key={index} style={{
                                      padding: '8px 0',
                                      borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
                                    }}>
                                      <span style={{ color: '#e2e8f0' }}>
                                        {item.quantity}x {item.orderItem.game?.name || item.orderItem.merch?.name || 'Item'}
                                      </span>
                                    </div>
                                  ))}

                                  {ret.customerNotes && (
                                    <div style={{ marginTop: '16px' }}>
                                      <h5 style={{ color: '#fdba74', marginBottom: '8px', fontSize: '14px' }}>
                                        Customer Notes
                                      </h5>
                                      <p style={{ fontSize: '13px', color: '#e2e8f0' }}>
                                        {ret.customerNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h4 style={{ 
                                    color: '#fdba74', 
                                    marginBottom: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    Quick Actions
                                  </h4>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <select
                                      value={ret.status}
                                      onChange={(e) => updateReturnStatus(ret.id, e.target.value)}
                                      style={{
                                        ...adminStyles.input,
                                        padding: '6px 12px',
                                        fontSize: '13px'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="requested">Requested</option>
                                      <option value="approved">Approved</option>
                                      <option value="shipping">Shipping</option>
                                      <option value="received">Received</option>
                                      <option value="processing">Processing</option>
                                      <option value="completed">Completed</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                    
                                    {ret.status === 'approved' && (
                                      <button
                                        style={{
                                          ...adminStyles.outlineButton,
                                          padding: '6px 12px',
                                          fontSize: '13px'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Generate return label
                                          addToast({ message: '📄 Return label generation coming soon!', type: 'info' });
                                        }}
                                      >
                                        <FileText size={14} />
                                        Return Label
                                      </button>
                                    )}

                                    {['received', 'processing'].includes(ret.status) && (
                                      <button
                                        style={{
                                          ...adminStyles.primaryButton,
                                          padding: '6px 12px',
                                          fontSize: '13px'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Process refund
                                          addToast({ message: '💰 Refund processing coming soon!', type: 'info' });
                                        }}
                                      >
                                        <DollarSign size={14} />
                                        Process Refund
                                      </button>
                                    )}
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
          )}
        </div>
      </div>
    </div>
  );
}