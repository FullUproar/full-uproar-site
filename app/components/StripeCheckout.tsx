'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { AlertCircle, Loader2, Shield } from 'lucide-react';

import { isStripeTestKeys } from '@/lib/payment-mode';

// Derive publishable key from the single NEXT_PUBLIC_CHECKOUT_MODE env var
const useTestKeys = isStripeTestKeys();
const stripePublishableKey = useTestKeys
  ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
const stripePromise = loadStripe(stripePublishableKey);

interface StripeCheckoutProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onProcessingChange?: (processing: boolean) => void;
}

function CheckoutForm({ orderId, amount, onSuccess, onError, onProcessingChange }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProcessing = (value: boolean) => {
    setIsProcessing(value);
    onProcessingChange?.(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    updateProcessing(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed. Please try a different card.');
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      updateProcessing(false);
    }
  };

  const isDisabled = isProcessing || !stripe;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '0.75rem',
          border: '2px solid rgba(239, 68, 68, 0.3)'
        }}>
          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0, marginTop: '0.125rem' }} />
          <p style={{ fontSize: '0.875rem', color: '#fca5a5', fontWeight: 'bold', margin: 0 }}>{error}</p>
        </div>
      )}

      <PaymentElement />

      <button
        type="submit"
        disabled={isDisabled}
        style={{
          width: '100%',
          background: isDisabled ? '#4b5563' : '#FF8200',
          color: isDisabled ? '#9ca3af' : '#111827',
          padding: '1rem',
          borderRadius: '50px',
          fontWeight: 900,
          fontSize: '1.125rem',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          opacity: isDisabled ? 0.7 : 1,
          transform: 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = '#ea580c';
            e.currentTarget.style.transform = 'scale(1.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = '#FF8200';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {isProcessing ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
            Processing your order...
          </span>
        ) : (
          `COMPLETE ORDER — $${(amount / 100).toFixed(2)}`
        )}
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        background: 'rgba(16, 185, 129, 0.05)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(16, 185, 129, 0.2)',
      }}>
        <Shield style={{ width: '0.875rem', height: '0.875rem', color: '#10b981' }} />
        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>
          Your payment info is encrypted and secure &bull; Powered by Stripe
        </span>
      </div>
    </form>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: props.orderId,
        amount: props.amount,
        currency: 'usd'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch(err => {
        setError('Failed to initialize payment. Please try again.');
        console.error('Payment intent error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props.orderId, props.amount]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        gap: '1rem'
      }}>
        <Loader2 style={{ width: '2rem', height: '2rem', color: '#FF8200', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#FBDB65', fontSize: '0.875rem', fontWeight: 'bold' }}>
          Preparing secure payment...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '0.75rem',
        border: '2px solid rgba(239, 68, 68, 0.3)'
      }}>
        <h3 style={{ fontWeight: 'bold', color: '#fca5a5', marginBottom: '0.5rem', fontSize: '1rem' }}>
          Payment Initialization Error
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#d1d5db', margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#FF8200',
        colorBackground: '#1f2937',
        colorText: '#e5e7eb',
        colorDanger: '#ef4444',
        borderRadius: '8px',
      },
      rules: {
        '.Label': {
          color: '#fbbf24',
          fontWeight: 'bold',
        },
        '.Input': {
          backgroundColor: '#374151',
          borderColor: 'rgba(255, 130, 0, 0.3)',
        },
        '.Input:focus': {
          borderColor: '#FF8200',
          boxShadow: '0 0 0 2px rgba(255, 130, 0, 0.2)',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
