'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Users, Clock, Heart, Share2, ChevronLeft, ChevronRight, 
  Zap, Package, Star, Skull, Shield, Truck, BadgeCheck, Sparkles,
  Gift, Timer, Eye, ArrowRight, Gamepad2, Trophy, Flame
} from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import FuglyLogo from '@/app/components/FuglyLogo';
import ProductImageGallery from '@/app/components/ProductImageGallery';
import FuglyPointing from '@/app/components/FuglyPointing';
import Navigation from '@/app/components/Navigation';

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

interface GameProductClientEnhancedProps {
  game: Game;
  similarGames: Game[];
}

export default function GameProductClientEnhanced({ game, similarGames }: GameProductClientEnhancedProps) {
  const router = useRouter();
  const { addToCart, toggleCart } = useCartStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [urgencyMessage, setUrgencyMessage] = useState('');
  const [peopleViewing, setPeopleViewing] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Simulate dynamic viewing/purchase data
  useEffect(() => {
    setPeopleViewing(Math.floor(Math.random() * 20) + 8);
    setRecentPurchases(Math.floor(Math.random() * 15) + 5);
    
    const viewingInterval = setInterval(() => {
      setPeopleViewing(prev => Math.max(8, prev + Math.floor(Math.random() * 5) - 2));
    }, 30000);

    return () => clearInterval(viewingInterval);
  }, []);

  // Countdown timer for urgency
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Stock-based urgency
  useEffect(() => {
    if (game.stock > 0 && game.stock <= 5) {
      setUrgencyMessage(`Only ${game.stock} left! Order soon.`);
    } else if (game.stock > 5 && game.stock <= 20) {
      setUrgencyMessage(`Limited stock - ${game.stock} remaining`);
    }
  }, [game.stock]);

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
    
    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 3000);
    
    // Confetti effect or visual feedback could go here
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
      alert('Link copied! Share the chaos!');
    }
  };

  const gameFeatures = [
    { icon: Trophy, label: 'Chaos Level', value: 'MAXIMUM' },
    { icon: Flame, label: 'Fun Factor', value: '11/10' },
    { icon: Shield, label: 'Fugly Guarantee', value: '100%' },
    { icon: Gift, label: 'Bonus Content', value: game.isBundle ? 'INCLUDED' : 'CHAOS CARDS' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900">
      <Navigation />

      {/* Hero Section with Product */}
      <section className="relative overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full filter blur-3xl animate-pulse" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className="text-orange-300 hover:text-orange-400 font-semibold">Home</Link>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <Link href="/games" className="text-orange-300 hover:text-orange-400 font-semibold">Games</Link>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <span className="text-gray-400 font-semibold">{game.title}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Enhanced Image Gallery */}
            <div className="relative">
              {/* Live viewing indicator */}
              <div className="absolute top-4 right-4 z-10 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <Eye className="h-4 w-4" />
                <span className="font-bold text-sm">{peopleViewing} people viewing</span>
              </div>

              <ProductImageGallery
                images={game.images}
                primaryImageUrl={game.imageUrl}
                productName={game.title}
              />
              
              {/* Trust badges below gallery */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 text-center border border-orange-500/20">
                  <Truck className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-300 font-semibold">Fast Shipping</span>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 text-center border border-orange-500/20">
                  <Shield className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-300 font-semibold">Secure Checkout</span>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 text-center border border-orange-500/20">
                  <BadgeCheck className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <span className="text-xs text-gray-300 font-semibold">Fugly Approved</span>
                </div>
              </div>
            </div>

            {/* Product Info - Enhanced */}
            <div>
              {/* Title and badges */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 flex-1">
                    {game.title}
                  </h1>
                  {game.featured && (
                    <div className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-xs font-black animate-pulse">
                      HOT 🔥
                    </div>
                  )}
                </div>
                
                {game.tagline && (
                  <p className="text-xl text-orange-300 font-bold mb-3">
                    {game.tagline}
                  </p>
                )}

                {/* Category and rating */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-orange-500 text-orange-500" />
                    ))}
                    <span className="text-sm text-gray-300 ml-2 font-semibold">(4.9) 127 Reviews</span>
                  </div>
                  {game.category && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      game.category === 'mod' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}>
                      {game.category.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Price section with urgency */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-orange-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-white">
                        ${(game.priceCents / 100).toFixed(2)}
                      </span>
                      {game.isBundle && (
                        <span className="text-lg text-gray-400 line-through">
                          ${((game.priceCents * 1.3) / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {game.isBundle && (
                      <p className="text-green-400 font-bold mt-1">Save ${((game.priceCents * 0.3) / 100).toFixed(2)}!</p>
                    )}
                  </div>
                  
                  {game.isPreorder && (
                    <div className="text-right">
                      <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-black">
                        PRE-ORDER BONUS
                      </div>
                      <p className="text-xs text-gray-300 mt-1">Ships August 2025</p>
                    </div>
                  )}
                </div>

                {/* Urgency indicators */}
                {urgencyMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-red-400 font-bold flex items-center gap-2">
                      <Timer className="h-5 w-5 animate-pulse" />
                      {urgencyMessage}
                    </p>
                  </div>
                )}

                {/* Recent activity */}
                <div className="flex items-center gap-2 text-sm text-orange-300 mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">{recentPurchases} sold in the last 24 hours</span>
                </div>

                {/* Quantity and Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-300 font-bold">Quantity:</span>
                    <div className="flex items-center bg-gray-700/50 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-gray-600/50 rounded-l-lg transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="px-6 py-2 font-bold text-white">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(game.stock || 99, quantity + 1))}
                        className="px-4 py-2 hover:bg-gray-600/50 rounded-r-lg transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={game.stock === 0}
                    className={`
                      relative w-full py-5 rounded-xl font-black text-xl transition-all
                      transform hover:scale-105 hover:shadow-2xl
                      ${game.stock === 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white animate-gradient-x'
                      }
                    `}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {game.stock === 0 ? (
                        'OUT OF STOCK'
                      ) : (
                        <>
                          <ShoppingCart className="h-6 w-6" />
                          ADD TO CHAOS CART
                          <ArrowRight className="h-6 w-6" />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Added to cart message */}
                  {showAddedMessage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold animate-bounce">
                        ✓ Added to Cart!
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`
                        flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2
                        ${isWishlisted 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        }
                      `}
                    >
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                      {isWishlisted ? 'Wishlisted!' : 'Add to Wishlist'}
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Countdown timer for special offer */}
                {game.isPreorder && (
                  <div className="mt-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <p className="text-orange-300 font-bold mb-2">🎁 Pre-order Bonus Ends In:</p>
                    <div className="flex gap-3 justify-center">
                      <div className="text-center">
                        <div className="bg-gray-800 rounded-lg px-3 py-2">
                          <span className="text-2xl font-black text-orange-500">{String(timeLeft.hours).padStart(2, '0')}</span>
                        </div>
                        <span className="text-xs text-gray-400">Hours</span>
                      </div>
                      <div className="text-center">
                        <div className="bg-gray-800 rounded-lg px-3 py-2">
                          <span className="text-2xl font-black text-orange-500">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        </div>
                        <span className="text-xs text-gray-400">Minutes</span>
                      </div>
                      <div className="text-center">
                        <div className="bg-gray-800 rounded-lg px-3 py-2">
                          <span className="text-2xl font-black text-orange-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        </div>
                        <span className="text-xs text-gray-400">Seconds</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Key features grid */}
              <div className="grid grid-cols-2 gap-3">
                {gameFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-400">{feature.label}</p>
                          <p className="font-bold text-orange-300">{feature.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Information Tabs */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-orange-500/20">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700/50">
            {['overview', 'gameplay', 'contents', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`
                  flex-1 py-4 px-6 font-bold capitalize transition-all
                  ${selectedTab === tab 
                    ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500' 
                    : 'text-gray-400 hover:text-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-orange-500 mb-3">About This Game</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">{game.description}</p>
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Players</p>
                    <p className="text-2xl font-black text-yellow-400">{game.players}</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Play Time</p>
                    <p className="text-2xl font-black text-yellow-400">{game.timeToPlay}</p>
                  </div>
                  <div className="text-center">
                    <Skull className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Age Rating</p>
                    <p className="text-2xl font-black text-yellow-400">{game.ageRating}</p>
                  </div>
                </div>

                {game.bundleInfo && (
                  <div className="bg-orange-500/10 rounded-xl p-6 border border-orange-500/30">
                    <h4 className="text-xl font-black text-orange-400 mb-3 flex items-center gap-2">
                      <Package className="h-6 w-6" />
                      Bundle Contents
                    </h4>
                    <p className="text-gray-300">{game.bundleInfo}</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'gameplay' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-orange-500 mb-3">How to Spread Chaos</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="bg-orange-500 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-black">1</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-orange-300 mb-1">Gather Your Victims</h4>
                      <p className="text-gray-300">Round up {game.players} for maximum chaos potential.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-orange-500 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-black">2</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-orange-300 mb-1">Unleash the Cards</h4>
                      <p className="text-gray-300">Deal out destruction and watch friendships crumble beautifully.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-orange-500 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-black">3</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-orange-300 mb-1">Embrace the Madness</h4>
                      <p className="text-gray-300">Let Fugly guide you through {game.timeToPlay} of pure anarchy.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'contents' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-orange-500 mb-3">What's in the Box?</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <Gamepad2 className="h-12 w-12 text-orange-500 mb-3" />
                    <h4 className="font-bold text-orange-300 mb-2">Game Components</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• 200+ Chaos Cards</li>
                      <li>• 1 Fugly-approved rulebook</li>
                      <li>• Special chaos dice</li>
                      <li>• Score tracking tokens</li>
                    </ul>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-6">
                    <Gift className="h-12 w-12 text-orange-500 mb-3" />
                    <h4 className="font-bold text-orange-300 mb-2">Bonus Content</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Exclusive Fugly sticker</li>
                      <li>• Digital companion app</li>
                      <li>• Printable expansion pack</li>
                      <li>• Chaos certificate</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-orange-500 mb-3">What Chaos Agents Say</h3>
                <div className="space-y-4">
                  {[
                    { name: "ChaosKing42", rating: 5, comment: "Ruined my family reunion in the best way possible!" },
                    { name: "TableFlipperPro", rating: 5, comment: "Finally, a game that encourages my natural tendencies." },
                    { name: "FuglyFanatic", rating: 5, comment: "Bought 3 copies. One to play, two to frame." }
                  ].map((review, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-orange-300">{review.name}</span>
                        <div className="flex">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-orange-500 text-orange-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-gray-900/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-orange-500 mb-2">JOIN THE CHAOS CULT</h2>
            <p className="text-gray-300">Over 10,000 chaos agents can't be wrong!</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-orange-500 mb-2">10K+</div>
              <p className="text-gray-400">Happy Chaos Agents</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-orange-500 mb-2">4.9/5</div>
              <p className="text-gray-400">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-orange-500 mb-2">127</div>
              <p className="text-gray-400">Verified Reviews</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-orange-500 mb-2">100%</div>
              <p className="text-gray-400">Fugly Approved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Similar Games with Upsell */}
      {similarGames.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-orange-500 mb-2">COMPLETE YOUR CHAOS COLLECTION</h2>
            <p className="text-xl text-orange-300">Save 15% when you buy 3 or more!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarGames.map((similarGame, index) => (
              <Link
                key={similarGame.id}
                href={`/games/${similarGame.slug}`}
                className={`
                  group bg-gray-800 rounded-xl overflow-hidden border-4 border-orange-500/20
                  hover:border-orange-500 transition-all transform hover:scale-105
                  ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}
                `}
              >
                <div className="aspect-square bg-gray-700 relative overflow-hidden">
                  <img
                    src={similarGame.images[0]?.imageUrl || similarGame.imageUrl || '/placeholder-game.jpg'}
                    alt={similarGame.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {similarGame.isPreorder && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      PRE-ORDER
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="p-4">
                  <h3 className="font-black text-yellow-400 mb-1 group-hover:text-orange-400 transition-colors">
                    {similarGame.title}
                  </h3>
                  {similarGame.tagline && (
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">{similarGame.tagline}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-orange-500">
                      ${(similarGame.priceCents / 100).toFixed(2)}
                    </p>
                    <ArrowRight className="h-5 w-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bundle offer */}
          <div className="mt-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-8 border-2 border-orange-500/30 text-center">
            <h3 className="text-2xl font-black text-orange-400 mb-3">🎁 CREATE YOUR OWN CHAOS BUNDLE</h3>
            <p className="text-gray-300 mb-4">Add any 3 games to cart and save 15% automatically!</p>
            <div className="flex justify-center gap-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-gray-900 px-8 py-3 rounded-full font-black transition-all transform hover:scale-105">
                BUILD MY BUNDLE
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sticky Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t-2 border-orange-500 p-4 z-40 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-orange-300">{game.title}</p>
            <p className="text-2xl font-black text-white">${(game.priceCents / 100).toFixed(2)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={game.stock === 0}
            className={`
              px-6 py-3 rounded-full font-black transition-all
              ${game.stock === 0
                ? 'bg-gray-600 text-gray-400'
                : 'bg-orange-500 text-gray-900 hover:bg-orange-600'
              }
            `}
          >
            {game.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
          </button>
        </div>
      </div>

      {/* Fun Fugly element */}
      <div className="fixed bottom-20 right-4 z-30 hidden lg:block">
        <FuglyPointing size={120} style={{ transform: 'rotate(-15deg)' }} />
        <div className="absolute -top-12 -left-16 bg-orange-500 text-gray-900 px-3 py-2 rounded-full font-bold text-sm transform -rotate-12 whitespace-nowrap">
          BUY IT NOW!
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}