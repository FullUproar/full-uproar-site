'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, User, ChevronDown, ChevronRight } from 'lucide-react';
import FuglyLogo from '@/app/components/FuglyLogo';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { formatOrderNumber } from '@/lib/utils/order-number';

interface OrderDetails {
  id: string;
  orderNumber?: number;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  status: string;
  totalCents: number;
  trackingNumber?: string;
  items: Array<{
    id: number;
    itemType: string;
    quantity: number;
    priceCents: number;
    merchSize?: string;
    game?: { title: string };
    merch?: { name: string };
  }>;
  statusHistory: Array<{
    id: number;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface UserOrder {
  id: string;
  orderNumber?: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: string;
  trackingNumber?: string;
  items: Array<{
    id: number;
    quantity: number;
    priceCents: number;
    productType: string;
    product: {
      id: number;
      title?: string;
      name?: string;
      imageUrl?: string;
    } | null;
  }>;
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)'
  },
  content: {
    maxWidth: '56rem',
    margin: '0 auto',
    padding: '3rem 1rem'
  },
  card: {
    background: '#1f2937',
    borderRadius: '1rem',
    padding: '1.5rem',
    border: '4px solid rgba(255, 130, 0, 0.2)',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 900,
    color: '#FF8200',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  input: {
    width: '100%',
    padding: '1rem 1.5rem',
    paddingRight: '4rem',
    background: '#374151',
    color: '#fff',
    borderRadius: '0.5rem',
    border: '2px solid #4b5563',
    fontSize: '1.125rem',
    outline: 'none'
  },
  searchButton: {
    position: 'absolute' as const,
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '0.75rem',
    background: '#FF8200',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer'
  },
  orderCard: {
    background: 'rgba(55, 65, 81, 0.5)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  orderHeader: {
    width: '100%',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  statusBadge: (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'rgba(234, 179, 8, 0.2)', text: '#facc15' },
      payment_pending: { bg: 'rgba(234, 179, 8, 0.2)', text: '#facc15' },
      paid: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
      processing: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
      shipped: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
      delivered: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
      refunded: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
      payment_failed: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' }
    };
    const color = colors[status] || { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' };
    return {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: 700,
      background: color.bg,
      color: color.text
    };
  }
};

export default function TrackOrderPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Fetch user's orders when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUserOrders();
    }
  }, [isLoaded, isSignedIn]);

  const fetchUserOrders = async () => {
    setLoadingUserOrders(true);
    try {
      const response = await fetch('/api/account/orders');
      if (response.ok) {
        const orders = await response.json();
        setUserOrders(orders);
        if (orders.length > 0) {
          setExpandedOrderId(orders[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const value = searchValue.trim();

      // Support FU-XXXX format: extract number and look up by orderNumber
      const fuMatch = value.match(/^FU-(\d+)$/i);
      const lookupId = fuMatch ? fuMatch[1] : value;

      let response = await fetch(`/api/orders/${lookupId}`);

      if (!response.ok) {
        response = await fetch(`/api/orders?email=${encodeURIComponent(value)}`);
        if (response.ok) {
          const orders = await response.json();
          if (orders.length > 0) {
            setOrder(orders[0]);
          } else {
            setError('No orders found with that email address');
          }
        } else {
          setError('Order not found. Check your order number or email.');
        }
      } else {
        const data = await response.json();
        setOrder(data);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const iconStyle = { width: 24, height: 24 };
    switch (status) {
      case 'pending':
      case 'payment_pending':
        return <Clock style={{ ...iconStyle, color: '#facc15' }} />;
      case 'paid':
      case 'processing':
        return <Package style={{ ...iconStyle, color: '#60a5fa' }} />;
      case 'shipped':
        return <Truck style={{ ...iconStyle, color: '#c084fc' }} />;
      case 'delivered':
        return <CheckCircle style={{ ...iconStyle, color: '#4ade80' }} />;
      case 'cancelled':
      case 'refunded':
      case 'payment_failed':
        return <AlertCircle style={{ ...iconStyle, color: '#f87171' }} />;
      default:
        return <Clock style={{ ...iconStyle, color: '#9ca3af' }} />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      payment_pending: 'Payment Pending',
      payment_failed: 'Payment Failed',
      partially_refunded: 'Partially Refunded'
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      <Navigation />

      <div style={styles.content}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: '#FF8200',
          textAlign: 'center',
          marginBottom: '2rem',
          textTransform: 'uppercase'
        }}>
          Track Your Chaos
        </h1>

        {/* User's Orders Section */}
        {isLoaded && isSignedIn && (
          <div style={styles.card}>
            <h2 style={styles.title}>
              <User style={{ width: 28, height: 28, color: '#FF8200' }} />
              Your Orders
            </h2>

            {loadingUserOrders ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                  <FuglyLogo size={60} />
                </div>
                <p style={{ color: '#FF8200', fontWeight: 700, marginTop: '1rem' }}>Loading your orders...</p>
              </div>
            ) : userOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <Package style={{ width: 64, height: 64, color: '#4b5563', margin: '0 auto 1rem' }} />
                <p style={{ color: '#9ca3af', fontSize: '1.125rem', marginBottom: '0.5rem' }}>No orders yet!</p>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Time to unleash some chaos?</p>
                <Link
                  href="/shop"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: '#FF8200',
                    color: '#111827',
                    fontWeight: 700,
                    borderRadius: '0.5rem',
                    textDecoration: 'none'
                  }}
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              <div>
                {userOrders.map((userOrder) => (
                  <div key={userOrder.id} style={styles.orderCard}>
                    <button
                      onClick={() => setExpandedOrderId(expandedOrderId === userOrder.id ? null : userOrder.id)}
                      style={{
                        ...styles.orderHeader,
                        background: expandedOrderId === userOrder.id ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {getStatusIcon(userOrder.status)}
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: 700, color: '#FBDB65', margin: 0 }}>
                            Order {formatOrderNumber(userOrder.orderNumber, userOrder.id)}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
                            {formatShortDate(userOrder.createdAt)} • {userOrder.items.length} item{userOrder.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={styles.statusBadge(userOrder.status)}>
                            {getStatusText(userOrder.status)}
                          </div>
                          <p style={{ color: '#fff', fontWeight: 700, marginTop: '0.25rem' }}>
                            ${(userOrder.totalAmount / 100).toFixed(2)}
                          </p>
                        </div>
                        {expandedOrderId === userOrder.id ? (
                          <ChevronDown style={{ width: 20, height: 20, color: '#9ca3af' }} />
                        ) : (
                          <ChevronRight style={{ width: 20, height: 20, color: '#9ca3af' }} />
                        )}
                      </div>
                    </button>

                    {expandedOrderId === userOrder.id && (
                      <div style={{
                        borderTop: '1px solid #4b5563',
                        padding: '1rem',
                        background: 'rgba(31, 41, 55, 0.5)'
                      }}>
                        {/* Items */}
                        <div style={{ marginBottom: '1rem' }}>
                          {userOrder.items.map((item) => (
                            <div key={item.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0',
                              borderBottom: '1px solid #374151'
                            }}>
                              <div>
                                <p style={{ color: '#fff', fontWeight: 700, margin: 0 }}>
                                  {item.product?.title || item.product?.name || 'Unknown Item'}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p style={{ color: '#FF8200', fontWeight: 700, margin: 0 }}>
                                ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Tracking */}
                        {userOrder.trackingNumber && (
                          <div style={{
                            background: 'rgba(55, 65, 81, 0.5)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Tracking Number:</p>
                            <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FF8200', margin: 0 }}>
                              {userOrder.trackingNumber}
                            </p>
                          </div>
                        )}

                        {/* Shipping Address */}
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Shipping to:</p>
                          <p style={{ color: '#fff', margin: 0 }}>{userOrder.shippingAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Form */}
        <div style={styles.card}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            fontStyle: 'normal',
            color: '#FF8200',
            textAlign: 'center',
            textTransform: 'uppercase',
            marginBottom: '1.5rem'
          }}>
            {isSignedIn ? 'LOOKUP ANOTHER ORDER' : 'HUNT DOWN YOUR ORDER'}
          </h2>

          {!isSignedIn && (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginBottom: '1.5rem' }}>
              <Link href="/sign-in" style={{ color: '#FF8200', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
              {' '}to see all your orders automatically
            </p>
          )}

          <form onSubmit={handleSearch} style={{ maxWidth: '36rem', margin: '0 auto', marginTop: '1rem' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#374151',
              borderRadius: '0.75rem',
              border: '2px solid #4b5563',
              overflow: 'hidden'
            }}>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Enter order number (FU-1001) or email"
                style={{
                  flex: 1,
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: '1rem',
                  border: 'none',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.875rem 1.25rem',
                  background: loading ? '#4b5563' : '#FF8200',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Search style={{ width: 24, height: 24, color: '#111827' }} />
              </button>
            </div>

            {error && (
              <p style={{ color: '#f87171', textAlign: 'center', marginTop: '1rem', fontWeight: 700 }}>
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
              <FuglyLogo size={80} />
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FF8200', marginTop: '1rem' }}>
              Searching the chaos realm...
            </p>
          </div>
        )}

        {/* Searched Order Details */}
        {order && !loading && (
          <div>
            {/* Order Header */}
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FBDB65', margin: 0 }}>
                    Order {formatOrderNumber(order.orderNumber, order.id)}
                  </h3>
                  <p style={{ color: '#9ca3af', marginTop: '0.25rem' }}>
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div style={{
                  ...styles.statusBadge(order.status),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem'
                }}>
                  {getStatusIcon(order.status)}
                  <span style={{ textTransform: 'uppercase' }}>{getStatusText(order.status)}</span>
                </div>
              </div>

              {order.trackingNumber && (
                <div style={{
                  background: 'rgba(55, 65, 81, 0.5)',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Tracking Number:</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FF8200', margin: 0 }}>
                    {order.trackingNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div style={styles.card}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200', marginBottom: '1.5rem' }}>
                  Chaos Progress
                </h4>

                <div>
                  {order.statusHistory.map((history, index) => (
                    <div key={history.id} style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: index === 0 ? '#FF8200' : '#374151'
                        }}>
                          {getStatusIcon(history.status)}
                        </div>
                        {index < order.statusHistory.length - 1 && (
                          <div style={{ width: 2, height: 64, background: '#374151', marginTop: 8 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: '2rem' }}>
                        <p style={{ fontWeight: 700, color: '#FBDB65', textTransform: 'capitalize', margin: 0 }}>
                          {getStatusText(history.status)}
                        </p>
                        {history.notes && (
                          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {history.notes}
                          </p>
                        )}
                        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          {formatDate(history.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div style={styles.card}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200', marginBottom: '1rem' }}>
                Order Contents
              </h4>

              <div>
                {order.items.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #374151'
                  }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#FBDB65', margin: 0 }}>
                        {item.itemType === 'game' ? item.game?.title : item.merch?.name}
                      </p>
                      {item.merchSize && (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Size: {item.merchSize}</p>
                      )}
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Quantity: {item.quantity}</p>
                    </div>
                    <p style={{ fontWeight: 700, color: '#fff', margin: 0 }}>
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #374151',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200' }}>Total Chaos</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
                  ${(order.totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Delivery Info */}
            <div style={styles.card}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200', marginBottom: '1rem' }}>
                Delivery Details
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Delivering to:</p>
                  <p style={{ fontWeight: 700, color: '#FBDB65', margin: 0 }}>{order.customerName}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Address:</p>
                  <p style={{ color: '#fff', margin: 0 }}>{order.shippingAddress}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Email:</p>
                  <p style={{ color: '#fff', margin: 0 }}>{order.customerEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
