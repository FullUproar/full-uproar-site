'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Printer, Scale, Truck, CheckCircle, 
  AlertCircle, ChevronRight, Search, Filter,
  Download, RefreshCw, MapPin, DollarSign,
  Clock, Box, Tag, Send, X, Copy
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    sku?: string;
  }>;
  totalCents: number;
  status: string;
  trackingNumber?: string;
  createdAt: string;
  weight?: number;
}

interface ShippingRate {
  carrier: string;
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
  deliveryDays?: number;
}

export default function FulfillmentCenter({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'shipped'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [packageWeight, setPackageWeight] = useState<number>(1);
  const [packageDimensions, setPackageDimensions] = useState({ length: 10, width: 8, height: 4 });
  const [printingLabel, setPrintingLabel] = useState(false);
  const labelIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let status = 'paid';
      if (activeTab === 'processing') status = 'processing';
      if (activeTab === 'shipped') status = 'shipped';

      const response = await fetch(`/api/admin/orders?status=${status}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingRates = async (order: Order) => {
    try {
      // Parse address for API
      const addressParts = order.shippingAddress.split(',').map(s => s.trim());
      
      const response = await fetch('/api/admin/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: packageWeight,
          dimensions: packageDimensions,
          toAddress: {
            street1: addressParts[0] || '',
            city: addressParts[1] || '',
            state: addressParts[2] || '',
            postalCode: addressParts[3] || '',
            country: 'US',
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShippingRates(data.rates || []);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const generateLabel = async () => {
    if (!selectedOrder || !selectedRate) return;

    setPrintingLabel(true);
    try {
      const response = await fetch('/api/admin/shipping/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          carrierCode: selectedRate.carrier,
          serviceCode: selectedRate.serviceCode,
          packageCode: 'package', // This should be selectable
          weight: packageWeight,
          dimensions: packageDimensions,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Show label for printing
        if (data.label.labelUrl && labelIframeRef.current) {
          // Convert base64 to blob and create URL
          const base64 = data.label.labelUrl.replace('data:application/pdf;base64,', '');
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          // Open in new window for printing
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        }

        // Refresh orders
        fetchOrders();
        setSelectedOrder(null);
        setSelectedRate(null);
      }
    } catch (error) {
      console.error('Error generating label:', error);
    } finally {
      setPrintingLabel(false);
    }
  };

  const bulkPrintPackingSlips = () => {
    // Generate packing slips for selected orders
    console.log('Printing packing slips for:', selectedOrders);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <div
      style={{
        ...adminStyles.card,
        marginBottom: '16px',
        cursor: 'pointer',
        border: selectedOrders.includes(order.id) ? '2px solid #FF8200' : '2px solid rgba(255, 130, 0, 0.2)',
      }}
      onClick={() => setSelectedOrder(order)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={selectedOrders.includes(order.id)}
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.checked) {
                  setSelectedOrders([...selectedOrders, order.id]);
                } else {
                  setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                }
              }}
              style={{ width: '18px', height: '18px' }}
            />
            <h3 style={{ color: '#FBDB65', fontSize: '18px', margin: 0 }}>
              Order #{order.id.slice(-8)}
            </h3>
            {order.trackingNumber && (
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                {order.trackingNumber}
              </span>
            )}
          </div>

          <p style={{ color: '#e2e8f0', marginBottom: '4px' }}>
            <strong>{order.customerName}</strong>
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            {order.shippingAddress}
          </p>

          <div style={{ marginTop: '12px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
              <strong>Items:</strong>
            </p>
            {order.items.map((item, index) => (
              <div key={index} style={{ color: '#e2e8f0', fontSize: '14px', marginLeft: '12px' }}>
                • {item.quantity}x {item.name} {item.sku && `(${item.sku})`}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#FBDB65', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            ${(order.totalCents / 100).toFixed(2)}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#FBDB65', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          📦 Fulfillment Center
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchOrders}
            style={adminStyles.primaryButton}
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          {selectedOrders.length > 0 && (
            <button
              onClick={bulkPrintPackingSlips}
              style={adminStyles.primaryButton}
            >
              <Printer size={20} />
              Print Packing Slips ({selectedOrders.length})
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {(['pending', 'processing', 'shipped'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab ? 'rgba(255, 130, 0, 0.2)' : 'transparent',
              border: '2px solid rgba(255, 130, 0, 0.3)',
              borderRadius: '8px',
              color: activeTab === tab ? '#FBDB65' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: '500',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'pending' && '📋'} 
            {tab === 'processing' && '⚙️'} 
            {tab === 'shipped' && '✅'} 
            {' ' + tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Orders List */}
        <div>
          <h2 style={{ color: '#FBDB65', fontSize: '20px', marginBottom: '16px' }}>
            {activeTab === 'pending' && 'Orders Ready to Ship'}
            {activeTab === 'processing' && 'Orders Being Processed'}
            {activeTab === 'shipped' && 'Shipped Orders'}
          </h2>

          {loading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
              No orders in this status
            </div>
          ) : (
            orders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </div>

        {/* Shipping Label Generator */}
        {selectedOrder && (
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#FBDB65', fontSize: '20px', margin: 0 }}>
                Generate Shipping Label
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Weight and Dimensions */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '12px' }}>
                <Scale size={18} style={{ display: 'inline', marginRight: '8px' }} />
                Package Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '12px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px' }}>Weight (lbs)</label>
                  <input
                    type="number"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(parseFloat(e.target.value))}
                    style={adminStyles.input}
                    step="0.1"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '14px' }}>L (in)</label>
                    <input
                      type="number"
                      value={packageDimensions.length}
                      onChange={(e) => setPackageDimensions({...packageDimensions, length: parseFloat(e.target.value)})}
                      style={adminStyles.input}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '14px' }}>W (in)</label>
                    <input
                      type="number"
                      value={packageDimensions.width}
                      onChange={(e) => setPackageDimensions({...packageDimensions, width: parseFloat(e.target.value)})}
                      style={adminStyles.input}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '14px' }}>H (in)</label>
                    <input
                      type="number"
                      value={packageDimensions.height}
                      onChange={(e) => setPackageDimensions({...packageDimensions, height: parseFloat(e.target.value)})}
                      style={adminStyles.input}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => fetchShippingRates(selectedOrder)}
                style={{ ...adminStyles.primaryButton, marginTop: '12px', width: '100%' }}
              >
                <DollarSign size={18} />
                Get Shipping Rates
              </button>
            </div>

            {/* Shipping Rates */}
            {shippingRates.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '12px' }}>
                  <Truck size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  Select Shipping Method
                </h3>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {shippingRates.map((rate, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedRate(rate)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: selectedRate === rate ? 'rgba(255, 130, 0, 0.2)' : 'rgba(17, 24, 39, 0.5)',
                        border: selectedRate === rate ? '2px solid #FF8200' : '2px solid rgba(255, 130, 0, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ color: '#FBDB65', fontWeight: '500', margin: 0 }}>
                            {rate.carrier.toUpperCase()} - {rate.serviceName}
                          </p>
                          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                            {rate.deliveryDays ? `${rate.deliveryDays} business days` : 'Standard delivery'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                            ${rate.shipmentCost.toFixed(2)}
                          </p>
                          {rate.otherCost > 0 && (
                            <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                              +${rate.otherCost.toFixed(2)} fees
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Label Button */}
            {selectedRate && (
              <button
                onClick={generateLabel}
                disabled={printingLabel}
                style={{
                  ...adminStyles.primaryButton,
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  background: printingLabel ? '#374151' : undefined,
                  cursor: printingLabel ? 'not-allowed' : 'pointer',
                }}
              >
                {printingLabel ? (
                  <>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Generating Label...
                  </>
                ) : (
                  <>
                    <Printer size={20} />
                    Print Label - ${selectedRate.shipmentCost.toFixed(2)}
                  </>
                )}
              </button>
            )}

            {/* Hidden iframe for label printing */}
            <iframe
              ref={labelIframeRef}
              style={{ display: 'none' }}
              title="Shipping Label"
            />
          </div>
        )}
      </div>
    </div>
  );
}