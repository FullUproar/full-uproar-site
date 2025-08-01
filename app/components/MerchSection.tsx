'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

interface Merch {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  sizes: string | null;
  featured: boolean;
}

interface MerchSectionProps {
  merchItems: Merch[];
}

export default function MerchSection({ merchItems }: MerchSectionProps) {
  const { addToCart } = useCartStore();
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const handleAddToCart = (merch: Merch) => {
    const sizes = merch.sizes ? JSON.parse(merch.sizes) : null;
    const selectedSize = selectedSizes[merch.id];

    if (sizes && sizes.length > 0 && !selectedSize) {
      alert("Pick a size, or Fugly will pick for you!");
      return;
    }

    addToCart({
      id: merch.id,
      name: merch.name,
      slug: merch.slug,
      priceCents: merch.priceCents,
      imageUrl: merch.imageUrl || '/placeholder-merch.jpg',
      type: 'merch',
      size: selectedSize,
      category: merch.category
    });
  };

  const categories = [...new Set(merchItems.map(item => item.category))];

  return (
    <section id="merch" className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Background chaos elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`
            }}
          >
            <Package className="h-16 w-16 text-orange-500" />
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-orange-500 mb-4">
            FUGLY'S MERCH MADNESS
          </h2>
          <p className="text-xl text-yellow-400 font-bold">
            Wear the chaos. BE the chaos. Fugly-approved fashion disasters.
          </p>
        </div>

        {merchItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-gray-400">No merch yet!</p>
            <p className="text-gray-500 mt-2">Fugly is still designing the perfect chaos wear.</p>
          </div>
        ) : (
          <>
            {/* Featured Merch */}
            {merchItems.filter(m => m.featured).length > 0 && (
              <div className="mb-16">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 transform rotate-1">
                  <h3 className="text-3xl font-black text-gray-900 mb-6 -rotate-1">
                    🔥 HOT CHAOS DROPS 🔥
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8 -rotate-1">
                    {merchItems.filter(m => m.featured).map((merch) => (
                      <Link
                        key={merch.id}
                        href={`/merch/${merch.slug}`}
                        className="bg-gray-900 rounded-xl p-6 transform hover:scale-105 transition-all duration-300 block"
                        onMouseEnter={() => setHoveredItem(merch.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="flex gap-6">
                          <div className="w-32 h-32 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <OptimizedImage
                              src={merch.imageUrl}
                              alt={merch.name}
                              fill
                              className="w-full h-full"
                              sizes="128px"
                              placeholder="👕"
                              priority={true}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-2xl font-black text-yellow-400 mb-2">
                              {merch.name}
                            </h4>
                            <p className="text-gray-400 mb-3">{merch.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-3xl font-black text-orange-500">
                                ${(merch.priceCents / 100).toFixed(2)}
                              </p>
                              <span className="bg-orange-500 text-gray-900 px-3 py-1 rounded-lg font-black">
                                VIEW
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.map((category) => (
              <div key={category} className="mb-12">
                <h3 className="text-3xl font-black text-orange-500 mb-6 transform -rotate-2">
                  {category.toUpperCase()}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {merchItems.filter(m => m.category === category && !m.featured).map((merch, index) => {
                    const sizes = merch.sizes ? JSON.parse(merch.sizes) : null;
                    const isHovered = hoveredItem === merch.id;
                    
                    return (
                      <div
                        key={merch.id}
                        className={`
                          bg-gray-800 rounded-xl overflow-hidden border-4 border-orange-500/20
                          transform transition-all duration-300
                          ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                          ${isHovered ? 'scale-105 border-orange-500' : ''}
                        `}
                        onMouseEnter={() => setHoveredItem(merch.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="relative h-48 bg-gray-700">
                          <OptimizedImage
                            src={merch.imageUrl}
                            alt={merch.name}
                            fill
                            className="w-full h-full"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            placeholder={category === 'Apparel' ? '👕' : '🎁'}
                            priority={index < 4}
                          />
                          {isHovered && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                              <Heart className="h-12 w-12 text-red-500 animate-pulse" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h4 className="text-xl font-black text-yellow-400 mb-2">
                            {merch.name}
                          </h4>
                          <p className="text-gray-400 text-sm mb-3">
                            {merch.description}
                          </p>
                          
                          {sizes && sizes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-bold text-orange-500 mb-2">Size:</p>
                              <div className="flex flex-wrap gap-2">
                                {sizes.map((size: string) => (
                                  <button
                                    key={size}
                                    onClick={() => setSelectedSizes({ 
                                      ...selectedSizes, 
                                      [merch.id]: size 
                                    })}
                                    className={`
                                      px-3 py-1 rounded-lg text-sm font-bold transition-all
                                      ${selectedSizes[merch.id] === size
                                        ? 'bg-orange-500 text-gray-900'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      }
                                    `}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-orange-500">
                              ${(merch.priceCents / 100).toFixed(2)}
                            </span>
                            <Link
                              href={`/merch/${merch.slug}`}
                              className="bg-orange-500 hover:bg-orange-600 text-gray-900 font-black px-4 py-2 rounded-lg transition-all transform hover:scale-110 flex items-center gap-2"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              VIEW
                            </Link>
                          </div>
                        </div>
                        
                        {index % 3 === 0 && (
                          <div className="absolute -top-4 -right-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full transform rotate-12">
                            FUGLY FAVE
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}