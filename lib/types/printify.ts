// Printify-specific types

export interface PrintifyProductImage {
  src: string;
  variant_ids: number[];
}

export interface PrintifyVariant {
  id: number;
  title: string;
  options: {
    color: string;
    size: string;
  };
  price: number;
  is_enabled: boolean;
  is_available: boolean;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: PrintifyProductImage[];
  variants: PrintifyVariant[];
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

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
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

export interface PrintifyApiResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
}

export interface PrintifySettings {
  printify_api_key?: string;
  printify_shop_id?: string;
  printify_enabled?: boolean;
}

export interface PrintifyImportResult {
  imported: number;
  updated: number;
  errors: number;
  details: Array<{
    id: string;
    title: string;
    action: 'imported' | 'updated' | 'error';
    error?: string;
    localId?: number;
  }>;
}