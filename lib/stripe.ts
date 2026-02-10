import Stripe from 'stripe';
import { isStripeTestKeys } from '@/lib/payment-mode';

// Derive Stripe key selection from the single NEXT_PUBLIC_CHECKOUT_MODE env var
export const isStripeTestMode = isStripeTestKeys();

// Get the appropriate secret key based on mode
const getSecretKey = () => {
  if (isStripeTestMode) {
    return process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
  }
  return process.env.STRIPE_SECRET_KEY;
};

const secretKey = getSecretKey();

if (!secretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be limited.');
}

export const stripe = secretKey
  ? new Stripe(secretKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  : null;

export const getStripePublishableKey = () => {
  if (isStripeTestMode) {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST ||
           process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
};

export const formatAmountForStripe = (amount: number, currency: string = 'usd'): number => {
  // Stripe expects amounts in the smallest currency unit (cents for USD)
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number, currency: string = 'usd'): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount / 100);
};