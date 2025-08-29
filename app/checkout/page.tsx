'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';
import { ArrowLeft, CreditCard, Truck, Package, AlertCircle, TestTube } from 'lucide-react';
import Navigation from '@/app/components/Navigation';
import { simulatePayment, TEST_CARDS, formatTestCardDisplay } from '@/lib/payment-test-mode';
import dynamic from 'next/dynamic';
import { TestId, getTestId } from '@/lib/constants/test-ids';
import { analytics, AnalyticsEvent, useAnalytics } from '@/lib/analytics/analytics';
import { MetaPixelEvents } from '@/app/components/MetaPixel';
import TrustBadges from '@/app/components/TrustBadges';

// Dynamically import StripeCheckout to avoid SSR issues
const StripeCheckout = dynamic(() => import('@/app/components/StripeCheckout'), {
  ssr: false,
  loading: () => <div style={{ color: '#fdba74', textAlign: 'center' }}>Loading payment processor...</div>
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
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  
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

  // Redirect if cart is empty
  useEffect(() => {
    setMounted(true);
    if (items.length === 0) {
      router.push('/');
    } else {
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
  }, [items, router]);

  const subtotal = getTotalPrice();
  const shipping = subtotal > 5000 ? 0 : 999; // Free shipping over $50
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + shipping + tax;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.customerEmail) newErrors.customerEmail = 'Email is required';
      if (!form.customerEmail.includes('@')) newErrors.customerEmail = 'Invalid email';
      if (!form.customerName) newErrors.customerName = 'Name is required';
      if (!form.phone) newErrors.phone = 'Phone is required';
    }

    if (step === 2) {
      if (!form.shippingAddress.street) newErrors['shipping.street'] = 'Street address is required';
      if (!form.shippingAddress.city) newErrors['shipping.city'] = 'City is required';
      if (!form.shippingAddress.state) newErrors['shipping.state'] = 'State is required';
      if (!form.shippingAddress.zipCode) newErrors['shipping.zipCode'] = 'ZIP code is required';
    }

    if (step === 3) {
      if (form.paymentMethod === 'card') {
        if (!form.cardDetails.number) newErrors['card.number'] = 'Card number is required';
        if (!form.cardDetails.expiry) newErrors['card.expiry'] = 'Expiry date is required';
        if (!form.cardDetails.cvc) newErrors['card.cvc'] = 'CVC is required';
        if (!form.cardDetails.name) newErrors['card.name'] = 'Cardholder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsProcessing(true);

    try {
      // Format addresses
      const shippingAddress = `${form.shippingAddress.street}${form.shippingAddress.apartment ? ', ' + form.shippingAddress.apartment : ''}, ${form.shippingAddress.city}, ${form.shippingAddress.state} ${form.shippingAddress.zipCode}, ${form.shippingAddress.country}`;
      const billingAddress = form.billingAddress.sameAsShipping 
        ? shippingAddress 
        : `${form.billingAddress.street}${form.billingAddress.apartment ? ', ' + form.billingAddress.apartment : ''}, ${form.billingAddress.city}, ${form.billingAddress.state} ${form.billingAddress.zipCode}, ${form.billingAddress.country}`;

      // Create order
      const orderData = {
        customerEmail: form.customerEmail,
        customerName: form.customerName,
        customerPhone: form.phone,
        shippingAddress,
        billingAddress,
        items: items.map(item => ({
          itemType: item.type,
          ...(item.type === 'game' ? { gameId: item.id } : { merchId: item.id }),
          ...(item.type === 'merch' && item.size ? { merchSize: item.size } : {}),
          quantity: item.quantity,
          priceCents: item.priceCents
        }))
      };

      console.log('Cart items:', items);
      console.log('Submitting order:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();

      // Simulate payment processing
      const paymentResult = await simulatePayment(form.cardDetails.number);
      
      if (!paymentResult.success) {
        // Show payment error
        setErrors({ payment: paymentResult.error || 'Payment failed' });
        setIsProcessing(false);
        return;
      }

      // Clear cart and redirect to success page
      clearCart();
      router.push(`/order-confirmation?orderId=${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setErrors({ submit: errorMessage });
      alert(`Order failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' }}>
        <Navigation />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fdba74', fontSize: '1.5rem' }}>Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#111827',
    color: '#fde68a',
    borderRadius: '0.5rem',
    border: '2px solid #374151',
    outline: 'none',
    fontSize: '1rem',
    transition: 'all 0.3s',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    color: '#fdba74',
    fontWeight: 'bold' as const,
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  };

  const buttonStyle = {
    width: '100%',
    background: '#f97316',
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
          color: '#f97316',
          textAlign: 'center',
          marginBottom: '3rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          FUGLY CHECKOUT
        </h1>

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
                      background: currentStep >= step ? '#f97316' : '#374151',
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
                      color: currentStep >= step ? '#fdba74' : '#6b7280',
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
                      background: currentStep > step ? '#f97316' : '#374151',
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
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316', marginBottom: '1rem' }}>
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
                        e.currentTarget.style.borderColor = '#f97316';
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
                        e.currentTarget.style.borderColor = '#f97316';
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
                        e.currentTarget.style.borderColor = '#f97316';
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

                  <button
                    onClick={handleNext}
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ea580c';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f97316';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Continue to Shipping
                  </button>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316', marginBottom: '1rem' }}>
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
                        e.currentTarget.style.borderColor = '#f97316';
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
                        e.currentTarget.style.borderColor = '#f97316';
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
                          e.currentTarget.style.borderColor = '#f97316';
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
                          e.currentTarget.style.borderColor = '#f97316';
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
                        e.currentTarget.style.borderColor = '#f97316';
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      onClick={handleBack}
                      style={{
                        ...buttonStyle,
                        background: 'transparent',
                        border: '2px solid #374151',
                        color: '#fdba74'
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
                        e.currentTarget.style.background = '#f97316';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316', marginBottom: '1rem' }}>
                    PAY FOR THE CHAOS
                  </h2>
                  
                  {/* Trust Badge */}
                  <TrustBadges variant="compact" />
                  
                  {/* Order Summary */}
                  <div style={{
                    background: '#111827',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '2px solid #374151',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fdba74', marginBottom: '1rem' }}>
                      Order Summary
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      {items.map((item) => (
                        <div key={`${item.id}-${item.size || ''}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ color: '#fde68a', fontWeight: 'bold' }}>{item.name}</p>
                            {item.size && (
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Size: {item.size}</p>
                            )}
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Qty: {item.quantity}</p>
                          </div>
                          <p style={{ color: '#fdba74', fontWeight: 'bold' }}>
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
                        <span style={{ color: '#9ca3af' }}>Shipping</span>
                        <span style={{ color: '#d1d5db' }}>
                          {shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(2)}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca3af' }}>Tax</span>
                        <span style={{ color: '#d1d5db' }}>${(tax / 100).toFixed(2)}</span>
                      </div>
                      <div style={{ borderTop: '1px solid #374151', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316' }}>Total</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316' }}>
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
                      borderColor: form.paymentMethod === 'card' ? '#f97316' : '#374151',
                      transition: 'all 0.3s'
                    }}>
                      <input
                        type="radio"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={(e) => setForm({ ...form, paymentMethod: 'card' })}
                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#f97316' }}
                      />
                      <CreditCard style={{ width: '1.5rem', height: '1.5rem', color: '#f97316' }} />
                      <span style={{ fontWeight: 'bold', color: '#fdba74' }}>Credit/Debit Card</span>
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
                      borderColor: form.paymentMethod === 'fugly-credit' ? '#f97316' : '#374151',
                      opacity: 0.5,
                      transition: 'all 0.3s'
                    }}>
                      <input
                        type="radio"
                        value="fugly-credit"
                        checked={form.paymentMethod === 'fugly-credit'}
                        onChange={(e) => setForm({ ...form, paymentMethod: 'fugly-credit' })}
                        disabled
                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#f97316' }}
                      />
                      <Package style={{ width: '1.5rem', height: '1.5rem', color: '#f97316' }} />
                      <span style={{ fontWeight: 'bold', color: '#fdba74' }}>Fugly Credit (Coming Soon)</span>
                    </label>
                  </div>

                  {form.paymentMethod === 'card' && (
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
                            e.currentTarget.style.borderColor = '#f97316';
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
                              e.currentTarget.style.borderColor = '#f97316';
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
                              e.currentTarget.style.borderColor = '#f97316';
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
                            e.currentTarget.style.borderColor = '#f97316';
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

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(249, 115, 22, 0.3)'
                  }}>
                    <TestTube style={{ width: '1.25rem', height: '1.25rem', color: '#f97316', flexShrink: 0, marginTop: '0.125rem' }} />
                    <div style={{ fontSize: '0.875rem', color: '#fdba74' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🧪 Test Mode Active</p>
                      <p style={{ marginBottom: '0.5rem' }}>This is a simulated checkout. No real payment will be processed.</p>
                      <details style={{ cursor: 'pointer' }}>
                        <summary style={{ fontWeight: 'bold', color: '#fde68a' }}>View test card numbers →</summary>
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          <p>✅ 4242 4242 4242 4242 - Success</p>
                          <p>❌ 4000 0000 0000 0002 - Declined</p>
                          <p>💸 4000 0000 0000 9995 - Insufficient funds</p>
                          <p>⏱️ 4000 0000 0000 0069 - Expired card</p>
                          <p>🐌 4000 0000 0000 1000 - Slow network (5s)</p>
                        </div>
                      </details>
                    </div>
                  </div>

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

                  {form.cardDetails.number && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                      Test card type: {formatTestCardDisplay(form.cardDetails.number)}
                    </div>
                  )}

                  {/* Security Notice */}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      onClick={handleBack}
                      style={{
                        ...buttonStyle,
                        background: 'transparent',
                        border: '2px solid #374151',
                        color: '#fdba74'
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
                        background: isProcessing || form.paymentMethod === 'fugly-credit' ? '#4b5563' : '#f97316',
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
                          e.currentTarget.style.background = '#f97316';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {isProcessing ? 'Processing...' : 'Complete Order'}
                    </button>
                  </div>
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