/**
 * Centralized TypeScript type definitions for the admin system
 * All shared interfaces and types should be defined here
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export type ID = string;
export type ISODateString = string;
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type Percentage = number; // 0-100

// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
  WHOLESALE = 'WHOLESALE'
}

export interface User {
  id: ID;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: ISODateString;
    requestId: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // Only in development
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

export interface Money {
  amount: number;
  currency: Currency;
  formatted?: string;
}

export interface TaxRate {
  state: string;
  rate: Percentage;
  nexus: boolean;
  lastUpdated: Date;
  thresholds: {
    transactions: number;
    revenue: Money;
  };
}

export interface FinancialPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface Revenue {
  gross: Money;
  net: Money;
  tax: Money;
  period: FinancialPeriod;
  byCategory: Record<string, Money>;
  growth: {
    value: number;
    percentage: Percentage;
  };
}

export interface Expense {
  id: ID;
  category: ExpenseCategory;
  description: string;
  amount: Money;
  date: Date;
  vendor?: string;
  approvedBy?: ID;
  receipt?: string;
  tags?: string[];
}

export enum ExpenseCategory {
  COGS = 'COGS',
  MARKETING = 'MARKETING',
  PAYROLL = 'PAYROLL',
  OPERATIONS = 'OPERATIONS',
  SOFTWARE = 'SOFTWARE',
  OFFICE = 'OFFICE',
  TRAVEL = 'TRAVEL',
  OTHER = 'OTHER'
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface Invoice {
  id: ID;
  number: string;
  status: InvoiceStatus;
  type: InvoiceType;
  customer: Customer;
  items: InvoiceItem[];
  dates: {
    issued: Date;
    due: Date;
    paid?: Date;
  };
  amounts: {
    subtotal: Money;
    tax: Money;
    discount: Money;
    total: Money;
    paid: Money;
    balance: Money;
  };
  payment?: PaymentDetails;
  notes?: string;
  terms?: string;
  attachments?: Attachment[];
  reminders?: Reminder[];
  recurring?: RecurringConfig;
  metadata?: Record<string, any>;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum InvoiceType {
  INVOICE = 'invoice',
  QUOTE = 'quote',
  CREDIT_NOTE = 'credit_note'
}

export interface InvoiceItem {
  id: ID;
  description: string;
  quantity: number;
  rate: Money;
  amount: Money;
  tax?: Money;
  discount?: Money;
}

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address: Address;
  taxId?: string;
  creditLimit?: Money;
  paymentTerms?: PaymentTerms;
}

export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  reference?: string;
  processorFee?: Money;
  metadata?: Record<string, any>;
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  ACH = 'ach',
  WIRE = 'wire',
  CHECK = 'check',
  CASH = 'cash',
  CRYPTO = 'crypto',
  OTHER = 'other'
}

export enum PaymentTerms {
  IMMEDIATE = 'immediate',
  NET15 = 'net15',
  NET30 = 'net30',
  NET45 = 'net45',
  NET60 = 'net60',
  CUSTOM = 'custom'
}

export interface Attachment {
  id: ID;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface Reminder {
  id: ID;
  date: Date;
  sent: boolean;
  type: 'email' | 'sms';
  template?: string;
}

export interface RecurringConfig {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  nextDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
}

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

export interface Employee {
  id: ID;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthday?: Date;
    address: Address;
    emergencyContact: EmergencyContact;
  };
  employment: {
    department: Department;
    position: string;
    level: EmployeeLevel;
    status: EmploymentStatus;
    startDate: Date;
    endDate?: Date;
    manager?: ID;
    directReports?: ID[];
  };
  compensation: {
    salary: Money;
    bonus?: Money;
    equity?: number;
    lastRaise?: Date;
    nextReview?: Date;
  };
  timeOff: {
    vacation: TimeOffBalance;
    sick: TimeOffBalance;
    personal: TimeOffBalance;
  };
  performance?: {
    lastReview?: Date;
    nextReview?: Date;
    rating?: 1 | 2 | 3 | 4 | 5;
    goals: PerformanceGoal[];
  };
  documents: EmployeeDocument[];
  metadata?: Record<string, any>;
}

export enum Department {
  ENGINEERING = 'engineering',
  MARKETING = 'marketing',
  SALES = 'sales',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  HR = 'hr',
  EXECUTIVE = 'executive'
}

export enum EmployeeLevel {
  INTERN = 'intern',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive'
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'onLeave',
  TERMINATED = 'terminated',
  ONBOARDING = 'onboarding'
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface TimeOffBalance {
  total: number;
  used: number;
  pending: number;
  scheduled: TimeOffRequest[];
}

export interface TimeOffRequest {
  id: ID;
  type: 'vacation' | 'sick' | 'personal';
  startDate: Date;
  endDate: Date;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approvedBy?: ID;
  notes?: string;
}

export interface PerformanceGoal {
  id: ID;
  title: string;
  description?: string;
  progress: Percentage;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
}

export interface EmployeeDocument {
  type: 'w4' | 'i9' | 'contract' | 'nda' | 'handbook' | 'other';
  url: string;
  uploadedAt: Date;
  verified: boolean;
  expiresAt?: Date;
}

// ============================================================================
// B2B/WHOLESALE TYPES
// ============================================================================

export interface WholesaleAccount {
  id: ID;
  company: {
    name: string;
    taxId: string;
    website?: string;
    industry?: string;
  };
  contact: {
    name: string;
    title?: string;
    email: string;
    phone: string;
  };
  billing: {
    address: Address;
    paymentTerms: PaymentTerms;
    creditLimit: Money;
    creditUsed: Money;
  };
  shipping?: {
    address: Address;
    method?: string;
    instructions?: string;
  };
  tier: WholesaleTier;
  status: AccountStatus;
  discountRate: Percentage;
  volumeCommitment?: Money;
  accountManager?: ID;
  dates: {
    onboarding: Date;
    lastOrder?: Date;
    nextReview?: Date;
  };
  metrics: {
    totalOrders: number;
    totalRevenue: Money;
    averageOrderValue: Money;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  };
  documents: AccountDocument[];
  notes?: string[];
  tags?: string[];
}

export enum WholesaleTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum AccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted'
}

export interface AccountDocument {
  type: 'w9' | 'resale_cert' | 'credit_app' | 'agreement' | 'insurance';
  url: string;
  uploadedAt: Date;
  verified: boolean;
  expiresAt?: Date;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface Product {
  id: ID;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  pricing: {
    retail: Money;
    wholesale?: WholesalePricing;
    cost?: Money;
  };
  inventory: {
    available: number;
    reserved: number;
    incoming?: number;
    reorderPoint: number;
    reorderQuantity: number;
  };
  specifications?: {
    weight?: number;
    dimensions?: Dimensions;
    materials?: string[];
    madeIn?: string;
  };
  images: ProductImage[];
  status: ProductStatus;
  metadata?: Record<string, any>;
}

export interface WholesalePricing {
  [WholesaleTier.BRONZE]: Money;
  [WholesaleTier.SILVER]: Money;
  [WholesaleTier.GOLD]: Money;
  [WholesaleTier.PLATINUM]: Money;
  moq: number; // Minimum order quantity
  casePackSize?: number;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

export interface ProductImage {
  id: ID;
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export enum ProductCategory {
  BOARD_GAME = 'board_game',
  CARD_GAME = 'card_game',
  DICE = 'dice',
  APPAREL = 'apparel',
  ACCESSORIES = 'accessories',
  DIGITAL = 'digital',
  OTHER = 'other'
}

export enum ProductStatus {
  ACTIVE = 'active',
  DISCONTINUED = 'discontinued',
  OUT_OF_STOCK = 'out_of_stock',
  COMING_SOON = 'coming_soon',
  ARCHIVED = 'archived'
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface Order {
  id: ID;
  number: string;
  type: OrderType;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
  };
  shipping: {
    address: Address;
    method: string;
    cost: Money;
    trackingNumber?: string;
    carrier?: string;
  };
  amounts: {
    subtotal: Money;
    tax: Money;
    shipping: Money;
    discount: Money;
    total: Money;
  };
  dates: {
    placed: Date;
    paid?: Date;
    shipped?: Date;
    delivered?: Date;
    cancelled?: Date;
  };
  notes?: OrderNote[];
  metadata?: Record<string, any>;
}

export enum OrderType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  SAMPLE = 'sample',
  REPLACEMENT = 'replacement'
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund'
}

export interface OrderItem {
  id: ID;
  productId: ID;
  name: string;
  sku: string;
  quantity: number;
  price: Money;
  discount?: Money;
  tax?: Money;
  total: Money;
}

export interface OrderNote {
  id: ID;
  author: ID;
  content: string;
  createdAt: Date;
  isInternal: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsEvent {
  id: ID;
  type: EventType;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  userId?: ID;
  sessionId?: string;
  timestamp: Date;
  properties?: Record<string, any>;
  context?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    utm?: UTMParams;
  };
}

export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  PURCHASE = 'purchase',
  SIGNUP = 'signup',
  LOGIN = 'login',
  ERROR = 'error',
  CUSTOM = 'custom'
}

export enum EventCategory {
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  RETENTION = 'retention',
  REVENUE = 'revenue'
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface SystemLog {
  id: ID;
  level: LogLevel;
  message: string;
  category: string;
  timestamp: Date;
  userId?: ID;
  metadata?: Record<string, any>;
  stack?: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface SystemMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncResult<T> = Promise<ApiResponse<T>>;

export type ValidationError = {
  field: string;
  message: string;
  code?: string;
};