import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './toastStore';

export type CartItem = {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
  type: 'game' | 'merch';
  size?: string; // For merch items with sizes
  color?: string; // For merch items with colors
  category?: string; // For merch items
};

type CartState = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (id: number, quantity: number, size?: string, color?: string) => void;
  removeFromCart: (id: number, size?: string, color?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (item) => {
        set((state) => {
          // For merch with sizes/colors, we need to check id, size, and color
          const isSameVariant = (i: CartItem) =>
            i.id === item.id &&
            i.type === item.type &&
            (item.type === 'merch' ? i.size === item.size && i.color === item.color : true);

          const existing = state.items.find(isSameVariant);

          if (existing) {
            return {
              items: state.items.map((i) =>
                isSameVariant(i) ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
        
        // Show success toast with personality
        const { addToast } = useToastStore.getState();
        const messages = item.type === 'game'
          ? [
              `Added ${item.name} to cart! The chaos is real now.`,
              `${item.name} secured! Time to unleash mayhem.`,
              `${item.name} is yours! Fugly approves.`
            ]
          : [
              `Added ${item.name} to cart! Wear your chaos with pride.`,
              `${item.name} secured! Looking fugly never felt so good.`,
              `${item.name} is yours! Time to rep the chaos.`
            ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        addToast({
          message: randomMessage,
          type: 'success',
          duration: 2000,
        });
      },
        
      updateQuantity: (id, quantity, size, color) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id &&
            (size !== undefined ? i.size === size : true) &&
            (color !== undefined ? i.color === color : true)
              ? { ...i, quantity: Math.max(0, quantity) }
              : i
          ).filter(i => i.quantity > 0),
        })),

      removeFromCart: (id, size, color) =>
        set((state) => ({
          items: state.items.filter((i) =>
            !(i.id === id &&
              (size !== undefined ? i.size === size : true) &&
              (color !== undefined ? i.color === color : true))
          ),
        })),
        
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.priceCents * item.quantity), 0);
      },
    }),
    {
      name: 'fugly-cart',
    }
  )
);
