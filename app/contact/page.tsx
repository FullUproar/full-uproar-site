'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Mail, MessageSquare, Package, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Navigation from '@/app/components/Navigation';
import Turnstile from '@/app/components/Turnstile';

export default function ContactPage() {
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  // Auto-fill name and email for logged-in users
  useEffect(() => {
    if (isLoaded && user) {
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const email = user.primaryEmailAddress?.emailAddress || '';
      setFormData(prev => ({
        ...prev,
        name: fullName || prev.name,
        email: email || prev.email
      }));
    }
  }, [isLoaded, user]);

  // Stable callbacks for Turnstile to prevent re-renders
  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setErrorMessage('CAPTCHA failed. Please refresh and try again.');
    setCaptchaToken('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setErrorMessage('Please complete the CAPTCHA');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // In production, this would send to your email service
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitStatus('success');
        setTicketNumber(data.ticketNumber || null);
        // Only clear message, keep name/email for logged-in users
        setFormData(prev => ({ ...prev, message: '' }));
        setCaptchaToken('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Failed to send message. Please try emailing us directly at support@fulluproar.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactReasons = [
    { value: 'general', label: 'General Inquiry', icon: <MessageSquare size={16} /> },
    { value: 'order', label: 'Order Issue', icon: <Package size={16} /> },
    { value: 'wholesale', label: 'Wholesale/Retail', icon: <Package size={16} /> },
    { value: 'support', label: 'Product Support', icon: <AlertCircle size={16} /> },
    { value: 'feedback', label: 'Feedback/Suggestions', icon: <MessageSquare size={16} /> },
    { value: 'media', label: 'Media/Press', icon: <Mail size={16} /> },
  ];

  return (
    <>
      <Navigation />
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          <h1 style={{ 
            color: '#f97316', 
            fontSize: '3rem', 
            marginBottom: '1rem',
            fontWeight: 900,
            textAlign: 'center'
          }}>
            Contact Us
          </h1>
          
          <p style={{
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '3rem',
            fontSize: '1.125rem'
          }}>
            Questions? Comments? Declarations of war? We're here for all of it.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            {/* Contact Form */}
            <div style={{
              background: '#1f2937',
              borderRadius: '1rem',
              padding: '2rem',
              border: '2px solid #374151'
            }}>
              <h2 style={{
                color: '#fdba74',
                fontSize: '1.5rem',
                marginBottom: '1.5rem',
                fontWeight: 'bold'
              }}>
                Send Us a Message
              </h2>

              {submitStatus === 'success' ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid #10b981',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Message Sent!</h3>
                  {ticketNumber && (
                    <p style={{
                      color: '#f97316',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      marginBottom: '0.75rem'
                    }}>
                      Ticket #{ticketNumber}
                    </p>
                  )}
                  <p style={{ color: '#cbd5e1' }}>
                    We'll get back to you within 24-48 hours. Probably sooner because we're excited someone wants to talk to us.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitStatus('idle');
                      setTicketNumber(null);
                    }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      border: '1px solid #10b981',
                      borderRadius: '0.5rem',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                {/* Logged-in user indicator */}
                {user && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <User size={16} style={{ color: '#10b981' }} />
                    <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                      Signed in as {user.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '0.25rem'
                    }}>
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: user ? 'rgba(15, 23, 42, 0.7)' : '#0f172a',
                        border: user ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#e5e7eb',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="Your chaotic name"
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '0.25rem'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: user ? 'rgba(15, 23, 42, 0.7)' : '#0f172a',
                        border: user ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#e5e7eb',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="chaos@example.com"
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '0.25rem'
                    }}>
                      What's this about?
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#0f172a',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#e5e7eb',
                        fontSize: '1rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {contactReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#e5e7eb',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: '0.25rem'
                    }}>
                      Message
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#0f172a',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#e5e7eb',
                        fontSize: '1rem',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      placeholder="Tell us everything. We love details and dramatic stories."
                    />
                  </div>

                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onVerify={handleCaptchaVerify}
                        onError={handleCaptchaError}
                        theme="dark"
                      />
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: isSubmitting ? '#6b7280' : 'linear-gradient(45deg, #f97316, #ea580c)',
                      color: isSubmitting ? '#9ca3af' : '#111827',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Send size={20} />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
                </>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <div style={{
                background: '#1f2937',
                borderRadius: '1rem',
                padding: '2rem',
                border: '2px solid #374151',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  color: '#fdba74',
                  fontSize: '1.5rem',
                  marginBottom: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  Other Ways to Reach Us
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      📧 Email Us Directly
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <a href="mailto:support@fulluproar.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        support@fulluproar.com
                      </a>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        General support & order inquiries
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      📦 Wholesale Inquiries
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <a href="mailto:wholesale@fulluproar.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        wholesale@fulluproar.com
                      </a>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        Bulk orders & retail partnerships
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      🎮 Marketing & Partnerships
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <a href="mailto:marketing@fulluproar.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        marketing@fulluproar.com
                      </a>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        Sponsorships, collabs & media inquiries
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      ↩️ Returns & Refunds
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <a href="mailto:returns@fulluproar.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        returns@fulluproar.com
                      </a>
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        Return authorizations & refund status
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                borderRadius: '1rem',
                padding: '2rem',
                color: '#111827'
              }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  💡 Pro Tips for Contacting Us
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                  <li>Include your order number for faster support</li>
                  <li>Photos help with product issues</li>
                  <li>We respond within 24-48 hours (usually faster)</li>
                  <li>Humor in your message gets priority responses</li>
                  <li>We read every message, even the angry ones</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}