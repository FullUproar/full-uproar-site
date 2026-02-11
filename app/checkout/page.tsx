'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';
import { ArrowLeft, CreditCard, Truck, Package, AlertCircle, TestTube, Rocket, Calendar, X, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import Navigation from '@/app/components/Navigation';
import { simulatePayment, TEST_CARDS, formatTestCardDisplay } from '@/lib/payment-test-mode';
import { getPaymentMode, isSimulatedMode, isStripeMode, isLiveMode } from '@/lib/payment-mode';
import dynamic from 'next/dynamic';
import { TestId, getTestId } from '@/lib/constants/test-ids';
import { analytics, AnalyticsEvent, useAnalytics } from '@/lib/analytics/analytics';
import { MetaPixelEvents } from '@/app/components/MetaPixel';
import TrustBadges from '@/app/components/TrustBadges';
import SMSOptIn from '@/app/components/SMSOptIn';

const PAYMENT_MODE = getPaymentMode();

// Store status configuration - controlled by env var
const STORE_STATUS = {
  isOpen: process.env.NEXT_PUBLIC_STORE_OPEN === 'true',
  launchDate: 'Spring 2026',
  allowTestOrders: false // When true, admins can test the full flow
};

// Dynamically import StripeCheckout to avoid SSR issues
const StripeCheckout = dynamic(() => import('@/app/components/StripeCheckout'), {
  ssr: false,
  loading: () => <div style={{ color: '#FBDB65', textAlign: 'center' }}>Loading payment processor...</div>
});

type OrderForm = {
  customerEmail: string;
  customerName: string;
  phone: string;
  shippingAddress: {
    street: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    sameAsShipping: boolean;
    street: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'card' | 'fugly-credit';
  cardDetails: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [signInDismissed, setSignInDismissed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  // Stripe payment flow: orderId is set after order creation, triggers StripeCheckout mount
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderTotalCents, setOrderTotalCents] = useState<number>(0);
  const [taxInfo, setTaxInfo] = useState<{
    taxCents: number;
    isEstimate: boolean;
    breakdown?: { subtotalTaxCents: number; shippingTaxCents: number };
  }>({ taxCents: 0, isEstimate: true });
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);

  // Shipping options state
  interface ShippingRate {
    carrier: string;
    carrierCode: string;
    service: string;
    serviceCode: string;
    priceCents: number;
    estimatedDays: number | null;
    packageType: string;
  }
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  useAnalytics();
  
  const [form, setForm] = useState<OrderForm>({
    customerEmail: '',
    customerName: '',
    phone: '',
    shippingAddress: {
      street: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    billingAddress: {
      sameAsShipping: true,
      street: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentMethod: 'card',
    cardDetails: {
      number: '',
      expiry: '',
      cvc: '',
      name: ''
    }
  });

  // Load persisted form data and redirect if cart is empty
  useEffect(() => {
    setMounted(true);

    // Restore sign-in dismiss state
    if (sessionStorage.getItem('checkout-signin-dismissed') === 'true') {
      setSignInDismissed(true);
    }

    // Restore form data from sessionStorage if available
    const savedForm = sessionStorage.getItem('checkout_form');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        // Restore form data but keep default empty card details (never restored from storage)
        setForm(prev => ({ ...prev, ...parsedForm, cardDetails: prev.cardDetails }));
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }

    if (items.length === 0 && !isNavigatingAway) {
      router.push('/');
    } else if (items.length > 0) {
      const cartValue = getTotalPrice();

      // Track analytics
      analytics.track(AnalyticsEvent.CHECKOUT_START, {
        cartItemCount: items.length,
        cartValue: cartValue
      });

      // Track Meta Pixel checkout initiation
      const contentIds = items.map(item => `${item.type}_${item.id}`);
      MetaPixelEvents.initiateCheckout(
        cartValue / 100,
        items.reduce((sum, item) => sum + item.quantity, 0),
        contentIds,
        'USD'
      );
    }
  }, [items, router, isNavigatingAway]);

  // Persist form data to sessionStorage (never persist card details)
  useEffect(() => {
    if (mounted) {
      const { cardDetails, ...formWithoutCard } = form;
      sessionStorage.setItem('checkout_form', JSON.stringify(formWithoutCard));
    }
  }, [form, mounted]);

  const subtotal = getTotalPrice();
  const shipping = selectedShipping?.priceCents || 0;
  const tax = taxInfo.taxCents;
  const total = subtotal + shipping + tax;

  // Fetch shipping rates when address is entered
  const fetchShippingRates = async (shippingAddress: OrderForm['shippingAddress']) => {
    if (!shippingAddress.zipCode || !shippingAddress.state) return;

    setIsLoadingShipping(true);
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toAddress: {
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.zipCode,
            country: shippingAddress.country || 'US'
          },
          // Pass cart items for weight-based shipping calculation
          cartItems: items.map(item => ({
            id: item.id,
            type: item.type,
            quantity: item.quantity
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rates = data.rates || [];
        setShippingRates(rates);
        // Auto-select cheapest option
        if (rates.length > 0 && !selectedShipping) {
          setSelectedShipping(rates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shipping rates:', error);
      // Set default rates on error
      setShippingRates([
        { carrier: 'USPS', carrierCode: 'usps', service: 'Priority Mail', serviceCode: 'usps_priority_mail', priceCents: 899, estimatedDays: 3, packageType: 'package' },
        { carrier: 'FedEx', carrierCode: 'fedex', service: 'Ground', serviceCode: 'fedex_ground', priceCents: 999, estimatedDays: 5, packageType: 'package' },
      ]);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Calculate tax when shipping address is provided
  const calculateTax = async (shippingAddress: OrderForm['shippingAddress']) => {
    setIsCalculatingTax(true);
    try {
      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotalCents: subtotal,
          shippingCents: shipping,
          shippingAddress: {
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            city: shippingAddress.city,
            country: shippingAddress.country
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTaxInfo({
          taxCents: data.taxCents,
          isEstimate: data.isEstimate,
          breakdown: data.breakdown
        });
      } else {
        // Fallback to simple 8% on taxable amount
        const fallbackTax = Math.round(subtotal * 0.08);
        setTaxInfo({ taxCents: fallbackTax, isEstimate: true });
      }
    } catch (error) {
      console.error('Tax calculation error:', error);
      // Fallback calculation
      const fallbackTax = Math.round(subtotal * 0.08);
      setTaxInfo({ taxCents: fallbackTax, isEstimate: true });
    } finally {
      setIsCalculatingTax(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.customerEmail) {
        newErrors.customerEmail = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
        newErrors.customerEmail = 'Please enter a valid email address';
      }
      if (!form.customerName) newErrors.customerName = 'Name is required';
      if (!form.phone) newErrors.phone = 'Phone is required';
    }

    if (step === 2) {
      if (!form.shippingAddress.street) newErrors['shipping.street'] = 'Street address is required';
      if (!form.shippingAddress.city) newErrors['shipping.city'] = 'City is required';
      if (!form.shippingAddress.state) newErrors['shipping.state'] = 'State is required';
      if (!form.shippingAddress.zipCode) newErrors['shipping.zipCode'] = 'ZIP code is required';
      if (!selectedShipping) newErrors['shipping.method'] = 'Please select a shipping method';
    }

    if (step === 3) {
      // Only validate card fields in simulated mode (Stripe Elements handles its own validation)
      if (form.paymentMethod === 'card' && isSimulatedMode()) {
        if (!form.cardDetails.number) newErrors['card.number'] = 'Card number is required';
        if (!form.cardDetails.expiry) newErrors['card.expiry'] = 'Expiry date is required';
        if (!form.cardDetails.cvc) newErrors['card.cvc'] = 'CVC is required';
        if (!form.cardDetails.name) newErrors['card.name'] = 'Cardholder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // Calculate tax when moving from shipping to payment step
      if (currentStep === 2) {
        await calculateTax(form.shippingAddress);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  // Fetch shipping rates when address fields change (debounced effect)
  useEffect(() => {
    if (currentStep === 2 && form.shippingAddress.zipCode && form.shippingAddress.state) {
      const timer = setTimeout(() => {
        fetchShippingRates(form.shippingAddress);
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [currentStep, form.shippingAddress.zipCode, form.shippingAddress.state, form.shippingAddress.city, items]);

  // Recalculate tax when shipping selection changes
  useEffect(() => {
    if (selectedShipping && form.shippingAddress.state) {
      calculateTax(form.shippingAddress);
    }
  }, [selectedShipping]);

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Create order via API — shared by both simulated and Stripe flows
  const handleCreateOrder = async (): Promise<{ id: string; totalCents: number } | null> => {
    const shippingAddress = `${form.shippingAddress.street}${form.shippingAddress.apartment ? ', ' + form.shippingAddress.apartment : ''}, ${form.shippingAddress.city}, ${form.shippingAddress.state} ${form.shippingAddress.zipCode}, ${form.shippingAddress.country}`;
    const billingAddress = form.billingAddress.sameAsShipping
      ? shippingAddress
      : `${form.billingAddress.street}${form.billingAddress.apartment ? ', ' + form.billingAddress.apartment : ''}, ${form.billingAddress.city}, ${form.billingAddress.state} ${form.billingAddress.zipCode}, ${form.billingAddress.country}`;

    const orderData = {
      customerEmail: form.customerEmail,
      customerName: form.customerName,
      customerPhone: form.phone,
      shippingAddress,
      billingAddress,
      shippingAddressData: {
        state: form.shippingAddress.state,
        zipCode: form.shippingAddress.zipCode,
        city: form.shippingAddress.city,
        country: form.shippingAddress.country
      },
      shippingMethod: selectedShipping ? {
        carrier: selectedShipping.carrier,
        carrierCode: selectedShipping.carrierCode,
        service: selectedShipping.service,
        serviceCode: selectedShipping.serviceCode,
        priceCents: selectedShipping.priceCents,
        estimatedDays: selectedShipping.estimatedDays
      } : null,
      items: items.map(item => ({
        itemType: item.type,
        ...(item.type === 'game' ? { gameId: item.id } : { merchId: item.id }),
        ...(item.type === 'merch' && item.size ? { merchSize: item.size } : {}),
        quantity: item.quantity,
        priceCents: item.priceCents
      }))
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Order creation failed:', errorData);

      if (response.status === 503) {
        setErrors({
          submit: `🚀 ${errorData.error || 'Store launching soon!'} Join our mailing list to be notified when we open!`
        });
        return null;
      }

      throw new Error(errorData.error || 'Failed to create order');
    }

    const order = await response.json();
    return { id: order.id, totalCents: order.totalCents || total };
  };

  // Post-payment success — shared by both simulated and Stripe flows
  const handlePostPaymentSuccess = async (completedOrderId: string) => {
    if (marketingOptIn && form.customerEmail) {
      fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.customerEmail,
          source: 'checkout'
        })
      }).catch(() => {});
      if (typeof window !== 'undefined') {
        localStorage.setItem('newsletter-subscribed', 'true');
      }
    }

    setIsNavigatingAway(true);
    clearCart();
    sessionStorage.removeItem('checkout_form');
    router.push(`/order-confirmation?orderId=${completedOrderId}`);
  };

  const handleSubmit = async () => {
    if (isSimulatedMode()) {
      // SIMULATED MODE: validate card fields, create order, simulate payment
      if (!validateStep(3)) return;
      setIsProcessing(true);

      try {
        const order = await handleCreateOrder();
        if (!order) { setIsProcessing(false); return; }

        const paymentResult = await simulatePayment(form.cardDetails.number);
        if (!paymentResult.success) {
          setErrors({ payment: paymentResult.error || 'Payment failed' });
          setIsProcessing(false);
          return;
        }

        // Mark order as paid on the server (simulated mode)
        const paidResponse = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'simulate-payment' })
        });
        if (!paidResponse.ok) {
          console.error('Failed to confirm simulated payment');
        }

        await handlePostPaymentSuccess(order.id);
      } catch (error) {
        console.error('Checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        setErrors({ submit: errorMessage });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // STRIPE MODE: create order, then mount StripeCheckout for payment
      setIsProcessing(true);
      setErrors({});

      try {
        const order = await handleCreateOrder();
        if (!order) { setIsProcessing(false); return; }

        // Store order info — this triggers StripeCheckout to mount
        setOrderTotalCents(order.totalCents);
        setCreatedOrderId(order.id);
      } catch (error) {
        console.error('Checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        setErrors({ submit: errorMessage });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!mounted || items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
        <Navigation />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#FBDB65', fontSize: '1.5rem' }}>Preparing mayhem machine...</p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#111827',
    color: '#FBDB65',
    borderRadius: '0.5rem',
    border: '2px solid #374151',
    outline: 'none',
    fontSize: '1rem',
    transition: 'all 0.3s',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    color: '#FBDB65',
    fontWeight: 'bold' as const,
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  };

  const buttonStyle = {
    width: '100%',
    background: '#FF8200',
    color: '#111827',
    padding: '1rem',
    borderRadius: '50px',
    fontWeight: 900,
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  };

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
        <Navigation />
      
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 900,
          color: '#FF8200',
          textAlign: 'center',
          marginBottom: '2rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {isLiveMode() ? 'SECURE CHECKOUT' : 'FUGLY CHECKOUT'}
        </h1>

        {/* Store Coming Soon Banner */}
        {!STORE_STATUS.isOpen && (
          <div style={{
            maxWidth: '48rem',
            margin: '0 auto 2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.15), rgba(139, 92, 246, 0.15))',
            borderRadius: '1rem',
            border: '3px solid #FF8200',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(255, 130, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <Rocket style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200' }} />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#FF8200',
                margin: 0
              }}>
                STORE LAUNCHING {STORE_STATUS.launchDate.toUpperCase()}
              </h2>
              <Rocket style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200', transform: 'scaleX(-1)' }} />
            </div>
            <p style={{
              color: '#FBDB65',
              fontSize: '1rem',
              marginBottom: '0.5rem',
              lineHeight: '1.5'
            }}>
              We're putting the finishing touches on our chaotic shop experience!
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Feel free to explore checkout — this is a preview of what's coming. No actual orders will be processed.
            </p>
          </div>
        )}

        {/* Sign-in nudge for guest users */}
        {!isSignedIn && !signInDismissed && (
          <div style={{
            maxWidth: '48rem',
            margin: '0 auto 1.5rem',
            padding: '0.875rem 1.25rem',
            background: 'rgba(255, 130, 0, 0.08)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 130, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={18} style={{ color: '#FF8200', flexShrink: 0 }} />
              <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
                Already have an account?{' '}
                <Link
                  href="/sign-in?redirect_url=/checkout"
                  style={{ color: '#FF8200', fontWeight: 700, textDecoration: 'none' }}
                >
                  Sign in
                </Link>
                {' '}for faster checkout with saved addresses and payment methods.
              </span>
            </div>
            <button
              onClick={() => {
                setSignInDismissed(true);
                sessionStorage.setItem('checkout-signin-dismissed', 'true');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0.25rem',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', marginBottom: '2rem' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto', width: '100%' }}>
            {/* Progress indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem', gap: '1rem' }}>
              {[
                { step: 1, label: 'Contact' },
                { step: 2, label: 'Shipping' },
                { step: 3, label: 'Payment' }
              ].map(({ step, label }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.25rem',
                      background: currentStep >= step ? '#FF8200' : '#374151',
                      color: currentStep >= step ? '#111827' : '#9ca3af',
                      border: currentStep >= step ? '3px solid #fb923c' : '3px solid #4b5563',
                      transition: 'all 0.3s',
                      transform: currentStep === step ? 'scale(1.1)' : 'scale(1)'
                    }}>
                      {step}
                    </div>
                    <span style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: currentStep >= step ? '#FBDB65' : '#6b7280',
                      textTransform: 'uppercase'
                    }}>
                      {label}
                    </span>
                  </div>
                  {step < 3 && (
                    <div style={{ 
                      width: '8rem',
                      height: '4px',
                      margin: '0 1rem',
                      marginBottom: '2rem',
                      background: currentStep > step ? '#FF8200' : '#374151',
                      transition: 'all 0.3s'
                    }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{
              background: '#1f2937',
              borderRadius: '1rem',
              padding: '2rem',
              border: '4px solid #fb923c',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}>
              {/* Step 1: Contact Info */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200', marginBottom: '1rem' }}>
                    WHO'S BUYING THE CHAOS?
                  </h2>
                  
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      style={inputStyle}
                      placeholder="fugly@chaos.com"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF8200';
                        e.currentTarget.style.background = '#1f2937';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = '#111827';
                      }}
                    />
                    {errors.customerEmail && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.customerEmail}</p>
                    )}
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#9ca3af',
                    }}>
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        style={{
                          accentColor: '#FF8200',
                          width: '1rem',
                          height: '1rem',
                          cursor: 'pointer',
                        }}
                      />
                      Keep me updated on new games, deals, and chaos (unsubscribe anytime)
                    </label>
                  </div>

                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      style={inputStyle}
                      placeholder="Fugly McChaosFace"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF8200';
                        e.currentTarget.style.background = '#1f2937';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = '#111827';
                      }}
                    />
                    {errors.customerName && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={inputStyle}
                      placeholder="555-CHAOS-666"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF8200';
                        e.currentTarget.style.background = '#1f2937';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = '#111827';
                      }}
                    />
                    {errors.phone && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.phone}</p>
                    )}
                  </div>

                  {/* SMS Opt-In */}
                  <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: 'rgba(255, 130, 0, 0.05)',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(255, 130, 0, 0.2)'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 'bold', 
                      color: '#FF8200',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      📱 Get Exclusive SMS Deals
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#FBDB65',
                      marginBottom: '1rem',
                      lineHeight: '1.5'
                    }}>
                      Be the first to know about new games, exclusive discounts, and limited-time offers! 
                      SMS subscribers save an average of 20% more than email-only subscribers.
                    </p>
                    <SMSOptIn 
                      context="checkout"
                      email={form.customerEmail}
                      onConsent={(phone) => {
                        // Update the phone number in the form when they consent to SMS
                        if (!form.phone) {
                          setForm({ ...form, phone });
                        }
                      }}
                    />
                  </div>

                  <button
                    onClick={handleNext}
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ea580c';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FF8200';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Ship the Chaos →
                  </button>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200', marginBottom: '1rem' }}>
                    WHERE'S THE CHAOS GOING?
                  </h2>
                  
                  <div>
                    <label style={labelStyle}>Street Address</label>
                    <input
                      type="text"
                      value={form.shippingAddress.street}
                      onChange={(e) => setForm({ 
                        ...form, 
                        shippingAddress: { ...form.shippingAddress, street: e.target.value }
                      })}
                      style={inputStyle}
                      placeholder="666 Chaos Street"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF8200';
                        e.currentTarget.style.background = '#1f2937';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = '#111827';
                      }}
                    />
                    {errors['shipping.street'] && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['shipping.street']}</p>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Apartment/Suite (optional)</label>
                    <input
                      type="text"
                      value={form.shippingAddress.apartment}
                      onChange={(e) => setForm({ 
                        ...form, 
                        shippingAddress: { ...form.shippingAddress, apartment: e.target.value }
                      })}
                      style={inputStyle}
                      placeholder="Apt 13"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF8200';
                        e.currentTarget.style.background = '#1f2937';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = '#111827';
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input
                        type="text"
                        value={form.shippingAddress.city}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, city: e.target.value }
                        })}
                        style={inputStyle}
                        placeholder="Chaos City"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#FF8200';
                          e.currentTarget.style.background = '#1f2937';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#374151';
                          e.currentTarget.style.background = '#111827';
                        }}
                      />
                      {errors['shipping.city'] && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['shipping.city']}</p>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>State</label>
                      <input
                        type="text"
                        value={form.shippingAddress.state}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, state: e.target.value }
                        })}
                        style={inputStyle}
                        placeholder="XX"
                        maxLength={2}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#FF8200';
                          e.currentTarget.style.background = '#1f2937';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#374151';
                          e.currentTarget.style.background = '#111827';
                        }}
                      />
                      {errors['shipping.state'] && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['shipping.state']}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>ZIP Code</label>
                    <input
                      type="text"
                      value={form.shippingAddress.zipCode}
                      onChange={(e) => setForm({
                        ...form,
                        shippingAddress: { ...form.shippingAddress, zipCode: e.target.value }
                      })}
                      style={inputStyle}
                      placeholder="12345"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF8200';
                        e.currentTarget.style.background = '#1f2937';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = '#111827';
                      }}
                    />
                    {errors['shipping.zipCode'] && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['shipping.zipCode']}</p>
                    )}
                  </div>

                  {/* Shipping Method Selection */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>
                      Shipping Method
                      {isLoadingShipping && shippingRates.length > 0 && (
                        <span style={{ fontWeight: 'normal', fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                          updating...
                        </span>
                      )}
                    </label>
                    {shippingRates.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        opacity: isLoadingShipping ? 0.7 : 1,
                        transition: 'opacity 0.2s'
                      }}>
                        {shippingRates.map((rate) => (
                          <label
                            key={`${rate.carrierCode}-${rate.serviceCode}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem',
                              background: '#111827',
                              borderRadius: '0.75rem',
                              cursor: 'pointer',
                              border: '2px solid',
                              borderColor: selectedShipping?.serviceCode === rate.serviceCode ? '#FF8200' : '#374151',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={selectedShipping?.serviceCode === rate.serviceCode}
                                onChange={() => setSelectedShipping(rate)}
                                style={{ width: '1.25rem', height: '1.25rem', accentColor: '#FF8200' }}
                              />
                              <div>
                                <p style={{ fontWeight: 'bold', color: '#FBDB65', margin: 0 }}>
                                  {rate.carrier} {rate.service}
                                </p>
                                {rate.estimatedDays && (
                                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
                                    {rate.estimatedDays === 1 ? 'Next day' : `${rate.estimatedDays} business days`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#FF8200', fontSize: '1.125rem' }}>
                              ${(rate.priceCents / 100).toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : isLoadingShipping ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Skeleton loaders */}
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem',
                              background: '#111827',
                              borderRadius: '0.75rem',
                              border: '2px solid #374151',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: '#374151' }} />
                              <div>
                                <div style={{ width: '120px', height: '1rem', background: '#374151', borderRadius: '4px', marginBottom: '0.25rem' }} />
                                <div style={{ width: '80px', height: '0.75rem', background: '#2d3748', borderRadius: '4px' }} />
                              </div>
                            </div>
                            <div style={{ width: '50px', height: '1.25rem', background: '#374151', borderRadius: '4px' }} />
                          </div>
                        ))}
                      </div>
                    ) : form.shippingAddress.zipCode && form.shippingAddress.state ? (
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '0.5rem',
                        border: '2px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        textAlign: 'center'
                      }}>
                        Unable to load shipping rates. Please verify your address.
                      </div>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        background: '#111827',
                        borderRadius: '0.5rem',
                        border: '2px solid #374151',
                        color: '#9ca3af',
                        textAlign: 'center'
                      }}>
                        Enter your ZIP code and state to see shipping options
                      </div>
                    )}
                    {errors['shipping.method'] && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['shipping.method']}</p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      onClick={handleBack}
                      style={{
                        ...buttonStyle,
                        background: 'transparent',
                        border: '2px solid #374151',
                        color: '#FBDB65'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4b5563';
                        e.currentTarget.style.background = 'rgba(55, 65, 81, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      style={buttonStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ea580c';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FF8200';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Prepare for Mayhem →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#FF8200', marginBottom: '1rem' }}>
                    PAY FOR THE CHAOS
                  </h2>
                  
                  {/* Trust Badge — full layout in live mode */}
                  <TrustBadges variant={isLiveMode() ? 'horizontal' : 'compact'} />
                  
                  {/* Order Summary */}
                  <div style={{
                    background: '#111827',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '2px solid #374151',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#FBDB65', marginBottom: '1rem' }}>
                      Order Summary
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      {items.map((item) => (
                        <div key={`${item.id}-${item.size || ''}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ color: '#FBDB65', fontWeight: 'bold' }}>{item.name}</p>
                            {item.size && (
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Size: {item.size}</p>
                            )}
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Qty: {item.quantity}</p>
                          </div>
                          <p style={{ color: '#FBDB65', fontWeight: 'bold' }}>
                            ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Subtotal</span>
                        <span style={{ color: '#d1d5db' }}>${(subtotal / 100).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>
                          Shipping
                          {selectedShipping && (
                            <span style={{ fontSize: '0.75rem', display: 'block', color: '#6b7280' }}>
                              {selectedShipping.carrier} {selectedShipping.service}
                            </span>
                          )}
                        </span>
                        <span style={{ color: '#d1d5db' }}>
                          ${(shipping / 100).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#9ca3af' }}>
                          Tax{taxInfo.isEstimate ? ' (est.)' : ''}
                        </span>
                        <span style={{ color: '#d1d5db' }}>
                          {isCalculatingTax ? (
                            <span style={{ fontSize: '0.75rem' }}>Calculating...</span>
                          ) : (
                            `$${(tax / 100).toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div style={{ borderTop: '1px solid #374151', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200' }}>Total</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF8200' }}>
                          ${(total / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: '#111827',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: form.paymentMethod === 'card' ? '#FF8200' : '#374151',
                      transition: 'all 0.3s'
                    }}>
                      <input
                        type="radio"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={(e) => setForm({ ...form, paymentMethod: 'card' })}
                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#FF8200' }}
                      />
                      <CreditCard style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200' }} />
                      <span style={{ fontWeight: 'bold', color: '#FBDB65' }}>Credit/Debit Card</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: '#111827',
                      borderRadius: '0.75rem',
                      cursor: 'not-allowed',
                      border: '2px solid',
                      borderColor: form.paymentMethod === 'fugly-credit' ? '#FF8200' : '#374151',
                      opacity: 0.5,
                      transition: 'all 0.3s'
                    }}>
                      <input
                        type="radio"
                        value="fugly-credit"
                        checked={form.paymentMethod === 'fugly-credit'}
                        onChange={(e) => setForm({ ...form, paymentMethod: 'fugly-credit' })}
                        disabled
                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#FF8200' }}
                      />
                      <Package style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200' }} />
                      <span style={{ fontWeight: 'bold', color: '#FBDB65' }}>Fugly Credit (Coming Soon)</span>
                    </label>
                  </div>

                  {/* SIMULATED MODE: Custom card inputs */}
                  {form.paymentMethod === 'card' && isSimulatedMode() && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Card Number</label>
                        <input
                          type="text"
                          value={form.cardDetails.number}
                          onChange={(e) => setForm({
                            ...form,
                            cardDetails: { ...form.cardDetails, number: formatCardNumber(e.target.value) }
                          })}
                          style={inputStyle}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#FF8200';
                            e.currentTarget.style.background = '#1f2937';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#374151';
                            e.currentTarget.style.background = '#111827';
                          }}
                        />
                        {errors['card.number'] && (
                          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['card.number']}</p>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={labelStyle}>Expiry Date</label>
                          <input
                            type="text"
                            value={form.cardDetails.expiry}
                            onChange={(e) => setForm({
                              ...form,
                              cardDetails: { ...form.cardDetails, expiry: formatExpiry(e.target.value) }
                            })}
                            style={inputStyle}
                            placeholder="MM/YY"
                            maxLength={5}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#FF8200';
                              e.currentTarget.style.background = '#1f2937';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#374151';
                              e.currentTarget.style.background = '#111827';
                            }}
                          />
                          {errors['card.expiry'] && (
                            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['card.expiry']}</p>
                          )}
                        </div>

                        <div>
                          <label style={labelStyle}>CVC</label>
                          <input
                            type="text"
                            value={form.cardDetails.cvc}
                            onChange={(e) => setForm({
                              ...form,
                              cardDetails: { ...form.cardDetails, cvc: e.target.value.replace(/\D/g, '') }
                            })}
                            style={inputStyle}
                            placeholder="123"
                            maxLength={4}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#FF8200';
                              e.currentTarget.style.background = '#1f2937';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#374151';
                              e.currentTarget.style.background = '#111827';
                            }}
                          />
                          {errors['card.cvc'] && (
                            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['card.cvc']}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Cardholder Name</label>
                        <input
                          type="text"
                          value={form.cardDetails.name}
                          onChange={(e) => setForm({
                            ...form,
                            cardDetails: { ...form.cardDetails, name: e.target.value }
                          })}
                          style={inputStyle}
                          placeholder="FUGLY MCCHAOSFACE"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#FF8200';
                            e.currentTarget.style.background = '#1f2937';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#374151';
                            e.currentTarget.style.background = '#111827';
                          }}
                        />
                        {errors['card.name'] && (
                          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors['card.name']}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STRIPE MODE: Stripe Payment Elements */}
                  {form.paymentMethod === 'card' && isStripeMode() && createdOrderId && (
                    <div style={{ marginTop: '1rem' }}>
                      <StripeCheckout
                        orderId={createdOrderId}
                        amount={orderTotalCents}
                        onSuccess={() => handlePostPaymentSuccess(createdOrderId)}
                        onError={(error) => setErrors({ payment: error })}
                        onProcessingChange={setIsProcessing}
                      />
                    </div>
                  )}

                  {/* Stripe test mode subtle indicator */}
                  {PAYMENT_MODE === 'stripe-test' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 130, 0, 0.08)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(255, 130, 0, 0.15)',
                    }}>
                      <TestTube style={{ width: '0.875rem', height: '0.875rem', color: '#FF8200' }} />
                      <span style={{ fontSize: '0.8rem', color: '#FF8200' }}>
                        Stripe Test Mode — No real charges will be made. Use card 4242 4242 4242 4242.
                      </span>
                    </div>
                  )}

                  {/* Simulated mode: full test card banner */}
                  {isSimulatedMode() && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(255, 130, 0, 0.1)',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(255, 130, 0, 0.3)'
                    }}>
                      <TestTube style={{ width: '1.25rem', height: '1.25rem', color: '#FF8200', flexShrink: 0, marginTop: '0.125rem' }} />
                      <div style={{ fontSize: '0.875rem', color: '#FBDB65' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Test Mode Active</p>
                        <p style={{ marginBottom: '0.5rem' }}>This is a simulated checkout. No real payment will be processed.</p>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ fontWeight: 'bold', color: '#FBDB65' }}>View test card numbers</summary>
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            <p>4242 4242 4242 4242 - Success</p>
                            <p>4000 0000 0000 0002 - Declined</p>
                            <p>4000 0000 0000 9995 - Insufficient funds</p>
                            <p>4000 0000 0000 0069 - Expired card</p>
                            <p>4000 0000 0000 1000 - Slow network (5s)</p>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}

                  {/* Simulated mode: test card type display */}
                  {isSimulatedMode() && form.cardDetails.number && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                      Test card type: {formatTestCardDisplay(form.cardDetails.number)}
                    </div>
                  )}

                  {/* Error displays */}
                  {errors.payment && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0, marginTop: '0.125rem' }} />
                      <p style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 'bold' }}>{errors.payment}</p>
                    </div>
                  )}

                  {errors.submit && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1.25rem',
                      background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.1), rgba(139, 92, 246, 0.1))',
                      borderRadius: '0.75rem',
                      border: '2px solid #FF8200'
                    }}>
                      <Rocket style={{ width: '1.5rem', height: '1.5rem', color: '#FF8200', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '0.9rem', color: '#FBDB65', fontWeight: 'bold', marginBottom: '0.5rem' }}>{errors.submit}</p>
                        <a
                          href="/"
                          style={{
                            fontSize: '0.875rem',
                            color: '#FF8200',
                            textDecoration: 'underline',
                            fontWeight: 'bold'
                          }}
                        >
                          ← Back to Homepage
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Security Notice — shown when StripeCheckout isn't rendering its own */}
                  {!(isStripeMode() && createdOrderId) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      marginBottom: '1rem'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>
                        Your payment info is encrypted and secure • Powered by Stripe
                      </span>
                    </div>
                  )}

                  {/* Action buttons — only show when StripeCheckout isn't active (it has its own button) */}
                  {!(isStripeMode() && createdOrderId) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <button
                        onClick={handleBack}
                        style={{
                          ...buttonStyle,
                          background: 'transparent',
                          border: '2px solid #374151',
                          color: '#FBDB65'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#4b5563';
                          e.currentTarget.style.background = 'rgba(55, 65, 81, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#374151';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isProcessing || form.paymentMethod === 'fugly-credit'}
                        style={{
                          ...buttonStyle,
                          background: isProcessing || form.paymentMethod === 'fugly-credit' ? '#4b5563' : '#FF8200',
                          color: isProcessing || form.paymentMethod === 'fugly-credit' ? '#9ca3af' : '#111827',
                          cursor: isProcessing || form.paymentMethod === 'fugly-credit' ? 'not-allowed' : 'pointer',
                          opacity: isProcessing || form.paymentMethod === 'fugly-credit' ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isProcessing && form.paymentMethod !== 'fugly-credit') {
                            e.currentTarget.style.background = '#ea580c';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProcessing && form.paymentMethod !== 'fugly-credit') {
                            e.currentTarget.style.background = '#FF8200';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {isProcessing ? 'Preparing your order...' : isStripeMode() ? 'Proceed to Payment' : 'Unleash the Mayhem!'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}