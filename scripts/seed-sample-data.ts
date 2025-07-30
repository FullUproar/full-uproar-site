// Script to seed sample data for testing
// Run this after database initialization

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const sampleGames = [
  {
    title: "Chaos Cards",
    tagline: "Where strategy meets anarchy",
    description: "A wild card game where the rules change every round. Perfect for those who think regular card games are too predictable.",
    priceCents: 2499,
    players: "2-6",
    timeToPlay: "30-45 min",
    ageRating: "13+",
    imageUrl: "/placeholder-game.jpg",
    featured: true,
    stock: 50
  },
  {
    title: "Fugly's Revenge",
    tagline: "The board game of beautiful chaos",
    description: "Navigate through Fugly's chaotic realm, collecting chaos tokens while avoiding order police. First to embrace full chaos wins!",
    priceCents: 4999,
    players: "3-5",
    timeToPlay: "60-90 min",
    ageRating: "16+",
    imageUrl: "/placeholder-game.jpg",
    isBundle: false,
    featured: true,
    stock: 30
  },
  {
    title: "Dice of Doom",
    tagline: "Roll your way to chaos",
    description: "Custom dice with chaotic modifiers. Every roll brings new surprises and unexpected twists to any game.",
    priceCents: 1999,
    players: "Any",
    timeToPlay: "Variable",
    ageRating: "10+",
    imageUrl: "/placeholder-game.jpg",
    stock: 100
  }
];

const sampleMerch = [
  {
    name: "Fugly Chaos Hoodie",
    description: "Embrace the chaos in comfort with our signature Fugly hoodie. Features the iconic Fugly logo.",
    category: "apparel",
    priceCents: 4999,
    imageUrl: "/placeholder-merch.jpg",
    sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
    featured: true
  },
  {
    name: "Chaos Energy Mug",
    description: "Start your day with chaos! This ceramic mug changes color when hot liquids are added.",
    category: "accessories",
    priceCents: 1499,
    imageUrl: "/placeholder-merch.jpg",
    featured: true
  },
  {
    name: "Fugly Sticker Pack",
    description: "10 chaotic stickers featuring Fugly in various poses of beautiful disorder.",
    category: "stickers",
    priceCents: 999,
    imageUrl: "/placeholder-merch.jpg"
  }
];

async function seedData() {
  console.log('Starting to seed sample data...');
  
  // Seed games
  for (const game of sampleGames) {
    try {
      const response = await fetch(`${API_BASE}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game)
      });
      
      if (response.ok) {
        console.log(`✓ Created game: ${game.title}`);
      } else {
        console.error(`✗ Failed to create game: ${game.title}`, await response.text());
      }
    } catch (error) {
      console.error(`✗ Error creating game: ${game.title}`, error);
    }
  }
  
  // Seed merch
  for (const merch of sampleMerch) {
    try {
      const response = await fetch(`${API_BASE}/api/merch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merch)
      });
      
      if (response.ok) {
        console.log(`✓ Created merch: ${merch.name}`);
      } else {
        console.error(`✗ Failed to create merch: ${merch.name}`, await response.text());
      }
    } catch (error) {
      console.error(`✗ Error creating merch: ${merch.name}`, error);
    }
  }
  
  console.log('Seeding complete!');
}

// Run if called directly
if (require.main === module) {
  seedData().catch(console.error);
}

export { seedData };