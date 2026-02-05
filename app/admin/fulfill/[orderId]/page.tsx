'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  Scan,
  Loader2,
  Box,
  Printer,
  AlertCircle,
  Undo2,
} from 'lucide-react';
import { adminStyles } from '../../styles/adminStyles';

/**
 * Fulfillment Page
 * ================
 * Barcode scanner-based order fulfillment workflow.
 *
 * ⚠️ AI MAINTAINER NOTE:
 * This page is designed for bluetooth barcode scanners.
 * The scanner acts like a keyboard - it types the barcode then presses Enter.
 * The hidden input field captures these scans.
 */

interface OrderItem {
  id: number;
  itemType: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  size: string | null;
  quantity: number;
  scannedQuantity: number;
  isComplete: boolean;
}

interface PackagingType {
  id: number;
  sku: string;
  name: string;
  length: number;
  width: number;
  height: number;
  material: string;
}

interface FulfillmentData {
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    status: string;
    shippingAddress: string;
    createdAt: string;
  };
  fulfillment: any;
  packagingType: PackagingType | null;
  checklist: OrderItem[];
  progress: {
    total: number;
    scanned: number;
    percentage: number;
    isComplete: boolean;
  };
}

export default function FulfillPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [data, setData] = useState<FulfillmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [selectedPackaging, setSelectedPackaging] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Fetch fulfillment data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/fulfillment?orderId=${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      if (json.packagingType) {
        setSelectedPackaging(json.packagingType.id);
      }
    } catch (err) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Fetch packaging types
  const fetchPackagingTypes = async () => {
    try {
      const res = await fetch('/api/admin/packaging?active=true');
      if (res.ok) {
        const types = await res.json();
        setPackagingTypes(types);
      }
    } catch (err) {
      console.error('Failed to fetch packaging types');
    }
  };

  // Start fulfillment session
  const startFulfillment = async () => {
    try {
      await fetch('/api/admin/fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to start fulfillment');
    }
  };

  useEffect(() => {
    fetchData();
    fetchPackagingTypes();
  }, [fetchData]);

  // Auto-start fulfillment if not started
  useEffect(() => {
    if (data && !data.fulfillment) {
      startFulfillment();
    }
  }, [data]);

  // Keep focus on scan input
  useEffect(() => {
    const focusInput = () => {
      if (scanInputRef.current && !showCompleteModal) {
        scanInputRef.current.focus();
      }
    };

    focusInput();
    const interval = setInterval(focusInput, 1000);
    return () => clearInterval(interval);
  }, [showCompleteModal]);

  // Handle barcode scan (from input)
  const handleScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const res = await fetch('/api/admin/fulfillment/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, barcode: barcode.trim() }),
      });

      const result = await res.json();
      setLastScanResult(result);

      // Refresh data
      fetchData();

      // Play sound feedback
      if (result.success) {
        playSound('success');
        if (result.orderComplete) {
          setShowCompleteModal(true);
        }
      } else {
        playSound('error');
      }
    } catch (err) {
      setLastScanResult({ success: false, message: 'Scan failed' });
      playSound('error');
    }

    setScanInput('');
  };

  // Simple sound feedback
  const playSound = (type: 'success' | 'error') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'success') {
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
      } else {
        oscillator.frequency.value = 300;
        oscillator.type = 'square';
      }

      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio not supported
    }
  };

  // Update packaging selection
  const handlePackagingChange = async (packagingTypeId: number) => {
    setSelectedPackaging(packagingTypeId);
    try {
      await fetch('/api/admin/fulfillment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, packagingTypeId }),
      });
    } catch (err) {
      console.error('Failed to update packaging');
    }
  };

  // Complete fulfillment
  const completeFulfillment = async () => {
    if (!selectedPackaging) {
      alert('Please select packaging before completing');
      return;
    }

    setCompleting(true);
    try {
      await fetch('/api/admin/fulfillment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'completed' }),
      });

      // Redirect to shipping label or order page
      router.push(`/admin/orders/${orderId}`);
    } catch (err) {
      console.error('Failed to complete fulfillment');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...adminStyles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={48} style={{ color: '#FF8200', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={adminStyles.container}>
        <div style={{ ...adminStyles.card, textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ color: '#ef4444' }}>{error || 'Order not found'}</h2>
          <button
            onClick={() => router.push('/admin')}
            style={{ ...adminStyles.button, marginTop: '1rem' }}
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.push('/admin')}
          style={adminStyles.backButton}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ ...adminStyles.title, margin: 0 }}>
            <Package size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Fulfill Order
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            {data.order.customerName} • {data.order.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ ...adminStyles.card, marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#FBDB65', fontWeight: 600 }}>
            Progress: {data.progress.scanned}/{data.progress.total} items
          </span>
          <span style={{ color: data.progress.isComplete ? '#10b981' : '#FF8200', fontWeight: 700 }}>
            {data.progress.percentage}%
          </span>
        </div>
        <div style={{
          height: '12px',
          background: 'rgba(255, 130, 0, 0.2)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${data.progress.percentage}%`,
            background: data.progress.isComplete
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #FF8200, #fb923c)',
            transition: 'width 0.3s ease',
            borderRadius: '6px',
          }} />
        </div>
      </div>

      {/* Scanner Input (hidden but captures keyboard) */}
      <div style={{ ...adminStyles.card, marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Scan size={32} style={{ color: '#FF8200' }} />
          <div style={{ flex: 1 }}>
            <label style={{ ...adminStyles.label, marginBottom: '0.5rem', display: 'block' }}>
              Scan Barcode
            </label>
            <input
              ref={scanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan(scanInput);
                }
              }}
              placeholder="Click here and scan..."
              style={{
                ...adminStyles.input,
                fontSize: '1.25rem',
                padding: '0.75rem 1rem',
              }}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '8px',
            background: lastScanResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${lastScanResult.success ? '#10b981' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {lastScanResult.success ? (
              <CheckCircle2 size={24} style={{ color: '#10b981' }} />
            ) : (
              <XCircle size={24} style={{ color: '#ef4444' }} />
            )}
            <span style={{ color: lastScanResult.success ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {lastScanResult.message}
            </span>
          </div>
        )}
      </div>

      {/* Item Checklist */}
      <div style={{ ...adminStyles.card, marginBottom: '1.5rem' }}>
        <h3 style={{ ...{ fontSize: '1.125rem', fontWeight: 700, color: '#FBDB65' }, marginBottom: '1rem' }}>
          Items to Pack
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.checklist.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: item.isComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 130, 0, 0.05)',
                borderRadius: '8px',
                border: `2px solid ${item.isComplete ? '#10b981' : 'rgba(255, 130, 0, 0.2)'}`,
              }}
            >
              {/* Status Icon */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: item.isComplete ? '#10b981' : 'rgba(255, 130, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.isComplete ? (
                  <CheckCircle2 size={24} style={{ color: '#fff' }} />
                ) : (
                  <span style={{ color: '#FF8200', fontWeight: 700 }}>
                    {item.scannedQuantity}/{item.quantity}
                  </span>
                )}
              </div>

              {/* Item Image */}
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    opacity: item.isComplete ? 0.7 : 1,
                  }}
                />
              )}

              {/* Item Details */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  color: item.isComplete ? '#10b981' : '#FBDB65',
                  textDecoration: item.isComplete ? 'line-through' : 'none',
                }}>
                  {item.name}
                  {item.size && <span style={{ color: '#94a3b8' }}> ({item.size})</span>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {item.sku && <span>SKU: {item.sku}</span>}
                  {item.barcode && <span style={{ marginLeft: '1rem' }}>Barcode: {item.barcode}</span>}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.isComplete ? '#10b981' : '#FF8200' }}>
                  ×{item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Packaging Selection */}
      <div style={{ ...adminStyles.card, marginBottom: '1.5rem' }}>
        <h3 style={{ ...{ fontSize: '1.125rem', fontWeight: 700, color: '#FBDB65' }, marginBottom: '1rem' }}>
          <Box size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Select Packaging
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {packagingTypes.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePackagingChange(pkg.id)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${selectedPackaging === pkg.id ? '#FF8200' : 'rgba(255, 130, 0, 0.2)'}`,
                background: selectedPackaging === pkg.id ? 'rgba(255, 130, 0, 0.1)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 700, color: '#FBDB65', marginBottom: '0.25rem' }}>
                {pkg.sku}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                {pkg.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                {pkg.length}" × {pkg.width}" × {pkg.height}" • {pkg.material}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Complete Button */}
      {data.progress.isComplete && (
        <div style={{ ...adminStyles.card, padding: '1.5rem', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>All Items Scanned!</h3>
          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={!selectedPackaging}
            style={{
              ...adminStyles.primaryButton,
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              opacity: selectedPackaging ? 1 : 0.5,
              cursor: selectedPackaging ? 'pointer' : 'not-allowed',
            }}
          >
            <Printer size={20} style={{ marginRight: '0.5rem' }} />
            Complete & Print Label
          </button>
          {!selectedPackaging && (
            <p style={{ color: '#f59e0b', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Please select packaging first
            </p>
          )}
        </div>
      )}

      {/* Completion Modal */}
      {showCompleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            ...adminStyles.card,
            maxWidth: '500px',
            width: '90%',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1rem' }} />
            <h2 style={{ color: '#FBDB65', marginBottom: '0.5rem' }}>Order Ready!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              All items have been scanned and verified.
            </p>

            <div style={{
              background: 'rgba(255, 130, 0, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}>
              <div style={{ color: '#FBDB65', fontWeight: 600 }}>
                Packaging: {packagingTypes.find(p => p.id === selectedPackaging)?.sku}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                {packagingTypes.find(p => p.id === selectedPackaging)?.name}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCompleteModal(false)}
                style={adminStyles.outlineButton}
              >
                <Undo2 size={18} style={{ marginRight: '0.5rem' }} />
                Go Back
              </button>
              <button
                onClick={completeFulfillment}
                disabled={completing}
                style={{
                  ...adminStyles.primaryButton,
                  opacity: completing ? 0.5 : 1,
                }}
              >
                {completing ? (
                  <Loader2 size={18} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Printer size={18} style={{ marginRight: '0.5rem' }} />
                )}
                Complete & Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
