'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import FuglyLogo from '@/app/components/FuglyLogo';
import Link from 'next/link';

interface OrderDetails {
  id: string;
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
    note?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function TrackOrderPage() {
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Try searching by order ID first
      let response = await fetch(`/api/orders/${searchValue.trim()}`);
      
      if (!response.ok) {
        // If not found by ID, try searching by email
        response = await fetch(`/api/orders?email=${encodeURIComponent(searchValue.trim())}`);
        if (response.ok) {
          const orders = await response.json();
          if (orders.length > 0) {
            // Show the most recent order
            setOrder(orders[0]);
          } else {
            setError('No orders found with that email address');
          }
        } else {
          setError('Order not found. Check your order ID or email.');
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
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'processing':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400';
      case 'delivered':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-600">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-md border-b-4 border-orange-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <FuglyLogo size={60} />
              <div>
                <h1 className="text-2xl font-black text-orange-500">TRACK YOUR CHAOS</h1>
                <p className="text-sm text-yellow-400 font-bold">Where's my stuff, Fugly?</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Form */}
        <div className="bg-gray-800 rounded-xl p-8 border-4 border-orange-500/20 mb-8">
          <h2 className="text-3xl font-black text-orange-500 mb-6 text-center">
            HUNT DOWN YOUR ORDER
          </h2>
          
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Enter your order ID or email"
                className="w-full px-6 py-4 pr-14 bg-gray-700 text-white rounded-lg text-lg
                         focus:outline-none focus:ring-4 focus:ring-orange-500/50
                         placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 
                         hover:bg-orange-600 rounded-lg transition-colors disabled:bg-gray-600"
              >
                <Search className="h-6 w-6 text-gray-900" />
              </button>
            </div>
            
            {error && (
              <p className="text-red-400 text-center mt-4 font-bold">{error}</p>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 animate-spin" style={{ width: 'fit-content' }}>
              <FuglyLogo size={80} />
            </div>
            <p className="text-xl font-bold text-orange-500">Searching the chaos realm...</p>
          </div>
        )}

        {/* Order Details */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black text-yellow-400">Order #{order.id}</h3>
                  <p className="text-gray-400 mt-1">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold ${getStatusColor(order.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="uppercase">{order.status}</span>
                  </div>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Tracking Number:</p>
                  <p className="font-mono font-bold text-orange-500">{order.trackingNumber}</p>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              <h4 className="text-xl font-black text-orange-500 mb-6">Chaos Progress</h4>
              
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${index === 0 ? 'bg-orange-500' : 'bg-gray-700'}`}>
                        {getStatusIcon(history.status)}
                      </div>
                      {index < order.statusHistory.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-700 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="font-bold text-yellow-400 capitalize">{history.status}</p>
                      {history.note && (
                        <p className="text-gray-400 text-sm mt-1">{history.note}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">{formatDate(history.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              <h4 className="text-xl font-black text-orange-500 mb-4">Order Contents</h4>
              
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-3 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="font-bold text-yellow-400">
                        {item.itemType === 'game' ? item.game?.title : item.merch?.name}
                      </p>
                      {item.merchSize && (
                        <p className="text-sm text-gray-400">Size: {item.merchSize}</p>
                      )}
                      <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-white">
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-xl font-black text-orange-500">Total Chaos</span>
                  <span className="text-xl font-black text-white">
                    ${(order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              <h4 className="text-xl font-black text-orange-500 mb-4">Delivery Details</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Delivering to:</p>
                  <p className="text-yellow-400 font-bold">{order.customerName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Address:</p>
                  <p className="text-white">{order.shippingAddress}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Email:</p>
                  <p className="text-white">{order.customerEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}