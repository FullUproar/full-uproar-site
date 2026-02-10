/**
 * Discord webhook notifications for team awareness
 *
 * Sends rich embeds to a Discord channel for:
 * - New orders (payment succeeded)
 * - Shipments (tracking added)
 * - Refunds (full or partial)
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

async function sendDiscordEmbed(embed: DiscordEmbed): Promise<boolean> {
  if (!WEBHOOK_URL) {
    return false;
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      console.error(`Discord webhook failed: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}

/**
 * Notify team of a new paid order
 */
export async function sendDiscordOrderNotification(data: {
  orderId: string;
  customerName: string;
  totalCents: number;
  itemCount: number;
  shippingMethod?: string;
}): Promise<boolean> {
  const total = `$${(data.totalCents / 100).toFixed(2)}`;
  const shortId = data.orderId.slice(-8).toUpperCase();

  // Gold for orders $100+, green otherwise
  const color = data.totalCents >= 10000 ? 0xFBDB65 : 0x10b981;

  return sendDiscordEmbed({
    title: `🛒 New Order #${shortId}`,
    color,
    fields: [
      { name: 'Customer', value: data.customerName, inline: true },
      { name: 'Total', value: total, inline: true },
      { name: 'Items', value: `${data.itemCount}`, inline: true },
      ...(data.shippingMethod ? [{ name: 'Shipping', value: data.shippingMethod, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Full Uproar Orders' },
  });
}

/**
 * Notify team when an order ships
 */
export async function sendDiscordShippingNotification(data: {
  orderId: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
}): Promise<boolean> {
  const shortId = data.orderId.slice(-8).toUpperCase();

  return sendDiscordEmbed({
    title: `📦 Order #${shortId} Shipped`,
    color: 0x7D55C7,
    fields: [
      { name: 'Customer', value: data.customerName, inline: true },
      { name: 'Carrier', value: data.carrier, inline: true },
      { name: 'Tracking', value: data.trackingNumber, inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Full Uproar Shipping' },
  });
}

/**
 * Notify team when a refund is processed
 */
export async function sendDiscordRefundNotification(data: {
  orderId: string;
  customerName: string;
  refundAmountCents: number;
  isFullRefund: boolean;
  reason?: string;
}): Promise<boolean> {
  const shortId = data.orderId.slice(-8).toUpperCase();
  const amount = `$${(data.refundAmountCents / 100).toFixed(2)}`;

  return sendDiscordEmbed({
    title: `💰 ${data.isFullRefund ? 'Full' : 'Partial'} Refund #${shortId}`,
    color: 0xdc2626,
    fields: [
      { name: 'Customer', value: data.customerName, inline: true },
      { name: 'Amount', value: amount, inline: true },
      ...(data.reason ? [{ name: 'Reason', value: data.reason, inline: false }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Full Uproar Refunds' },
  });
}
