'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Truck, Mail, ArrowRight, Copy } from 'lucide-react';
import FuglyLogo from '@/app/components/FuglyLogo';
import Link from 'next/link';
import { MetaPixelEvents } from '@/app/components/MetaPixel';

interface OrderDetails {
  id: string;
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
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    fetchOrder();
  }, [orderId, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Order not found');
      const data = await response.json();
      setOrder(data);
      
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

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 animate-bounce">
            <FuglyLogo size={100} />
          </div>
          <p className="text-2xl font-black text-orange-500">Loading your chaos...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const subtotal = order.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-600">
      {/* Confetti effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div
              className={`w-3 h-3 ${i % 3 === 0 ? 'bg-orange-500' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-red-500'} rounded-full`}
              style={{ transform: `rotate(${Math.random() * 360}deg)` }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            
            <h1 className="text-5xl font-black text-white mb-4">
              CHAOS INCOMING!
            </h1>
            
            <p className="text-2xl text-yellow-400 font-bold mb-2">
              Your order has been placed successfully
            </p>
            
            <div className="inline-flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 mt-4">
              <span className="text-gray-400">Order ID:</span>
              <span className="text-orange-500 font-mono font-bold">{orderId}</span>
              <button
                onClick={copyOrderId}
                className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <Copy className="h-4 w-4 text-gray-400" />
              </button>
              {copied && (
                <span className="text-green-400 text-sm ml-2">Copied!</span>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Delivery Info */}
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              <h2 className="text-xl font-black text-orange-500 mb-4 flex items-center gap-2">
                <Truck className="h-6 w-6" />
                Delivery Details
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Delivering to:</p>
                  <p className="text-yellow-400 font-bold">{order.customerName}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Shipping address:</p>
                  <p className="text-white">{order.shippingAddress}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Email:</p>
                  <p className="text-white">{order.customerEmail}</p>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">Estimated delivery:</p>
                  <p className="text-yellow-400 font-bold">5-7 business days of pure chaos</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              <h2 className="text-xl font-black text-orange-500 mb-4 flex items-center gap-2">
                <Package className="h-6 w-6" />
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-yellow-400">
                        {item.itemType === 'game' ? item.game?.title : item.merch?.name}
                      </p>
                      {item.merchSize && (
                        <p className="text-sm text-gray-400">Size: {item.merchSize}</p>
                      )}
                      <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-white">
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 border-t border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">
                    {order.shippingCents === 0 ? 'FREE' : `$${(order.shippingCents / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-white">${(order.taxCents / 100).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-700 pt-4">
                  <span className="text-xl font-black text-orange-500">Total</span>
                  <span className="text-xl font-black text-white">
                    ${(order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gray-800 rounded-xl p-8 border-4 border-orange-500/20 text-center">
            <div className="mx-auto mb-4" style={{ width: 'fit-content' }}>
              <FuglyLogo size={80} />
            </div>
            
            <h2 className="text-2xl font-black text-orange-500 mb-4">
              What Happens Next?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-yellow-400 font-bold mb-1">Step 1</p>
                <p className="text-gray-400">You'll receive a confirmation email from Fugly himself</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-yellow-400 font-bold mb-1">Step 2</p>
                <p className="text-gray-400">We'll pack your order with extra chaos and care</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-yellow-400 font-bold mb-1">Step 3</p>
                <p className="text-gray-400">Track your shipment as it spreads chaos across the land</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-gray-900 font-black px-8 py-4 rounded-lg transition-all transform hover:scale-105"
              >
                Continue Shopping
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                href="/track-order"
                className="inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-black px-8 py-4 rounded-lg transition-all"
              >
                Track Your Order
                <Truck className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-600 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 animate-bounce">
            <FuglyLogo size={100} />
          </div>
          <p className="text-2xl font-black text-orange-500">Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}