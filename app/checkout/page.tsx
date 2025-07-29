'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cartStore';
import { ArrowLeft, CreditCard, Truck, Package, AlertCircle, TestTube } from 'lucide-react';
import FuglyLogo from '@/app/components/FuglyLogo';
import { simulatePayment, TEST_CARDS, formatTestCardDisplay } from '@/lib/payment-test-mode';

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
    if (items.length === 0) {
      router.push('/');
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
        shippingAddress,
        billingAddress,
        totalCents: total,
        shippingCents: shipping,
        taxCents: tax,
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
        throw new Error('Failed to create order');
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
      alert('Something went wrong. Fugly is investigating!');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-600">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-gray-900/90 border-b-4 border-orange-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to chaos
            </button>
            <div className="flex items-center gap-3">
              <FuglyLogo size={50} />
              <span className="text-2xl font-black text-orange-500">CHECKOUT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main checkout form */}
          <div className="lg:col-span-2">
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${currentStep >= step ? 'bg-orange-500 text-gray-900' : 'bg-gray-700 text-gray-400'}
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-full h-1 mx-2
                      ${currentStep > step ? 'bg-orange-500' : 'bg-gray-700'}
                    `} style={{ width: '100px' }} />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20">
              {/* Step 1: Contact Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-orange-500">Contact Information</h2>
                  
                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Email</label>
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="fugly@chaos.com"
                    />
                    {errors.customerEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Full Name</label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Fugly McChaosFace"
                    />
                    {errors.customerName && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-yellow-400 font-bold mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="555-CHAOS-666"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-gray-900 font-black py-4 rounded-lg transition-all transform hover:scale-105"
                  >
                    Continue to Shipping
                  </button>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-orange-500">Shipping Address</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-yellow-400 font-bold mb-2">Street Address</label>
                      <input
                        type="text"
                        value={form.shippingAddress.street}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, street: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="666 Chaos Street"
                      />
                      {errors['shipping.street'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['shipping.street']}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-yellow-400 font-bold mb-2">Apartment/Suite (optional)</label>
                      <input
                        type="text"
                        value={form.shippingAddress.apartment}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, apartment: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Apt 13"
                      />
                    </div>

                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">City</label>
                      <input
                        type="text"
                        value={form.shippingAddress.city}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, city: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Chaos City"
                      />
                      {errors['shipping.city'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['shipping.city']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">State</label>
                      <input
                        type="text"
                        value={form.shippingAddress.state}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, state: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="XX"
                        maxLength={2}
                      />
                      {errors['shipping.state'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['shipping.state']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-yellow-400 font-bold mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={form.shippingAddress.zipCode}
                        onChange={(e) => setForm({ 
                          ...form, 
                          shippingAddress: { ...form.shippingAddress, zipCode: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="12345"
                      />
                      {errors['shipping.zipCode'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['shipping.zipCode']}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-gray-900 font-black py-4 rounded-lg transition-all transform hover:scale-105"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-orange-500">Payment Method</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <input
                        type="radio"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={(e) => setForm({ ...form, paymentMethod: 'card' })}
                        className="w-5 h-5 text-orange-500"
                      />
                      <CreditCard className="h-6 w-6 text-orange-500" />
                      <span className="font-bold text-yellow-400">Credit/Debit Card</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <input
                        type="radio"
                        value="fugly-credit"
                        checked={form.paymentMethod === 'fugly-credit'}
                        onChange={(e) => setForm({ ...form, paymentMethod: 'fugly-credit' })}
                        className="w-5 h-5 text-orange-500"
                      />
                      <Package className="h-6 w-6 text-orange-500" />
                      <span className="font-bold text-yellow-400">Fugly Credit (Coming Soon)</span>
                    </label>
                  </div>

                  {form.paymentMethod === 'card' && (
                    <div className="space-y-4 mt-6">
                      <div>
                        <label className="block text-yellow-400 font-bold mb-2">Card Number</label>
                        <input
                          type="text"
                          value={form.cardDetails.number}
                          onChange={(e) => setForm({ 
                            ...form, 
                            cardDetails: { ...form.cardDetails, number: formatCardNumber(e.target.value) }
                          })}
                          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                        />
                        {errors['card.number'] && (
                          <p className="text-red-500 text-sm mt-1">{errors['card.number']}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-yellow-400 font-bold mb-2">Expiry Date</label>
                          <input
                            type="text"
                            value={form.cardDetails.expiry}
                            onChange={(e) => setForm({ 
                              ...form, 
                              cardDetails: { ...form.cardDetails, expiry: formatExpiry(e.target.value) }
                            })}
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                          {errors['card.expiry'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['card.expiry']}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-yellow-400 font-bold mb-2">CVC</label>
                          <input
                            type="text"
                            value={form.cardDetails.cvc}
                            onChange={(e) => setForm({ 
                              ...form, 
                              cardDetails: { ...form.cardDetails, cvc: e.target.value.replace(/\D/g, '') }
                            })}
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="123"
                            maxLength={4}
                          />
                          {errors['card.cvc'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['card.cvc']}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-yellow-400 font-bold mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          value={form.cardDetails.name}
                          onChange={(e) => setForm({ 
                            ...form, 
                            cardDetails: { ...form.cardDetails, name: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="FUGLY MCCHAOSFACE"
                        />
                        {errors['card.name'] && (
                          <p className="text-red-500 text-sm mt-1">{errors['card.name']}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-lg border-2 border-orange-500/30">
                    <TestTube className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-400">
                      <p className="font-bold mb-2">🧪 Test Mode Active</p>
                      <p className="mb-2">This is a simulated checkout. No real payment will be processed.</p>
                      <details className="cursor-pointer">
                        <summary className="font-bold hover:text-yellow-300">View test card numbers →</summary>
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="font-mono">✅ 4242 4242 4242 4242 - Success</p>
                          <p className="font-mono">❌ 4000 0000 0000 0002 - Declined</p>
                          <p className="font-mono">💸 4000 0000 0000 9995 - Insufficient funds</p>
                          <p className="font-mono">⏱️ 4000 0000 0000 0069 - Expired card</p>
                          <p className="font-mono">🐌 4000 0000 0000 1000 - Slow network (5s)</p>
                        </div>
                      </details>
                    </div>
                  </div>

                  {errors.payment && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border-2 border-red-500/30">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400 font-bold">{errors.payment}</p>
                    </div>
                  )}

                  {form.cardDetails.number && (
                    <div className="text-xs text-gray-500 text-center">
                      Test card type: {formatTestCardDisplay(form.cardDetails.number)}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing || form.paymentMethod === 'fugly-credit'}
                      className={`
                        flex-1 font-black py-4 rounded-lg transition-all transform
                        ${isProcessing || form.paymentMethod === 'fugly-credit'
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600 text-gray-900 hover:scale-105'
                        }
                      `}
                    >
                      {isProcessing ? 'Processing...' : 'Complete Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border-4 border-orange-500/20 sticky top-24">
              <h3 className="text-xl font-black text-orange-500 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size || ''}`} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-bold text-yellow-400">{item.name}</p>
                      {item.size && (
                        <p className="text-gray-400">Size: {item.size}</p>
                      )}
                      <p className="text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-white">
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">
                    {shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-white">${(tax / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-gray-700 pt-4 mt-4">
                <span className="text-xl font-black text-orange-500">Total</span>
                <span className="text-xl font-black text-white">${(total / 100).toFixed(2)}</span>
              </div>

              {shipping === 0 && (
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-sm text-green-400 font-bold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    You qualified for FREE shipping!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}