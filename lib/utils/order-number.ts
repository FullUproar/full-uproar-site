/**
 * Format an order number for customer-facing display.
 * Uses the FU- prefix (Full Uproar) with the sequential number.
 * Falls back to truncated CUID for orders created before migration.
 */
export function formatOrderNumber(orderNumber: number | null | undefined, fallbackId?: string): string {
  if (orderNumber) return `FU-${orderNumber}`;
  if (fallbackId) return `#${fallbackId.slice(0, 8).toUpperCase()}`;
  return 'Unknown';
}
