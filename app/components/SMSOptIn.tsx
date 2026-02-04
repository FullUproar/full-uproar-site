'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, Check, X, Info } from 'lucide-react';

interface SMSOptInProps {
  userId?: string;
  email?: string;
  context: 'checkout' | 'account' | 'campaign';
  onConsent?: (phoneNumber: string) => void;
}

export default function SMSOptIn({ userId, email, context, onConsent }: SMSOptInProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneDigits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneDigits.length <= 3) {
      return phoneDigits;
    } else if (phoneDigits.length <= 6) {
      return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3)}`;
    } else if (phoneDigits.length <= 10) {
      return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
    }
    return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleOptIn = async () => {
    if (!consent) {
      setMessage({ type: 'error', text: 'Please check the consent box to continue' });
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sms/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `+1${cleanPhone}`,
          consent: true,
          context,
          userId,
          email
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowVerification(true);
        setMessage({ type: 'success', text: 'Verification code sent! Check your phone.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to opt-in' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit code' });
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `+1${cleanPhone}`,
          code: verificationCode,
          userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Phone number verified! You\'re all set for SMS updates.' });
        if (onConsent) {
          onConsent(`+1${cleanPhone}`);
        }
        // Reset after success
        setTimeout(() => {
          setShowVerification(false);
          setVerificationCode('');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      borderRadius: '15px',
      padding: '2rem',
      border: '2px solid rgba(255, 130, 0, 0.3)',
      marginTop: '2rem'
    },
    
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    
    title: {
      fontSize: '1.5rem',
      color: '#FBDB65',
      fontWeight: 'bold',
      margin: 0
    },
    
    subtitle: {
      color: '#94a3b8',
      marginBottom: '1.5rem',
      lineHeight: '1.6'
    },
    
    benefits: {
      background: 'rgba(255, 130, 0, 0.1)',
      borderRadius: '10px',
      padding: '1rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(255, 130, 0, 0.3)'
    },
    
    benefitsList: {
      margin: 0,
      paddingLeft: '1.5rem',
      color: '#FBDB65'
    },
    
    inputGroup: {
      marginBottom: '1rem'
    },
    
    label: {
      display: 'block',
      color: '#e2e8f0',
      marginBottom: '0.5rem',
      fontSize: '0.9rem'
    },
    
    input: {
      width: '100%',
      padding: '0.75rem',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '8px',
      color: '#e2e8f0',
      fontSize: '1rem',
      transition: 'all 0.3s ease'
    },
    
    checkboxContainer: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    
    checkbox: {
      width: '20px',
      height: '20px',
      marginTop: '2px',
      accentColor: '#FF8200',
      cursor: 'pointer'
    },
    
    consentText: {
      color: '#94a3b8',
      fontSize: '0.85rem',
      lineHeight: '1.5',
      flex: 1
    },
    
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #FF8200, #ea580c)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease',
      opacity: loading ? 0.7 : 1
    },
    
    message: {
      padding: '1rem',
      borderRadius: '8px',
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    
    disclaimer: {
      marginTop: '1rem',
      padding: '1rem',
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '8px',
      border: '1px solid rgba(148, 163, 184, 0.2)'
    },
    
    disclaimerText: {
      color: '#64748b',
      fontSize: '0.75rem',
      lineHeight: '1.4',
      margin: 0
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <MessageSquare size={28} color="#FF8200" />
        <h3 style={styles.title}>Get SMS Updates</h3>
      </div>
      
      <p style={styles.subtitle}>
        Be the first to know about exclusive deals, new game releases, and limited-time offers!
      </p>
      
      <div style={styles.benefits}>
        <ul style={styles.benefitsList}>
          <li>🎮 Early access to new games</li>
          <li>💰 Exclusive SMS-only discounts</li>
          <li>📦 Order shipping updates</li>
          <li>🎉 VIP event invitations</li>
        </ul>
      </div>
      
      {!showVerification ? (
        <>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Phone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Mobile Phone Number
            </label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              style={styles.input}
              maxLength={14}
              disabled={loading}
            />
          </div>
          
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="sms-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={styles.checkbox}
              disabled={loading}
            />
            <label htmlFor="sms-consent" style={styles.consentText}>
              I agree to receive recurring automated marketing text messages (e.g. cart reminders) 
              at the phone number provided. Consent is not a condition to purchase. 
              Msg & data rates may apply. Reply STOP to unsubscribe. Reply HELP for help. 
              View our <a href="/privacy" style={{ color: '#FF8200' }}>Privacy Policy</a> and 
              {' '}<a href="/terms" style={{ color: '#FF8200' }}>Terms of Service</a>.
            </label>
          </div>
          
          <button
            onClick={handleOptIn}
            style={styles.button}
            disabled={loading || !phoneNumber || !consent}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'Processing...' : 'Enable SMS Notifications'}
          </button>
        </>
      ) : (
        <>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Enter the 6-digit code sent to {phoneNumber}
            </label>
            <input
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...styles.input, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              maxLength={6}
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleVerify}
            style={styles.button}
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Phone Number'}
          </button>
          
          <button
            onClick={() => {
              setShowVerification(false);
              setVerificationCode('');
              setMessage(null);
            }}
            style={{ ...styles.button, background: 'transparent', border: '1px solid #64748b', marginTop: '1rem' }}
          >
            <X size={16} />
            Start Over
          </button>
        </>
      )}
      
      {message && (
        <div style={{
          ...styles.message,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444'
        }}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {message.text}
        </div>
      )}
      
      <div style={styles.disclaimer}>
        <p style={styles.disclaimerText}>
          <Info size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
          <strong>Frequency:</strong> Up to 5 messages per month. 
          <strong> Carriers:</strong> Message and data rates may apply. 
          Supported carriers include Verizon, AT&T, T-Mobile, Sprint, and others.
          Text STOP to cancel anytime. Text HELP for support.
        </p>
      </div>
    </div>
  );
}