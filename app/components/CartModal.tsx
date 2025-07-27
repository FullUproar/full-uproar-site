'use client';

import { useCartStore } from '@/lib/cartStore';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CartModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items, removeFromCart, clearCart } = useCartStore();

  const total = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] bg-orange-500 hover:bg-orange-600 text-gray-900 px-6 py-3 rounded-full shadow-lg font-black transition transform hover:scale-105"
      >
        🛒 CART ({items.length})
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-xl font-bold"
              >
                ✖
              </button>

              <h2 className="text-2xl font-bold mb-4">Your Cart</h2>

              {items.length === 0 ? (
                <p className="text-gray-500">Your cart is empty.</p>
              ) : (
                <>
                  <ul className="space-y-4 mb-6">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center gap-4">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-16 w-16 object-contain rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p>
                            {item.quantity} × ${(
                              item.priceCents / 100
                            ).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 font-bold"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>

                  <p className="text-right font-bold mb-6">
                    Total: ${(total / 100).toFixed(2)}
                  </p>

                  <div className="flex justify-between">
                    <button
                      onClick={clearCart}
                      className="border border-black px-4 py-2 rounded"
                    >
                      Clear Cart
                    </button>
                    <button className="bg-black text-white px-6 py-2 rounded font-bold">
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
