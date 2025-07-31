// Database model types - single source of truth for data shapes

export interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  category: string; // 'game' or 'mod'
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo: string | null;
  stock: number;
  tags: string | null;
  howToPlay?: string | null;
  components?: string | null;
  videoUrl?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  
  // Relations
  orderItems?: OrderItem[];
  images?: GameImage[];
  inventory?: GameInventory | null;
  reviews?: Review[];
}

export interface Merch {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: MerchCategory;
  priceCents: number;
  imageUrl: string | null;
  sizes: string | null; // JSON string of size array
  featured: boolean;
  tags: string | null; // JSON string of tags
  createdAt: Date;
  
  // Printify fields
  printifyId: string | null;
  blueprintId: number | null;
  printProviderId: number | null;
  variantMapping: string | null; // JSON mapping
  isPrintify: boolean;
  
  // Relations
  inventory?: Inventory[];
  orderItems?: OrderItem[];
  images?: MerchImage[];
  
  // Computed
  totalStock?: number;
}

export interface Comic {
  id: number;
  title: string;
  episode: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: Date;
}

export interface Artwork {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  largeUrl: string | null;
  category: ArtworkCategory;
  tags: string | null;
  chaosMode: boolean;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  billingAddress: string | null;
  status: OrderStatus;
  totalCents: number;
  shippingCents: number;
  taxCents: number;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  items?: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface OrderItem {
  id: number;
  orderId: string;
  itemType: 'game' | 'merch';
  gameId: number | null;
  merchId: number | null;
  merchSize: string | null;
  quantity: number;
  priceCents: number;
  
  // Relations
  order?: Order;
  game?: Game;
  merch?: Merch;
}

export interface OrderStatusHistory {
  id: number;
  orderId: string;
  status: string;
  note: string | null;
  createdAt: Date;
  
  // Relations
  order?: Order;
}

export interface Inventory {
  id: number;
  merchId: number;
  size: string | null;
  quantity: number;
  reserved: number;
  
  // Relations
  merch?: Merch;
}

export interface GameInventory {
  id: number;
  gameId: number;
  quantity: number;
  reserved: number;
  
  // Relations
  game?: Game;
}

export interface GameImage {
  id: number;
  gameId: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  
  // Relations
  game?: Game;
}

export interface MerchImage {
  id: number;
  merchId: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  
  // Relations
  merch?: Merch;
}

export interface Settings {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

export interface EmailSubscriber {
  id: number;
  email: string;
  createdAt: Date;
}

export interface Review {
  id: number;
  gameId: number | null;
  merchId: number | null;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  game?: Game;
  merch?: Merch;
}

export interface ProductView {
  id: number;
  productType: string;
  productId: number;
  userId: string | null;
  sessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface UserActivity {
  id: number;
  userId: string;
  action: string;
  targetType: string;
  targetId: number;
  metadata: string | null;
  createdAt: Date;
}

// Enums
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type MerchCategory = 'apparel' | 'accessories' | 'collectibles' | 'stickers' | 'other';
export type ArtworkCategory = 'background' | 'character' | 'logo' | 'decoration' | 'other';