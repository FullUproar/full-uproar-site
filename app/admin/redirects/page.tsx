'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Edit2, Trash2, ExternalLink, Search,
  Link2, QrCode, BarChart3, Copy, Check, Eye, EyeOff, Download
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';
import QRCodeLib from 'qrcode';

interface Redirect {
  id: number;
  slug: string;
  destination: string;
  name: string | null;
  description: string | null;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: string | null;
  createdAt: string;
}

interface RedirectScan {
  id: number;
  scannedAt: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
}

export default function RedirectsAdminPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showScans, setShowScans] = useState<number | null>(null);
  const [scans, setScans] = useState<RedirectScan[]>([]);
  const [scansLoading, setScansLoading] = useState(false);

  // QR Code state
  const [qrModal, setQrModal] = useState<Redirect | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState(300);
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    destination: '',
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchRedirects();
  }, []);

  const fetchRedirects = async () => {
    try {
      const response = await fetch('/api/admin/redirects');
      const data = await response.json();
      setRedirects(data);
    } catch (error) {
      console.error('Error fetching redirects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScans = async (redirectId: number) => {
    setScansLoading(true);
    try {
      const response = await fetch(`/api/admin/redirects/${redirectId}/scans`);
      const data = await response.json();
      setScans(data);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setScansLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingRedirect
      ? `/api/admin/redirects/${editingRedirect.id}`
      : '/api/admin/redirects';

    const method = editingRedirect ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchRedirects();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving redirect:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const response = await fetch(`/api/admin/redirects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRedirects(redirects.filter(r => r.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting redirect:', error);
    }
  };

  const toggleActive = async (redirect: Redirect) => {
    try {
      await fetch(`/api/admin/redirects/${redirect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !redirect.isActive }),
      });
      fetchRedirects();
    } catch (error) {
      console.error('Error toggling redirect:', error);
    }
  };

  const openModal = (redirect?: Redirect) => {
    if (redirect) {
      setEditingRedirect(redirect);
      setFormData({
        slug: redirect.slug,
        destination: redirect.destination,
        name: redirect.name || '',
        description: redirect.description || '',
        isActive: redirect.isActive,
      });
    } else {
      setEditingRedirect(null);
      setFormData({
        slug: '',
        destination: '',
        name: '',
        description: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRedirect(null);
  };

  const copyUrl = (slug: string, id: number) => {
    navigator.clipboard.writeText(`https://fulluproar.com/go/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // QR Code functions
  const generateQR = async (redirect: Redirect) => {
    setQrModal(redirect);
    const url = `https://fulluproar.com/go/${redirect.slug}`;
    try {
      const dataUrl = await QRCodeLib.toDataURL(url, {
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: qrBgColor,
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // Regenerate QR when settings change
  useEffect(() => {
    if (qrModal) {
      generateQR(qrModal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrSize, qrColor, qrBgColor]);

  const downloadQR = async (format: 'png' | 'svg') => {
    if (!qrModal) return;
    const url = `https://fulluproar.com/go/${qrModal.slug}`;
    const filename = `qr-${qrModal.slug}`;

    if (format === 'png') {
      // Use canvas for PNG
      const canvas = document.createElement('canvas');
      await QRCodeLib.toCanvas(canvas, url, {
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: qrBgColor,
        },
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      // Generate SVG
      const svg = await QRCodeLib.toString(url, {
        type: 'svg',
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: qrBgColor,
        },
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `${filename}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const filteredRedirects = redirects.filter(r =>
    r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <Link
          href="/admin/dashboard"
          style={adminStyles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={adminStyles.title}>
              <Link2 style={{ display: 'inline', marginRight: '12px' }} />
              URL Redirects
            </h1>
            <p style={adminStyles.subtitle}>
              Manage short links for QR codes and packaging
            </p>
          </div>
          <button
            onClick={() => openModal()}
            style={{
              ...adminStyles.button,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} />
            New Redirect
          </button>
        </div>

        {/* Search Bar */}
        <div style={adminStyles.section}>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            />
            <input
              type="text"
              placeholder="Search redirects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                ...adminStyles.input,
                paddingLeft: '44px',
                width: '100%',
                maxWidth: '400px',
              }}
            />
          </div>
        </div>

        {/* Redirects Table */}
        <div style={adminStyles.section}>
          {loading ? (
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading redirects...</p>
          ) : filteredRedirects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <QrCode size={48} style={{ color: '#4b5563', marginBottom: '16px' }} />
              <p style={{ color: '#94a3b8' }}>
                {searchTerm ? 'No redirects match your search' : 'No redirects yet. Create one!'}
              </p>
            </div>
          ) : (
            <div style={adminStyles.tableContainer}>
              <table style={adminStyles.table}>
                <thead>
                  <tr>
                    <th style={adminStyles.tableHeader}>Slug / URL</th>
                    <th style={adminStyles.tableHeader}>Destination</th>
                    <th style={adminStyles.tableHeader}>Scans</th>
                    <th style={adminStyles.tableHeader}>Last Scanned</th>
                    <th style={adminStyles.tableHeader}>Status</th>
                    <th style={adminStyles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRedirects.map((redirect) => (
                    <>
                      <tr key={redirect.id} style={adminStyles.tableRow}>
                        <td style={adminStyles.tableCell}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#fdba74' }}>
                              {redirect.name || redirect.slug}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '4px',
                            }}>
                              /go/{redirect.slug}
                              <button
                                onClick={() => copyUrl(redirect.slug, redirect.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  color: copiedId === redirect.id ? '#22c55e' : '#94a3b8',
                                }}
                                title="Copy URL"
                              >
                                {copiedId === redirect.id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div style={{
                            maxWidth: '250px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            <a
                              href={redirect.destination}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#60a5fa', textDecoration: 'none' }}
                            >
                              {redirect.destination}
                              <ExternalLink size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
                            </a>
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <button
                            onClick={() => {
                              if (showScans === redirect.id) {
                                setShowScans(null);
                              } else {
                                setShowScans(redirect.id);
                                fetchScans(redirect.id);
                              }
                            }}
                            style={{
                              background: 'rgba(249, 115, 22, 0.1)',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              color: '#fdba74',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <BarChart3 size={14} />
                            {redirect.scanCount.toLocaleString()}
                          </button>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                            {formatDate(redirect.lastScannedAt)}
                          </span>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <button
                            onClick={() => toggleActive(redirect)}
                            style={{
                              background: redirect.isActive
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                              border: `1px solid ${redirect.isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              borderRadius: '6px',
                              padding: '4px 12px',
                              color: redirect.isActive ? '#22c55e' : '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                            }}
                          >
                            {redirect.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            {redirect.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => generateQR(redirect)}
                              style={{
                                ...adminStyles.secondaryButton,
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                borderColor: 'rgba(139, 92, 246, 0.3)',
                                color: '#a78bfa',
                              }}
                              title="Generate QR Code"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              onClick={() => openModal(redirect)}
                              style={{
                                ...adminStyles.secondaryButton,
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(redirect.id)}
                              style={{
                                ...(deleteConfirm === redirect.id
                                  ? adminStyles.dangerButton
                                  : adminStyles.secondaryButton),
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                              {deleteConfirm === redirect.id && 'Confirm?'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Scans Expansion Row */}
                      {showScans === redirect.id && (
                        <tr>
                          <td colSpan={6} style={{
                            padding: '16px',
                            background: 'rgba(15, 23, 42, 0.5)',
                          }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#fdba74',
                              marginBottom: '12px',
                            }}>
                              Recent Scans
                            </div>
                            {scansLoading ? (
                              <p style={{ color: '#94a3b8' }}>Loading...</p>
                            ) : scans.length === 0 ? (
                              <p style={{ color: '#94a3b8' }}>No scans recorded yet</p>
                            ) : (
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px',
                              }}>
                                {scans.slice(0, 10).map((scan) => (
                                  <div
                                    key={scan.id}
                                    style={{
                                      background: 'rgba(30, 41, 59, 0.5)',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      fontSize: '12px',
                                    }}
                                  >
                                    <div style={{ color: '#94a3b8', marginBottom: '4px' }}>
                                      {formatDate(scan.scannedAt)}
                                    </div>
                                    <div style={{ color: '#e2e8f0' }}>
                                      {[scan.device, scan.browser, scan.os].filter(Boolean).join(' / ') || 'Unknown'}
                                    </div>
                                    {(scan.city || scan.country) && (
                                      <div style={{ color: '#64748b', marginTop: '4px' }}>
                                        {[scan.city, scan.country].filter(Boolean).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
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

        {/* Tips Section */}
        <div style={{
          ...adminStyles.section,
          background: 'rgba(139, 92, 246, 0.1)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
        }}>
          <h3 style={{ color: '#a78bfa', marginBottom: '12px', fontSize: '16px' }}>
            <QrCode size={18} style={{ display: 'inline', marginRight: '8px' }} />
            QR Code Tips
          </h3>
          <ul style={{ color: '#c4b5fd', fontSize: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
            <li>Use short, memorable slugs: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>/go/fugly</code></li>
            <li>Generate QR codes pointing to your redirect URLs, not direct product links</li>
            <li>You can change destinations anytime without reprinting QR codes</li>
            <li>Track which packaging/ads drive the most traffic</li>
          </ul>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px',
          }}>
            <h2 style={{ color: '#fdba74', marginBottom: '24px', fontSize: '24px' }}>
              {editingRedirect ? 'Edit Redirect' : 'New Redirect'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>
                  Slug *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>/go/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    })}
                    placeholder="fugly"
                    required
                    style={{ ...adminStyles.input, flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>
                  Destination URL *
                </label>
                <input
                  type="url"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="https://fulluproar.com/games/fugly"
                  required
                  style={adminStyles.input}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fugly Box QR"
                  style={adminStyles.input}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Where this link is used (e.g., back of Fugly box)"
                  rows={2}
                  style={{ ...adminStyles.input, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#f97316' }}
                  />
                  Active (redirect is live)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={adminStyles.secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" style={adminStyles.button}>
                  {editingRedirect ? 'Save Changes' : 'Create Redirect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            margin: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#a78bfa', fontSize: '24px' }}>
                <QrCode size={24} style={{ display: 'inline', marginRight: '12px' }} />
                QR Code
              </h2>
              <button
                onClick={() => setQrModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '24px',
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ color: '#fdba74', fontWeight: 'bold', marginBottom: '4px' }}>
                {qrModal.name || qrModal.slug}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                fulluproar.com/go/{qrModal.slug}
              </div>
            </div>

            {/* QR Code Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
              padding: '20px',
              background: qrBgColor,
              borderRadius: '12px',
            }}>
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${qrModal.slug}`}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </div>

            {/* Settings */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}>
                  Size (px)
                </label>
                <select
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  style={{
                    ...adminStyles.input,
                    padding: '8px',
                    fontSize: '14px',
                  }}
                >
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={400}>400</option>
                  <option value={500}>500</option>
                  <option value={800}>800</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}>
                  QR Color
                </label>
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    border: '2px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}>
                  Background
                </label>
                <input
                  type="color"
                  value={qrBgColor}
                  onChange={(e) => setQrBgColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    border: '2px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Preset Colors */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}>
                Presets
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setQrColor('#000000'); setQrBgColor('#ffffff'); }}
                  style={{
                    padding: '6px 12px',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Classic
                </button>
                <button
                  onClick={() => { setQrColor('#f97316'); setQrBgColor('#0a0a0a'); }}
                  style={{
                    padding: '6px 12px',
                    background: '#0a0a0a',
                    color: '#f97316',
                    border: '2px solid #f97316',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Full Uproar
                </button>
                <button
                  onClick={() => { setQrColor('#0a0a0a'); setQrBgColor('#f97316'); }}
                  style={{
                    padding: '6px 12px',
                    background: '#f97316',
                    color: '#0a0a0a',
                    border: '2px solid #0a0a0a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Inverted
                </button>
                <button
                  onClick={() => { setQrColor('#8b5cf6'); setQrBgColor('#fde68a'); }}
                  style={{
                    padding: '6px 12px',
                    background: '#fde68a',
                    color: '#8b5cf6',
                    border: '2px solid #8b5cf6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Fugly
                </button>
              </div>
            </div>

            {/* Download Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => downloadQR('png')}
                style={{
                  ...adminStyles.button,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Download size={16} />
                Download PNG
              </button>
              <button
                onClick={() => downloadQR('svg')}
                style={{
                  ...adminStyles.secondaryButton,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Download size={16} />
                Download SVG
              </button>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}
