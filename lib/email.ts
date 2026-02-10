import nodemailer from 'nodemailer';

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Category to team email routing
const categoryEmailMap: Record<string, string> = {
  general: 'support@fulluproar.com',
  order_issue: 'support@fulluproar.com',
  wholesale: 'wholesale@fulluproar.com',
  product_support: 'support@fulluproar.com',
  feedback: 'marketing@fulluproar.com',
  media_press: 'marketing@fulluproar.com',
};

// Human-readable category labels
const categoryLabels: Record<string, string> = {
  general: 'General Inquiry',
  order_issue: 'Order Issue',
  wholesale: 'Wholesale/Retail Inquiry',
  product_support: 'Product Support',
  feedback: 'Feedback/Suggestion',
  media_press: 'Media/Press Inquiry',
};

interface TicketEmailData {
  ticketNumber: string;
  accessToken: string | null;
  customerName: string;
  customerEmail: string;
  category: string;
  subject: string;
  message: string;
}

interface CustomerReplyData {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  category: string;
  subject: string;
  newMessage: string;
  conversationHistory: Array<{
    senderType: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://fulluproar.com';

/**
 * Send confirmation email to customer
 */
export async function sendCustomerConfirmation(data: TicketEmailData): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping customer confirmation');
    return false;
  }

  const categoryLabel = categoryLabels[data.category] || 'General Inquiry';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF8200 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Full Uproar
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                We got your message!
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px 0;">
                Hey ${data.customerName}!
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Thanks for reaching out. We've received your message and created a support ticket for tracking.
              </p>

              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                      Your Ticket Number
                    </p>
                    <p style="color: #FF8200; font-size: 24px; font-weight: bold; margin: 0 0 15px 0;">
                      ${data.ticketNumber}
                    </p>
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                      Category: ${categoryLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                We typically respond within 24-48 hours, but honestly it's usually faster because we're excited when people want to talk to us.
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Need to follow up or check the status? Use the button below to view your ticket and conversation history.
              </p>

              <!-- View Ticket Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${BASE_URL}/support/ticket/${data.accessToken}"
                       style="display: inline-block; background-color: #FF8200; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      View Your Ticket
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                This link is unique to your ticket. Keep it handy!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.customerName}!

Thanks for reaching out to Full Uproar. We've received your message and created a support ticket.

Your Ticket Number: ${data.ticketNumber}
Category: ${categoryLabel}

We typically respond within 24-48 hours.

To view your ticket, check the conversation history, or send us a follow-up message, visit:
${BASE_URL}/support/ticket/${data.accessToken}

- The Full Uproar Team
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Support" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Got it! Your ticket ${data.ticketNumber} is in the queue`,
      text,
      html,
    });
    console.log(`Customer confirmation sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send customer confirmation:', error);
    return false;
  }
}

/**
 * Send notification email to the appropriate team
 */
export async function sendTeamNotification(data: TicketEmailData): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping team notification');
    return false;
  }

  const teamEmail = categoryEmailMap[data.category] || 'support@fulluproar.com';
  const categoryLabel = categoryLabels[data.category] || 'General Inquiry';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">
                New Support Ticket
              </h1>
            </td>
          </tr>

          <!-- Ticket Details -->
          <tr>
            <td style="padding: 30px;">
              <!-- Ticket Number & Category -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td width="50%" style="padding-right: 10px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">
                      Ticket
                    </p>
                    <p style="color: #FF8200; font-size: 18px; font-weight: bold; margin: 0;">
                      ${data.ticketNumber}
                    </p>
                  </td>
                  <td width="50%" style="padding-left: 10px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">
                      Category
                    </p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0;">
                      ${categoryLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Customer Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                      From
                    </p>
                    <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 3px 0; font-weight: 500;">
                      ${data.customerName}
                    </p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                      <a href="mailto:${data.customerEmail}" style="color: #3b82f6; text-decoration: none;">${data.customerEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">
                Message
              </p>
              <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; border-left: 3px solid #FF8200;">
                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>

              <!-- Actions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                <tr>
                  <td>
                    <a href="mailto:${data.customerEmail}?subject=Re: ${data.ticketNumber} - ${encodeURIComponent(data.subject)}"
                       style="display: inline-block; background-color: #FF8200; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                      Reply to Customer
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 15px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
                This ticket was created via the Contact Us form on fulluproar.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
NEW SUPPORT TICKET: ${data.ticketNumber}

Category: ${categoryLabel}
From: ${data.customerName} <${data.customerEmail}>

Message:
${data.message}

---
Reply to: ${data.customerEmail}
`;

  try {
    console.log(`Sending team notification to ${teamEmail} for ticket ${data.ticketNumber}...`);
    const result = await transporter.sendMail({
      from: `"Full Uproar Tickets" <${process.env.GMAIL_USER}>`,
      to: teamEmail,
      replyTo: data.customerEmail,
      subject: `[${data.ticketNumber}] ${categoryLabel}: ${data.customerName}`,
      text,
      html,
    });
    console.log(`Team notification sent to ${teamEmail}:`, {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to send team notification:', {
      to: teamEmail,
      ticketNumber: data.ticketNumber,
      error: errorMessage,
      hint: 'If this is a Google Group, ensure donotreply@ is a member of the group or the group accepts emails from organization members.',
    });
    return false;
  }
}

/**
 * Send both customer confirmation and team notification
 */
export async function sendTicketEmails(data: TicketEmailData): Promise<{
  customerSent: boolean;
  teamSent: boolean;
}> {
  const [customerSent, teamSent] = await Promise.all([
    sendCustomerConfirmation(data),
    sendTeamNotification(data),
  ]);

  return { customerSent, teamSent };
}

/**
 * Send notification when customer replies to a ticket
 */
interface StaffReplyData {
  ticketNumber: string;
  accessToken: string | null;
  customerName: string;
  customerEmail: string;
  category: string;
  subject: string;
  staffName: string | null;
  newMessage: string;
}

/**
 * Send notification to customer when staff replies
 */
export async function sendStaffReplyNotification(data: StaffReplyData): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping staff reply notification');
    return false;
  }

  const categoryLabel = categoryLabels[data.category] || 'General Inquiry';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF8200 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Full Uproar
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                We've replied to your ticket!
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px 0;">
                Hey ${data.customerName}!
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Our team has responded to your support ticket. Here's a preview of our reply:
              </p>

              <!-- Ticket Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                      Ticket ${data.ticketNumber}
                    </p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 15px 0;">
                      ${data.subject}
                    </p>
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                      Category: ${categoryLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Reply Preview -->
              <p style="color: #FF8200; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; font-weight: 600;">
                Our Reply
              </p>
              <div style="background-color: rgba(255, 130, 0, 0.1); border-radius: 8px; padding: 20px; border-left: 3px solid #FF8200; margin-bottom: 25px;">
                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${data.newMessage.length > 500 ? data.newMessage.slice(0, 500) + '...' : data.newMessage}</p>
              </div>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Click below to view the full conversation and reply if needed.
              </p>

              <!-- View Ticket Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${BASE_URL}/support/ticket/${data.accessToken}"
                       style="display: inline-block; background-color: #FF8200; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      View Full Conversation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                This link is unique to your ticket. Keep it handy!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.customerName}!

Our team has responded to your support ticket ${data.ticketNumber}.

OUR REPLY:
${data.newMessage}

---

To view the full conversation and reply, visit:
${BASE_URL}/support/ticket/${data.accessToken}

- The Full Uproar Team
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Support" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Re: ${data.ticketNumber} - We've replied to your ticket`,
      text,
      html,
    });
    console.log(`Staff reply notification sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send staff reply notification:', error);
    return false;
  }
}

// ============================================
// GAME NIGHT EMAIL INVITATIONS
// ============================================

interface GameNightInviteData {
  guestName: string;
  guestEmail: string;
  hostName: string;
  gameNightTitle: string;
  gameNightDate: string;
  gameNightTime: string | null;
  gameNightLocation: string | null;
  gameNightVibe: string;
  inviteToken: string;
  personalMessage?: string;
}

const vibeEmoji: Record<string, string> = {
  CHILL: '☕',
  COMPETITIVE: '🔥',
  CHAOS: '⚡',
  PARTY: '🎉',
  COZY: '💖',
};

const vibeColors: Record<string, string> = {
  CHILL: '#60a5fa',
  COMPETITIVE: '#FF8200',
  CHAOS: '#a855f7',
  PARTY: '#ec4899',
  COZY: '#f472b6',
};

/**
 * Send game night invitation email to a guest
 */
export async function sendGameNightInvite(data: GameNightInviteData): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping game night invitation');
    return false;
  }

  const vibeColor = vibeColors[data.gameNightVibe] || '#FF8200';
  const emoji = vibeEmoji[data.gameNightVibe] || '🎮';
  const vibeName = data.gameNightVibe.charAt(0) + data.gameNightVibe.slice(1).toLowerCase();
  const rsvpUrl = `${BASE_URL}/join/${data.inviteToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${vibeColor} 0%, ${vibeColor}cc 100%); padding: 35px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">
                You're Invited!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${data.hostName} wants you at their game night
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 25px 0;">
                Hey ${data.guestName}!
              </p>

              ${data.personalMessage ? `
              <div style="background-color: rgba(255, 130, 0, 0.1); border-radius: 8px; padding: 20px; border-left: 4px solid #FF8200; margin-bottom: 25px;">
                <p style="color: #FBDB65; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                  Message from ${data.hostName}
                </p>
                <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                  "${data.personalMessage}"
                </p>
              </div>
              ` : ''}

              <!-- Event Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 12px; margin-bottom: 30px; border: 2px solid ${vibeColor}33;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #fff; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
                      ${data.gameNightTitle}
                    </h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">📅 Date:</span>
                          <span style="color: #e2e8f0; font-size: 14px; margin-left: 10px; font-weight: 500;">${data.gameNightDate}</span>
                        </td>
                      </tr>
                      ${data.gameNightTime ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">🕖 Time:</span>
                          <span style="color: #e2e8f0; font-size: 14px; margin-left: 10px; font-weight: 500;">${data.gameNightTime}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.gameNightLocation ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">📍 Where:</span>
                          <span style="color: #e2e8f0; font-size: 14px; margin-left: 10px; font-weight: 500;">${data.gameNightLocation}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">${emoji} Vibe:</span>
                          <span style="color: ${vibeColor}; font-size: 14px; margin-left: 10px; font-weight: bold;">${vibeName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Let ${data.hostName} know if you can make it!
              </p>

              <!-- RSVP Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <a href="${rsvpUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, ${vibeColor}, ${vibeColor}cc); color: #ffffff; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px ${vibeColor}40;">
                      RSVP Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Click the button above to let everyone know if you're in, maybe, or can't make it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Powered by <span style="color: #FF8200; font-weight: bold;">Full Uproar</span> Game Nights<br>
                <span style="color: #94a3b8;">Where chaos becomes unforgettable memories</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.guestName}!

${data.hostName} has invited you to their game night!

${data.personalMessage ? `Message from ${data.hostName}:\n"${data.personalMessage}"\n\n` : ''}
EVENT DETAILS:
- ${data.gameNightTitle}
- Date: ${data.gameNightDate}
${data.gameNightTime ? `- Time: ${data.gameNightTime}` : ''}
${data.gameNightLocation ? `- Location: ${data.gameNightLocation}` : ''}
- Vibe: ${vibeName} ${emoji}

RSVP here: ${rsvpUrl}

Let ${data.hostName} know if you can make it!

- Full Uproar Game Nights
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Game Nights" <${process.env.GMAIL_USER}>`,
      to: data.guestEmail,
      subject: `${emoji} ${data.hostName} invited you to ${data.gameNightTitle}!`,
      text,
      html,
    });
    console.log(`Game night invitation sent to ${data.guestEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send game night invitation:', error);
    return false;
  }
}

export async function sendCustomerReplyNotification(data: CustomerReplyData): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping customer reply notification');
    return false;
  }

  const teamEmail = categoryEmailMap[data.category] || 'support@fulluproar.com';
  const categoryLabel = categoryLabels[data.category] || 'General Inquiry';

  // Format conversation history for email
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const conversationHtml = data.conversationHistory.map((msg) => `
    <div style="padding: 15px; margin-bottom: 10px; background-color: ${msg.senderType === 'staff' ? 'rgba(255, 130, 0, 0.1)' : '#1f2937'}; border-radius: 8px; border-left: 3px solid ${msg.senderType === 'staff' ? '#FF8200' : '#3b82f6'};">
      <p style="color: ${msg.senderType === 'staff' ? '#FF8200' : '#3b82f6'}; font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">
        ${msg.senderType === 'staff' ? 'Full Uproar Support' : msg.senderName} • ${formatDate(msg.createdAt)}
      </p>
      <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${msg.message}</p>
    </div>
  `).join('');

  const conversationText = data.conversationHistory.map((msg) =>
    `[${msg.senderType === 'staff' ? 'Support' : msg.senderName}] ${formatDate(msg.createdAt)}\n${msg.message}`
  ).join('\n\n---\n\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">
                Customer Reply
              </h1>
            </td>
          </tr>

          <!-- Ticket Details -->
          <tr>
            <td style="padding: 30px;">
              <!-- Ticket Number & Category -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td width="50%" style="padding-right: 10px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">
                      Ticket
                    </p>
                    <p style="color: #FF8200; font-size: 18px; font-weight: bold; margin: 0;">
                      ${data.ticketNumber}
                    </p>
                  </td>
                  <td width="50%" style="padding-left: 10px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">
                      Category
                    </p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0;">
                      ${categoryLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Customer Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                      From
                    </p>
                    <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 3px 0; font-weight: 500;">
                      ${data.customerName}
                    </p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                      <a href="mailto:${data.customerEmail}" style="color: #3b82f6; text-decoration: none;">${data.customerEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- New Message Highlight -->
              <p style="color: #22c55e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; font-weight: 600;">
                New Message
              </p>
              <div style="background-color: rgba(34, 197, 94, 0.1); border-radius: 8px; padding: 20px; border-left: 3px solid #22c55e; margin-bottom: 25px;">
                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${data.newMessage}</p>
              </div>

              <!-- Full Conversation -->
              <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">
                Full Conversation (${data.conversationHistory.length} messages)
              </p>
              ${conversationHtml}

              <!-- Actions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                <tr>
                  <td>
                    <a href="mailto:${data.customerEmail}?subject=Re: ${data.ticketNumber} - ${encodeURIComponent(data.subject)}"
                       style="display: inline-block; background-color: #FF8200; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                      Reply to Customer
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 15px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
                Customer replied via the ticket portal on fulluproar.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
CUSTOMER REPLY: ${data.ticketNumber}

Category: ${categoryLabel}
From: ${data.customerName} <${data.customerEmail}>

NEW MESSAGE:
${data.newMessage}

---

FULL CONVERSATION:
${conversationText}

---
Reply to: ${data.customerEmail}
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Tickets" <${process.env.GMAIL_USER}>`,
      to: teamEmail,
      replyTo: data.customerEmail,
      subject: `[${data.ticketNumber}] Reply from ${data.customerName}`,
      text,
      html,
    });
    console.log(`Customer reply notification sent to ${teamEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send customer reply notification:', error);
    return false;
  }
}

// ============================================
// ORDER CONFIRMATION EMAILS
// ============================================

export interface OrderItem {
  quantity: number;
  priceCents: number;
  merchSize?: string | null;
  game?: { title: string; slug: string } | null;
  merch?: { name: string; slug: string } | null;
}

export interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  totalCents: number;
  shippingCents: number;
  taxCents: number;
  paidAt: Date;
}

/**
 * Send order confirmation email to customer after successful payment
 */
export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping order confirmation');
    return false;
  }

  const subtotalCents = data.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const orderDate = new Date(data.paidAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate items HTML
  const itemsHtml = data.items.map(item => {
    const name = item.game?.title || item.merch?.name || 'Unknown Item';
    const sizeText = item.merchSize ? ` (${item.merchSize})` : '';
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #374151;">
          <p style="color: #e2e8f0; font-size: 14px; margin: 0; font-weight: 500;">
            ${name}${sizeText}
          </p>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: center;">
          <span style="color: #94a3b8; font-size: 14px;">×${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right;">
          <span style="color: #FBDB65; font-size: 14px; font-weight: 500;">$${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
        </td>
      </tr>
    `;
  }).join('');

  // Generate items text
  const itemsText = data.items.map(item => {
    const name = item.game?.title || item.merch?.name || 'Unknown Item';
    const sizeText = item.merchSize ? ` (${item.merchSize})` : '';
    return `- ${name}${sizeText} x${item.quantity}: $${((item.priceCents * item.quantity) / 100).toFixed(2)}`;
  }).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF8200 0%, #ea580c 100%); padding: 35px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Order Confirmed!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                Thanks for your order, chaos is on the way!
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 20px 0;">
                Hey ${data.customerName}!
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Great news! Your payment went through and we're getting your order ready. Here's what you ordered:
              </p>

              <!-- Order Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">
                            Order Number
                          </p>
                          <p style="color: #FF8200; font-size: 16px; font-weight: bold; margin: 0; font-family: monospace;">
                            ${data.orderId.slice(0, 8).toUpperCase()}
                          </p>
                        </td>
                        <td width="50%">
                          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">
                            Order Date
                          </p>
                          <p style="color: #e2e8f0; font-size: 14px; margin: 0;">
                            ${orderDate}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <p style="color: #FBDB65; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
                Your Items
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #FF8200; color: #94a3b8; font-size: 12px; font-weight: 500;">Item</th>
                    <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #FF8200; color: #94a3b8; font-size: 12px; font-weight: 500;">Qty</th>
                    <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #FF8200; color: #94a3b8; font-size: 12px; font-weight: 500;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">Subtotal:</span>
                        </td>
                        <td style="padding: 4px 0; text-align: right;">
                          <span style="color: #e2e8f0; font-size: 14px;">$${(subtotalCents / 100).toFixed(2)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">Shipping:</span>
                        </td>
                        <td style="padding: 4px 0; text-align: right;">
                          <span style="color: #e2e8f0; font-size: 14px;">$${(data.shippingCents / 100).toFixed(2)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="color: #94a3b8; font-size: 14px;">Tax:</span>
                        </td>
                        <td style="padding: 4px 0; text-align: right;">
                          <span style="color: #e2e8f0; font-size: 14px;">$${(data.taxCents / 100).toFixed(2)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #374151;">
                          <span style="color: #FBDB65; font-size: 16px; font-weight: bold;">Total:</span>
                        </td>
                        <td style="padding: 8px 0; border-top: 1px solid #374151; text-align: right;">
                          <span style="color: #FBDB65; font-size: 18px; font-weight: bold;">$${(data.totalCents / 100).toFixed(2)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <p style="color: #FBDB65; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
                Shipping To
              </p>
              <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 25px;">
                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">
                  ${data.shippingAddress}
                </p>
              </div>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We'll send you another email with tracking info once your order ships. Get ready for some serious game night chaos!
              </p>

              <!-- Support Link -->
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Questions? Hit us up at <a href="mailto:support@fulluproar.com" style="color: #FF8200; text-decoration: none;">support@fulluproar.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.customerName}!

ORDER CONFIRMED!

Great news! Your payment went through and we're getting your order ready.

Order Number: ${data.orderId.slice(0, 8).toUpperCase()}
Order Date: ${orderDate}

YOUR ITEMS:
${itemsText}

Subtotal: $${(subtotalCents / 100).toFixed(2)}
Shipping: $${(data.shippingCents / 100).toFixed(2)}
Tax: $${(data.taxCents / 100).toFixed(2)}
Total: $${(data.totalCents / 100).toFixed(2)}

SHIPPING TO:
${data.shippingAddress}

We'll send you another email with tracking info once your order ships.

Questions? Hit us up at support@fulluproar.com

- The Full Uproar Team
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Games" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmed! Your Full Uproar order #${data.orderId.slice(0, 8).toUpperCase()}`,
      text,
      html,
    });
    console.log(`Order confirmation sent to ${data.customerEmail} for order ${data.orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    return false;
  }
}

/**
 * Send order shipped notification to customer
 */
export async function sendOrderShippedNotification(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  trackingNumber: string;
  shippingCarrier: string;
  items: OrderItem[];
}): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping shipping notification');
    return false;
  }

  // Generate tracking URL based on carrier
  const getTrackingUrl = (carrier: string, tracking: string) => {
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    } else if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${tracking}`;
    } else if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    } else if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
    }
    return null;
  };

  const trackingUrl = getTrackingUrl(data.shippingCarrier, data.trackingNumber);
  const itemsList = data.items.map(item => {
    const name = item.game?.title || item.merch?.name || 'Unknown Item';
    return name;
  }).join(', ');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7D55C7 0%, #7c3aed 100%); padding: 35px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Your Order Shipped!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                The chaos is on its way to you!
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 20px 0;">
                Hey ${data.customerName}!
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Great news! Your order is on its way. Here's your tracking info:
              </p>

              <!-- Tracking Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px; border: 2px solid #7D55C7;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                      Tracking Number
                    </p>
                    <p style="color: #a78bfa; font-size: 20px; font-weight: bold; margin: 0 0 15px 0; font-family: monospace;">
                      ${data.trackingNumber}
                    </p>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">
                      via ${data.shippingCarrier}
                    </p>
                    ${trackingUrl ? `
                    <a href="${trackingUrl}"
                       style="display: inline-block; background-color: #7D55C7; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Track Your Package
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">
                <strong style="color: #e2e8f0;">What's in the box:</strong> ${itemsList}
              </p>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Questions? Hit us up at <a href="mailto:support@fulluproar.com" style="color: #FF8200; text-decoration: none;">support@fulluproar.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.customerName}!

YOUR ORDER SHIPPED!

Great news! Your order is on its way.

Tracking Number: ${data.trackingNumber}
Carrier: ${data.shippingCarrier}
${trackingUrl ? `Track here: ${trackingUrl}` : ''}

What's in the box: ${itemsList}

Questions? Hit us up at support@fulluproar.com

- The Full Uproar Team
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Games" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Your order shipped! Track it here`,
      text,
      html,
    });
    console.log(`Shipping notification sent to ${data.customerEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send shipping notification:', error);
    return false;
  }
}

/**
 * Send payment failed notification to customer
 */
export async function sendPaymentFailedNotification(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  errorMessage: string;
}): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping payment failed notification');
    return false;
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://fulluproar.com';
  const shortId = data.orderId.slice(-8).toUpperCase();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 35px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Payment Issue
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                We couldn't process your payment
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 20px 0;">
                Hey ${data.customerName},
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                We tried to process the payment for your order <strong style="color: #e2e8f0;">#${shortId}</strong>, but ran into an issue:
              </p>

              <!-- Error Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px; border: 2px solid #dc2626;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #fca5a5; font-size: 15px; font-weight: 600; margin: 0;">
                      ${data.errorMessage || 'Your payment could not be completed'}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Your cart items are still saved. You can try again with a different payment method or the same card.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${BASE_URL}/checkout"
                       style="display: inline-block; background-color: #FF8200; color: #111827; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
                      Try Again
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Need help? Contact us at <a href="mailto:support@fulluproar.com" style="color: #FF8200; text-decoration: none;">support@fulluproar.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.customerName},

PAYMENT ISSUE

We tried to process the payment for your order #${shortId}, but ran into an issue:

${data.errorMessage || 'Your payment could not be completed'}

Your cart items are still saved. Try again at: ${BASE_URL}/checkout

Need help? Contact us at support@fulluproar.com

- The Full Uproar Team
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Games" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Payment issue with your Full Uproar order`,
      text,
      html,
    });
    console.log(`Payment failed notification sent to ${data.customerEmail} for order ${data.orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment failed notification:', error);
    return false;
  }
}

/**
 * Send refund notification to customer
 */
export async function sendRefundNotification(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  refundAmountCents: number;
  isFullRefund: boolean;
  reason?: string;
}): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured - skipping refund notification');
    return false;
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://fulluproar.com';
  const shortId = data.orderId.slice(-8).toUpperCase();
  const refundAmount = `$${(data.refundAmountCents / 100).toFixed(2)}`;
  const refundType = data.isFullRefund ? 'Full Refund' : 'Partial Refund';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7D55C7 0%, #7c3aed 100%); padding: 35px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">💰</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                ${refundType} Processed
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                Your refund is on its way
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 20px 0;">
                Hey ${data.customerName},
              </p>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                We've processed a refund for your order <strong style="color: #e2e8f0;">#${shortId}</strong>.
              </p>

              <!-- Refund Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; border-radius: 8px; margin-bottom: 25px; border: 2px solid #7D55C7;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
                      Refund Amount
                    </p>
                    <p style="color: #a78bfa; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">
                      ${refundAmount}
                    </p>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">
                      ${refundType}${data.reason ? ` — ${data.reason}` : ''}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                The refund has been submitted to your payment provider. Please allow <strong style="color: #e2e8f0;">5–10 business days</strong> for it to appear on your statement.
              </p>

              <!-- Track Order Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${BASE_URL}/track-order"
                       style="display: inline-block; background-color: #7D55C7; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      View Order Details
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Questions? Contact us at <a href="mailto:support@fulluproar.com" style="color: #FF8200; text-decoration: none;">support@fulluproar.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; border-top: 1px solid #374151;">
              <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
                Full Uproar Games Inc.<br>
                <span style="color: #FF8200;">Professionally ruining game nights since day one.</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hey ${data.customerName},

${refundType.toUpperCase()} PROCESSED

We've processed a refund for your order #${shortId}.

Refund Amount: ${refundAmount}
Type: ${refundType}${data.reason ? `\nReason: ${data.reason}` : ''}

The refund has been submitted to your payment provider. Please allow 5-10 business days for it to appear on your statement.

View your order: ${BASE_URL}/track-order

Questions? Contact us at support@fulluproar.com

- The Full Uproar Team
`;

  try {
    await transporter.sendMail({
      from: `"Full Uproar Games" <${process.env.GMAIL_USER}>`,
      to: data.customerEmail,
      subject: `${refundType} processed for your Full Uproar order`,
      text,
      html,
    });
    console.log(`Refund notification sent to ${data.customerEmail} for order ${data.orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to send refund notification:', error);
    return false;
  }
}
