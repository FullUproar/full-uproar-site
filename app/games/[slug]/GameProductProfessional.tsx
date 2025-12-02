'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Users, Clock, Heart, Share2, ChevronLeft, ChevronRight, 
  Zap, Package, Star, Skull, Shield, Truck, BadgeCheck, Sparkles,
  Gift, Timer, Eye, ArrowRight, Gamepad2, Trophy, Flame, Check,
  Info, AlertCircle, X, Plus, Minus
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import ProductImageGallery from '@/app/components/ProductImageGallery';

interface GameImage {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Game {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  players: string;
  timeToPlay: string;
  ageRating: string;
  category?: string;
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo: string | null;
  stock: number;
  tags: string | null;
  images: GameImage[];
}

interface GameProductProfessionalProps {
  game: Game;
  similarGames: Game[];
}

export default function GameProductProfessional({ game, similarGames }: GameProductProfessionalProps) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isInCart, setIsInCart] = useState(false);
  const [showBuyBox, setShowBuyBox] = useState(true);

  const allImages = [
    ...(game.imageUrl ? [{ imageUrl: game.imageUrl, alt: game.title, isPrimary: true }] : []),
    ...game.images
  ].filter(img => img.imageUrl);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: game.id,
        name: game.title,
        slug: game.slug,
        priceCents: game.priceCents,
        imageUrl: allImages[0]?.imageUrl || '/placeholder-game.jpg',
        type: 'game'
      });
    }
    
    setIsInCart(true);
    setTimeout(() => setIsInCart(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: game.title,
        text: game.tagline || game.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Track scroll for sticky buy box
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowBuyBox(scrollTop < 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { label: 'Player Count', value: game.players, icon: Users },
    { label: 'Play Time', value: game.timeToPlay, icon: Clock },
    { label: 'Age Rating', value: game.ageRating, icon: Info },
    { label: 'Category', value: game.category?.toUpperCase() || 'GAME', icon: Gamepad2 }
  ];

  const highlights = [
    '🎮 Officially licensed Fugly chaos',
    '🏆 Award-winning game design',
    '🎯 Perfect for game nights',
    '💥 Guaranteed table flips',
    '🎨 Premium quality components'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Amazon-style breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-orange-600 hover:text-orange-700">Full Uproar</Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <Link href="/games" className="text-orange-600 hover:text-orange-700">Games</Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span className="text-gray-700">{game.category === 'mod' ? 'Mods' : 'Games'}</span>
          </div>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Images */}
            <div className="lg:col-span-1">
              {/* Main Image */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <div 
                  className="aspect-square relative cursor-zoom-in"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMousePosition({
                      x: ((e.clientX - rect.left) / rect.width) * 100,
                      y: ((e.clientY - rect.top) / rect.height) * 100
                    });
                  }}
                  onMouseEnter={() => setShowZoom(true)}
                  onMouseLeave={() => setShowZoom(false)}
                >
                  <img
                    src={allImages[selectedImage]?.imageUrl || '/placeholder-game.jpg'}
                    alt={allImages[selectedImage]?.alt || game.title}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Zoom Preview */}
                  {showZoom && (
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        backgroundImage: `url(${allImages[selectedImage]?.imageUrl})`,
                        backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                        backgroundSize: '200%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 space-y-2">
                    {game.isPreorder && (
                      <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">
                        PRE-ORDER
                      </div>
                    )}
                    {game.featured && (
                      <div className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-semibold">
                        BESTSELLER
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`
                        aspect-square bg-gray-100 rounded overflow-hidden border-2 transition-all
                        ${selectedImage === index ? 'border-orange-600' : 'border-gray-300 hover:border-gray-400'}
                      `}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.alt || `${game.title} ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Middle Column - Product Info */}
            <div className="lg:col-span-1">
              {/* Title Section */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{game.title}</h1>
                {game.tagline && (
                  <p className="text-lg text-gray-600">{game.tagline}</p>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    4.8 out of 5 | 234 ratings
                  </span>
                </div>

                {/* Category Badge */}
                <div className="mt-3">
                  <span className={`
                    inline-block px-3 py-1 rounded-full text-xs font-semibold
                    ${game.category === 'mod' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-orange-100 text-orange-800'
                    }
                  `}>
                    {game.category?.toUpperCase() || 'GAME'}
                  </span>
                </div>
              </div>

              {/* Price Section */}
              <div className="border-t border-b py-4 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-3xl font-medium text-gray-900">
                    ${(game.priceCents / 100).toFixed(2)}
                  </span>
                  {game.isBundle && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ${((game.priceCents * 1.3) / 100).toFixed(2)}
                      </span>
                      <span className="text-sm text-green-700 font-semibold">
                        Save ${((game.priceCents * 0.3) / 100).toFixed(2)} (23%)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  FREE delivery on orders over $25
                </p>
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{feature.label}:</span>
                      <span className="font-semibold text-gray-900">{feature.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Product Highlights */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">About this item</h3>
                <ul className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-orange-600 mt-0.5">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{game.description}</p>
              </div>

              {/* Bundle Info */}
              {game.bundleInfo && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Bundle Includes
                  </h4>
                  <p className="text-sm text-orange-800">{game.bundleInfo}</p>
                </div>
              )}
            </div>

            {/* Right Column - Buy Box */}
            <div className="lg:col-span-1">
              <div className={`
                bg-white border border-gray-300 rounded-lg p-6 
                ${showBuyBox ? '' : 'lg:sticky lg:top-20'}
              `}>
                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-medium text-gray-900">
                    ${(game.priceCents / 100).toFixed(2)}
                  </span>
                </div>

                {/* Delivery Info */}
                <div className="text-sm space-y-2 mb-4">
                  <p className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">FREE delivery</span> 
                    <span className="text-gray-600">Thursday, November 7</span>
                  </p>
                  <p className="text-gray-600">
                    Or fastest delivery <span className="font-semibold">Tomorrow, Nov 5</span>
                  </p>
                </div>

                {/* Stock Status */}
                <div className="mb-4">
                  {game.stock > 20 ? (
                    <p className="text-green-700 font-semibold">In Stock</p>
                  ) : game.stock > 0 ? (
                    <p className="text-orange-700 font-semibold">
                      Only {game.stock} left in stock - order soon
                    </p>
                  ) : (
                    <p className="text-red-700 font-semibold">Currently unavailable</p>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="mb-4">
                  <label className="text-sm text-gray-700 block mb-1">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(game.stock || 99, quantity + 1))}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= (game.stock || 99)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={game.stock === 0}
                    className={`
                      w-full py-2 px-4 rounded-full font-medium transition-all
                      ${game.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                      }
                    `}
                  >
                    {isInCart ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        Added to Cart
                      </span>
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                  
                  <button
                    onClick={handleBuyNow}
                    disabled={game.stock === 0}
                    className={`
                      w-full py-2 px-4 rounded-full font-medium transition-all
                      ${game.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }
                    `}
                  >
                    Buy Now
                  </button>
                </div>

                {/* Security Info */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Secure transaction</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold">Ships from</p>
                    <p>Full Uproar Games</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold">Sold by</p>
                    <p>Full Uproar Games</p>
                  </div>
                </div>

                {/* Gift Options */}
                <div className="border-t mt-4 pt-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>Add a gift receipt for easy returns</span>
                  </label>
                </div>

                {/* Share and Save */}
                <div className="border-t mt-4 pt-4 flex items-center gap-4">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                    <Heart className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>

              {/* Promotional Banner */}
              <div className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg p-4">
                <h4 className="font-bold mb-1">🎮 Level Up Your Collection!</h4>
                <p className="text-sm">Buy 3 games and save 15% with code CHAOS15</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b">
              <div className="flex space-x-8 px-6">
                {['Product Details', 'Customer Reviews', 'Q&A'].map((tab) => (
                  <button
                    key={tab}
                    className="py-4 border-b-2 border-transparent hover:border-orange-600 font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Technical Details</h4>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="text-gray-600 w-32">Brand</dt>
                      <dd className="font-medium">Full Uproar Games</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-600 w-32">Item Weight</dt>
                      <dd className="font-medium">1.2 pounds</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-600 w-32">Dimensions</dt>
                      <dd className="font-medium">5.5 x 3.5 x 2 inches</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-600 w-32">Release Date</dt>
                      <dd className="font-medium">{game.isPreorder ? 'Spring 2026' : 'Available Now'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                  <dl className="space-y-2">
                    <div className="flex">
                      <dt className="text-gray-600 w-32">ASIN</dt>
                      <dd className="font-medium">B0{game.id}FUGLY</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-600 w-32">Best Sellers Rank</dt>
                      <dd className="font-medium">#42 in Card Games</dd>
                    </div>
                    <div className="flex">
                      <dt className="text-gray-600 w-32">Customer Reviews</dt>
                      <dd className="font-medium flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-orange-400 text-orange-400" />
                          ))}
                        </div>
                        4.8 out of 5 stars
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarGames.length > 0 && (
        <div className="bg-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Customers who viewed this item also viewed</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarGames.slice(0, 6).map((similarGame) => (
                <Link
                  key={similarGame.id}
                  href={`/games/${similarGame.slug}`}
                  className="group"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={similarGame.images[0]?.imageUrl || similarGame.imageUrl || '/placeholder-game.jpg'}
                      alt={similarGame.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-orange-600">
                    {similarGame.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-orange-400 text-orange-400" />
                    ))}
                    <span className="text-xs text-gray-600">(45)</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mt-1">
                    ${(similarGame.priceCents / 100).toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Frequently Bought Together */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Frequently bought together</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                {[game, ...similarGames.slice(0, 2)].map((item, index) => (
                  <React.Fragment key={item.id}>
                    <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={item.images[0]?.imageUrl || item.imageUrl || '/placeholder-game.jpg'}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {index < 2 && <Plus className="h-4 w-4 text-gray-400" />}
                  </React.Fragment>
                ))}
              </div>
              
              <div className="ml-auto text-right">
                <p className="text-sm text-gray-600">Total price:</p>
                <p className="text-2xl font-medium text-gray-900">
                  ${((game.priceCents + similarGames.slice(0, 2).reduce((sum, g) => sum + g.priceCents, 0)) / 100).toFixed(2)}
                </p>
                <button className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-2 rounded-full font-medium">
                  Add all 3 to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .cursor-zoom-in {
          cursor: zoom-in;
        }
      `}</style>
    </div>
  );
}