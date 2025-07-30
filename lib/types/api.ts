// API request and response types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Request types
export interface CreateGameRequest {
  title: string;
  tagline?: string;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  imageUrl?: string;
  isBundle?: boolean;
  isPreorder?: boolean;
  featured?: boolean;
  bundleInfo?: string;
  stock?: number;
  tags?: string[];
  additionalImages?: {
    url: string;
    alt?: string;
  }[];
}

export interface UpdateGameRequest extends Partial<CreateGameRequest> {
  id: number;
}

export interface CreateMerchRequest {
  name: string;
  slug?: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl?: string;
  sizes?: string[];
  featured?: boolean;
  tags?: string[];
}

export interface UpdateMerchRequest extends Partial<CreateMerchRequest> {
  id: number;
}

export interface CreateOrderRequest {
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  billingAddress?: string;
  items: {
    itemType: 'game' | 'merch';
    itemId: number;
    quantity: number;
    merchSize?: string;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: string;
  trackingNumber?: string;
  statusNote?: string;
}

export interface ImportPrintifyRequest {
  productIds?: string[];
  importAll?: boolean;
}

export interface PrintifySettingsRequest {
  printify_api_key?: string;
  printify_shop_id?: string;
  printify_enabled?: string;
}

// Query parameter types
export interface GameQueryParams {
  featured?: boolean;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MerchQueryParams {
  featured?: boolean;
  category?: string;
  isPrintify?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderQueryParams {
  status?: string;
  customerEmail?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}