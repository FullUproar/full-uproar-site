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
  Truck,
  DollarSign,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

/**
 * Fulfillment Page - Mobile-First
 * ================================
 * Barcode scanner-based order fulfillment workflow.
 * Optimized for Android phones with Bluetooth scanners.
 *
 * The scanner acts like a keyboard - it types the barcode then presses Enter.
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

interface FulfillmentPackage {
  id: number;
  boxNumber: number;
  packagingType: PackagingType;
  items: { name: string; quantity: number; scanId: number }[];
}

interface ScanItem {
  scanId: number;
  name: string;
  quantity: number;
}

interface PackageData {
  id: number;
  boxNumber: number;
  packagingType: PackagingType;
  items: ScanItem[];
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
  packages: PackageData[];
  unassignedScans: ScanItem[];
  progress: {
    total: number;
    scanned: number;
    percentage: number;
    isComplete: boolean;
  };
}

interface ShippingRate {
  carrier: string;
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
}

interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string; // base64 PDF
  cost: number;
  shipmentId: number;
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

  // Shipping label state
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [shippingLabel, setShippingLabel] = useState<ShippingLabel | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

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
      if (scanInputRef.current && !showCompleteModal && !showShippingModal) {
        scanInputRef.current.focus();
      }
    };

    focusInput();
    const interval = setInterval(focusInput, 1000);
    return () => clearInterval(interval);
  }, [showCompleteModal, showShippingModal]);

  // Handle barcode scan
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

      // Play sound feedback
      if (result.success) {
        playSound('success');

        // If it was a packaging scan, update the selected packaging
        if (result.isPackaging) {
          // For multi-box: result.package contains the new package info
          if (result.package?.packagingType) {
            setSelectedPackaging(result.package.packagingType.id);
          } else if (result.packagingType) {
            // Legacy single-box response
            setSelectedPackaging(result.packagingType.id);
          }
        }
      } else {
        playSound('error');
      }

      // Refresh data after scan
      fetchData();
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

  // Parse shipping address for rate calculation
  const parseAddress = (addressString: string) => {
    const parts = addressString.split(',').map(s => s.trim());
    if (parts.length >= 4) {
      const stateZip = parts[2].split(' ').filter(Boolean);
      return {
        street1: parts[0],
        city: parts[1],
        state: stateZip[0] || '',
        postalCode: stateZip.slice(1).join(' ') || '',
        country: parts[3] || 'US',
      };
    }
    return { street1: addressString, city: '', state: '', postalCode: '', country: 'US' };
  };

  // Calculate total package weight (rough estimate)
  const calculateWeight = () => {
    // Base weight from packaging
    const packagingWeight = data?.packages?.reduce((sum, pkg) => {
      return sum + (pkg.packagingType.material === 'Cardboard' ? 0.5 : 0.25);
    }, 0) || 0.5;
    // Add item weights (estimate 1 lb per item)
    const itemWeight = data?.progress.total || 1;
    return packagingWeight + itemWeight;
  };

  // Fetch shipping rates
  const fetchShippingRates = async () => {
    if (!data) return;

    setLoadingRates(true);
    setShippingError(null);
    setShippingRates([]);
    setSelectedRate(null);

    try {
      const address = parseAddress(data.order.shippingAddress);
      const weight = calculateWeight();

      // Get dimensions from the largest package
      const largestPkg = data.packages?.reduce((largest, pkg) => {
        const vol = pkg.packagingType.length * pkg.packagingType.width * pkg.packagingType.height;
        const largestVol = largest ? largest.packagingType.length * largest.packagingType.width * largest.packagingType.height : 0;
        return vol > largestVol ? pkg : largest;
      }, null as PackageData | null);

      const res = await fetch('/api/admin/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight,
          dimensions: largestPkg ? {
            length: largestPkg.packagingType.length,
            width: largestPkg.packagingType.width,
            height: largestPkg.packagingType.height,
          } : undefined,
          toAddress: address,
        }),
      });

      const result = await res.json();

      if (result.success && result.rates?.length > 0) {
        setShippingRates(result.rates);
        // Auto-select cheapest rate
        setSelectedRate(result.rates[0]);
      } else {
        setShippingError(result.error || 'No shipping rates available. ShipStation may not be configured.');
      }
    } catch (err) {
      setShippingError('Failed to fetch shipping rates');
    } finally {
      setLoadingRates(false);
    }
  };

  // Generate shipping label
  const generateLabel = async () => {
    if (!selectedRate || !data) return;

    setGeneratingLabel(true);
    setShippingError(null);

    try {
      const weight = calculateWeight();
      const largestPkg = data.packages?.[0];

      const res = await fetch('/api/admin/shipping/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          carrierCode: selectedRate.carrier,
          serviceCode: selectedRate.serviceCode,
          packageCode: 'package', // Default package type
          weight,
          dimensions: largestPkg ? {
            length: largestPkg.packagingType.length,
            width: largestPkg.packagingType.width,
            height: largestPkg.packagingType.height,
          } : undefined,
        }),
      });

      const result = await res.json();

      if (result.success && result.label) {
        setShippingLabel(result.label);

        // Mark fulfillment as completed
        await fetch('/api/admin/fulfillment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: 'completed' }),
        });
      } else {
        setShippingError(result.error || 'Failed to generate label');
      }
    } catch (err) {
      setShippingError('Failed to generate shipping label');
    } finally {
      setGeneratingLabel(false);
    }
  };

  // Print/download label
  const printLabel = () => {
    if (!shippingLabel?.labelUrl) return;

    // labelUrl is base64 encoded PDF
    const linkSource = `data:application/pdf;base64,${shippingLabel.labelUrl}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = linkSource;
    downloadLink.download = `label-${orderId.slice(0, 8)}-${shippingLabel.trackingNumber}.pdf`;
    downloadLink.click();
  };

  // Open shipping modal when clicking complete
  const handleCompleteClick = () => {
    if (!data?.packages || data.packages.length === 0) {
      alert('Please scan packaging to create at least one box before completing');
      return;
    }

    if (data.unassignedScans && data.unassignedScans.length > 0) {
      alert('Some items are not assigned to a box. Scan packaging to assign them.');
      return;
    }

    // Open shipping modal and fetch rates
    setShowShippingModal(true);
    setShippingLabel(null);
    fetchShippingRates();
  };

  // Complete without label (skip shipping)
  const completeWithoutLabel = async () => {
    setCompleting(true);
    try {
      await fetch('/api/admin/fulfillment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'completed' }),
      });
      router.push(`/admin/orders/${orderId}`);
    } catch (err) {
      console.error('Failed to complete fulfillment');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={40} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '2rem' }}>
          <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'Order not found'}</h2>
          <button onClick={() => router.push('/admin')} style={styles.button}>
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header - compact on mobile */}
      <div style={styles.header}>
        <button onClick={() => router.push('/admin')} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={styles.title}>Fulfill Order</h1>
          <p style={styles.subtitle}>
            {data.order.customerName} • #{data.order.id.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
            {data.progress.scanned}/{data.progress.total} items
          </span>
          <span style={{
            color: data.progress.isComplete ? '#10b981' : '#f97316',
            fontWeight: 700,
            fontSize: '18px',
          }}>
            {data.progress.percentage}%
          </span>
        </div>
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${data.progress.percentage}%`,
            background: data.progress.isComplete ? '#10b981' : '#f97316',
          }} />
        </div>
      </div>

      {/* Scanner Input - large and prominent */}
      <div style={styles.scanCard}>
        <div style={styles.scanHeader}>
          <Scan size={24} style={{ color: '#f97316' }} />
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Scan Barcode</span>
        </div>
        <input
          ref={scanInputRef}
          type="text"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleScan(scanInput);
          }}
          placeholder="Tap here, then scan..."
          style={styles.scanInput}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />

        {/* Last Scan Result */}
        {lastScanResult && (
          <div style={{
            ...styles.scanResult,
            background: lastScanResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderColor: lastScanResult.success ? '#10b981' : '#ef4444',
          }}>
            {lastScanResult.success ? (
              <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            ) : (
              <XCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            )}
            <span style={{
              color: lastScanResult.success ? '#10b981' : '#ef4444',
              fontWeight: 500,
            }}>
              {lastScanResult.message}
            </span>
          </div>
        )}
      </div>

      {/* Item Checklist - simplified for mobile */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Items to Pack</h3>
        <div style={styles.itemList}>
          {data.checklist.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.itemRow,
                background: item.isComplete ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                borderColor: item.isComplete ? '#10b981' : '#222',
              }}
            >
              {/* Status */}
              <div style={{
                ...styles.itemStatus,
                background: item.isComplete ? '#10b981' : '#1a1a1a',
              }}>
                {item.isComplete ? (
                  <CheckCircle2 size={18} style={{ color: '#fff' }} />
                ) : (
                  <span style={{ color: '#f97316', fontWeight: 700, fontSize: '12px' }}>
                    {item.scannedQuantity}/{item.quantity}
                  </span>
                )}
              </div>

              {/* Item Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  color: item.isComplete ? '#10b981' : '#e2e8f0',
                  textDecoration: item.isComplete ? 'line-through' : 'none',
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.name}
                  {item.size && <span style={{ color: '#64748b' }}> ({item.size})</span>}
                </div>
                {item.sku && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {item.sku}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: item.isComplete ? '#10b981' : '#f97316',
              }}>
                ×{item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unassigned Items - items scanned but not yet in a box */}
      {data.unassignedScans && data.unassignedScans.length > 0 && (
        <div style={{
          ...styles.card,
          borderColor: '#f59e0b',
          background: 'rgba(245, 158, 11, 0.05)',
        }}>
          <h3 style={{ ...styles.cardTitle, color: '#f59e0b' }}>
            <Package size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Unassigned Items ({data.unassignedScans.length})
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
            Scan a packaging barcode to assign these items to a box
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.unassignedScans.map((item) => (
              <div key={item.scanId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: '#1a1a1a',
                borderRadius: '6px',
                fontSize: '14px',
              }}>
                <span style={{ color: '#e2e8f0', flex: 1 }}>{item.name}</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>×{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boxes - Multi-box shipment display */}
      {data.packages && data.packages.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <Box size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Boxes ({data.packages.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.packages.map((pkg) => (
              <div key={pkg.id} style={{
                padding: '12px',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}>
                      BOX {pkg.boxNumber}
                    </span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {pkg.packagingType.sku}
                    </span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {pkg.items.length} item{pkg.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {pkg.items.map((item) => (
                    <div key={item.scanId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      background: '#0a0a0a',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ color: '#94a3b8', flex: 1 }}>{item.name}</span>
                      <span style={{ color: '#64748b' }}>×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packaging Status - show when no boxes yet */}
      {(!data.packages || data.packages.length === 0) && (
        <div style={{
          ...styles.card,
          borderColor: selectedPackaging ? '#10b981' : '#333',
          background: selectedPackaging ? 'rgba(16, 185, 129, 0.05)' : '#111',
        }}>
          <h3 style={styles.cardTitle}>
            <Box size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Packaging
          </h3>
          <div style={{
            padding: '16px',
            background: '#1a1a1a',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px dashed #333',
          }}>
            <Scan size={24} style={{ color: '#f97316', marginBottom: '8px' }} />
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Scan packaging barcode to close a box</div>
          </div>
        </div>
      )}

      {/* BIG Complete Button - visible when all items scanned AND all items in boxes */}
      {data.progress.isComplete && data.packages && data.packages.length > 0 &&
       (!data.unassignedScans || data.unassignedScans.length === 0) && (
        <button
          onClick={handleCompleteClick}
          disabled={completing}
          style={{
            width: '100%',
            padding: '24px',
            fontSize: '20px',
            fontWeight: 700,
            background: completing ? '#333' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: completing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {completing ? (
            <>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </>
          ) : (
            <>
              <Truck size={28} />
              COMPLETE & SHIP
            </>
          )}
        </button>
      )}

      {/* Status message when not ready */}
      {(!data.progress.isComplete || !data.packages || data.packages.length === 0 ||
        (data.unassignedScans && data.unassignedScans.length > 0)) && (
        <div style={{
          ...styles.card,
          textAlign: 'center',
          padding: '20px',
          background: '#1a1a1a',
        }}>
          {!data.progress.isComplete ? (
            <p style={{ color: '#f97316', margin: 0, fontSize: '15px' }}>
              Scan {data.progress.total - data.progress.scanned} more item{data.progress.total - data.progress.scanned !== 1 ? 's' : ''}
            </p>
          ) : data.unassignedScans && data.unassignedScans.length > 0 ? (
            <p style={{ color: '#f59e0b', margin: 0, fontSize: '15px' }}>
              Scan packaging to assign {data.unassignedScans.length} item{data.unassignedScans.length !== 1 ? 's' : ''} to a box
            </p>
          ) : (
            <p style={{ color: '#f59e0b', margin: 0, fontSize: '15px' }}>
              Scan packaging to create a box
            </p>
          )}
        </div>
      )}

      {/* Shipping Modal - full screen on mobile */}
      {showShippingModal && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={24} style={{ color: '#f97316' }} />
                {shippingLabel ? 'Label Ready!' : 'Create Shipping Label'}
              </h2>
              {!shippingLabel && (
                <button
                  onClick={() => setShowShippingModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Shipping Address */}
            <div style={{ background: '#1a1a1a', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>SHIP TO</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{data.order.customerName}</div>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>{data.order.shippingAddress}</div>
            </div>

            {/* Label Generated - Show success state */}
            {shippingLabel && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '16px' }} />

                <div style={{ background: '#0f2419', border: '1px solid #10b981', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                    Tracking Number
                  </div>
                  <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '16px', wordBreak: 'break-all' }}>
                    {shippingLabel.trackingNumber}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={printLabel}
                    style={{
                      ...styles.primaryButton,
                      width: '100%',
                      background: '#10b981',
                      padding: '16px',
                      fontSize: '18px',
                    }}
                  >
                    <Download size={20} />
                    Download Label PDF
                  </button>

                  <button
                    onClick={() => router.push(`/admin/orders/${orderId}`)}
                    style={{ ...styles.secondaryButton, width: '100%' }}
                  >
                    <CheckCircle2 size={18} />
                    Done - View Order
                  </button>
                </div>
              </div>
            )}

            {/* Loading Rates */}
            {!shippingLabel && loadingRates && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Loader2 size={40} style={{ color: '#f97316', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
                <div style={{ color: '#94a3b8' }}>Fetching shipping rates...</div>
              </div>
            )}

            {/* Error State */}
            {!shippingLabel && shippingError && !loadingRates && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <AlertCircle size={40} style={{ color: '#f59e0b', marginBottom: '12px' }} />
                <div style={{ color: '#f59e0b', marginBottom: '16px' }}>{shippingError}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={fetchShippingRates} style={styles.secondaryButton}>
                    <RefreshCw size={16} />
                    Try Again
                  </button>
                  <button
                    onClick={completeWithoutLabel}
                    disabled={completing}
                    style={{ ...styles.secondaryButton, color: '#64748b' }}
                  >
                    {completing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Complete Without Label
                  </button>
                </div>
              </div>
            )}

            {/* Rate Selection */}
            {!shippingLabel && !loadingRates && shippingRates.length > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Select Shipping Service
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflow: 'auto' }}>
                    {shippingRates.map((rate, idx) => (
                      <button
                        key={`${rate.carrier}-${rate.serviceCode}-${idx}`}
                        onClick={() => setSelectedRate(rate)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: selectedRate?.serviceCode === rate.serviceCode && selectedRate?.carrier === rate.carrier
                            ? 'rgba(249, 115, 22, 0.15)'
                            : '#1a1a1a',
                          border: selectedRate?.serviceCode === rate.serviceCode && selectedRate?.carrier === rate.carrier
                            ? '2px solid #f97316'
                            : '1px solid #333',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div>
                          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>
                            {rate.serviceName}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                            {rate.carrier}
                          </div>
                        </div>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
                          ${(rate.shipmentCost + (rate.otherCost || 0)).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Label Button */}
                <button
                  onClick={generateLabel}
                  disabled={!selectedRate || generatingLabel}
                  style={{
                    ...styles.primaryButton,
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    opacity: (!selectedRate || generatingLabel) ? 0.5 : 1,
                    cursor: (!selectedRate || generatingLabel) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generatingLabel ? (
                    <>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      Generating Label...
                    </>
                  ) : (
                    <>
                      <Printer size={20} />
                      Generate Label {selectedRate ? `($${(selectedRate.shipmentCost + (selectedRate.otherCost || 0)).toFixed(2)})` : ''}
                    </>
                  )}
                </button>

                {/* Skip option */}
                <button
                  onClick={completeWithoutLabel}
                  disabled={completing}
                  style={{
                    ...styles.secondaryButton,
                    width: '100%',
                    marginTop: '12px',
                    color: '#64748b',
                    fontSize: '13px',
                  }}
                >
                  Skip - Complete Without Label
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Mobile-first styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    padding: '16px',
    paddingBottom: '100px', // Extra space for scrolling
  },
  loadingContainer: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#94a3b8',
    padding: '10px',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#e2e8f0',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },

  // Progress
  progressCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressBar: {
    height: '8px',
    background: '#1a1a1a',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },

  // Scan
  scanCard: {
    background: '#111',
    border: '2px solid #f97316',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  scanHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  scanInput: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e2e8f0',
    boxSizing: 'border-box',
  },
  scanResult: {
    marginTop: '12px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  // Cards
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Items
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #222',
  },
  itemStatus: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Packaging
  packagingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  packagingButton: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #333',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'center',
    minHeight: '60px',
  },

  // Buttons
  button: {
    padding: '12px 20px',
    minHeight: '44px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  primaryButton: {
    padding: '14px 24px',
    minHeight: '48px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  secondaryButton: {
    padding: '14px 20px',
    minHeight: '48px',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #333',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  // Modal
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000,
  },
  modalContent: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  modalPackaging: {
    background: '#1a1a1a',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
  },
};
