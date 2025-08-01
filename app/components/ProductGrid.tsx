'use client';

import { useCartStore } from '@/lib/cartStore';
import OptimizedImage from './OptimizedImage';

export default function ProductGrid({ products }: { products: any[] }) {
  const { addToCart } = useCartStore();

  return (
    <section className="py-20 px-6 bg-white text-black">
      <h3 className="text-4xl font-bold text-center mb-10">Our Products</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-100 p-6 rounded-xl text-center shadow-md max-w-sm mx-auto"
          >
            <div className="h-64 mb-4 relative">
              <OptimizedImage
                src={product.imageUrl}
                alt={product.name}
                fill
                className="w-full h-full"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                placeholder={product.title ? '🎮' : '👕'}
                priority={false}
              />
            </div>
            <h4 className="text-2xl font-bold mb-2">{product.name}</h4>
            <p className="mb-2">${(product.priceCents / 100).toFixed(2)}</p>
            <button
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name || product.title,
                  slug: product.slug,
                  priceCents: product.priceCents,
                  imageUrl: product.imageUrl,
                  type: product.title ? 'game' : 'merch',
                })
              }
              className="bg-black text-white px-4 py-2 rounded font-bold"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
