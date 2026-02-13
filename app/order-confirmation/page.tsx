'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Truck, Mail, ArrowRight, Copy, User, Zap, ShieldCheck, Clock } from 'lucide-react';
import FuglyLogo from '@/app/components/FuglyLogo';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { MetaPixelEvents } from '@/app/components/MetaPixel';
import { useCartStore } from '@/lib/cartStore';
import EmailCapture from '@/app/components/EmailCapture';

import { formatOrderNumber } from '@/lib/utils/order-number';

interface OrderDetails {
  id: string;
  orderNumber?: number;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  status: string;
  totalCents: number;
  shippingCents: number;
  taxCents: number;
  items: Array<{
    id: number;
    itemType: string;
    quantity: number;
    priceCents: number;
    merchSize?: string;
    game?: { title: string };
    merch?: { name: string };
  }>;
  createdAt: string;
}

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const orderId = searchParams.get('orderId');
  const redirectStatus = searchParams.get('redirect_status');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { clearCart } = useCartStore();

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    // Handle Stripe redirect (3D Secure, etc.) — if payment failed during redirect, go back to checkout
    if (redirectStatus && redirectStatus !== 'succeeded') {
      router.push(`/checkout?error=payment_failed`);
      return;
    }

    fetchOrder();
  }, [orderId, router, redirectStatus]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Order not found');
      const data = await response.json();
      setOrder(data);

      // Clear the cart after successful order confirmation
      clearCart();

      // Track purchase completion with Meta Pixel
      if (data) {
        const contentIds = data.items.map((item: any) => `${item.itemType}_${item.id}`);
        const totalValue = data.totalCents / 100;
        const numItems = data.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

        MetaPixelEvents.purchase(
          totalValue,
          contentIds,
          'product',
          numItems,
          'USD'
        );
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const displayOrderNumber = order ? formatOrderNumber(order.orderNumber, order.id) : '';

  const copyOrderId = () => {
    if (displayOrderNumber) {
      navigator.clipboard.writeText(displayOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>
            <FuglyLogo size={100} />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF8200' }}>Loading your chaos...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const subtotal = order.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)'
    }}>
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '6rem',
              height: '6rem',
              background: '#22c55e',
              borderRadius: '50%',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle style={{ width: '4rem', height: '4rem', color: 'white' }} />
            </div>

            <h1 style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: 'white',
              marginBottom: '1rem'
            }}>
              CHAOS INCOMING!
            </h1>

            <p style={{
              fontSize: '1.5rem',
              color: '#fbbf24',
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Your chaos order is on the way!
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#1f2937',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              marginTop: '1rem'
            }}>
              <span style={{ color: '#9ca3af' }}>Order:</span>
              <span style={{ color: '#FF8200', fontFamily: 'monospace', fontWeight: 'bold' }}>{displayOrderNumber}</span>
              <button
                onClick={copyOrderId}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '0.25rem'
                }}
              >
                <Copy style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
              </button>
              {copied && (
                <span style={{ color: '#4ade80', fontSize: '0.875rem', marginLeft: '0.5rem' }}>Copied!</span>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Delivery Info */}
            <div style={{
              background: '#1f2937',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '4px solid rgba(255, 130, 0, 0.2)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#FF8200',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Truck style={{ width: '1.5rem', height: '1.5rem' }} />
                Where's the Chaos Headed?
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Delivering to:</p>
                  <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: 0 }}>{order.customerName}</p>
                </div>

                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Shipping address:</p>
                  <p style={{ color: 'white', margin: 0 }}>{order.shippingAddress}</p>
                </div>

                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Email:</p>
                  <p style={{ color: 'white', margin: 0 }}>{order.customerEmail}</p>
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #374151' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Estimated delivery:</p>
                  <p style={{ color: '#fbbf24', fontWeight: 'bold', margin: 0 }}>5-7 business days</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              background: '#1f2937',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '4px solid rgba(255, 130, 0, 0.2)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#FF8200',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Package style={{ width: '1.5rem', height: '1.5rem' }} />
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>
                        {item.itemType === 'game' ? item.game?.title : item.merch?.name}
                      </p>
                      {item.merchSize && (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Size: {item.merchSize}</p>
                      )}
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Qty: {item.quantity}</p>
                    </div>
                    <p style={{ fontWeight: 'bold', color: 'white', margin: 0 }}>
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                borderTop: '1px solid #374151',
                paddingTop: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Subtotal</span>
                  <span style={{ color: 'white' }}>${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Shipping</span>
                  <span style={{ color: 'white' }}>
                    ${(order.shippingCents / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Tax</span>
                  <span style={{ color: 'white' }}>${(order.taxCents / 100).toFixed(2)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #374151',
                  paddingTop: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200' }}>Total</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>
                    ${(order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div style={{
            background: '#1f2937',
            borderRadius: '0.75rem',
            padding: '2rem',
            border: '4px solid rgba(255, 130, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <FuglyLogo size={80} />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#FF8200',
              marginBottom: '1rem'
            }}>
              What Happens Next?
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'rgba(255, 130, 0, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <Mail style={{ width: '2rem', height: '2rem', color: '#FF8200' }} />
                </div>
                <p style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.25rem' }}>Step 1</p>
                <p style={{ color: '#9ca3af', margin: 0 }}>Fugly will send you a confirmation email</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'rgba(255, 130, 0, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <Package style={{ width: '2rem', height: '2rem', color: '#FF8200' }} />
                </div>
                <p style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.25rem' }}>Step 2</p>
                <p style={{ color: '#9ca3af', margin: 0 }}>Fugly will pack your chaos with extra care</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'rgba(255, 130, 0, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <Truck style={{ width: '2rem', height: '2rem', color: '#FF8200' }} />
                </div>
                <p style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.25rem' }}>Step 3</p>
                <p style={{ color: '#9ca3af', margin: 0 }}>Follow your Fugly delivery</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#FF8200',
                  color: '#111827',
                  fontWeight: 900,
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                Browse More Chaos
                <ArrowRight style={{ width: '1.25rem', height: '1.25rem' }} />
              </Link>

              <Link
                href="/track-order"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#374151',
                  color: 'white',
                  fontWeight: 900,
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                Track Your Chaos
                <Truck style={{ width: '1.25rem', height: '1.25rem' }} />
              </Link>
            </div>
          </div>

          {/* Account Upsell (guest users only) */}
          {!isSignedIn && (
            <div style={{
              background: '#1f2937',
              borderRadius: '0.75rem',
              padding: '2rem',
              border: '4px solid rgba(255, 130, 0, 0.2)',
              marginTop: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <User style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200', margin: 0 }}>
                  Create Your Full Uproar Account
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {[
                  { icon: <Truck style={{ width: '1.25rem', height: '1.25rem', color: '#FF8200' }} />, text: 'Track orders in real-time' },
                  { icon: <Zap style={{ width: '1.25rem', height: '1.25rem', color: '#FF8200' }} />, text: 'Faster checkout next time' },
                  { icon: <ShieldCheck style={{ width: '1.25rem', height: '1.25rem', color: '#FF8200' }} />, text: 'Exclusive member deals' },
                  { icon: <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#FF8200' }} />, text: 'Order history & reorders' },
                ].map((benefit, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {benefit.icon}
                    <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{benefit.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/sign-up?redirect_url=/account"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#FF8200',
                  color: '#111827',
                  fontWeight: 900,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Create Account <ArrowRight style={{ width: '1rem', height: '1rem' }} />
              </Link>
            </div>
          )}

          {/* Newsletter CTA */}
          <div style={{ marginTop: '2rem' }}>
            <EmailCapture
              variant="card"
              source="order-confirmation"
              heading="Get first dibs on new games"
              subtext="Exclusive deals, new game launches, and chaos-worthy updates. Straight to your inbox."
              prefillEmail={order?.customerEmail}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>
            <FuglyLogo size={100} />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF8200' }}>Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
