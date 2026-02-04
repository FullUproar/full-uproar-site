'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';

interface MobileCartButtonProps {
  onClose: () => void;
}

export default function MobileCartButton({ onClose }: MobileCartButtonProps) {
  const router = useRouter();
  const { getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItems = mounted ? getTotalItems() : 0;

  return (
    <button 
      onClick={() => { 
        router.push('/cart'); 
        onClose(); 
      }} 
      style={{
        background: 'rgba(255, 130, 0, 0.2)',
        color: '#FBDB65',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontWeight: 'bold',
        border: '2px solid #FF8200',
        cursor: 'pointer',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}
    >
      <ShoppingCart size={20} />
      CART {mounted && cartItems > 0 && `(${cartItems})`}
    </button>
  );
}