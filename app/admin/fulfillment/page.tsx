'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, ArrowLeft, Clock, CheckCircle, 
  Truck, Search, Filter, Eye, PrinterIcon,
  AlertCircle, BarChart3, Box, PackageCheck,
  Timer, TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { adminStyles } from '../styles/adminStyles';

interface FulfillmentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalCents: number;
  status: string;
  paidAt: string;
  createdAt: string;
  priority: 'normal' | 'rush' | 'expedited';
  items: Array<{
    id: number;
    quantity: number;
    game?: { name: string; sku?: string };
    merch?: { name: string; sku?: string; size?: string };
  }>;
  shippingLabels: Array<{
    id: number;
    carrier: string;
    trackingNumber: string;
    createdAt: string;
  }>;
}

interface FulfillmentStats {
  pendingOrders: number;
  ordersToday: number;
  averageProcessingTime: number;
  rushOrders: number;
  readyToShip: number;
  awaitingStock: number;
}

const priorityConfig = {
  normal: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Normal' },
  rush: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'Rush' },
  expedited: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Expedited' }
};

const workflowStages = [
  { id: 'paid', label: 'Payment Received', icon: DollarSign },
  { id: 'picking', label: 'Picking', icon: Box },
  { id: 'packing', label: 'Packing', icon: Package },
  { id: 'ready', label: 'Ready to Ship', icon: PackageCheck },
  { id: 'shipped', label: 'Shipped', icon: Truck }
];

export default function FulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('paid');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<FulfillmentStats>({
    pendingOrders: 0,
    ordersToday: 0,
    averageProcessingTime: 0,
    rushOrders: 0,
    readyToShip: 0,
    awaitingStock: 0
  });

  useEffect(() => {
    fetchFulfillmentOrders();
  }, [stageFilter, priorityFilter]);

  const fetchFulfillmentOrders = async () => {
    try {
      const params = new URLSearchParams({
        fulfillment: 'true',
        ...(stageFilter !== 'all' && { status: stageFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter })
      });
      
      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();
      
      // Calculate priority based on order date and shipping method
      const ordersWithPriority = (data.orders || []).map((order: any) => ({
        ...order,
        priority: calculatePriority(order)
      }));
      
      setOrders(ordersWithPriority);
      
      // Calculate fulfillment-specific stats
      const fulfillmentStats = calculateFulfillmentStats(ordersWithPriority);
      setStats(fulfillmentStats);
    } catch (error) {
      console.error('Error fetching fulfillment orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = (order: any): 'normal' | 'rush' | 'expedited' => {
    const hoursSinceOrder = (Date.now() - new Date(order.paidAt || order.createdAt).getTime()) / (1000 * 60 * 60);
    
    // Expedited if order is over 48 hours old
    if (hoursSinceOrder > 48) return 'expedited';
    
    // Rush if order is over 24 hours old or has express shipping
    if (hoursSinceOrder > 24 || order.shippingMethod?.includes('express')) return 'rush';
    
    return 'normal';
  };

  const calculateFulfillmentStats = (orders: FulfillmentOrder[]): FulfillmentStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pendingOrders = orders.filter(o => ['paid', 'picking', 'packing'].includes(o.status)).length;
    const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
    const rushOrders = orders.filter(o => ['rush', 'expedited'].includes(o.priority)).length;
    const readyToShip = orders.filter(o => o.status === 'ready').length;
    const awaitingStock = 0; // TODO: Implement stock checking
    
    // Calculate average processing time for shipped orders
    const shippedOrders = orders.filter(o => o.status === 'shipped' && o.shippingLabels.length > 0);
    let totalProcessingTime = 0;
    
    shippedOrders.forEach(order => {
      const paidTime = new Date(order.paidAt || order.createdAt).getTime();
      const shippedTime = new Date(order.shippingLabels[0].createdAt).getTime();
      totalProcessingTime += (shippedTime - paidTime) / (1000 * 60 * 60); // Convert to hours
    });
    
    const averageProcessingTime = shippedOrders.length > 0 
      ? Math.round(totalProcessingTime / shippedOrders.length) 
      : 0;
    
    return {
      pendingOrders,
      ordersToday,
      averageProcessingTime,
      rushOrders,
      readyToShip,
      awaitingStock
    };
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

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    
    try {
      const updates = Array.from(selectedOrders).map(orderId => 
        updateOrderStatus(orderId, newStatus)
      );
      
      await Promise.all(updates);
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Error bulk updating orders:', error);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const printPackingSlips = () => {
    if (selectedOrders.size === 0) return;
    
    // TODO: Generate packing slips PDF
    alert(`Printing packing slips for ${selectedOrders.size} orders...`);
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.customerEmail.toLowerCase().includes(search)
    );
  });

  const getPriorityDisplay = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.bg,
        color: config.color,
        textTransform: 'uppercase'
      }}>
        {config.label}
      </span>
    );
  };

  const getCurrentStageIndex = (status: string) => {
    return workflowStages.findIndex(stage => stage.id === status);
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
          <h1 style={adminStyles.title}>Fulfillment Center</h1>
          <p style={adminStyles.subtitle}>
            Process and ship orders efficiently
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Pending Orders</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{stats.pendingOrders}</p>
              </div>
              <Clock size={28} style={{ color: '#fbbf24' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Ready to Ship</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{stats.readyToShip}</p>
              </div>
              <PackageCheck size={28} style={{ color: '#10b981' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Rush Orders</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{stats.rushOrders}</p>
              </div>
              <Timer size={28} style={{ color: '#ef4444' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Orders Today</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{stats.ordersToday}</p>
              </div>
              <Calendar size={28} style={{ color: '#3b82f6' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Avg Processing</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{stats.averageProcessingTime}h</p>
              </div>
              <TrendingUp size={28} style={{ color: '#a78bfa' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Awaiting Stock</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde68a' }}>{stats.awaitingStock}</p>
              </div>
              <AlertCircle size={28} style={{ color: '#f97316' }} />
            </div>
          </div>
        </div>

        {/* Workflow Stages */}
        <div style={{ ...adminStyles.section, marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            {workflowStages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = stage.id === stageFilter;
              const orderCount = orders.filter(o => o.status === stage.id).length;
              
              return (
                <button
                  key={stage.id}
                  onClick={() => setStageFilter(stage.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: isActive 
                      ? 'rgba(249, 115, 22, 0.2)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    border: `2px solid ${isActive 
                      ? 'rgba(249, 115, 22, 0.5)' 
                      : 'transparent'}`,
                    borderRadius: '8px',
                    color: isActive ? '#fdba74' : '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontWeight: '600' }}>{stage.label}</span>
                  <span style={{
                    background: isActive ? '#f97316' : '#64748b',
                    color: '#0f172a',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {orderCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters and Actions */}
        <div style={adminStyles.section}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
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
                placeholder="Search orders..."
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={adminStyles.input}
            >
              <option value="all">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="rush">Rush</option>
              <option value="expedited">Expedited</option>
            </select>

            {selectedOrders.size > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#fdba74', fontWeight: '600', fontSize: '14px' }}>
                  {selectedOrders.size} selected
                </span>
                <button
                  onClick={printPackingSlips}
                  style={{
                    ...adminStyles.outlineButton,
                    padding: '8px 16px',
                    fontSize: '13px'
                  }}
                >
                  <PrinterIcon size={16} />
                  Print Packing Slips
                </button>
                <button
                  onClick={() => bulkUpdateStatus('picking')}
                  style={{
                    ...adminStyles.primaryButton,
                    padding: '8px 16px',
                    fontSize: '13px'
                  }}
                >
                  Start Picking
                </button>
              </div>
            )}
          </div>

          {/* Orders Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Package size={32} style={{ 
                color: '#fdba74', 
                marginBottom: '16px',
                animation: 'pulse 2s infinite'
              }} />
              <p style={{ color: '#94a3b8' }}>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Package size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No orders in this stage</h3>
              <p style={{ color: '#94a3b8' }}>
                Orders will appear here as they progress through fulfillment
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Select All */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                border: '2px solid rgba(249, 115, 22, 0.2)'
              }}>
                <input
                  type="checkbox"
                  checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                  onChange={toggleAllOrders}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Select all {filteredOrders.length} orders
                </span>
              </div>

              {/* Order Cards */}
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '20px',
                    background: selectedOrders.has(order.id) 
                      ? 'rgba(249, 115, 22, 0.1)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '8px',
                    border: `2px solid ${selectedOrders.has(order.id) 
                      ? 'rgba(249, 115, 22, 0.5)' 
                      : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <p style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '14px',
                              color: '#fde68a',
                              fontWeight: '600'
                            }}>
                              {order.id.slice(0, 8)}...
                            </p>
                            {getPriorityDisplay(order.priority)}
                          </div>
                          <p style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>
                            {order.customerName}
                          </p>
                          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                            {order.customerEmail}
                          </p>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#fde68a' }}>
                            ${(order.totalCents / 100).toFixed(2)}
                          </p>
                          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {formatDistanceToNow(new Date(order.paidAt || order.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.2)', 
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '12px'
                      }}>
                        <p style={{ fontSize: '13px', color: '#fdba74', fontWeight: '600', marginBottom: '8px' }}>
                          Items ({order.items.length})
                        </p>
                        {order.items.map((item, index) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            color: '#e2e8f0',
                            marginBottom: index < order.items.length - 1 ? '4px' : 0
                          }}>
                            <span>
                              {item.quantity}x {item.game?.name || item.merch?.name || 'Item'}
                              {item.merch?.size && ` (${item.merch.size})`}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                              {item.game?.sku || item.merch?.sku || 'No SKU'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                        >
                          <Eye size={14} />
                          View Details
                        </Link>

                        {order.status === 'paid' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'picking')}
                            style={{
                              ...adminStyles.primaryButton,
                              padding: '6px 12px',
                              fontSize: '13px'
                            }}
                          >
                            Start Picking
                          </button>
                        )}

                        {order.status === 'picking' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'packing')}
                            style={{
                              ...adminStyles.primaryButton,
                              padding: '6px 12px',
                              fontSize: '13px'
                            }}
                          >
                            Move to Packing
                          </button>
                        )}

                        {order.status === 'packing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            style={{
                              ...adminStyles.primaryButton,
                              padding: '6px 12px',
                              fontSize: '13px'
                            }}
                          >
                            Ready to Ship
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <Link
                            href={`/admin/orders/${order.id}#shipping`}
                            style={{
                              ...adminStyles.primaryButton,
                              padding: '6px 12px',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Truck size={14} />
                            Create Label
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}