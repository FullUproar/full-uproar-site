'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Send, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';

interface Message {
  id: number;
  senderType: 'customer' | 'staff' | 'system';
  senderName: string | null;
  message: string;
  createdAt: string;
  isInternal: boolean;
}

interface Ticket {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  category: string;
  status: string;
  subject: string;
  createdAt: string;
  messages: Message[];
}

const categoryLabels: Record<string, string> = {
  general: 'General Inquiry',
  order_issue: 'Order Issue',
  wholesale: 'Wholesale/Retail Inquiry',
  product_support: 'Product Support',
  feedback: 'Feedback/Suggestion',
  media_press: 'Media/Press Inquiry',
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', label: 'Open' },
  in_progress: { bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316', label: 'In Progress' },
  waiting_on_customer: { bg: 'rgba(234, 179, 8, 0.2)', text: '#eab308', label: 'Awaiting Your Reply' },
  resolved: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', label: 'Resolved' },
  closed: { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280', label: 'Closed' },
};

export default function TicketViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/ticket/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Ticket not found. Please check your link and try again.');
        } else {
          setError('Unable to load ticket. Please try again later.');
        }
        return;
      }
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError('Unable to load ticket. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTicket();
    }
  }, [token, fetchTicket]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || submitting) return;

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`/api/support/ticket/${token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to send reply');
      }

      setReplyMessage('');
      setSubmitSuccess(true);
      // Refresh ticket to show new message
      await fetchTicket();

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setError('Failed to send your reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Navigation />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}>
          <div style={{ color: '#fdba74', fontSize: '18px' }}>Loading ticket...</div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <Navigation />
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '4rem 1rem',
          textAlign: 'center',
        }}>
          <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h1 style={{ color: '#e2e8f0', fontSize: '1.5rem', marginBottom: '1rem' }}>
            {error || 'Ticket not found'}
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
            The link may have expired or the ticket doesn't exist.
          </p>
          <Link
            href="/connect/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#f97316',
              color: '#fff',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={20} />
            Contact Us
          </Link>
        </div>
      </div>
    );
  }

  const status = statusColors[ticket.status] || statusColors.open;
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navigation />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ color: '#f97316', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {ticket.ticketNumber}
            </h1>
            <span style={{
              padding: '0.25rem 0.75rem',
              background: status.bg,
              color: status.text,
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              {status.label}
            </span>
          </div>

          <p style={{ color: '#e2e8f0', fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>
            {ticket.subject}
          </p>

          <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <span>{categoryLabels[ticket.category] || ticket.category}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={14} />
              {formatDate(ticket.createdAt)}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          background: '#111827',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <MessageSquare size={20} style={{ color: '#f97316' }} />
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>Conversation</span>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {ticket.messages
              .filter(m => !m.isInternal)
              .map((message, index) => (
                <div
                  key={message.id}
                  style={{
                    padding: '1rem',
                    borderBottom: index < ticket.messages.length - 1 ? '1px solid #1f2937' : 'none',
                    background: message.senderType === 'staff' ? 'rgba(249, 115, 22, 0.05)' : 'transparent',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{
                      color: message.senderType === 'staff' ? '#f97316' : '#3b82f6',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}>
                      {message.senderType === 'staff' ? 'Full Uproar Support' : message.senderName || 'You'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    color: '#e2e8f0',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}>
                    {message.message}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Reply Form */}
        {!isResolved ? (
          <div style={{
            background: '#111827',
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0', fontSize: '1rem' }}>
              Add a Reply
            </h3>

            {submitSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}>
                <CheckCircle size={20} style={{ color: '#22c55e' }} />
                <span style={{ color: '#22c55e' }}>Reply sent successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmitReply}>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message..."
                required
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#e5e7eb',
                  fontSize: '1rem',
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: '1rem',
                }}
              />

              <button
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: submitting || !replyMessage.trim() ? '#374151' : '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  cursor: submitting || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <Send size={18} />
                {submitting ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{
            background: '#111827',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '1rem' }} />
            <h3 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>
              This ticket has been {ticket.status === 'resolved' ? 'resolved' : 'closed'}
            </h3>
            <p style={{ color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Need more help? Submit a new request.
            </p>
            <Link
              href="/connect/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#f97316',
                color: '#fff',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Contact Us
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
