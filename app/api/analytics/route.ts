import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { events } = await request.json();
    
    // Process events in batch
    const analyticsEvents = events.map((event: any) => ({
      eventType: event.event,
      properties: event.properties,
      userId: userId || event.properties.userId,
      sessionId: event.properties.sessionId,
      timestamp: new Date(event.properties.timestamp),
      pageUrl: event.properties.pageUrl,
    }));
    
    // Store in database
    await prisma.analyticsEvent.createMany({
      data: analyticsEvents,
      skipDuplicates: true,
    });
    
    // For product impressions, update view counts
    const impressionEvents = events.filter((e: any) => e.event === 'product_impression');
    for (const event of impressionEvents) {
      const productId = event.properties.productId;
      if (productId) {
        // Check if it's a game or merch
        const game = await prisma.game.findUnique({ where: { id: productId } });
        if (game) {
          await prisma.game.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
          });
        } else {
          await prisma.merch.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
          });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't return error to client - analytics should fail silently
    return NextResponse.json({ success: true });
  }
}