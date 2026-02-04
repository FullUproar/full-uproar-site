'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { TestId, getTestId } from '@/lib/constants/test-ids';

export default function CartButton() {
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItems = mounted ? getTotalItems() : 0;

  return (
    <button
      onClick={() => router.push('/cart')}
      aria-label={`Shopping cart${cartItems > 0 ? `, ${cartItems} items` : ''}`}
      {...getTestId(TestId.CART_BUTTON)}
      style={{
        position: 'relative',
        padding: '0.5rem',
        borderRadius: '50%',
        transition: 'background-color 0.3s',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <ShoppingCart style={{ height: '1.25rem', width: '1.25rem', color: '#FBDB65' }} />
      {mounted && cartItems > 0 && (
        <span 
          {...getTestId(TestId.CART_BADGE)}
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: '#ef4444',
            color: 'white',
            fontSize: '0.625rem',
            borderRadius: '50%',
            height: '1rem',
            width: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            transform: 'translate(25%, -25%)'
          }}
        >
          {cartItems > 99 ? '99+' : cartItems}
        </span>
      )}
    </button>
  );
}