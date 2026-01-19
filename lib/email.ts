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
  accessToken: string;
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
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
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
                    <p style="color: #f97316; font-size: 24px; font-weight: bold; margin: 0 0 15px 0;">
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
                       style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
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
                <span style="color: #f97316;">Professionally ruining game nights since day one.</span>
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
                    <p style="color: #f97316; font-size: 18px; font-weight: bold; margin: 0;">
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
              <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; border-left: 3px solid #f97316;">
                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>

              <!-- Actions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                <tr>
                  <td>
                    <a href="mailto:${data.customerEmail}?subject=Re: ${data.ticketNumber} - ${encodeURIComponent(data.subject)}"
                       style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
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
    await transporter.sendMail({
      from: `"Full Uproar Tickets" <${process.env.GMAIL_USER}>`,
      to: teamEmail,
      replyTo: data.customerEmail,
      subject: `[${data.ticketNumber}] ${categoryLabel}: ${data.customerName}`,
      text,
      html,
    });
    console.log(`Team notification sent to ${teamEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send team notification:', error);
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
    <div style="padding: 15px; margin-bottom: 10px; background-color: ${msg.senderType === 'staff' ? 'rgba(249, 115, 22, 0.1)' : '#1f2937'}; border-radius: 8px; border-left: 3px solid ${msg.senderType === 'staff' ? '#f97316' : '#3b82f6'};">
      <p style="color: ${msg.senderType === 'staff' ? '#f97316' : '#3b82f6'}; font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">
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
                    <p style="color: #f97316; font-size: 18px; font-weight: bold; margin: 0;">
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
                       style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
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
