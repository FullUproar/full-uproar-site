'use client';

import { Fragment } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { useRouter } from 'next/navigation';

export default function CartModal() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCartStore();
  
  // TODO: Implement modal open/close state management
  const isOpen = false;
  const toggleCart = () => {};

  if (!isOpen) return null;

  const handleCheckout = () => {
    toggleCart();
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={toggleCart}
      />
      
      {/* Cart Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-500">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-black text-orange-500">FUGLY'S CART</h2>
          </div>
          <button
            onClick={toggleCart}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-400 mb-2">Your cart is empty</p>
              <p className="text-gray-500">Fugly is disappointed. Add some chaos!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={`${item.id}-${item.size || ''}`}
                  className="bg-gray-800 rounded-lg p-4 border-2 border-orange-500/20"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold">
                          {item.type === 'game' ? '🎮' : '👕'}
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-400">{item.name}</h3>
                      {item.size && (
                        <p className="text-sm text-gray-400">Size: {item.size}</p>
                      )}
                      <p className="text-orange-500 font-bold">
                        ${(item.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                          className="p-1 hover:bg-gray-600 rounded-l-lg transition-colors"
                        >
                          <Minus className="h-4 w-4 text-gray-400" />
                        </button>
                        <span className="px-3 font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                          className="p-1 hover:bg-gray-600 rounded-r-lg transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-orange-500 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Subtotal ({getTotalItems()} items)</span>
                <span className="font-bold text-white">
                  ${(getTotalPrice() / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Shipping & taxes calculated at checkout
              </p>
            </div>
            
            <button
              onClick={handleCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-gray-900 font-black py-4 rounded-lg 
                       transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              UNLEASH THE CHAOS
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleCart}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-3 rounded-lg 
                       transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}