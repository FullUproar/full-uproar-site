import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+18334431092'; // Default Full Uproar number

// Only initialize if we have credentials
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSMSOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SendVerificationOptions {
  to: string;
  channel?: 'sms' | 'call';
}

/**
 * Send an SMS message
 */
export async function sendSMS({ to, body, mediaUrl, statusCallback }: SendSMSOptions) {
  if (!client) {
    console.error('Twilio client not initialized. Check environment variables.');
    throw new Error('SMS service not configured');
  }

  try {
    const message = await client.messages.create({
      to,
      body,
      ...(messagingServiceSid ? { messagingServiceSid } : { from: fromNumber }),
      ...(mediaUrl && { mediaUrl }),
      ...(statusCallback && { statusCallback })
    });

    return {
      success: true,
      sid: message.sid,
      status: message.status,
      to: message.to,
      body: message.body
    };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    throw new Error(error.message || 'Failed to send SMS');
  }
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification SMS
 */
export async function sendVerificationSMS(to: string, code: string) {
  const body = `Your Full Uproar verification code is: ${code}\n\nThis code expires in 10 minutes. Text STOP to unsubscribe.`;
  
  return sendSMS({ to, body });
}

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmationSMS(to: string, orderNumber: string, total: string) {
  const body = `🎮 Full Uproar: Your order #${orderNumber} for ${total} has been confirmed! Track your order at fulluproar.com/track-order\n\nText STOP to unsubscribe.`;
  
  return sendSMS({ to, body });
}

/**
 * Send shipping notification SMS
 */
export async function sendShippingNotificationSMS(
  to: string, 
  orderNumber: string, 
  trackingNumber?: string, 
  carrier?: string
) {
  let body = `📦 Full Uproar: Your order #${orderNumber} has shipped!`;
  
  if (trackingNumber && carrier) {
    body += ` Track with ${carrier}: ${trackingNumber}`;
  }
  
  body += `\n\nText STOP to unsubscribe.`;
  
  return sendSMS({ to, body });
}

/**
 * Send promotional SMS
 */
export async function sendPromotionalSMS(to: string, message: string, includeOptOut: boolean = true) {
  let body = message;
  
  if (includeOptOut) {
    body += '\n\nText STOP to unsubscribe. Msg & data rates may apply.';
  }
  
  return sendSMS({ to, body });
}

/**
 * Handle incoming SMS (webhooks from Twilio)
 */
export async function handleIncomingSMS(from: string, body: string) {
  const message = body.toUpperCase().trim();
  
  // Handle opt-out
  if (message === 'STOP' || message === 'UNSUBSCRIBE' || message === 'CANCEL') {
    // Record opt-out in database
    return {
      response: "You've been unsubscribed from Full Uproar SMS updates. Reply START to resubscribe.",
      action: 'opt_out'
    };
  }
  
  // Handle opt-in
  if (message === 'START' || message === 'SUBSCRIBE' || message === 'YES') {
    return {
      response: "Welcome back to Full Uproar SMS updates! Get ready for exclusive deals and game news. Text STOP to unsubscribe.",
      action: 'opt_in'
    };
  }
  
  // Handle help
  if (message === 'HELP' || message === 'INFO') {
    return {
      response: "Full Uproar SMS: Get exclusive deals & updates. Msg frequency varies. Msg & data rates may apply. Text STOP to cancel. Visit fulluproar.com/privacy for terms.",
      action: 'help'
    };
  }
  
  // Default response for other messages
  return {
    response: "Thanks for contacting Full Uproar! For support, visit fulluproar.com/contact. Text HELP for info or STOP to unsubscribe.",
    action: 'unknown'
  };
}

/**
 * Validate phone number format (US numbers)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US number (10 or 11 digits starting with 1)
  if (cleaned.length === 10) {
    return true;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return true;
  }
  
  return false;
}

/**
 * Format phone number for Twilio (E.164 format)
 */
export function formatPhoneForTwilio(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle 10-digit US numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Handle 11-digit numbers starting with 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Return as-is if already in international format
  if (phone.startsWith('+')) {
    return phone;
  }
  
  throw new Error('Invalid phone number format');
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken);
}

export default client;