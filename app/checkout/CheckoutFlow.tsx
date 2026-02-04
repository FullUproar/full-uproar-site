'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cartStore';
import {
  CreditCard, Truck, Package, User, MapPin, Plus, Check,
  ChevronRight, ShoppingCart, Lock, ArrowLeft, Edit2,
  Home, Building, Globe, Tag, X, Loader2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Support test/live mode switching via NEXT_PUBLIC_STRIPE_MODE
const isTestMode = process.env.NEXT_PUBLIC_STRIPE_MODE === 'test';
const stripePublishableKey = isTestMode
  ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
const stripePromise = loadStripe(stripePublishableKey);

interface Address {
  id: string;
  nickname?: string;
  isDefault: boolean;
  fullName: string;
  phone?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentMethod {
  id: string;
  stripePaymentId: string;
  type: string;
  isDefault: boolean;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  nickname?: string;
}

type CheckoutStep = 'shipping' | 'payment' | 'review';

export default function CheckoutFlow() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { items, getTotalPrice, clearCart } = useCartStore();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [isLoading, setIsLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValidating, setPromoCodeValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: number;
    code: string;
    discountCents: number;
    discountType: string;
    discountValue: number;
    message: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // New address form
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    fullName: user?.fullName || '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    nickname: ''
  });

  // Fetch saved addresses and payment methods
  useEffect(() => {
    if (isSignedIn && user) {
      fetchSavedData();
    }
  }, [isSignedIn, user]);

  const fetchSavedData = async () => {
    try {
      // Fetch saved addresses
      const addressRes = await fetch('/api/user/addresses');
      if (addressRes.ok) {
        const addresses = await addressRes.json();
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find((a: Address) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      }

      // Fetch saved payment methods
      const paymentRes = await fetch('/api/user/payment-methods');
      if (paymentRes.ok) {
        const methods = await paymentRes.json();
        setSavedPaymentMethods(methods);
        const defaultMethod = methods.find((m: PaymentMethod) => m.isDefault);
        if (defaultMethod) setSelectedPaymentId(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching saved data:', error);
    }
  };

  const saveNewAddress = async () => {
    if (!isSignedIn) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });
      
      if (res.ok) {
        const savedAddr = await res.json();
        setSavedAddresses([...savedAddresses, savedAddr]);
        setSelectedAddressId(savedAddr.id);
        setShowNewAddress(false);
      }
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToPayment = () => {
    if (!selectedAddressId && !showNewAddress) {
      alert('Please select or add a shipping address');
      return;
    }
    setCurrentStep('payment');
  };

  const proceedToReview = async () => {
    if (!selectedPaymentId && !showNewPayment) {
      alert('Please select or add a payment method');
      return;
    }
    setCurrentStep('review');
    
    // Create the order
    await createOrder();
  };

  const createOrder = async () => {
    setIsLoading(true);
    try {
      const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId) || newAddress;
      
      const orderData = {
        customerEmail: user?.emailAddresses[0]?.emailAddress || '',
        customerName: selectedAddr.fullName,
        customerPhone: selectedAddr.phone,
        shippingAddress: `${selectedAddr.street}${selectedAddr.apartment ? ', ' + selectedAddr.apartment : ''}, ${selectedAddr.city}, ${selectedAddr.state} ${selectedAddr.zipCode}`,
        billingAddress: `${selectedAddr.street}${selectedAddr.apartment ? ', ' + selectedAddr.apartment : ''}, ${selectedAddr.city}, ${selectedAddr.state} ${selectedAddr.zipCode}`,
        items: items.map(item => ({
          itemType: item.type,
          ...(item.type === 'game' ? { gameId: item.id } : { merchId: item.id }),
          ...(item.type === 'merch' && item.size ? { merchSize: item.size } : {}),
          quantity: item.quantity,
          priceCents: item.priceCents
        })),
        // Promo code data
        promoCodeId: appliedPromo?.id || null,
        discountCents: appliedPromo?.discountCents || 0,
        promoCodeUsed: appliedPromo?.code || null
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        const order = await res.json();
        setOrderId(order.id);
        
        // Create payment intent
        const paymentRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: order.totalCents,
            paymentMethodId: selectedPaymentId
          })
        });
        
        if (paymentRes.ok) {
          const { clientSecret } = await paymentRes.json();
          setClientSecret(clientSecret);
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOrder = async () => {
    setIsLoading(true);
    try {
      // Clear cart and redirect
      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Promo code validation
  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setPromoCodeValidating(true);
    setPromoError(null);

    try {
      const cartItems = items.map(item => ({
        id: item.id,
        type: item.type as 'game' | 'merch',
        priceCents: item.priceCents,
        quantity: item.quantity
      }));

      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          cartItems,
          userEmail: user?.primaryEmailAddress?.emailAddress
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedPromo({
          id: data.promoCode.id,
          code: data.promoCode.code,
          discountCents: data.discount.cents,
          discountType: data.promoCode.discountType,
          discountValue: data.promoCode.discountValue,
          message: data.message
        });
        setPromoCode('');
      } else {
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError('Failed to validate promo code');
    } finally {
      setPromoCodeValidating(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Calculate totals
  const subtotal = getTotalPrice();
  const discount = appliedPromo?.discountCents || 0;
  const shipping = subtotal > 5000 ? 0 : 999;
  const taxableAmount = subtotal - discount;
  const tax = Math.round(Math.max(0, taxableAmount) * 0.08);
  const total = Math.max(0, subtotal - discount) + shipping + tax;

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #0a0a0a, #1a1a2e, #16213e)',
    paddingTop: '2rem',
    paddingBottom: '4rem'
  };

  const stepIndicatorStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '3rem',
    padding: '0 1rem'
  };

  const stepStyle = (isActive: boolean, isCompleted: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '50px',
    background: isActive ? '#FF8200' : isCompleted ? '#10b981' : '#374151',
    color: isActive || isCompleted ? '#000' : '#9ca3af',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  });

  const mainContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem'
  };

  const sectionStyle = {
    background: 'rgba(31, 41, 59, 0.5)',
    borderRadius: '16px',
    padding: '2rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 130, 0, 0.2)'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FBDB65',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  };

  const addressCardStyle = (isSelected: boolean) => ({
    padding: '1rem',
    borderRadius: '12px',
    border: `2px solid ${isSelected ? '#FF8200' : '#374151'}`,
    background: isSelected ? 'rgba(255, 130, 0, 0.1)' : 'rgba(55, 65, 81, 0.3)',
    cursor: 'pointer',
    marginBottom: '1rem',
    transition: 'all 0.2s'
  });

  const buttonStyle = {
    padding: '1rem 2rem',
    background: '#FF8200',
    color: '#000',
    borderRadius: '50px',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s'
  };

  return (
    <div style={containerStyle}>
      {/* Step Indicator */}
      <div style={stepIndicatorStyle}>
        <div style={stepStyle(currentStep === 'shipping', false)}>
          <MapPin size={20} />
          <span>Shipping</span>
        </div>
        <ChevronRight style={{ color: '#6b7280', margin: '0 1rem' }} />
        <div style={stepStyle(currentStep === 'payment', currentStep === 'review')}>
          <CreditCard size={20} />
          <span>Payment</span>
        </div>
        <ChevronRight style={{ color: '#6b7280', margin: '0 1rem' }} />
        <div style={stepStyle(currentStep === 'review', false)}>
          <Check size={20} />
          <span>Review</span>
        </div>
      </div>

      <div style={mainContentStyle}>
        {/* Main Content */}
        <div>
          {currentStep === 'shipping' && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>
                <Truck size={24} />
                Shipping Address
              </h2>

              {/* Saved Addresses */}
              {isSignedIn && savedAddresses.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Saved Addresses</h3>
                  {savedAddresses.map(addr => (
                    <div
                      key={addr.id}
                      style={addressCardStyle(selectedAddressId === addr.id)}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#FBDB65', marginBottom: '0.25rem' }}>
                            {addr.nickname || 'Address'}
                            {addr.isDefault && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.75rem', 
                                background: '#10b981', 
                                color: '#000',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px'
                              }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#e2e8f0' }}>{addr.fullName}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            {addr.street}{addr.apartment && `, ${addr.apartment}`}<br />
                            {addr.city}, {addr.state} {addr.zipCode}
                          </div>
                          {addr.phone && (
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                              Phone: {addr.phone}
                            </div>
                          )}
                        </div>
                        <button
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Address Button */}
              {!showNewAddress && (
                <button
                  onClick={() => setShowNewAddress(true)}
                  style={{
                    ...buttonStyle,
                    background: 'transparent',
                    border: '2px dashed #FF8200',
                    color: '#FF8200',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={20} />
                  Add New Address
                </button>
              )}

              {/* New Address Form */}
              {showNewAddress && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>New Address</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      style={{
                        padding: '0.75rem',
                        background: '#1f2937',
                        border: '2px solid #374151',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      style={{
                        padding: '0.75rem',
                        background: '#1f2937',
                        border: '2px solid #374151',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      style={{
                        padding: '0.75rem',
                        background: '#1f2937',
                        border: '2px solid #374151',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Apartment, Suite, etc. (optional)"
                      value={newAddress.apartment}
                      onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                      style={{
                        padding: '0.75rem',
                        background: '#1f2937',
                        border: '2px solid #374151',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        style={{
                          padding: '0.75rem',
                          background: '#1f2937',
                          border: '2px solid #374151',
                          borderRadius: '8px',
                          color: '#e2e8f0'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        style={{
                          padding: '0.75rem',
                          background: '#1f2937',
                          border: '2px solid #374151',
                          borderRadius: '8px',
                          color: '#e2e8f0'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="ZIP"
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        style={{
                          padding: '0.75rem',
                          background: '#1f2937',
                          border: '2px solid #374151',
                          borderRadius: '8px',
                          color: '#e2e8f0'
                        }}
                      />
                    </div>
                    {isSignedIn && (
                      <input
                        type="text"
                        placeholder="Save as (e.g., Home, Work)"
                        value={newAddress.nickname}
                        onChange={(e) => setNewAddress({ ...newAddress, nickname: e.target.value })}
                        style={{
                          padding: '0.75rem',
                          background: '#1f2937',
                          border: '2px solid #374151',
                          borderRadius: '8px',
                          color: '#e2e8f0'
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    {isSignedIn && (
                      <button
                        onClick={saveNewAddress}
                        disabled={isLoading}
                        style={buttonStyle}
                      >
                        Save Address
                      </button>
                    )}
                    <button
                      onClick={() => setShowNewAddress(false)}
                      style={{
                        ...buttonStyle,
                        background: '#374151',
                        color: '#e2e8f0'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              {!showNewAddress && (
                <button
                  onClick={proceedToPayment}
                  style={{ ...buttonStyle, width: '100%', justifyContent: 'center', marginTop: '2rem' }}
                >
                  Continue to Payment
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          )}

          {currentStep === 'payment' && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>
                <CreditCard size={24} />
                Payment Method
              </h2>

              {/* Saved Payment Methods */}
              {isSignedIn && savedPaymentMethods.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Saved Cards</h3>
                  {savedPaymentMethods.map(method => (
                    <div
                      key={method.id}
                      style={addressCardStyle(selectedPaymentId === method.id)}
                      onClick={() => setSelectedPaymentId(method.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#FBDB65', marginBottom: '0.25rem' }}>
                            {method.nickname || `${method.brand?.toUpperCase()} ****${method.last4}`}
                            {method.isDefault && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.75rem', 
                                background: '#10b981', 
                                color: '#000',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px'
                              }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            Expires {method.expMonth}/{method.expYear}
                          </div>
                        </div>
                        <CreditCard size={24} style={{ color: '#94a3b8' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stripe Payment Element */}
              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentElement />
                </Elements>
              )}

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setCurrentStep('shipping')}
                  style={{
                    ...buttonStyle,
                    background: '#374151',
                    color: '#e2e8f0'
                  }}
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                <button
                  onClick={proceedToReview}
                  style={{ ...buttonStyle, flex: 1, justifyContent: 'center' }}
                >
                  Continue to Review
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>
                <Package size={24} />
                Review Your Order
              </h2>

              {/* Order Summary */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Items ({items.length})</h3>
                {items.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    padding: '1rem',
                    background: 'rgba(55, 65, 81, 0.3)',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}>
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#FBDB65', fontWeight: 'bold' }}>{item.name}</div>
                      {item.size && <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Size: {item.size}</div>}
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ color: '#FF8200', fontWeight: 'bold' }}>
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Summary */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Shipping To</h3>
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(55, 65, 81, 0.3)',
                  borderRadius: '8px'
                }}>
                  {selectedAddressId && savedAddresses.find(a => a.id === selectedAddressId) ? (
                    <div>
                      <div style={{ color: '#FBDB65', fontWeight: 'bold' }}>
                        {savedAddresses.find(a => a.id === selectedAddressId)?.fullName}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {savedAddresses.find(a => a.id === selectedAddressId)?.street}
                        {savedAddresses.find(a => a.id === selectedAddressId)?.apartment && 
                          `, ${savedAddresses.find(a => a.id === selectedAddressId)?.apartment}`}
                        <br />
                        {savedAddresses.find(a => a.id === selectedAddressId)?.city}, {' '}
                        {savedAddresses.find(a => a.id === selectedAddressId)?.state} {' '}
                        {savedAddresses.find(a => a.id === selectedAddressId)?.zipCode}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: '#FBDB65', fontWeight: 'bold' }}>{newAddress.fullName}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {newAddress.street}{newAddress.apartment && `, ${newAddress.apartment}`}<br />
                        {newAddress.city}, {newAddress.state} {newAddress.zipCode}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Order Button */}
              <button
                onClick={completeOrder}
                disabled={isLoading}
                style={{ 
                  ...buttonStyle, 
                  width: '100%', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #FF8200, #ea580c)',
                  fontSize: '1.25rem',
                  padding: '1.25rem'
                }}
              >
                <Lock size={24} />
                {isLoading ? 'Processing...' : `Complete Order - $${(total / 100).toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div style={sectionStyle}>
            <h3 style={{ color: '#FBDB65', fontWeight: 'bold', marginBottom: '1rem' }}>
              Order Summary
            </h3>
            
            <div style={{ borderBottom: '1px solid #374151', paddingBottom: '1rem', marginBottom: '1rem' }}>
              {items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.875rem'
                }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div style={{ borderBottom: '1px solid #374151', paddingBottom: '1rem', marginBottom: '1rem' }}>
              {appliedPromo ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={16} style={{ color: '#22c55e' }} />
                    <span style={{ color: '#22c55e', fontWeight: '500' }}>{appliedPromo.code}</span>
                    <span style={{ color: '#86efac', fontSize: '0.75rem' }}>
                      {appliedPromo.message}
                    </span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove promo code"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError(null);
                      }}
                      placeholder="Promo code"
                      style={{
                        flex: 1,
                        padding: '0.625rem 0.75rem',
                        background: '#1f2937',
                        border: promoError ? '1px solid #ef4444' : '1px solid #374151',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          validatePromoCode();
                        }
                      }}
                    />
                    <button
                      onClick={validatePromoCode}
                      disabled={promoCodeValidating || !promoCode.trim()}
                      style={{
                        padding: '0.625rem 1rem',
                        background: promoCodeValidating || !promoCode.trim() ? '#374151' : '#FF8200',
                        border: 'none',
                        borderRadius: '6px',
                        color: promoCodeValidating || !promoCode.trim() ? '#6b7280' : 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: promoCodeValidating || !promoCode.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {promoCodeValidating ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>...</span>
                        </>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  {promoError && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      {promoError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Subtotal</span>
                <span style={{ color: '#e2e8f0' }}>${(subtotal / 100).toFixed(2)}</span>
              </div>
              {appliedPromo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>Discount ({appliedPromo.code})</span>
                  <span style={{ color: '#22c55e' }}>-${(discount / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Shipping</span>
                <span style={{ color: '#e2e8f0' }}>
                  {shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Tax</span>
                <span style={{ color: '#e2e8f0' }}>${(tax / 100).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ 
              borderTop: '2px solid #FF8200', 
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>
              <span style={{ color: '#FBDB65' }}>Total</span>
              <span style={{ color: '#FF8200' }}>${(total / 100).toFixed(2)}</span>
            </div>

            {shipping === 0 && (
              <div style={{ 
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                🎉 You qualify for FREE shipping!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}