/**
 * Unified payment mode — ONE env var controls everything.
 *
 * NEXT_PUBLIC_CHECKOUT_MODE:
 *   'dev'  — Simulated payments, no Stripe needed
 *   'test' — Real Stripe with test keys (no real charges)
 *   'live' — Real Stripe with live keys (production)
 *
 * Defaults to 'dev' if not set.
 */

export type PaymentMode = 'simulated' | 'stripe-test' | 'stripe-live';

const RAW_MODE = process.env.NEXT_PUBLIC_CHECKOUT_MODE || 'dev';

export function getPaymentMode(): PaymentMode {
  if (RAW_MODE === 'live') return 'stripe-live';
  if (RAW_MODE === 'test') return 'stripe-test';
  return 'simulated';
}

/** True when using the simulated card form (dev mode, no Stripe) */
export function isSimulatedMode(): boolean {
  return getPaymentMode() === 'simulated';
}

/** True when using real Stripe (test or live keys) */
export function isStripeMode(): boolean {
  return !isSimulatedMode();
}

/** True only in production live-charge mode */
export function isLiveMode(): boolean {
  return getPaymentMode() === 'stripe-live';
}

/** Whether Stripe should use test keys (for stripe.ts key selection) */
export function isStripeTestKeys(): boolean {
  return RAW_MODE === 'test';
}
