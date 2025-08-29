'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Zap, Package, Ruler, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';
import ProductImageGallery from '@/app/components/ProductImageGallery';
import { stripHtmlTags } from '@/lib/utils/formatting';

interface MerchImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Inventory {
  id: number;
  size: string | null;
  quantity: number;
  reserved: number;
}

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
  tags: string | null;
  images: MerchImage[];
  inventory: Inventory[];
  isPrintify?: boolean;
  totalStock?: number;
}

interface MerchProductClientProps {
  merch: Merch;
  similarMerch: Merch[];
}

export default function MerchProductClient({ merch, similarMerch }: MerchProductClientProps) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Parse sizes
  const availableSizes = merch.sizes ? JSON.parse(merch.sizes) : [];

  // Get stock for selected size
  const getStockForSize = (size: string) => {
    // POD products always have stock
    if (merch.isPrintify) return 999;
    
    const inv = merch.inventory.find(i => i.size === size);
    return inv ? inv.quantity - inv.reserved : 0;
  };

  const currentStock = selectedSize ? getStockForSize(selectedSize) : (merch.totalStock || 0);

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      alert("Pick a size, or Fugly will pick for you (and you won't like it)!");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: merch.id,
        name: merch.name,
        slug: merch.slug,
        priceCents: merch.priceCents,
        imageUrl: merch.imageUrl || merch.images[0]?.imageUrl || '/placeholder-merch.jpg',
        type: 'merch',
        size: selectedSize || undefined,
        category: merch.category
      });
    }
    router.push('/cart');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: merch.name,
        text: stripHtmlTags(merch.description),
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const sizeGuide = {
    'S': { chest: '34-36"', waist: '28-30"' },
    'M': { chest: '38-40"', waist: '32-34"' },
    'L': { chest: '42-44"', waist: '36-38"' },
    'XL': { chest: '46-48"', waist: '40-42"' },
    'XXL': { chest: '50-52"', waist: '44-46"' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-600">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-gray-900/90 border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <FuglyLogo size={50} />
              <span className="text-2xl font-black text-orange-500">FULL UPROAR</span>
            </Link>
            
            <button
              onClick={() => router.push('/#merch')}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Merch
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative">
              <ProductImageGallery
                images={merch.images}
                primaryImageUrl={merch.imageUrl}
                productName={merch.name}
              />
              
              {/* Badge overlay */}
              {merch.featured && (
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-black transform -rotate-3">
                    FUGLY FAVE
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
                  {merch.category.toUpperCase()}
                </span>
              </div>
              
              <h1 className="text-5xl font-black text-orange-500 mb-3 transform -rotate-1">
                {merch.name}
              </h1>
            </div>

            {/* Description */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border-2 border-orange-500/20">
              <p className="text-gray-300 text-lg leading-relaxed">{stripHtmlTags(merch.description)}</p>
            </div>

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-black text-yellow-400">Choose Your Size</h3>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold text-sm transition-colors"
                  >
                    <Ruler className="h-4 w-4" />
                    Size Guide
                  </button>
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                  {availableSizes.map((size: string) => {
                    const stock = getStockForSize(size);
                    const isAvailable = stock > 0;
                    
                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={`
                          relative py-3 rounded-lg font-black transition-all transform
                          ${selectedSize === size
                            ? 'bg-orange-500 text-gray-900 scale-110'
                            : isAvailable
                              ? 'bg-gray-700 text-white hover:bg-gray-600 hover:scale-105'
                              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          }
                        `}
                      >
                        {size}
                        {!isAvailable && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-gray-800/90 px-2 py-1 rounded text-xs">SOLD OUT</span>
                          </span>
                        )}
                        {isAvailable && stock < 5 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {stock} left
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Size Guide Modal */}
                {showSizeGuide && (
                  <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                    <h4 className="font-bold text-orange-400 mb-2">Size Guide (US)</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(sizeGuide).map(([size, measurements]) => (
                        <div key={size} className="flex justify-between text-gray-300">
                          <span className="font-bold">{size}:</span>
                          <span>Chest {measurements.chest}, Waist {measurements.waist}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price and Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-black text-white">
                    ${(merch.priceCents / 100).toFixed(2)}
                  </p>
                  {selectedSize && currentStock > 0 && currentStock < 10 && (
                    <p className="text-red-400 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Only {currentStock} left in {selectedSize}!
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`
                      p-3 rounded-full transition-all
                      ${isWishlisted 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }
                    `}
                  >
                    <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <Share2 className="h-6 w-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 font-bold">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                    disabled={selectedSize ? quantity >= currentStock : false}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-800 disabled:text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={availableSizes.length > 0 && (!selectedSize || currentStock === 0)}
                className={`
                  w-full py-5 rounded-xl font-black text-xl transition-all transform
                  flex items-center justify-center gap-3
                  ${availableSizes.length > 0 && (!selectedSize || currentStock === 0)
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-gray-900 hover:scale-105 hover:shadow-2xl'
                  }
                `}
              >
                {availableSizes.length > 0 && !selectedSize ? (
                  <>SELECT A SIZE FIRST</>
                ) : currentStock === 0 ? (
                  <>OUT OF STOCK</>
                ) : (
                  <>
                    <ShoppingCart className="h-6 w-6" />
                    ADD ${((merch.priceCents * quantity) / 100).toFixed(2)} OF CHAOS
                    <Zap className="h-6 w-6" />
                  </>
                )}
              </button>

              {merch.category === 'Apparel' && (
                <p className="text-center text-yellow-400 font-bold text-sm">
                  🔥 Machine washable chaos - Fugly tested for durability!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarMerch.length > 0 && (
          <div className="mt-16">
            <h2 className="text-4xl font-black text-orange-500 mb-8 text-center transform -rotate-2">
              MORE WAYS TO REP THE CHAOS
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarMerch.map((item, index) => {
                const itemSizes = item.sizes ? JSON.parse(item.sizes) : [];
                
                return (
                  <Link
                    key={item.id}
                    href={`/merch/${item.slug}`}
                    className={`
                      bg-gray-800 rounded-xl overflow-hidden border-4 border-orange-500/20
                      hover:border-orange-500 transition-all transform hover:scale-105
                      ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                    `}
                  >
                    <div className="aspect-square bg-gray-700 relative">
                      <img
                        src={item.images[0]?.imageUrl || item.imageUrl || '/placeholder-merch.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.featured && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-gray-900 text-xs px-2 py-1 rounded-full font-bold">
                          HOT
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <p className="text-xs text-orange-400 font-bold mb-1">{item.category}</p>
                      <h3 className="font-black text-yellow-400 mb-2">{item.name}</h3>
                      {itemSizes.length > 0 && (
                        <p className="text-xs text-gray-400 mb-2">
                          Sizes: {itemSizes.join(', ')}
                        </p>
                      )}
                      <p className="text-2xl font-black text-orange-500">
                        ${(item.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}