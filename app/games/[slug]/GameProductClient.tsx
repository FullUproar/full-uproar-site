'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Users, Clock, Heart, Share2, ChevronLeft, ChevronRight, Zap, Package, Star, Skull } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';
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
  imageUrl: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  featured: boolean;
  bundleInfo: string | null;
  stock: number;
  tags: string | null;
  images: GameImage[];
}

interface GameProductClientProps {
  game: Game;
  similarGames: Game[];
}

export default function GameProductClient({ game, similarGames }: GameProductClientProps) {
  const router = useRouter();
  const { addToCart, toggleCart } = useCartStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: game.id,
        name: game.title,
        slug: game.slug,
        priceCents: game.priceCents,
        imageUrl: game.imageUrl || game.images[0]?.imageUrl || '/placeholder-game.jpg',
        type: 'game'
      });
    }
    toggleCart();
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
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Chaos
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
                images={game.images}
                primaryImageUrl={game.imageUrl}
                productName={game.title}
              />
              
              {/* Badges overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                {game.isPreorder && (
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full font-black transform -rotate-3">
                    PRE-ORDER
                  </div>
                )}
                
                {game.isBundle && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-black transform rotate-3 ml-auto">
                    BUNDLE DEAL
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <h1 className="text-5xl font-black text-orange-500 mb-3 transform -rotate-1">
                {game.title}
              </h1>
              {game.tagline && (
                <p className="text-2xl text-yellow-400 font-bold transform rotate-1">
                  {game.tagline}
                </p>
              )}
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl p-4 text-center border-2 border-orange-500/20">
                <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Players</p>
                <p className="font-black text-yellow-400">{game.players}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center border-2 border-orange-500/20">
                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Play Time</p>
                <p className="font-black text-yellow-400">{game.timeToPlay}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center border-2 border-orange-500/20">
                <Skull className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Age Rating</p>
                <p className="font-black text-yellow-400">{game.ageRating}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border-2 border-orange-500/20">
              <h2 className="text-2xl font-black text-orange-500 mb-3">About This Chaos</h2>
              <p className="text-gray-300 text-lg leading-relaxed">{game.description}</p>
              
              {game.bundleInfo && (
                <div className="mt-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <p className="text-yellow-400 font-bold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Bundle Includes:
                  </p>
                  <p className="text-gray-300 mt-1">{game.bundleInfo}</p>
                </div>
              )}
            </div>

            {/* Price and Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-black text-white">
                    ${(game.priceCents / 100).toFixed(2)}
                  </p>
                  {game.stock > 0 && game.stock < 10 && (
                    <p className="text-red-400 font-bold mt-1">
                      Only {game.stock} left in stock!
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
                    onClick={() => setQuantity(Math.min(game.stock || 99, quantity + 1))}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={game.stock === 0}
                className={`
                  w-full py-5 rounded-xl font-black text-xl transition-all transform
                  flex items-center justify-center gap-3
                  ${game.stock === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-gray-900 hover:scale-105 hover:shadow-2xl'
                  }
                `}
              >
                {game.stock === 0 ? (
                  <>OUT OF CHAOS</>
                ) : (
                  <>
                    <ShoppingCart className="h-6 w-6" />
                    THROW ${((game.priceCents * quantity) / 100).toFixed(2)} AT FUGLY
                    <Zap className="h-6 w-6" />
                  </>
                )}
              </button>

              {game.isPreorder && (
                <p className="text-center text-yellow-400 font-bold">
                  🚀 Pre-order now and get it August 2025!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Similar Games */}
        {similarGames.length > 0 && (
          <div className="mt-16">
            <h2 className="text-4xl font-black text-orange-500 mb-8 text-center transform -rotate-2">
              MORE CHAOS YOU'LL LOVE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarGames.map((similarGame, index) => (
                <Link
                  key={similarGame.id}
                  href={`/games/${similarGame.slug}`}
                  className={`
                    bg-gray-800 rounded-xl overflow-hidden border-4 border-orange-500/20
                    hover:border-orange-500 transition-all transform hover:scale-105
                    ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                  `}
                >
                  <div className="aspect-square bg-gray-700 relative">
                    <img
                      src={similarGame.images[0]?.imageUrl || similarGame.imageUrl || '/placeholder-game.jpg'}
                      alt={similarGame.title}
                      className="w-full h-full object-cover"
                    />
                    {similarGame.isPreorder && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        PRE-ORDER
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-black text-yellow-400 mb-1">{similarGame.title}</h3>
                    {similarGame.tagline && (
                      <p className="text-sm text-gray-400 mb-2">{similarGame.tagline}</p>
                    )}
                    <p className="text-2xl font-black text-orange-500">
                      ${(similarGame.priceCents / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}