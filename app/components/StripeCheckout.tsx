'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { AlertCircle, Loader2 } from 'lucide-react';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ orderId, amount, onSuccess, onError }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Test mode - simulate payment without Stripe
      if (isTestMode) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update order status via API
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid' })
        });

        if (!response.ok) {
          throw new Error('Failed to update order status');
        }

        onSuccess();
        return;
      }

      // Real Stripe payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border-2 border-red-500/30">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-bold">{error}</p>
        </div>
      )}

      {!isTestMode && <PaymentElement />}

      {isTestMode && (
        <div className="p-6 bg-yellow-500/10 rounded-lg border-2 border-yellow-500/30">
          <h3 className="font-bold text-yellow-400 mb-2">Test Mode Active</h3>
          <p className="text-sm text-gray-300">
            Payment will be simulated. Click "Complete Order" to proceed.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || (!stripe && !isTestMode)}
        className={`
          w-full font-black py-4 rounded-lg transition-all transform
          ${isProcessing || (!stripe && !isTestMode)
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 text-gray-900 hover:scale-105'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </span>
        ) : (
          `Complete Order - $${(amount / 100).toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is securely processed by Stripe.
        We never store your card details.
      </p>
    </form>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // Create payment intent
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
          setIsTestMode(data.testMode || false);
        }
      })
      .catch(err => {
        setError('Failed to initialize payment');
        console.error('Payment intent error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props.orderId, props.amount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 rounded-lg border-2 border-red-500/30">
        <h3 className="font-bold text-red-400 mb-2">Payment Initialization Error</h3>
        <p className="text-sm text-gray-300">{error}</p>
      </div>
    );
  }

  // Test mode - no Stripe Elements needed
  if (isTestMode) {
    return <CheckoutForm {...props} />;
  }

  // Real Stripe payment
  const options = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#f97316',
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
          borderColor: 'rgba(249, 115, 22, 0.3)',
        },
        '.Input:focus': {
          borderColor: '#f97316',
          boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)',
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