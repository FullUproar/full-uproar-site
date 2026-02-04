'use client';

import { useState, useEffect } from 'react';
import { Shield, Flag, Eye, Ban, VolumeX, AlertTriangle, Check, X, ExternalLink } from 'lucide-react';
import Navigation from '@/app/components/Navigation';

interface Report {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  description: string | null;
  url: string | null;
  status: string;
  priority: string;
  createdAt: string;
  reporter: {
    id: string;
    username: string | null;
    displayName: string | null;
    trustLevel: number;
  };
  targetUser: {
    id: string;
    username: string | null;
    displayName: string | null;
    flagCount: number;
    trustLevel: number;
    isBanned: boolean;
    isMuted: boolean;
  } | null;
}

const PRIORITY_COLORS = {
  LOW: '#94a3b8',
  NORMAL: '#60a5fa',
  HIGH: '#FF8200',
  URGENT: '#ef4444'
};

const STATUS_COLORS = {
  PENDING: '#fbbf24',
  UNDER_REVIEW: '#60a5fa',
  RESOLVED: '#10b981',
  DISMISSED: '#6b7280',
  ESCALATED: '#ef4444'
};

export default function ModerationQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/moderation/queue?status=${statusFilter}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (report: Report, action: string) => {
    setSelectedReport(report);
    setActionType(action);
    setShowActionModal(true);
  };

  const submitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          targetUserId: selectedReport.targetUser?.id,
          reason: actionReason,
          duration: actionDuration ? parseInt(actionDuration) : null,
          contentType: selectedReport.contentType,
          contentId: selectedReport.contentId,
          reportId: selectedReport.id,
          publicReason: actionReason
        })
      });

      if (response.ok) {
        setShowActionModal(false);
        setActionType('');
        setActionReason('');
        setActionDuration('');
        fetchReports();
      } else {
        alert('Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    } finally {
      setSubmitting(false);
    }
  };

  const dismissReport = async (reportId: string) => {
    try {
      const response = await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'DISMISS',
          reason: 'Report reviewed - no action needed',
          reportId
        })
      });

      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      color: '#e2e8f0'
    }}>
      <Navigation />
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={32} style={{ color: '#FF8200' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200' }}>
              Moderation Queue
            </h1>
          </div>
          <p style={{ color: '#94a3b8' }}>
            Review and take action on user reports
          </p>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                background: statusFilter === status ? '#FF8200' : 'rgba(255, 255, 255, 0.05)',
                border: statusFilter === status ? 'none' : '1px solid #374151',
                borderRadius: '0.5rem',
                color: statusFilter === status ? '#111827' : '#94a3b8',
                fontWeight: statusFilter === status ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '1rem',
            border: '2px dashed #10b981'
          }}>
            <Check size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
              No Reports
            </p>
            <p style={{ color: '#94a3b8' }}>
              Queue is empty for this status
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9))',
                  borderRadius: '0.75rem',
                  border: `2px solid ${PRIORITY_COLORS[report.priority as keyof typeof PRIORITY_COLORS]}`,
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: PRIORITY_COLORS[report.priority as keyof typeof PRIORITY_COLORS],
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#111827'
                      }}>
                        {report.priority}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}20`,
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]
                      }}>
                        {report.status}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 style={{ color: '#FF8200', fontSize: '1.125rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                      {report.contentType}: {report.reason}
                    </h3>

                    {report.description && (
                      <p style={{ color: '#FBDB65', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {report.description}
                      </p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>REPORTED BY</p>
                        <p style={{ color: '#fff', fontWeight: 'bold' }}>
                          {report.reporter.displayName || report.reporter.username || 'Anonymous'}
                          <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                            (Trust: {report.reporter.trustLevel})
                          </span>
                        </p>
                      </div>

                      {report.targetUser && (
                        <div>
                          <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>REPORTED USER</p>
                          <p style={{ color: '#fff', fontWeight: 'bold' }}>
                            {report.targetUser.displayName || report.targetUser.username}
                            <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                              ({report.targetUser.flagCount} flags)
                            </span>
                          </p>
                          {report.targetUser.isBanned && (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>⛔ BANNED</span>
                          )}
                          {report.targetUser.isMuted && (
                            <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>🔇 MUTED</span>
                          )}
                        </div>
                      )}
                    </div>

                    {report.url && (
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          color: '#60a5fa',
                          fontSize: '0.875rem',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={14} />
                        View Content
                      </a>
                    )}
                  </div>
                </div>

                {report.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleAction(report, 'WARN')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#fbbf24',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#111827',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <AlertTriangle size={16} />
                      Warn
                    </button>

                    <button
                      onClick={() => handleAction(report, 'MUTE')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#FF8200',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#111827',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <VolumeX size={16} />
                      Mute
                    </button>

                    <button
                      onClick={() => handleAction(report, 'BAN')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Ban size={16} />
                      Ban
                    </button>

                    <button
                      onClick={() => handleAction(report, 'HIDE_CONTENT')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#6b7280',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Eye size={16} />
                      Hide Content
                    </button>

                    <button
                      onClick={() => dismissReport(report.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <X size={16} />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {showActionModal && selectedReport && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 1000
            }}
            onClick={() => setShowActionModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                background: '#111827',
                borderRadius: '1rem',
                border: '2px solid #FF8200',
                padding: '1.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ color: '#FF8200', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>
                {actionType} Action
              </h2>

              <form onSubmit={submitAction}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Reason (visible to user)
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {(actionType === 'MUTE' || actionType === 'BAN') && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Duration (hours, leave empty for permanent)
                    </label>
                    <input
                      type="number"
                      value={actionDuration}
                      onChange={(e) => setActionDuration(e.target.value)}
                      placeholder="24"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowActionModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#94a3b8',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: submitting ? '#374151' : '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: submitting ? '#6b7280' : '#fff',
                      fontWeight: 'bold',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Processing...' : `Confirm ${actionType}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
