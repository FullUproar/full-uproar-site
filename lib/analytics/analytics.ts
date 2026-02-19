/**
 * Frontend Analytics System
 * Tracks user interactions, impressions, and behavior
 */

export enum AnalyticsEvent {
  // Page Views
  PAGE_VIEW = 'page_view',
  
  // Product Interactions
  PRODUCT_IMPRESSION = 'product_impression',
  PRODUCT_CLICK = 'product_click',
  PRODUCT_ADD_TO_CART = 'product_add_to_cart',
  PRODUCT_REMOVE_FROM_CART = 'product_remove_from_cart',
  
  // Cart Events
  CART_VIEW = 'cart_view',
  CART_UPDATE_QUANTITY = 'cart_update_quantity',
  CART_PROCEED_TO_CHECKOUT = 'cart_proceed_to_checkout',
  
  // Checkout Events
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_STEP = 'checkout_step',
  CHECKOUT_COMPLETE = 'checkout_complete',
  CHECKOUT_ERROR = 'checkout_error',
  
  // Search Events
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_RESULT_CLICK = 'search_result_click',
  
  // User Events
  USER_LOGIN = 'user_login',
  USER_SIGNUP = 'user_signup',
  USER_LOGOUT = 'user_logout',
  
  // Error Events
  ERROR_BOUNDARY = 'error_boundary',
  API_ERROR = 'api_error',
  
  // Navigation
  NAV_CLICK = 'nav_click',
  FILTER_APPLIED = 'filter_applied',
}

export interface AnalyticsProperties {
  // Common properties
  timestamp?: number;
  sessionId?: string;
  userId?: string;
  
  // Page properties
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  
  // Product properties
  productId?: string;
  productName?: string;
  productPrice?: number;
  productCategory?: string;
  quantity?: number;
  
  // Cart properties
  cartValue?: number;
  cartItemCount?: number;
  
  // Checkout properties
  checkoutStep?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  orderTotal?: number;
  orderId?: string;
  
  // Search properties
  searchQuery?: string;
  searchResultsCount?: number;
  
  // Error properties
  errorMessage?: string;
  errorStack?: string;
  
  // Custom properties
  [key: string]: any;
}

class Analytics {
  private queue: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties }> = [];
  private sessionId: string;
  private isInitialized = false;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  
  constructor() {
    this.sessionId = typeof window !== 'undefined' ? this.generateSessionId() : 'ssr';
  }
  
  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Track page views on route changes
    if (typeof window !== 'undefined') {
      this.trackPageView();
      
      // Listen for route changes
      window.addEventListener('popstate', () => this.trackPageView());
      
      // Flush queue before page unload
      window.addEventListener('beforeunload', () => this.flush());
      
      // Set up visibility tracking for impressions
      this.setupImpressionTracking();
    }
  }
  
  track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
    const enrichedProperties: AnalyticsProperties = {
      ...properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      pageTitle: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    };
    
    this.queue.push({ event, properties: enrichedProperties });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Analytics:', event, enrichedProperties);
    }
    
    // Batch events - send after 5 seconds or when queue reaches 10 events
    if (this.queue.length >= 10) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), 5000);
    }
  }
  
  trackPageView(additionalProperties?: AnalyticsProperties) {
    this.track(AnalyticsEvent.PAGE_VIEW, additionalProperties);
  }
  
  trackProductImpression(productId: string, productName: string, productPrice: number, category?: string) {
    this.track(AnalyticsEvent.PRODUCT_IMPRESSION, {
      productId,
      productName,
      productPrice,
      productCategory: category,
    });
  }
  
  trackAddToCart(productId: string, productName: string, productPrice: number, quantity: number = 1) {
    this.track(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
      productId,
      productName,
      productPrice,
      quantity,
    });
  }
  
  trackCheckoutStep(step: string, additionalProperties?: AnalyticsProperties) {
    this.track(AnalyticsEvent.CHECKOUT_STEP, {
      checkoutStep: step,
      ...additionalProperties,
    });
  }
  
  trackError(error: Error, additionalProperties?: AnalyticsProperties) {
    this.track(AnalyticsEvent.ERROR_BOUNDARY, {
      errorMessage: error.message,
      errorStack: error.stack,
      ...additionalProperties,
    });
  }
  
  private async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-add events to queue on failure
      this.queue.unshift(...events);
    }
  }
  
  private setupImpressionTracking() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const productId = element.dataset.productId;
            const productName = element.dataset.productName;
            const productPrice = parseFloat(element.dataset.productPrice || '0');
            const productCategory = element.dataset.productCategory;
            
            if (productId && productName && !element.dataset.tracked) {
              this.trackProductImpression(productId, productName, productPrice, productCategory);
              element.dataset.tracked = 'true';
            }
          }
        });
      },
      { threshold: 0.5 } // Track when 50% visible
    );
    
    // Observe product cards
    const observeProducts = () => {
      document.querySelectorAll('[data-track-impression="true"]').forEach((element) => {
        observer.observe(element);
      });
    };
    
    // Initial observation
    observeProducts();
    
    // Re-observe on DOM changes
    const mutationObserver = new MutationObserver(() => observeProducts());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
  
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getUserId(): string | undefined {
    // Get user ID from auth provider
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('userId') || undefined;
    }
    return undefined;
  }
}

// Singleton instance
export const analytics = new Analytics();

// React hooks
import { useEffect } from 'react';

export function useAnalytics() {
  useEffect(() => {
    analytics.init();
  }, []);
  
  return analytics;
}

export function useTrackImpression(
  productId: string | undefined,
  productName: string | undefined,
  productPrice: number | undefined,
  category?: string
) {
  useEffect(() => {
    if (productId && productName && productPrice !== undefined) {
      analytics.trackProductImpression(productId, productName, productPrice, category);
    }
  }, [productId, productName, productPrice, category]);
}