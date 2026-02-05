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
  MoveRight,
  Trash2,
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

  // Complete fulfillment
  const completeFulfillment = async () => {
    if (!data?.packages || data.packages.length === 0) {
      alert('Please scan packaging to create at least one box before completing');
      return;
    }

    if (data.unassignedScans && data.unassignedScans.length > 0) {
      alert('Some items are not assigned to a box. Scan packaging to assign them.');
      return;
    }

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
          onClick={completeFulfillment}
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
              <Printer size={28} />
              COMPLETE & PRINT LABEL
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

      {/* Completion Modal - full screen on mobile */}
      {showCompleteModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <CheckCircle2 size={56} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h2 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Order Ready!</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              All items verified.
            </p>

            <div style={styles.modalPackaging}>
              <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                {packagingTypes.find(p => p.id === selectedPackaging)?.sku}
              </div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>
                {packagingTypes.find(p => p.id === selectedPackaging)?.name}
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button onClick={() => setShowCompleteModal(false)} style={styles.secondaryButton}>
                <Undo2 size={18} />
                Go Back
              </button>
              <button
                onClick={completeFulfillment}
                disabled={completing}
                style={{
                  ...styles.primaryButton,
                  flex: 1,
                  opacity: completing ? 0.5 : 1,
                }}
              >
                {completing ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Printer size={18} />
                )}
                Print Label
              </button>
            </div>
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
