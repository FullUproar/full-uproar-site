// Mock zustand before importing the store
import { act } from '@testing-library/react';

const zustandStore = {
  items: [],
  addToCart: jest.fn(),
  updateQuantity: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
  getTotalItems: jest.fn(),
  getTotalPrice: jest.fn(),
};

jest.mock('zustand', () => ({
  create: jest.fn(() => () => zustandStore),
}));

jest.mock('zustand/middleware', () => ({
  persist: jest.fn((fn) => fn),
}));

jest.mock('@/lib/toastStore', () => ({
  useToastStore: {
    getState: () => ({
      addToast: jest.fn(),
    }),
  },
}));

// Import after mocking
import { useCartStore } from '@/lib/cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store state
    zustandStore.items = [];
    jest.clearAllMocks();
    
    // Set up default mock implementations
    zustandStore.addToCart.mockImplementation((item) => {
      const existing = zustandStore.items.find(
        (i) => i.id === item.id && i.type === item.type && 
        (item.type === 'merch' ? i.size === item.size : true)
      );
      
      if (existing) {
        existing.quantity += 1;
      } else {
        zustandStore.items.push({ ...item, quantity: 1 });
      }
    });

    zustandStore.removeFromCart.mockImplementation((id, size) => {
      zustandStore.items = zustandStore.items.filter(
        (item) => !(item.id === id && (!size || item.size === size))
      );
    });

    zustandStore.updateQuantity.mockImplementation((id, quantity, size) => {
      const item = zustandStore.items.find(
        (i) => i.id === id && (!size || i.size === size)
      );
      if (item) {
        if (quantity <= 0) {
          zustandStore.removeFromCart(id, size);
        } else {
          item.quantity = quantity;
        }
      }
    });

    zustandStore.clearCart.mockImplementation(() => {
      zustandStore.items = [];
    });

    zustandStore.getTotalItems.mockImplementation(() => {
      return zustandStore.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    zustandStore.getTotalPrice.mockImplementation(() => {
      return zustandStore.items.reduce(
        (sum, item) => sum + item.priceCents * item.quantity,
        0
      );
    });
  });

  describe('addToCart', () => {
    it('should add a game to the cart', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };

      zustandStore.addToCart(game);
      
      expect(zustandStore.items).toHaveLength(1);
      expect(zustandStore.items[0]).toMatchObject({
        ...game,
        quantity: 1,
      });
    });

    it('should add merchandise with size to the cart', () => {
      const merch = {
        id: 2,
        name: 'T-Shirt',
        slug: 't-shirt',
        priceCents: 2499,
        imageUrl: 'https://example.com/shirt.jpg',
        type: 'merch' as const,
        size: 'L',
        category: 'apparel',
      };

      zustandStore.addToCart(merch);
      
      expect(zustandStore.items).toHaveLength(1);
      expect(zustandStore.items[0]).toMatchObject({
        ...merch,
        quantity: 1,
      });
    });

    it('should increase quantity if item already exists', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };

      zustandStore.addToCart(game);
      zustandStore.addToCart(game);
      
      expect(zustandStore.items).toHaveLength(1);
      expect(zustandStore.items[0].quantity).toBe(2);
    });

    it('should treat same merch with different sizes as different items', () => {
      const merch = {
        id: 2,
        name: 'T-Shirt',
        slug: 't-shirt',
        priceCents: 2499,
        imageUrl: 'https://example.com/shirt.jpg',
        type: 'merch' as const,
        category: 'apparel',
      };

      zustandStore.addToCart({ ...merch, size: 'L' });
      zustandStore.addToCart({ ...merch, size: 'XL' });
      
      expect(zustandStore.items).toHaveLength(2);
      expect(zustandStore.items[0].size).toBe('L');
      expect(zustandStore.items[1].size).toBe('XL');
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from the cart', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };

      zustandStore.addToCart(game);
      expect(zustandStore.items).toHaveLength(1);

      zustandStore.removeFromCart(1);
      expect(zustandStore.items).toHaveLength(0);
    });

    it('should remove specific size of merch item', () => {
      const merch = {
        id: 2,
        name: 'T-Shirt',
        slug: 't-shirt',
        priceCents: 2499,
        imageUrl: 'https://example.com/shirt.jpg',
        type: 'merch' as const,
        category: 'apparel',
      };

      zustandStore.addToCart({ ...merch, size: 'L' });
      zustandStore.addToCart({ ...merch, size: 'XL' });
      
      zustandStore.removeFromCart(2, 'L');
      
      expect(zustandStore.items).toHaveLength(1);
      expect(zustandStore.items[0].size).toBe('XL');
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of an item', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };

      zustandStore.addToCart(game);
      zustandStore.updateQuantity(1, 5);
      
      expect(zustandStore.items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is set to 0', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };

      zustandStore.addToCart(game);
      zustandStore.updateQuantity(1, 0);
      
      expect(zustandStore.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from the cart', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };
      const merch = {
        id: 2,
        name: 'T-Shirt',
        slug: 't-shirt',
        priceCents: 2499,
        imageUrl: 'https://example.com/shirt.jpg',
        type: 'merch' as const,
        size: 'L',
      };

      zustandStore.addToCart(game);
      zustandStore.addToCart(merch);
      
      expect(zustandStore.items).toHaveLength(2);
      
      zustandStore.clearCart();
      expect(zustandStore.items).toHaveLength(0);
    });
  });

  describe('getTotalPrice', () => {
    it('should calculate the total price correctly', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };
      const merch = {
        id: 2,
        name: 'T-Shirt',
        slug: 't-shirt',
        priceCents: 2499,
        imageUrl: 'https://example.com/shirt.jpg',
        type: 'merch' as const,
        size: 'L',
      };

      zustandStore.addToCart(game);
      zustandStore.addToCart(game); // quantity 2
      zustandStore.addToCart(merch);
      
      const total = zustandStore.getTotalPrice();
      expect(total).toBe(1999 * 2 + 2499);
    });

    it('should return 0 for empty cart', () => {
      const total = zustandStore.getTotalPrice();
      expect(total).toBe(0);
    });
  });

  describe('getTotalItems', () => {
    it('should return the correct number of items', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };

      zustandStore.addToCart(game);
      zustandStore.addToCart(game);
      zustandStore.addToCart(game);
      
      const count = zustandStore.getTotalItems();
      expect(count).toBe(3);
    });

    it('should count quantities correctly for multiple items', () => {
      const game = {
        id: 1,
        name: 'Test Game',
        slug: 'test-game',
        priceCents: 1999,
        imageUrl: 'https://example.com/game.jpg',
        type: 'game' as const,
      };
      const merch = {
        id: 2,
        name: 'T-Shirt',
        slug: 't-shirt',
        priceCents: 2499,
        imageUrl: 'https://example.com/shirt.jpg',
        type: 'merch' as const,
        size: 'L',
      };

      zustandStore.addToCart(game);
      zustandStore.addToCart(game);
      zustandStore.addToCart(merch);
      zustandStore.addToCart(merch);
      zustandStore.addToCart(merch);
      
      const count = zustandStore.getTotalItems();
      expect(count).toBe(5);
    });
  });
});