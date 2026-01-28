/**
 * ShipStation API Integration
 * Handles all shipping operations including rate calculation, label generation, and tracking
 */

import crypto from 'crypto';

interface ShipStationConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  street3?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  residential?: boolean;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
  units: 'inches' | 'centimeters';
}

interface Weight {
  value: number;
  units: 'pounds' | 'ounces' | 'grams';
}

interface OrderItem {
  lineItemKey?: string;
  sku?: string;
  name: string;
  imageUrl?: string;
  weight?: Weight;
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  options?: Array<{
    name: string;
    value: string;
  }>;
}

interface CreateOrderRequest {
  orderNumber: string;
  orderDate: string;
  orderStatus: 'awaiting_payment' | 'awaiting_shipment' | 'shipped' | 'on_hold' | 'cancelled';
  customerUsername?: string;
  customerEmail?: string;
  billTo: Address;
  shipTo: Address;
  items: OrderItem[];
  amountPaid?: number;
  taxAmount?: number;
  shippingAmount?: number;
  customerNotes?: string;
  internalNotes?: string;
  gift?: boolean;
  giftMessage?: string;
  paymentMethod?: string;
  requestedShippingService?: string;
  carrierCode?: string;
  serviceCode?: string;
  packageCode?: string;
  confirmation?: string;
  shipDate?: string;
  weight?: Weight;
  dimensions?: Dimensions;
  insuranceOptions?: {
    provider: string;
    insureShipment: boolean;
    insuredValue: number;
  };
  advancedOptions?: {
    warehouseId?: number;
    nonMachinable?: boolean;
    saturdayDelivery?: boolean;
    containsAlcohol?: boolean;
    customField1?: string;
    customField2?: string;
    customField3?: string;
    source?: string;
  };
}

interface Rate {
  serviceName: string;
  serviceCode: string;
  shipmentCost: number;
  otherCost: number;
}

interface CreateLabelRequest {
  orderId?: string;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation?: string;
  shipDate: string;
  weight: Weight;
  dimensions?: Dimensions;
  shipFrom?: Address;
  shipTo: Address;
  returnTo?: Address;
  insuranceOptions?: {
    provider: string;
    insureShipment: boolean;
    insuredValue: number;
  };
  testLabel?: boolean;
}

interface ShipmentLabel {
  shipmentId: number;
  orderId?: string;
  userId?: string;
  customerEmail?: string;
  orderNumber?: string;
  createDate: string;
  shipDate: string;
  shipmentCost: number;
  insuranceCost: number;
  trackingNumber: string;
  isReturnLabel: boolean;
  batchNumber?: string;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation?: string;
  warehouseId?: number;
  voided: boolean;
  voidDate?: string;
  marketplaceNotified: boolean;
  notifyErrorMessage?: string;
  shipTo: Address;
  weight: Weight;
  dimensions?: Dimensions;
  labelData: string;
  formData?: string;
}

class ShipStationAPI {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ShipStationConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'https://ssapi.shipstation.com';
    
    // Create base64 encoded auth header
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    this.authHeader = `Basic ${auth}`;
  }

  /**
   * Make authenticated request to ShipStation API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // ShipStation uses 429 for rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('X-Rate-Limit-Reset');
        throw new Error(`Rate limited. Retry after: ${retryAfter}`);
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ShipStation API error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error('ShipStation API request failed:', error);
      throw error;
    }
  }

  /**
   * Create or update an order in ShipStation
   */
  async createOrder(order: CreateOrderRequest): Promise<any> {
    return this.request('/orders/createorder', 'POST', order);
  }

  /**
   * Get shipping rates for a shipment
   */
  async getRates(params: {
    carrierCode: string;
    fromPostalCode: string;
    toState?: string;
    toCountry: string;
    toPostalCode: string;
    toCity?: string;
    weight: Weight;
    dimensions?: Dimensions;
    confirmation?: string;
    residential?: boolean;
  }): Promise<Rate[]> {
    const query = new URLSearchParams({
      carrierCode: params.carrierCode,
      fromPostalCode: params.fromPostalCode,
      toCountry: params.toCountry,
      toPostalCode: params.toPostalCode,
      weight: params.weight.value.toString(),
      // Add other params as needed
    });

    if (params.toState) query.append('toState', params.toState);
    if (params.toCity) query.append('toCity', params.toCity);
    if (params.dimensions) {
      query.append('dimensions', `${params.dimensions.length}x${params.dimensions.width}x${params.dimensions.height}`);
    }

    return this.request(`/shipments/getrates?${query.toString()}`);
  }

  /**
   * Create a shipping label
   */
  async createLabel(labelData: CreateLabelRequest): Promise<ShipmentLabel> {
    return this.request('/shipments/createlabel', 'POST', labelData);
  }

  /**
   * Void a shipping label
   */
  async voidLabel(shipmentId: number): Promise<{ approved: boolean; message: string }> {
    return this.request('/shipments/voidlabel', 'POST', { shipmentId });
  }

  /**
   * Get tracking information for a shipment
   */
  async trackShipment(carrierCode: string, trackingNumber: string): Promise<any> {
    const query = new URLSearchParams({
      carrierCode,
      trackingNumber,
    });
    
    return this.request(`/shipments/trackshipment?${query.toString()}`);
  }

  /**
   * List all carriers available
   */
  async listCarriers(): Promise<any[]> {
    return this.request('/carriers');
  }

  /**
   * Get carrier services
   */
  async getCarrierServices(carrierCode: string): Promise<any[]> {
    const query = new URLSearchParams({ carrierCode });
    return this.request(`/carriers/listservices?${query.toString()}`);
  }

  /**
   * Get carrier packages
   */
  async getCarrierPackages(carrierCode: string): Promise<any[]> {
    const query = new URLSearchParams({ carrierCode });
    return this.request(`/carriers/listpackages?${query.toString()}`);
  }

  /**
   * Mark an order as shipped
   */
  async markAsShipped(params: {
    orderId: string;
    carrierCode: string;
    shipDate?: string;
    trackingNumber?: string;
    notifyCustomer?: boolean;
    notifySalesChannel?: boolean;
  }): Promise<any> {
    return this.request('/orders/markasshipped', 'POST', params);
  }

  /**
   * Create a return label
   */
  async createReturnLabel(originalShipmentId: number): Promise<ShipmentLabel> {
    // This would swap the addresses and create a return label
    // Implementation depends on your return policy
    return this.request('/shipments/createlabel', 'POST', {
      // Return label specific params
      isReturnLabel: true,
      // ... other params
    });
  }

  /**
   * Get order by order number
   */
  async getOrder(orderNumber: string): Promise<any> {
    const query = new URLSearchParams({ orderNumber });
    return this.request(`/orders?${query.toString()}`);
  }

  /**
   * List orders with filters
   */
  async listOrders(params: {
    orderStatus?: string;
    orderDateStart?: string;
    orderDateEnd?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<any> {
    const query = new URLSearchParams();
    
    if (params.orderStatus) query.append('orderStatus', params.orderStatus);
    if (params.orderDateStart) query.append('orderDateStart', params.orderDateStart);
    if (params.orderDateEnd) query.append('orderDateEnd', params.orderDateEnd);
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());

    return this.request(`/orders?${query.toString()}`);
  }

  /**
   * Register a webhook
   */
  async registerWebhook(params: {
    target_url: string;
    event: 'ORDER_NOTIFY' | 'ITEM_ORDER_NOTIFY' | 'SHIP_NOTIFY' | 'ITEM_SHIP_NOTIFY';
    store_id?: number;
    friendly_name?: string;
  }): Promise<any> {
    return this.request('/webhooks/subscribe', 'POST', params);
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<any[]> {
    return this.request('/webhooks');
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    return this.request(`/webhooks/${webhookId}`, 'DELETE');
  }
}

/**
 * Parse a formatted address string into components
 * Expected format: "123 Main St, Apt 4, Chicago, IL 60601, US"
 * or: "123 Main St, Chicago, IL 60601, US"
 */
export function parseAddressString(addressString: string): {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
} {
  const parts = addressString.split(',').map(s => s.trim());

  // Handle different formats
  if (parts.length >= 5) {
    // Has apartment/suite: "123 Main St, Apt 4, Chicago, IL 60601, US"
    const stateZip = parts[3].split(' ').filter(Boolean);
    return {
      street1: parts[0],
      street2: parts[1],
      city: parts[2],
      state: stateZip[0] || '',
      postalCode: stateZip.slice(1).join(' ') || '',
      country: parts[4] || 'US',
    };
  } else if (parts.length >= 4) {
    // No apartment: "123 Main St, Chicago, IL 60601, US"
    const stateZip = parts[2].split(' ').filter(Boolean);
    return {
      street1: parts[0],
      city: parts[1],
      state: stateZip[0] || '',
      postalCode: stateZip.slice(1).join(' ') || '',
      country: parts[3] || 'US',
    };
  } else if (parts.length >= 3) {
    // Minimal: "123 Main St, City, ST 12345"
    const stateZip = parts[2].split(' ').filter(Boolean);
    return {
      street1: parts[0],
      city: parts[1],
      state: stateZip[0] || '',
      postalCode: stateZip.slice(1).join(' ') || '',
      country: 'US',
    };
  }

  // Fallback - couldn't parse
  return {
    street1: addressString,
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  };
}

// Helper function to convert our order format to ShipStation format
export function convertOrderToShipStation(order: any): CreateOrderRequest {
  const shippingAddr = parseAddressString(order.shippingAddress || '');
  const billingAddr = order.billingAddress
    ? parseAddressString(order.billingAddress)
    : shippingAddr;

  // Get item names from the order items
  const items = order.items?.map((item: any) => {
    const name = item.game?.title || item.merch?.name || 'Product';
    const sku = item.game?.slug || item.merch?.slug || `item-${item.id}`;
    const sizeOption = item.merchSize
      ? [{ name: 'Size', value: item.merchSize }]
      : [];

    return {
      lineItemKey: String(item.id),
      sku,
      name,
      quantity: item.quantity,
      unitPrice: item.priceCents / 100,
      options: sizeOption,
    };
  }) || [];

  return {
    orderNumber: order.id,
    orderDate: new Date(order.createdAt).toISOString(),
    orderStatus: order.status === 'paid' ? 'awaiting_shipment' : 'awaiting_payment',
    customerEmail: order.customerEmail,
    customerUsername: order.customerName,
    billTo: {
      name: order.customerName,
      street1: billingAddr.street1,
      street2: billingAddr.street2,
      city: billingAddr.city,
      state: billingAddr.state,
      postalCode: billingAddr.postalCode,
      country: billingAddr.country,
      phone: order.customerPhone || '',
    },
    shipTo: {
      name: order.customerName,
      street1: shippingAddr.street1,
      street2: shippingAddr.street2,
      city: shippingAddr.city,
      state: shippingAddr.state,
      postalCode: shippingAddr.postalCode,
      country: shippingAddr.country,
      phone: order.customerPhone || '',
      residential: true,
    },
    items,
    amountPaid: order.totalCents / 100,
    taxAmount: (order.taxCents || 0) / 100,
    shippingAmount: (order.shippingCents || 0) / 100,
    paymentMethod: 'Stripe',
    advancedOptions: {
      source: 'Full Uproar',
      customField1: order.id,
    },
  };
}

// Singleton instance
let shipStationInstance: ShipStationAPI | null = null;

export function getShipStation(): ShipStationAPI {
  if (!shipStationInstance) {
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('ShipStation API credentials not configured');
    }

    shipStationInstance = new ShipStationAPI({
      apiKey,
      apiSecret,
    });
  }

  return shipStationInstance;
}

/**
 * Sync an order to ShipStation
 * This is a safe wrapper that won't throw - logs errors instead
 */
export async function syncOrderToShipStation(order: any): Promise<boolean> {
  try {
    const shipStation = getShipStation();
    const shipStationOrder = convertOrderToShipStation(order);
    await shipStation.createOrder(shipStationOrder);
    console.log(`Order ${order.id} synced to ShipStation`);
    return true;
  } catch (error) {
    // Don't fail the main operation if ShipStation sync fails
    console.error(`Failed to sync order ${order.id} to ShipStation:`, error);
    return false;
  }
}

/**
 * Check if ShipStation is configured
 */
export function isShipStationConfigured(): boolean {
  return !!(process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET);
}

export default ShipStationAPI;