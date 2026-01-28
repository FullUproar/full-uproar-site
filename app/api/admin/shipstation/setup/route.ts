import { NextRequest, NextResponse } from 'next/server';
import { getShipStation, isShipStationConfigured } from '@/lib/shipping/shipstation';
import { requirePermission } from '@/lib/auth';

/**
 * ShipStation Setup Endpoint
 *
 * GET - Check status and list existing webhooks
 * POST - Register webhook for shipping notifications
 * DELETE - Remove all webhooks
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fulluproar.com';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    if (!isShipStationConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'ShipStation API credentials not configured. Add SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET to your environment variables.',
        envVarsNeeded: ['SHIPSTATION_API_KEY', 'SHIPSTATION_API_SECRET'],
      });
    }

    const shipStation = getShipStation();

    // Get existing webhooks
    let webhooks: any[] = [];
    try {
      webhooks = await shipStation.listWebhooks();
    } catch (error) {
      console.error('Failed to list webhooks:', error);
    }

    // Get available carriers
    let carriers: any[] = [];
    try {
      carriers = await shipStation.listCarriers();
    } catch (error) {
      console.error('Failed to list carriers:', error);
    }

    // Check if our webhook is registered
    const webhookUrl = `${SITE_URL}/api/webhooks/shipstation`;
    const ourWebhook = webhooks.find((w: any) =>
      w.target_url === webhookUrl || w.Url === webhookUrl
    );

    return NextResponse.json({
      configured: true,
      webhookUrl,
      webhookRegistered: !!ourWebhook,
      existingWebhooks: webhooks,
      availableCarriers: carriers.map((c: any) => ({
        code: c.code,
        name: c.name,
        accountNumber: c.accountNumber,
        primary: c.primary,
      })),
      setupInstructions: !ourWebhook ? [
        'Your ShipStation webhook is not registered.',
        'Click the "Register Webhook" button below or POST to this endpoint.',
        'The webhook will notify your site when orders are shipped.',
      ] : [
        'ShipStation webhook is registered and ready!',
        'When you ship orders in ShipStation, your site will be notified automatically.',
      ],
    });

  } catch (error: any) {
    console.error('ShipStation setup check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check ShipStation status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    if (!isShipStationConfigured()) {
      return NextResponse.json(
        { error: 'ShipStation not configured' },
        { status: 400 }
      );
    }

    const shipStation = getShipStation();
    const webhookUrl = `${SITE_URL}/api/webhooks/shipstation`;

    // Check if webhook already exists
    const existingWebhooks = await shipStation.listWebhooks();
    const alreadyRegistered = existingWebhooks.find((w: any) =>
      w.target_url === webhookUrl || w.Url === webhookUrl
    );

    if (alreadyRegistered) {
      return NextResponse.json({
        success: true,
        message: 'Webhook already registered',
        webhook: alreadyRegistered,
      });
    }

    // Register the webhook for shipping notifications
    const result = await shipStation.registerWebhook({
      target_url: webhookUrl,
      event: 'SHIP_NOTIFY',
      friendly_name: 'Full Uproar - Shipping Notifications',
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: result,
      webhookUrl,
    });

  } catch (error: any) {
    console.error('ShipStation webhook registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    if (!isShipStationConfigured()) {
      return NextResponse.json(
        { error: 'ShipStation not configured' },
        { status: 400 }
      );
    }

    const shipStation = getShipStation();
    const webhooks = await shipStation.listWebhooks();

    // Delete all webhooks (or just ours)
    const webhookUrl = `${SITE_URL}/api/webhooks/shipstation`;
    const ourWebhooks = webhooks.filter((w: any) =>
      w.target_url === webhookUrl || w.Url === webhookUrl
    );

    for (const webhook of ourWebhooks) {
      const webhookId = webhook.WebHookID || webhook.id;
      if (webhookId) {
        await shipStation.deleteWebhook(String(webhookId));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${ourWebhooks.length} webhook(s)`,
    });

  } catch (error: any) {
    console.error('ShipStation webhook deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete webhooks' },
      { status: 500 }
    );
  }
}
