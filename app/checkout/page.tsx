'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';
import { CreditCard, AlertCircle, TestTube, Rocket, X, User, Check, ChevronDown, ChevronUp, Loader2, Edit3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import Navigation from '@/app/components/Navigation';
import { simulatePayment, formatTestCardDisplay } from '@/lib/payment-test-mode';
import { getPaymentMode, isSimulatedMode, isStripeMode } from '@/lib/payment-mode';
import dynamic from 'next/dynamic';
import { analytics, AnalyticsEvent, useAnalytics } from '@/lib/analytics/analytics';
import { MetaPixelEvents } from '@/app/components/MetaPixel';
import TrustBadges from '@/app/components/TrustBadges';
import { colors, typography, spacing } from '@/lib/design-system';

const PAYMENT_MODE = getPaymentMode();

const STORE_STATUS = {
  isOpen: process.env.NEXT_PUBLIC_STORE_OPEN === 'true',
  launchDate: 'Spring 2026',
  allowTestOrders: false
};

const StripeCheckout = dynamic(() => import('@/app/components/StripeCheckout'), {
  ssr: false,
  loading: () => <div style={{ color: colors.creamYellow, textAlign: 'center' }}>Loading payment processor...</div>
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
  paymentMethod: 'card';
  cardDetails: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
};

// Phone formatting: (XXX) XXX-XXXX
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [signInDismissed, setSignInDismissed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderTotalCents, setOrderTotalCents] = useState<number>(0);
  const [taxInfo, setTaxInfo] = useState<{
    taxCents: number;
    isEstimate: boolean;
    breakdown?: { subtotalTaxCents: number; shippingTaxCents: number };
  }>({ taxCents: 0, isEstimate: true });
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false);

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

  // Responsive breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load persisted form data and redirect if cart is empty
  useEffect(() => {
    setMounted(true);

    if (sessionStorage.getItem('checkout-signin-dismissed') === 'true') {
      setSignInDismissed(true);
    }

    const savedForm = sessionStorage.getItem('checkout_form');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        setForm(prev => ({ ...prev, ...parsedForm, cardDetails: prev.cardDetails }));
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }

    if (items.length === 0 && !isNavigatingAway) {
      router.push('/');
    } else if (items.length > 0) {
      const cartValue = getTotalPrice();
      analytics.track(AnalyticsEvent.CHECKOUT_START, {
        cartItemCount: items.length,
        cartValue: cartValue
      });
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
        if (rates.length > 0 && !selectedShipping) {
          setSelectedShipping(rates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shipping rates:', error);
      setShippingRates([
        { carrier: 'USPS', carrierCode: 'usps', service: 'Priority Mail', serviceCode: 'usps_priority_mail', priceCents: 899, estimatedDays: 3, packageType: 'package' },
        { carrier: 'FedEx', carrierCode: 'fedex', service: 'Ground', serviceCode: 'fedex_ground', priceCents: 999, estimatedDays: 5, packageType: 'package' },
      ]);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Calculate tax
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
        const fallbackTax = Math.round(subtotal * 0.08);
        setTaxInfo({ taxCents: fallbackTax, isEstimate: true });
      }
    } catch (error) {
      console.error('Tax calculation error:', error);
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
      // Phone is optional — only validate format if provided
      if (form.phone) {
        const cleanPhone = form.phone.replace(/\D/g, '');
        if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
      }
    }

    if (step === 2) {
      if (!form.shippingAddress.street) newErrors['shipping.street'] = 'Street address is required';
      if (!form.shippingAddress.city) newErrors['shipping.city'] = 'City is required';
      if (!form.shippingAddress.state) newErrors['shipping.state'] = 'State is required';
      if (!form.shippingAddress.zipCode) newErrors['shipping.zipCode'] = 'ZIP code is required';
      if (!selectedShipping) newErrors['shipping.method'] = 'Please select a shipping method';
    }

    if (step === 3) {
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
      if (currentStep === 2) {
        await calculateTax(form.shippingAddress);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && form.shippingAddress.zipCode && form.shippingAddress.state) {
      const timer = setTimeout(() => {
        fetchShippingRates(form.shippingAddress);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, form.shippingAddress.zipCode, form.shippingAddress.state, form.shippingAddress.city, items]);

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
          submit: `${errorData.error || 'Store launching soon!'} Join our mailing list to be notified when we open!`
        });
        return null;
      }

      throw new Error(errorData.error || 'Failed to create order');
    }

    const order = await response.json();
    return { id: order.id, totalCents: order.totalCents || total };
  };

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
      setIsProcessing(true);
      setErrors({});

      try {
        const order = await handleCreateOrder();
        if (!order) { setIsProcessing(false); return; }

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

  // ── Styles ──────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: colors.textDark,
    color: colors.creamYellow,
    borderRadius: '0.375rem',
    border: `1px solid ${colors.bgCardHover}`,
    outline: 'none',
    fontSize: typography.small.fontSize,
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: colors.creamYellow,
    fontWeight: typography.label.fontWeight,
    fontSize: typography.xs.fontSize,
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    background: colors.primary,
    color: colors.textDark,
    padding: '0.875rem',
    borderRadius: '50px',
    fontWeight: 900,
    fontSize: typography.body.fontSize,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'center',
    gap: spacing.sm,
  };

  const secondaryBtnStyle: React.CSSProperties = {
    ...primaryBtnStyle,
    background: 'transparent',
    border: `2px solid ${colors.bgCardHover}`,
    color: colors.creamYellow,
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = colors.primary;
      e.currentTarget.style.background = colors.bgCard;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = colors.bgCardHover;
      e.currentTarget.style.background = colors.textDark;
    },
  };

  // ── Loading / empty state ──────────────────────────────────

  if (!mounted || items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: colors.gradientHero }}>
        <Navigation />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md }}>
            <Loader2 size={32} style={{ color: colors.primary, animation: 'spin 1s linear infinite' }} />
            <p style={{ color: colors.creamYellow, ...typography.bodyLarge }}>Loading checkout...</p>
          </div>
        </div>
        <style jsx global>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ── Progress Bar ───────────────────────────────────────────

  const steps = [
    { step: 1, label: 'Contact' },
    { step: 2, label: 'Shipping' },
    { step: 3, label: 'Payment' },
  ];

  const renderProgressBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, gap: '0' }}>
      {steps.map(({ step, label }) => {
        const isCompleted = currentStep > step;
        const isCurrent = currentStep === step;
        const isFuture = currentStep < step;

        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: isCompleted ? 'pointer' : 'default' }}
              onClick={() => isCompleted && setCurrentStep(step)}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8rem',
                background: isCompleted ? colors.success : isCurrent ? colors.primary : colors.bgCardHover,
                color: isCompleted || isCurrent ? 'white' : colors.textMuted,
                border: isCompleted ? `3px solid ${colors.success}` : isCurrent ? `3px solid ${colors.primary}` : `3px solid #4b5563`,
                transition: 'all 0.3s',
                animation: isCurrent ? 'pulse 2s infinite' : 'none',
              }}>
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
              </div>
              <span style={{
                marginTop: '2px',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isFuture ? colors.textMuted : colors.creamYellow,
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>
            {step < 3 && (
              <div style={{
                width: isMobile ? '3rem' : '5rem',
                height: '2px',
                margin: `0 ${isMobile ? '0.5rem' : '0.75rem'}`,
                marginBottom: '1.2rem',
                background: currentStep > step ? colors.primary : colors.bgCardHover,
                borderRadius: '2px',
                transition: 'all 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Order Summary (sidebar / accordion) ────────────────────

  const renderOrderSummary = () => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const summaryContent = (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {items.map((item) => (
            <div key={`${item.id}-${item.size || ''}-${item.color || ''}`} style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                overflow: 'hidden',
                background: colors.bgCardHover,
                flexShrink: 0,
                position: 'relative',
              }}>
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    unoptimized
                  />
                )}
                {item.quantity > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: colors.primary,
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                  }}>
                    {item.quantity}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: colors.creamYellow, fontWeight: 700, margin: 0, fontSize: typography.small.fontSize, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </p>
                {item.size && (
                  <p style={{ color: colors.textMuted, fontSize: typography.xs.fontSize, margin: 0 }}>Size: {item.size}</p>
                )}
              </div>
              <p style={{ color: colors.textSecondary, fontWeight: 700, margin: 0, fontSize: typography.small.fontSize, flexShrink: 0 }}>
                ${((item.priceCents * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${colors.bgCardHover}`, marginTop: spacing.sm, paddingTop: spacing.sm, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textMuted, ...typography.xs }}>Subtotal</span>
            <span style={{ color: colors.textSecondary, ...typography.xs }}>${(subtotal / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textMuted, ...typography.xs }}>
              Shipping
              {selectedShipping && (
                <span style={{ fontSize: '0.65rem', display: 'block', color: colors.textMuted }}>
                  {selectedShipping.carrier} {selectedShipping.service}
                </span>
              )}
            </span>
            <span style={{ color: colors.textSecondary, ...typography.xs }}>
              {currentStep >= 2 && selectedShipping ? `$${(shipping / 100).toFixed(2)}` : (
                <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>Calculated next</span>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textMuted, ...typography.xs }}>
              Tax
            </span>
            <span style={{ color: colors.textSecondary, ...typography.xs }}>
              {currentStep >= 3 ? (
                isCalculatingTax ? (
                  <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>Calculating...</span>
                ) : `$${(tax / 100).toFixed(2)}`
              ) : (
                <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>Calculated next</span>
              )}
            </span>
          </div>
          <div style={{ borderTop: `1px solid ${colors.bgCardHover}`, paddingTop: spacing.xs, display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
            <span style={{ ...typography.body, fontWeight: 900, color: colors.primary }}>Total</span>
            <span style={{ ...typography.body, fontWeight: 900, color: colors.primary }}>
              ${((currentStep >= 3 ? total : subtotal + shipping) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs, color: colors.textMuted, fontSize: typography.xs.fontSize, textDecoration: 'none', marginTop: spacing.sm }}>
          <Edit3 size={12} /> Edit cart
        </Link>
      </>
    );

    // Mobile: collapsible accordion
    if (isMobile) {
      return (
        <div style={{
          background: colors.bgCard,
          borderRadius: '0.75rem',
          border: `1px solid ${colors.bgCardHover}`,
          marginBottom: spacing.md,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.md,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.creamYellow,
            }}
          >
            <span style={{ ...typography.xs, fontWeight: 700 }}>
              Order Summary ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ ...typography.small, fontWeight: 900, color: colors.primary }}>
                ${((currentStep >= 3 ? total : subtotal + shipping) / 100).toFixed(2)}
              </span>
              {orderSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>
          {orderSummaryExpanded && (
            <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
              {summaryContent}
            </div>
          )}
        </div>
      );
    }

    // Desktop: sticky sidebar
    return (
      <div style={{
        position: 'sticky',
        top: spacing.md,
        background: colors.bgCard,
        borderRadius: '0.75rem',
        padding: spacing.md,
        border: `1px solid ${colors.bgCardHover}`,
        alignSelf: 'start',
      }}>
        <h3 style={{ ...typography.small, fontWeight: 700, color: colors.creamYellow, margin: `0 0 ${spacing.md}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Order Summary
        </h3>
        {summaryContent}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 130, 0, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255, 130, 0, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: colors.gradientHero }}>
        <Navigation />

        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: `${spacing.lg} ${spacing.page}` }}>
          {/* Page title */}
          <h1 style={{
            ...typography.h3,
            color: colors.primary,
            textAlign: 'center',
            marginBottom: spacing.md,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Checkout
          </h1>

          {/* Store Coming Soon Banner */}
          {!STORE_STATUS.isOpen && (
            <div style={{
              maxWidth: '48rem',
              margin: `0 auto ${spacing.xl}`,
              padding: spacing.lg,
              background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.15), rgba(125, 85, 199, 0.15))',
              borderRadius: '1rem',
              border: `3px solid ${colors.primary}`,
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(255, 130, 0, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Rocket style={{ width: '1.5rem', height: '1.5rem', color: colors.primary }} />
                <h2 style={{ ...typography.h3, color: colors.primary, margin: 0 }}>
                  STORE LAUNCHING {STORE_STATUS.launchDate.toUpperCase()}
                </h2>
                <Rocket style={{ width: '1.5rem', height: '1.5rem', color: colors.primary, transform: 'scaleX(-1)' }} />
              </div>
              <p style={{ color: colors.creamYellow, ...typography.body, marginBottom: spacing.sm, lineHeight: 1.5 }}>
                We&apos;re putting the finishing touches on our shop experience!
              </p>
              <p style={{ color: colors.textMuted, ...typography.small, margin: 0 }}>
                Feel free to explore checkout — this is a preview. No orders will be processed.
              </p>
            </div>
          )}

          {/* Sign-in nudge */}
          {!isSignedIn && !signInDismissed && (
            <div style={{
              maxWidth: '48rem',
              margin: `0 auto ${spacing.lg}`,
              padding: '0.875rem 1.25rem',
              background: 'rgba(255, 130, 0, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 130, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <User size={18} style={{ color: colors.primary, flexShrink: 0 }} />
                <span style={{ color: colors.textSecondary, ...typography.small }}>
                  Already have an account?{' '}
                  <Link href="/sign-in?redirect_url=/checkout" style={{ color: colors.primary, fontWeight: 700, textDecoration: 'none' }}>
                    Sign in
                  </Link>
                  {' '}for faster checkout.
                </span>
              </div>
              <button
                onClick={() => { setSignInDismissed(true); sessionStorage.setItem('checkout-signin-dismissed', 'true'); }}
                style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: spacing.xs, flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Progress bar */}
          {renderProgressBar()}

          {/* 2-column layout: forms + order summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
            gap: spacing.xl,
            maxWidth: isMobile ? '48rem' : 'none',
            margin: '0 auto',
          }}>
            {/* Left column: Step content */}
            <div>
              {/* Mobile: order summary accordion */}
              {isMobile && renderOrderSummary()}

              <div style={{
                background: colors.bgCard,
                borderRadius: '1rem',
                padding: spacing.lg,
                border: `2px solid ${colors.bgCardHover}`,
              }}>

                {/* ── Step 1: Contact Information ── */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                    <h2 style={{ ...typography.h4, color: colors.primary, margin: 0 }}>
                      Contact Information
                    </h2>

                    {/* Email */}
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        style={inputStyle}
                        placeholder=""
                        {...focusHandlers}
                      />
                      {errors.customerEmail && (
                        <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors.customerEmail}</p>
                      )}
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        marginTop: spacing.sm,
                        cursor: 'pointer',
                        ...typography.xs,
                        color: colors.textMuted,
                      }}>
                        <input
                          type="checkbox"
                          checked={marketingOptIn}
                          onChange={(e) => setMarketingOptIn(e.target.checked)}
                          style={{ accentColor: colors.primary, width: '1rem', height: '1rem', cursor: 'pointer' }}
                        />
                        Email me about new products and exclusive offers
                      </label>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input
                        type="text"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        style={inputStyle}
                        placeholder=""
                        {...focusHandlers}
                      />
                      {errors.customerName && (
                        <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors.customerName}</p>
                      )}
                    </div>

                    {/* Mobile Number (optional) */}
                    <div>
                      <label style={labelStyle}>
                        Mobile Number <span style={{ fontWeight: 400, color: colors.textMuted, textTransform: 'none' }}>(optional)</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })}
                        style={inputStyle}
                        placeholder=""
                        maxLength={14}
                        {...focusHandlers}
                      />
                      {errors.phone && (
                        <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors.phone}</p>
                      )}
                      {/* SMS opt-in: only show when a valid phone is entered */}
                      {form.phone.replace(/\D/g, '').length >= 10 && (
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          marginTop: spacing.sm,
                          cursor: 'pointer',
                          ...typography.xs,
                          color: colors.textMuted,
                        }}>
                          <input
                            type="checkbox"
                            checked={smsOptIn}
                            onChange={(e) => setSmsOptIn(e.target.checked)}
                            style={{ accentColor: colors.primary, width: '1rem', height: '1rem', cursor: 'pointer' }}
                          />
                          Text me order updates and shipping notifications
                        </label>
                      )}
                    </div>

                    {/* Continue */}
                    <button
                      onClick={handleNext}
                      style={primaryBtnStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryDark; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      Continue to Shipping
                    </button>
                  </div>
                )}

                {/* ── Step 2: Shipping Address ── */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                    <h2 style={{ ...typography.h4, color: colors.primary, margin: 0 }}>
                      Shipping Address
                    </h2>

                    <div>
                      <label style={labelStyle}>Street Address</label>
                      <input
                        type="text"
                        value={form.shippingAddress.street}
                        onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, street: e.target.value } })}
                        style={inputStyle}
                        placeholder=""
                        {...focusHandlers}
                      />
                      {errors['shipping.street'] && (
                        <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['shipping.street']}</p>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>Apartment / Suite <span style={{ fontWeight: 400, color: colors.textMuted, textTransform: 'none' }}>(optional)</span></label>
                      <input
                        type="text"
                        value={form.shippingAddress.apartment}
                        onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, apartment: e.target.value } })}
                        style={inputStyle}
                        placeholder=""
                        {...focusHandlers}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: spacing.md }}>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input
                          type="text"
                          value={form.shippingAddress.city}
                          onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, city: e.target.value } })}
                          style={inputStyle}
                          placeholder=""
                          {...focusHandlers}
                        />
                        {errors['shipping.city'] && (
                          <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['shipping.city']}</p>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>State</label>
                        <input
                          type="text"
                          value={form.shippingAddress.state}
                          onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, state: e.target.value } })}
                          style={inputStyle}
                          placeholder=""
                          maxLength={2}
                          {...focusHandlers}
                        />
                        {errors['shipping.state'] && (
                          <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['shipping.state']}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>ZIP Code</label>
                      <input
                        type="text"
                        value={form.shippingAddress.zipCode}
                        onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, zipCode: e.target.value } })}
                        style={inputStyle}
                        placeholder=""
                        {...focusHandlers}
                      />
                      {errors['shipping.zipCode'] && (
                        <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['shipping.zipCode']}</p>
                      )}
                    </div>

                    {/* Shipping Method Selection */}
                    <div style={{ marginTop: spacing.md }}>
                      <label style={labelStyle}>
                        Shipping Method
                        {isLoadingShipping && shippingRates.length > 0 && (
                          <span style={{ ...typography.xs, fontWeight: 400, color: colors.textMuted, marginLeft: spacing.sm }}>updating...</span>
                        )}
                      </label>
                      {shippingRates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, opacity: isLoadingShipping ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                          {shippingRates.map((rate) => (
                            <label
                              key={`${rate.carrierCode}-${rate.serviceCode}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: spacing.md,
                                background: colors.textDark,
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: selectedShipping?.serviceCode === rate.serviceCode ? colors.primary : colors.bgCardHover,
                                transition: 'all 0.2s',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                                <input
                                  type="radio"
                                  name="shippingMethod"
                                  checked={selectedShipping?.serviceCode === rate.serviceCode}
                                  onChange={() => setSelectedShipping(rate)}
                                  style={{ width: '1.25rem', height: '1.25rem', accentColor: colors.primary }}
                                />
                                <div>
                                  <p style={{ fontWeight: 700, color: colors.creamYellow, margin: 0 }}>
                                    {rate.carrier} {rate.service}
                                  </p>
                                  {rate.estimatedDays && (
                                    <p style={{ ...typography.small, color: colors.textMuted, margin: 0 }}>
                                      {rate.estimatedDays === 1 ? 'Next day' : `${rate.estimatedDays} business days`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span style={{ ...typography.bodyLarge, fontWeight: 700, color: colors.primary }}>
                                ${(rate.priceCents / 100).toFixed(2)}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : isLoadingShipping ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                          {[1, 2, 3].map((i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: spacing.md, background: colors.textDark, borderRadius: '0.75rem', border: `2px solid ${colors.bgCardHover}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                                <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: colors.bgCardHover }} />
                                <div>
                                  <div style={{ width: '120px', height: '1rem', background: colors.bgCardHover, borderRadius: '4px', marginBottom: spacing.xs }} />
                                  <div style={{ width: '80px', height: '0.75rem', background: '#2d3748', borderRadius: '4px' }} />
                                </div>
                              </div>
                              <div style={{ width: '50px', height: '1.25rem', background: colors.bgCardHover, borderRadius: '4px' }} />
                            </div>
                          ))}
                        </div>
                      ) : form.shippingAddress.zipCode && form.shippingAddress.state ? (
                        <div style={{
                          padding: spacing.md, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem',
                          border: '2px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', textAlign: 'center',
                        }}>
                          Unable to load shipping rates. Please verify your address.
                        </div>
                      ) : (
                        <div style={{
                          padding: spacing.md, background: colors.textDark, borderRadius: '0.5rem',
                          border: `2px solid ${colors.bgCardHover}`, color: colors.textMuted, textAlign: 'center',
                        }}>
                          Enter your ZIP code and state to see shipping options
                        </div>
                      )}
                      {errors['shipping.method'] && (
                        <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['shipping.method']}</p>
                      )}
                    </div>

                    {/* Navigation buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                      <button
                        onClick={handleBack}
                        style={secondaryBtnStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.background = 'rgba(55, 65, 81, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.bgCardHover; e.currentTarget.style.background = 'transparent'; }}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNext}
                        style={primaryBtnStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryDark; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Review & Pay ── */}
                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                    <h2 style={{ ...typography.h4, color: colors.primary, margin: 0 }}>
                      Review & Pay
                    </h2>

                    {/* Contact & Shipping Summary */}
                    <div style={{
                      background: colors.textDark,
                      borderRadius: '0.75rem',
                      padding: spacing.lg,
                      border: `1px solid ${colors.bgCardHover}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.md,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ ...typography.xs, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.xs, letterSpacing: '0.05em' }}>Contact</p>
                          <p style={{ color: colors.textSecondary, ...typography.small, margin: 0 }}>{form.customerEmail}</p>
                          <p style={{ color: colors.textSecondary, ...typography.small, margin: 0 }}>{form.customerName}</p>
                          {form.phone && <p style={{ color: colors.textMuted, ...typography.small, margin: 0 }}>{form.phone}</p>}
                        </div>
                        <button
                          onClick={() => setCurrentStep(1)}
                          style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing.xs, ...typography.xs, fontWeight: 600 }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      </div>
                      <div style={{ borderTop: `1px solid ${colors.bgCardHover}`, paddingTop: spacing.md }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ ...typography.xs, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.xs, letterSpacing: '0.05em' }}>Ship to</p>
                            <p style={{ color: colors.textSecondary, ...typography.small, margin: 0 }}>
                              {form.shippingAddress.street}{form.shippingAddress.apartment ? `, ${form.shippingAddress.apartment}` : ''}
                            </p>
                            <p style={{ color: colors.textSecondary, ...typography.small, margin: 0 }}>
                              {form.shippingAddress.city}, {form.shippingAddress.state} {form.shippingAddress.zipCode}
                            </p>
                          </div>
                          <button
                            onClick={() => setCurrentStep(2)}
                            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing.xs, ...typography.xs, fontWeight: 600 }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                        {selectedShipping && (
                          <p style={{ color: colors.textMuted, ...typography.xs, margin: `${spacing.xs} 0 0` }}>
                            {selectedShipping.carrier} {selectedShipping.service}
                            {selectedShipping.estimatedDays && ` — ${selectedShipping.estimatedDays === 1 ? 'Next day' : `${selectedShipping.estimatedDays} business days`}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Trust Badges */}
                    <TrustBadges variant="compact" />

                    {/* Order Summary on Step 3 (full detail) */}
                    <div style={{
                      background: colors.textDark,
                      borderRadius: '0.75rem',
                      padding: spacing.lg,
                      border: `2px solid ${colors.bgCardHover}`,
                    }}>
                      <h3 style={{ ...typography.h4, color: colors.creamYellow, marginBottom: spacing.md, margin: `0 0 ${spacing.md}` }}>
                        Order Summary
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.md }}>
                        {items.map((item) => (
                          <div key={`${item.id}-${item.size || ''}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ color: colors.creamYellow, fontWeight: 700, margin: 0 }}>{item.name}</p>
                              {item.size && <p style={{ color: colors.textMuted, ...typography.small, margin: 0 }}>Size: {item.size}</p>}
                              <p style={{ color: colors.textMuted, ...typography.small, margin: 0 }}>Qty: {item.quantity}</p>
                            </div>
                            <p style={{ color: colors.creamYellow, fontWeight: 700, margin: 0 }}>
                              ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div style={{ borderTop: `1px solid ${colors.bgCardHover}`, paddingTop: spacing.md, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: colors.textMuted }}>Subtotal</span>
                          <span style={{ color: colors.textSecondary }}>${(subtotal / 100).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: colors.textMuted }}>
                            Shipping
                            {selectedShipping && (
                              <span style={{ ...typography.xs, display: 'block', color: colors.textMuted }}>
                                {selectedShipping.carrier} {selectedShipping.service}
                              </span>
                            )}
                          </span>
                          <span style={{ color: colors.textSecondary }}>${(shipping / 100).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: colors.textMuted }}>Tax</span>
                          <span style={{ color: colors.textSecondary }}>
                            {isCalculatingTax ? (
                              <span style={{ ...typography.xs }}>Calculating...</span>
                            ) : `$${(tax / 100).toFixed(2)}`}
                          </span>
                        </div>
                        <div style={{ borderTop: `1px solid ${colors.bgCardHover}`, paddingTop: spacing.sm, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ ...typography.h4, fontWeight: 900, color: colors.primary }}>Total</span>
                          <span style={{ ...typography.h4, fontWeight: 900, color: colors.primary }}>${(total / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <CreditCard size={20} style={{ color: colors.primary }} />
                      <h3 style={{ ...typography.h4, color: colors.creamYellow, margin: 0 }}>Payment</h3>
                    </div>

                    {/* SIMULATED MODE: Custom card inputs */}
                    {form.paymentMethod === 'card' && isSimulatedMode() && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                        <div>
                          <label style={labelStyle}>Card Number</label>
                          <input
                            type="text"
                            value={form.cardDetails.number}
                            onChange={(e) => setForm({ ...form, cardDetails: { ...form.cardDetails, number: formatCardNumber(e.target.value) } })}
                            style={inputStyle}
                            placeholder="4242 4242 4242 4242"
                            maxLength={19}
                            {...focusHandlers}
                          />
                          {errors['card.number'] && (
                            <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['card.number']}</p>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                          <div>
                            <label style={labelStyle}>Expiry Date</label>
                            <input
                              type="text"
                              value={form.cardDetails.expiry}
                              onChange={(e) => setForm({ ...form, cardDetails: { ...form.cardDetails, expiry: formatExpiry(e.target.value) } })}
                              style={inputStyle}
                              placeholder="MM/YY"
                              maxLength={5}
                              {...focusHandlers}
                            />
                            {errors['card.expiry'] && (
                              <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['card.expiry']}</p>
                            )}
                          </div>
                          <div>
                            <label style={labelStyle}>CVC</label>
                            <input
                              type="text"
                              value={form.cardDetails.cvc}
                              onChange={(e) => setForm({ ...form, cardDetails: { ...form.cardDetails, cvc: e.target.value.replace(/\D/g, '') } })}
                              style={inputStyle}
                              placeholder="123"
                              maxLength={4}
                              {...focusHandlers}
                            />
                            {errors['card.cvc'] && (
                              <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['card.cvc']}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Cardholder Name</label>
                          <input
                            type="text"
                            value={form.cardDetails.name}
                            onChange={(e) => setForm({ ...form, cardDetails: { ...form.cardDetails, name: e.target.value } })}
                            style={inputStyle}
                            placeholder=""
                            {...focusHandlers}
                          />
                          {errors['card.name'] && (
                            <p style={{ color: colors.error, ...typography.small, marginTop: spacing.xs }}>{errors['card.name']}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STRIPE MODE: Stripe Payment Elements */}
                    {form.paymentMethod === 'card' && isStripeMode() && createdOrderId && (
                      <div>
                        <StripeCheckout
                          orderId={createdOrderId}
                          amount={orderTotalCents}
                          onSuccess={() => handlePostPaymentSuccess(createdOrderId)}
                          onError={(error) => setErrors({ payment: error })}
                          onProcessingChange={setIsProcessing}
                        />
                      </div>
                    )}

                    {/* Stripe test mode indicator */}
                    {PAYMENT_MODE === 'stripe-test' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: spacing.sm,
                        padding: '0.75rem 1rem', background: 'rgba(255, 130, 0, 0.08)',
                        borderRadius: '0.5rem', border: '1px solid rgba(255, 130, 0, 0.15)',
                      }}>
                        <TestTube style={{ width: '0.875rem', height: '0.875rem', color: colors.primary }} />
                        <span style={{ ...typography.xs, color: colors.primary }}>
                          Stripe Test Mode — No real charges. Use card 4242 4242 4242 4242.
                        </span>
                      </div>
                    )}

                    {/* Simulated mode: test card banner */}
                    {isSimulatedMode() && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: spacing.md,
                        padding: spacing.md, background: 'rgba(255, 130, 0, 0.1)',
                        borderRadius: '0.75rem', border: '2px solid rgba(255, 130, 0, 0.3)',
                      }}>
                        <TestTube style={{ width: '1.25rem', height: '1.25rem', color: colors.primary, flexShrink: 0, marginTop: '0.125rem' }} />
                        <div style={{ ...typography.small, color: colors.creamYellow }}>
                          <p style={{ fontWeight: 700, marginBottom: spacing.sm }}>Test Mode Active</p>
                          <p style={{ marginBottom: spacing.sm }}>This is a simulated checkout. No real payment will be processed.</p>
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ fontWeight: 700, color: colors.creamYellow }}>View test card numbers</summary>
                            <div style={{ marginTop: spacing.sm, display: 'flex', flexDirection: 'column', gap: spacing.xs, ...typography.xs, fontFamily: 'monospace' }}>
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

                    {/* Test card type display */}
                    {isSimulatedMode() && form.cardDetails.number && (
                      <div style={{ ...typography.xs, color: colors.textMuted, textAlign: 'center' }}>
                        Test card type: {formatTestCardDisplay(form.cardDetails.number)}
                      </div>
                    )}

                    {/* Error displays */}
                    {errors.payment && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: spacing.md,
                        padding: spacing.md, background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '0.75rem', border: '2px solid rgba(239, 68, 68, 0.3)',
                      }}>
                        <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: colors.error, flexShrink: 0, marginTop: '0.125rem' }} />
                        <p style={{ ...typography.small, color: colors.error, fontWeight: 700 }}>{errors.payment}</p>
                      </div>
                    )}

                    {errors.submit && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: spacing.md,
                        padding: '1.25rem', background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.1), rgba(125, 85, 199, 0.1))',
                        borderRadius: '0.75rem', border: `2px solid ${colors.primary}`,
                      }}>
                        <Rocket style={{ width: '1.5rem', height: '1.5rem', color: colors.primary, flexShrink: 0 }} />
                        <div>
                          <p style={{ ...typography.small, color: colors.creamYellow, fontWeight: 700, marginBottom: spacing.sm }}>{errors.submit}</p>
                          <a href="/" style={{ ...typography.small, color: colors.primary, textDecoration: 'underline', fontWeight: 700 }}>
                            Back to Homepage
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Security Notice */}
                    {!(isStripeMode() && createdOrderId) && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
                        padding: spacing.sm, background: 'rgba(16, 185, 129, 0.05)',
                        borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2">
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                        <span style={{ ...typography.xs, color: colors.success, fontWeight: 700 }}>
                          Your payment info is encrypted and secure
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!(isStripeMode() && createdOrderId) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                        <button
                          onClick={handleBack}
                          style={secondaryBtnStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.background = 'rgba(55, 65, 81, 0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.bgCardHover; e.currentTarget.style.background = 'transparent'; }}
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isProcessing}
                          style={{
                            ...primaryBtnStyle,
                            background: isProcessing ? '#4b5563' : colors.primary,
                            color: isProcessing ? colors.textMuted : colors.textDark,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isProcessing) { e.currentTarget.style.background = colors.primaryDark; e.currentTarget.style.transform = 'scale(1.02)'; }
                          }}
                          onMouseLeave={(e) => {
                            if (!isProcessing) { e.currentTarget.style.background = colors.primary; e.currentTarget.style.transform = 'scale(1)'; }
                          }}
                        >
                          {isProcessing ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Order summary sidebar (desktop only) */}
            {!isMobile && renderOrderSummary()}
          </div>
        </div>
      </div>
    </>
  );
}
