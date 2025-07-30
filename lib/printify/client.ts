import { prisma } from '@/lib/prisma';

export interface PrintifyProductImage {
  src: string;
  variant_ids: number[];
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: PrintifyProductImage[];
  variants: Array<{
    id: number;
    title: string;
    options: {
      color: string;
      size: string;
    };
    price: number;
    is_enabled: boolean;
    is_available: boolean;
  }>;
  blueprint_id: number;
  print_provider_id: number;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        name: string;
        type: string;
        src: string;
      }>;
    }>;
  }>;
}

export interface PrintifyOrder {
  external_id: string;
  label: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
  }>;
  shipping_method: number;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

export class PrintifyClient {
  private apiKey: string | null = null;
  private shopId: string | null = null;
  private baseUrl = 'https://api.printify.com/v1';

  async initialize() {
    // Load API key and shop ID from database
    const apiKeySetting = await prisma.settings.findUnique({
      where: { key: 'printify_api_key' }
    });
    
    const shopIdSetting = await prisma.settings.findUnique({
      where: { key: 'printify_shop_id' }
    });

    this.apiKey = apiKeySetting?.value || null;
    this.shopId = shopIdSetting?.value || null;

    if (!this.apiKey) {
      throw new Error('Printify API key not configured');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      await this.initialize();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Printify API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async getShops() {
    return this.request('/shops.json');
  }

  async getProducts(limit = 100, page = 1) {
    return this.request(`/shops/${this.shopId}/products.json?limit=${limit}&page=${page}`);
  }

  async getProduct(productId: string) {
    return this.request(`/shops/${this.shopId}/products/${productId}.json`);
  }

  async getBlueprints() {
    return this.request('/catalog/blueprints.json');
  }

  async getBlueprintProviders(blueprintId: number) {
    return this.request(`/catalog/blueprints/${blueprintId}/print_providers.json`);
  }

  async getBlueprintVariants(blueprintId: number, printProviderId: number) {
    return this.request(`/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`);
  }

  async createOrder(order: PrintifyOrder) {
    return this.request(`/shops/${this.shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  async submitOrderForProduction(orderId: string) {
    return this.request(`/shops/${this.shopId}/orders/${orderId}/send_to_production.json`, {
      method: 'POST'
    });
  }

  async getOrder(orderId: string) {
    return this.request(`/shops/${this.shopId}/orders/${orderId}.json`);
  }

  async calculateShipping(order: Partial<PrintifyOrder>) {
    return this.request(`/shops/${this.shopId}/orders/shipping.json`, {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  // Helper method to check if a product is available
  async checkProductAvailability(productId: string, variantId: number) {
    try {
      const product = await this.getProduct(productId);
      const variant = product.variants.find((v: any) => v.id === variantId);
      
      return {
        available: variant?.is_available || false,
        enabled: variant?.is_enabled || false,
        variant
      };
    } catch (error) {
      console.error('Error checking product availability:', error);
      return {
        available: false,
        enabled: false,
        variant: null
      };
    }
  }

  // Helper to convert Printify product to our merch format
  convertToMerch(product: PrintifyProduct) {
    // Extract unique sizes from variants
    const sizes = [...new Set(product.variants
      .filter(v => v.is_enabled && v.is_available)
      .map(v => v.options.size))]
      .filter(size => size); // Remove empty sizes

    // Create variant mapping
    const variantMapping: Record<string, number> = {};
    product.variants.forEach(variant => {
      if (variant.options.size && variant.is_enabled) {
        variantMapping[variant.options.size] = variant.id;
      }
    });

    // Get the primary image
    const primaryImage = product.images[0]?.src || null;

    // Calculate price (Printify prices are in cents)
    const prices = product.variants
      .filter(v => v.is_enabled && v.is_available)
      .map(v => v.price);
    const averagePrice = prices.length > 0 
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

    return {
      name: product.title,
      slug: product.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: product.description || product.title,
      category: 'apparel', // You might want to map this based on blueprint
      priceCents: averagePrice,
      imageUrl: primaryImage,
      sizes: JSON.stringify(sizes),
      featured: false,
      tags: JSON.stringify(['printify', 'pod']),
      
      // Printify specific fields
      printifyId: product.id,
      blueprintId: product.blueprint_id,
      printProviderId: product.print_provider_id,
      variantMapping: JSON.stringify(variantMapping),
      isPrintify: true
    };
  }
}