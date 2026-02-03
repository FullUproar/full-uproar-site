import GameEditFormEnhanced from '../[id]/edit/GameEditFormEnhanced';

// Default empty game for new game creation
const emptyGame = {
  id: 0,
  title: '',
  slug: '',
  tagline: null,
  teaser: null,
  story: null,
  description: '',
  priceCents: 0,
  ageRating: 'FOURTEEN_PLUS',
  category: 'GAME',
  playerCount: 'TWO_TO_FOUR',
  playerCountCustom: null,
  playTime: 'MEDIUM',
  playTimeCustom: null,
  imageUrl: null,
  isBundle: false,
  isPreorder: false,
  featured: false,
  isNew: true,
  isBestseller: false,
  bundleInfo: null,
  stock: 0,
  tags: null,
  components: null,
  howToPlay: null,
  setupTime: null,
  difficulty: null,
  designer: null,
  artist: null,
  publisher: 'Full Uproar Games',
  releaseYear: new Date().getFullYear(),
  videoUrl: null,
  bggUrl: null,
  launchDate: null,
  isHidden: true, // New games start hidden
  weightOz: null,
};

export default function NewGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-black text-orange-500 mb-8">
          Create New Game
        </h1>

        <GameEditFormEnhanced game={emptyGame as any} isNew />
      </div>
    </div>
  );
}
