'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ReportButtonProps {
  contentType: string; // 'POST', 'THREAD', 'USER', etc.
  contentId: string;
  targetUserId?: string;
  url?: string;
  compact?: boolean;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or advertising' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'HATE_SPEECH', label: 'Hate speech or discrimination' },
  { value: 'NSFW', label: 'NSFW content' },
  { value: 'SCAM', label: 'Scam or fraud' },
  { value: 'IMPERSONATION', label: 'Impersonation' },
  { value: 'OFF_TOPIC', label: 'Off-topic or irrelevant' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'PERSONAL_INFO', label: 'Shares personal information' },
  { value: 'OTHER', label: 'Other (explain below)' }
];

export default function ReportButton({
  contentType,
  contentId,
  targetUserId,
  url,
  compact = false
}: ReportButtonProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          targetUserId,
          reason,
          description,
          url: url || window.location.href
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowModal(false);
          setSubmitted(false);
          setReason('');
          setDescription('');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: compact ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
          background: 'transparent',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.375rem',
          color: '#ef4444',
          fontSize: compact ? '0.75rem' : '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.borderColor = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }}
      >
        <Flag size={compact ? 12 : 14} />
        {!compact && 'Report'}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#111827',
              borderRadius: '1rem',
              border: '2px solid #ef4444',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 900 }}>
                    Report Content
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>

                <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Help us keep the community safe. Reports are reviewed by our moderation team.
                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      Reason for report
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="">Select a reason...</option>
                      {REPORT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      Additional details (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide any additional context that would help our review..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: '0.5rem',
                      color: '#ef4444',
                      marginBottom: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !reason}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: submitting || !reason ? '#374151' : '#ef4444',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: submitting || !reason ? '#6b7280' : '#fff',
                        fontWeight: 'bold',
                        cursor: submitting || !reason ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                <h3 style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Report Submitted
                </h3>
                <p style={{ color: '#94a3b8' }}>
                  Thank you for helping keep our community safe.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
