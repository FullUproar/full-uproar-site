'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Mail, ShoppingCart, Calendar, Users, BookOpen, Star, Package, ArrowRight, Menu, X, Heart, Share2, Play, Zap, Skull, Pause } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cartStore';
import { formatAgeRating } from '@/lib/utils/formatting';

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
  createdAt: Date;
}

interface Comic {
  id: number;
  title: string;
  episode: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: string;
}

interface FullUproarHomeProps {
  games: Game[];
  comics: Comic[];
  news: NewsPost[];
}

export default function FullUproarHome({ games, comics, news }: FullUproarHomeProps) {
  const { user } = useUser();
  const { items, addToCart } = useCartStore();
  const [email, setEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeGame, setActiveGame] = useState(0);
  const [currentComic, setCurrentComic] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(7);

  const handleAddToCart = (game: Game) => {
    addToCart({
      id: game.id,
      name: game.title,
      slug: game.slug,
      priceCents: game.priceCents,
      imageUrl: game.imageUrl || '/placeholder-game.jpg',
      type: 'game'
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (response.ok) {
          alert(`Welcome to the chaos! Fugly will personally deliver updates to ${email}`);
          setEmail('');
        }
      } catch (error) {
        console.error('Newsletter signup failed:', error);
      }
    }
  };

  // Auto-rotate featured games (pause on hover)
  useEffect(() => {
    if (games.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setActiveGame((current) => (current + 1) % games.length);
            return 7;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [games.length, isPaused]);

  const featuredGame = games[activeGame];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/90 shadow-lg border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-bold">
                FU
              </div>
              <div>
                <span className="font-black text-2xl text-orange-500">FULL UPROAR</span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#games" className="font-bold text-orange-200 hover:text-orange-400 transition">GAMES</a>
              <a href="#comics" className="font-bold text-orange-200 hover:text-orange-400 transition">COMICS</a>
              <a href="#news" className="font-bold text-orange-200 hover:text-orange-400 transition">CHAOS</a>
              <a href="#community" className="font-bold text-orange-200 hover:text-orange-400 transition">CULT</a>
              <button className="relative p-2 hover:bg-orange-500/20 rounded-full transition">
                <ShoppingCart className="h-5 w-5 text-orange-300" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-bounce">
                    {items.length}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-orange-300">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t-2 border-orange-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#games" className="block px-3 py-2 font-bold text-orange-200 hover:bg-orange-500/20 rounded">GAMES</a>
              <a href="#comics" className="block px-3 py-2 font-bold text-orange-200 hover:bg-orange-500/20 rounded">COMICS</a>
              <a href="#news" className="block px-3 py-2 font-bold text-orange-200 hover:bg-orange-500/20 rounded">CHAOS</a>
              <a href="#community" className="block px-3 py-2 font-bold text-orange-200 hover:bg-orange-500/20 rounded">CULT</a>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center">
            <div className="inline-block bg-orange-500 text-gray-900 px-6 py-2 rounded-full mb-6 transform -rotate-3 font-black text-sm">
              EXTRA SKETCHY SINCE 2024
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="text-orange-500">GAMES AND MODS</span>
              <br />
              <span className="text-orange-300">SO CHAOTIC</span>
              <br />
              <span className="bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">FUGLY APPROVES</span>
            </h1>
            
            <p className="text-xl text-orange-200 mb-8 max-w-2xl mx-auto font-bold">
              Turn ANY game night into a beautiful disaster with our chaos-inducing card decks. 
              <span className="block text-lg mt-2 text-orange-300">Warning: Friendships may not survive. Worth it.</span>
            </p>
            
            {/* Email Capture */}
            <div className="max-w-md mx-auto mb-8">
              <form onSubmit={handleEmailSubmit} className="bg-gray-800 rounded-full shadow-lg p-2 flex items-center border-4 border-orange-500">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Join Fugly's chaos crew"
                  className="flex-1 px-4 py-2 outline-none font-bold bg-transparent text-orange-100 placeholder-orange-300/50"
                />
                <button 
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-gray-900 px-6 py-2 rounded-full font-black transition transform hover:scale-105 flex items-center gap-2"
                >
                  SIGN ME UP <Zap className="h-4 w-4" />
                </button>
              </form>
              <p className="text-sm text-orange-300 mt-2 font-semibold">
                🎁 Get exclusive pre-order bonuses and Fugly's seal of approval!
              </p>
            </div>

            {/* Featured Game Showcase */}
            {featuredGame && (
              <div 
                className="bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto border-4 border-orange-500 transform hover:rotate-1 transition-transform"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="text-left">
                    <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-black inline-block -rotate-3">
                      PRE-ORDER MADNESS
                    </span>
                    <h2 className="text-4xl font-black mt-4 mb-4 text-orange-300">{featuredGame.title}</h2>
                    <p className="text-orange-100 mb-6 text-lg">{featuredGame.description}</p>
                    
                    <div className="flex gap-6 mb-6">
                      <div className="text-center">
                        <Users className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                        <span className="font-bold text-orange-200">{featuredGame.players}</span>
                      </div>
                      <div className="text-center">
                        <Calendar className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                        <span className="font-bold text-orange-200">{featuredGame.timeToPlay}</span>
                      </div>
                      <div className="text-center">
                        <Skull className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                        <span className="font-bold text-orange-200">{formatAgeRating(featuredGame.ageRating)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-black text-orange-500">${(featuredGame.priceCents / 100).toFixed(2)}</span>
                      <button 
                        onClick={() => handleAddToCart(featuredGame)}
                        className="bg-orange-500 hover:bg-orange-600 text-gray-900 px-8 py-4 rounded-full font-black transform hover:scale-105 transition flex items-center gap-2 shadow-lg"
                      >
                        THROW MONEY AT FUGLY <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-64 h-64 mx-auto bg-gray-700 rounded-2xl flex items-center justify-center text-orange-500 text-6xl font-bold">
                      FUGLY
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full transform rotate-12 font-bold text-sm">
                      Fugly Tested!
                    </div>
                  </div>
                </div>
                
                {/* Game selector dots with countdown */}
                <div className="flex justify-center items-center gap-4 mt-8">
                  <div className="flex gap-2">
                    {games.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveGame(index);
                          setCountdown(7);
                        }}
                        className={`h-3 w-3 rounded-full transition-all ${
                          index === activeGame ? 'bg-orange-500 w-8' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  {isPaused ? (
                    <div className="flex items-center gap-2 text-orange-300 bg-gray-700 px-3 py-1 rounded-full">
                      <Pause className="h-4 w-4" />
                      <span className="text-sm font-bold">PAUSED</span>
                    </div>
                  ) : (
                    <div className="text-orange-300 bg-gray-700 px-3 py-1 rounded-full">
                      <span className="text-sm font-bold">CHAOS IN {countdown}...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section id="games" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4 text-orange-500">THE CHAOS COLLECTION</h2>
            <p className="text-xl text-orange-300 font-bold">Games that make Fugly purr with evil delight</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <div 
                key={game.id} 
                className="group relative bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border-4 border-orange-400 hover:border-orange-500"
                style={{ transform: `rotate(${index % 2 === 0 ? '-2' : '2'}deg)` }}
              >
                <div className="w-full h-32 bg-gray-700 rounded-lg mb-4 flex items-center justify-center text-orange-500 text-4xl font-bold">
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    'GAME'
                  )}
                </div>
                <h3 className="text-2xl font-black mb-2 text-orange-300">{game.title}</h3>
                <p className="text-orange-100 font-bold mb-4">{game.tagline || 'Epic chaos awaits!'}</p>
                
                <div className="flex gap-4 text-sm mb-4 font-semibold">
                  <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">{game.players}</span>
                  <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">{game.timeToPlay}</span>
                  <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">{formatAgeRating(game.ageRating)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-black text-orange-500">${(game.priceCents / 100).toFixed(2)}</span>
                  <button 
                    onClick={() => handleAddToCart(game)}
                    className="bg-orange-500 hover:bg-orange-600 text-gray-900 px-6 py-3 rounded-full font-black transition transform hover:scale-110"
                  >
                    WANT IT
                  </button>
                </div>
                
                {game.isPreorder && !game.isBundle && (
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-black transform rotate-12">
                    SPRING 2026
                  </span>
                )}
                {game.isBundle && (
                  <span className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-black transform rotate-12 animate-pulse">
                    SAVE $10
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comics Section */}
      {comics.length > 0 && (
        <section id="comics" className="py-20 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black mb-4 text-orange-500">FUGLY'S ADVENTURES</h2>
              <p className="text-xl text-orange-300 font-bold">Weekly chaos in comic form</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 border-4 border-orange-500 transform hover:-rotate-1 transition-transform">
                <div className="bg-gray-700 rounded-2xl p-12 mb-6 text-center">
                  <div className="w-full h-64 bg-gray-600 rounded-lg mb-4 flex items-center justify-center text-orange-500 text-4xl font-bold">
                    {comics[currentComic]?.imageUrl ? (
                      <img src={comics[currentComic].imageUrl} alt={comics[currentComic].title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      'COMIC STRIP'
                    )}
                  </div>
                  <h3 className="text-3xl font-black mb-2 text-orange-300">{comics[currentComic]?.title}</h3>
                  <p className="text-orange-200 font-bold mb-2">{comics[currentComic]?.episode}</p>
                  <p className="text-lg text-orange-100">{comics[currentComic]?.description || 'Fugly is up to his usual shenanigans!'}</p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => setCurrentComic((prev) => (prev - 1 + comics.length) % comics.length)}
                    className="px-6 py-3 bg-orange-500 text-gray-900 rounded-full font-black hover:bg-orange-600 transition"
                  >
                    ← PREVIOUS
                  </button>
                  <button 
                    onClick={() => setCurrentComic((prev) => (prev + 1) % comics.length)}
                    className="px-6 py-3 bg-orange-500 text-gray-900 rounded-full font-black hover:bg-orange-600 transition"
                  >
                    NEXT →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* News Section */}
      {news.length > 0 && (
        <section id="news" className="py-20 bg-gray-900/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black mb-4 text-orange-500">LATEST DISASTERS</h2>
              <p className="text-xl text-orange-300 font-bold">What Fugly's been up to</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {news.slice(0, 3).map((item, index) => (
                <article 
                  key={item.id} 
                  className="bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition border-4 border-orange-400"
                  style={{ transform: `rotate(${index === 1 ? '-3' : index === 2 ? '3' : '0'}deg)` }}
                >
                  <span className="text-sm font-black text-orange-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <h3 className="text-2xl font-black mt-2 mb-3 text-orange-300">{item.title}</h3>
                  <p className="text-orange-100 mb-4 font-semibold">{item.excerpt}</p>
                  <a href="#" className="text-orange-500 hover:text-orange-400 font-black flex items-center gap-1">
                    READ THE CHAOS <ChevronRight className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Section */}
      <section id="community" className="py-20 bg-gradient-to-br from-orange-900/50 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black mb-8 text-orange-500">JOIN THE CULT OF FUGLY</h2>
          <p className="text-2xl text-orange-300 font-bold mb-12 max-w-2xl mx-auto">
            Where chaos reigns and tables are meant to be flipped!
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl transform -rotate-3 border-4 border-orange-500">
              <div className="text-6xl mb-4">😼</div>
              <h3 className="text-2xl font-black mb-2 text-orange-300">5,000+ MINIONS</h3>
              <p className="font-bold text-orange-100">Fugly's army grows stronger</p>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl transform rotate-2 border-4 border-red-500">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-black mb-2 text-orange-300">WEEKLY MAYHEM</h3>
              <p className="font-bold text-orange-100">Game nights that end in chaos</p>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl transform -rotate-2 border-4 border-yellow-500">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-black mb-2 text-orange-300">EXCLUSIVE CHAOS</h3>
              <p className="font-bold text-orange-100">First dibs on Fugly's schemes</p>
            </div>
          </div>
          
          <button className="bg-gradient-to-r from-orange-500 to-red-500 text-gray-900 px-12 py-6 rounded-full text-2xl font-black hover:shadow-2xl transform hover:scale-105 transition animate-pulse">
            PLEDGE ALLEGIANCE TO FUGLY
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold text-gray-900">
                  FU
                </div>
                <div>
                  <span className="font-black text-xl text-orange-500">FULL UPROAR</span>
                  <span className="block text-xs text-gray-400">Games Inc.</span>
                </div>
              </div>
              <p className="text-gray-400 font-semibold">Making game night weird since 2024</p>
            </div>
            
            <div>
              <h4 className="font-black mb-4 text-orange-400">GAMES</h4>
              <ul className="space-y-2 text-gray-400 font-semibold">
                <li><a href="#" className="hover:text-orange-400">All Games</a></li>
                <li><a href="#" className="hover:text-orange-400">Pre-orders</a></li>
                <li><a href="#" className="hover:text-orange-400">Fugly's Picks</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black mb-4 text-orange-400">COMMUNITY</h4>
              <ul className="space-y-2 text-gray-400 font-semibold">
                <li><a href="#" className="hover:text-orange-400">The Cult</a></li>
                <li><a href="#" className="hover:text-orange-400">Discord Chaos</a></li>
                <li><a href="#" className="hover:text-orange-400">Fugly Sightings</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black mb-4 text-orange-400">STAY CHAOTIC</h4>
              <p className="text-gray-400 mb-4 font-semibold">Join Fugly's inner circle of chaos</p>
              <div className="flex gap-4">
                <button className="hover:text-orange-400 transition">
                  <Mail className="h-6 w-6" />
                </button>
                <button className="hover:text-orange-400 transition">
                  <Heart className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p className="font-semibold">© {new Date().getFullYear()} Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}