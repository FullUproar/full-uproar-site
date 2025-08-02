import { prisma } from '@/lib/prisma';

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface PackageDetails {
  weight: number; // in ounces
  length: number; // in inches
  width: number;
  height: number;
  value: number; // in cents
}

export interface ShippingRate {
  carrier: string;
  service: string;
  rate: number; // in cents
  deliveryDays: number;
  trackable: boolean;
  insurance: boolean;
}

export interface ShippingLabel {
  carrier: string;
  trackingNumber: string;
  labelUrl: string;
  labelPdfUrl?: string;
  cost: number; // in cents
  estimatedDeliveryDate?: Date;
}

export class ShippingService {
  // USPS integration placeholder
  static async getUSPSRates(
    from: ShippingAddress,
    to: ShippingAddress,
    packageDetails: PackageDetails
  ): Promise<ShippingRate[]> {
    // TODO: Implement actual USPS API integration
    // For now, return mock rates
    const baseRate = Math.max(packageDetails.weight * 0.5, 5.0) * 100; // cents
    
    return [
      {
        carrier: 'USPS',
        service: 'Priority Mail',
        rate: Math.round(baseRate * 1.2),
        deliveryDays: 3,
        trackable: true,
        insurance: packageDetails.value > 5000
      },
      {
        carrier: 'USPS',
        service: 'First-Class Mail',
        rate: Math.round(baseRate * 0.8),
        deliveryDays: 5,
        trackable: true,
        insurance: false
      },
      {
        carrier: 'USPS',
        service: 'Priority Mail Express',
        rate: Math.round(baseRate * 2.5),
        deliveryDays: 1,
        trackable: true,
        insurance: true
      }
    ];
  }

  // UPS integration placeholder
  static async getUPSRates(
    from: ShippingAddress,
    to: ShippingAddress,
    packageDetails: PackageDetails
  ): Promise<ShippingRate[]> {
    // TODO: Implement actual UPS API integration
    const baseRate = Math.max(packageDetails.weight * 0.6, 7.0) * 100;
    
    return [
      {
        carrier: 'UPS',
        service: 'Ground',
        rate: Math.round(baseRate),
        deliveryDays: 5,
        trackable: true,
        insurance: false
      },
      {
        carrier: 'UPS',
        service: '3 Day Select',
        rate: Math.round(baseRate * 1.5),
        deliveryDays: 3,
        trackable: true,
        insurance: false
      },
      {
        carrier: 'UPS',
        service: 'Next Day Air',
        rate: Math.round(baseRate * 3),
        deliveryDays: 1,
        trackable: true,
        insurance: true
      }
    ];
  }

  // Get rates from all carriers
  static async getAllRates(
    from: ShippingAddress,
    to: ShippingAddress,
    packageDetails: PackageDetails
  ): Promise<ShippingRate[]> {
    const [uspsRates, upsRates] = await Promise.all([
      this.getUSPSRates(from, to, packageDetails),
      this.getUPSRates(from, to, packageDetails)
    ]);

    return [...uspsRates, ...upsRates].sort((a, b) => a.rate - b.rate);
  }

  // Create shipping label
  static async createLabel(
    orderId: string,
    from: ShippingAddress,
    to: ShippingAddress,
    packageDetails: PackageDetails,
    carrier: string,
    service: string
  ): Promise<ShippingLabel> {
    // TODO: Implement actual carrier API integration
    // For now, create mock label
    
    const trackingNumber = this.generateTrackingNumber(carrier);
    const cost = Math.round(Math.max(packageDetails.weight * 0.5, 5.0) * 100);
    
    // Save to database
    const label = await prisma.shippingLabel.create({
      data: {
        orderId,
        carrier,
        trackingNumber,
        labelUrl: `https://example.com/labels/${trackingNumber}.png`,
        labelPdfUrl: `https://example.com/labels/${trackingNumber}.pdf`,
        costCents: cost,
        weight: packageDetails.weight,
        length: packageDetails.length,
        width: packageDetails.width,
        height: packageDetails.height,
        rate: {
          carrier,
          service,
          deliveryDays: this.getDeliveryDays(carrier, service)
        }
      }
    });

    // Update order with tracking info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        shippingCarrier: carrier,
        shippingMethod: service,
        shippedAt: new Date(),
        estimatedDeliveryDate: this.calculateDeliveryDate(carrier, service),
        status: 'shipped'
      }
    });

    // Add to status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'shipped',
        notes: `Shipped via ${carrier} ${service}. Tracking: ${trackingNumber}`
      }
    });

    return {
      carrier,
      trackingNumber,
      labelUrl: label.labelUrl,
      labelPdfUrl: label.labelPdfUrl || undefined,
      cost: label.costCents,
      estimatedDeliveryDate: this.calculateDeliveryDate(carrier, service)
    };
  }

  // Void shipping label
  static async voidLabel(labelId: number): Promise<boolean> {
    try {
      // TODO: Call carrier API to void label
      
      // Update database
      const label = await prisma.shippingLabel.update({
        where: { id: labelId },
        data: {
          isVoid: true,
          voidedAt: new Date()
        }
      });

      // Update order if this was the active label
      const order = await prisma.order.findFirst({
        where: { trackingNumber: label.trackingNumber }
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            trackingNumber: null,
            shippingCarrier: null,
            shippedAt: null,
            status: 'processing'
          }
        });

        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'processing',
            notes: `Shipping label voided. Tracking was: ${label.trackingNumber}`
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Error voiding label:', error);
      return false;
    }
  }

  // Track shipment
  static async trackShipment(trackingNumber: string, carrier: string): Promise<any> {
    // TODO: Implement actual carrier tracking API
    // For now, return mock tracking data
    
    return {
      trackingNumber,
      carrier,
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      events: [
        {
          date: new Date(),
          location: 'Local Post Office',
          description: 'Package accepted'
        },
        {
          date: new Date(Date.now() - 2 * 60 * 60 * 1000),
          location: 'Distribution Center',
          description: 'Arrived at facility'
        }
      ]
    };
  }

  // Helper methods
  private static generateTrackingNumber(carrier: string): string {
    const prefix = carrier === 'USPS' ? '9400' : carrier === 'UPS' ? '1Z' : 'FD';
    const random = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `${prefix}${random}`;
  }

  private static getDeliveryDays(carrier: string, service: string): number {
    const serviceDays: Record<string, number> = {
      'Priority Mail Express': 1,
      'Next Day Air': 1,
      'Priority Mail': 3,
      '3 Day Select': 3,
      'First-Class Mail': 5,
      'Ground': 5
    };
    return serviceDays[service] || 5;
  }

  private static calculateDeliveryDate(carrier: string, service: string): Date {
    const days = this.getDeliveryDays(carrier, service);
    const deliveryDate = new Date();
    
    // Add business days (skip weekends)
    let daysAdded = 0;
    while (daysAdded < days) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    return deliveryDate;
  }

  // Parse address from string
  static parseAddress(addressString: string): Partial<ShippingAddress> {
    // Simple parser - in production use a proper address parser
    const parts = addressString.split(',').map(p => p.trim());
    
    if (parts.length < 3) {
      return { street1: addressString };
    }

    const lastPart = parts[parts.length - 1];
    const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
    
    if (stateZipMatch) {
      const [, state, zip] = stateZipMatch;
      const cityStateZip = parts[parts.length - 2];
      const city = cityStateZip.replace(new RegExp(`\\s*,?\\s*${state}.*$`), '').trim();
      
      return {
        street1: parts.slice(0, -2).join(', '),
        city,
        state,
        zip,
        country: 'US'
      };
    }

    return {
      street1: parts[0],
      city: parts[1] || '',
      state: parts[2] || '',
      country: 'US'
    };
  }
}