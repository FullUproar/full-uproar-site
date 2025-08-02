/**
 * Centralized test IDs for E2E testing
 * Using enums ensures type safety and prevents typos
 */

export enum TestId {
  // Navigation
  NAV_HOME = 'nav-home',
  NAV_GAMES = 'nav-games',
  NAV_MERCH = 'nav-merch',
  NAV_CART = 'nav-cart',
  NAV_USER_MENU = 'nav-user-menu',
  NAV_MOBILE_MENU = 'nav-mobile-menu',
  
  // Cart
  CART_BUTTON = 'cart-button',
  CART_BADGE = 'cart-badge',
  CART_EMPTY = 'cart-empty',
  CART_ITEM = 'cart-item',
  CART_ITEM_REMOVE = 'cart-item-remove',
  CART_ITEM_QUANTITY = 'cart-item-quantity',
  CART_SUBTOTAL = 'cart-subtotal',
  CART_CHECKOUT_BUTTON = 'cart-checkout-button',
  
  // Product Cards
  PRODUCT_CARD = 'product-card',
  PRODUCT_CARD_ADD_TO_CART = 'product-card-add-to-cart',
  PRODUCT_CARD_NAME = 'product-card-name',
  PRODUCT_CARD_PRICE = 'product-card-price',
  
  // Product Detail
  PRODUCT_DETAIL = 'product-detail',
  PRODUCT_DETAIL_ADD_TO_CART = 'product-detail-add-to-cart',
  PRODUCT_DETAIL_QUANTITY = 'product-detail-quantity',
  PRODUCT_DETAIL_PRICE = 'product-detail-price',
  
  // Checkout
  CHECKOUT_FORM = 'checkout-form',
  CHECKOUT_EMAIL = 'checkout-email',
  CHECKOUT_NAME = 'checkout-name',
  CHECKOUT_SHIPPING_ADDRESS = 'checkout-shipping-address',
  CHECKOUT_BILLING_ADDRESS = 'checkout-billing-address',
  CHECKOUT_PAYMENT = 'checkout-payment',
  CHECKOUT_SUBMIT = 'checkout-submit',
  CHECKOUT_SUCCESS = 'checkout-success',
  
  // Admin
  ADMIN_ORDERS_LIST = 'admin-orders-list',
  ADMIN_ORDER_ROW = 'admin-order-row',
  ADMIN_ORDER_DETAIL = 'admin-order-detail',
  ADMIN_GAMES_LIST = 'admin-games-list',
  ADMIN_GAME_FORM = 'admin-game-form',
  ADMIN_MERCH_LIST = 'admin-merch-list',
  ADMIN_MERCH_FORM = 'admin-merch-form',
  
  // Toast
  TOAST_CONTAINER = 'toast-container',
  TOAST_MESSAGE = 'toast-message',
  
  // Search
  SEARCH_INPUT = 'search-input',
  SEARCH_RESULTS = 'search-results',
  
  // Filters
  FILTER_CATEGORY = 'filter-category',
  FILTER_PRICE = 'filter-price',
  FILTER_SORT = 'filter-sort',
}

// Helper function to get test ID attribute
export function getTestId(id: TestId): { 'data-testid': string } {
  return { 'data-testid': id };
}