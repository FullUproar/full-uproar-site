'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CartModal  = dynamic(() => import('./CartModal'), { ssr: false });

export default function DrawerWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // avoids hydration mismatch
  }, []);

  if (!mounted) return null;

  return <CartModal  />;
}
