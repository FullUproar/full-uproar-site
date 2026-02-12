const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleGames = [
  {
    title: "Hack Your Deck",
    tagline: "Turn ANY game into chaos!",
    description: "Inject pure chaos into your next game night! This party game modifier works with ANY existing game, adding hilarious twists, sabotages, and unpredictable challenges. Whether you're flipping rules or forcing absurd minigames, this deck turns any gathering into unforgettable mayhem.",
    priceCents: 2499,
    players: "Any",
    timeToPlay: "Adds 15+ min",
    ageRating: "14+",
    isBundle: false,
    isPreorder: true,
    featured: true,
    bundleInfo: "Mayhem Machine Collection"
  },
  {
    title: "Crime and Funishments",
    tagline: "Justice never felt so stupid",
    description: "Someone broke the rules—and now justice must be served! This hilarious punishment deck bolts onto any party game. From ridiculous dares to petty vendettas, players suffer side-splitting consequences that make losing (or cheating) half the fun.",
    priceCents: 1999,
    players: "Any",
    timeToPlay: "Varies",
    ageRating: "16+",
    isBundle: false,
    isPreorder: true,
    featured: false
  },
  {
    title: "Dumbest Ways to Win",
    tagline: "End ties with maximum stupidity",
    description: "End your tie-breaker woes in the dumbest way possible. This pocket-sized party game resolves stalemates with absurd prompts and challenges. From interpretive dance-offs to dramatic monologues, no game night ends quietly when this deck hits the table.",
    priceCents: 1499,
    players: "2+",
    timeToPlay: "5-10 min",
    ageRating: "12+",
    isBundle: false,
    isPreorder: true,
    featured: false
  },
  {
    title: "#CancelMe",
    tagline: "Survive the court of public opinion",
    description: "Welcome to the savage world of cancel culture! This darkly hilarious social deduction game has players slinging scandal cards while trying to survive public opinion. With unique roles and outrageous saves, it's Werewolf reimagined for the clout-chasing age.",
    priceCents: 3499,
    players: "5-10",
    timeToPlay: "30-60 min",
    ageRating: "18+",
    isBundle: false,
    isPreorder: true,
    featured: false
  },
  {
    title: "Mayhem Machine Bundle",
    tagline: "All three chaos decks - SAVE $10!",
    description: "Get all three game-breaking decks in one chaotic bundle! Includes Hack Your Deck, Crime and Funishments, AND Dumbest Ways to Win. Transform any game night into a beautiful disaster. Fugly's personal favorite!",
    priceCents: 4999,
    players: "Any",
    timeToPlay: "Varies",
    ageRating: "14+",
    isBundle: true,
    isPreorder: true,
    featured: true,
    bundleInfo: "Save $10 when you buy all three chaos decks together!"
  }
];

const sampleComics = [
  {
    title: "Fugly vs. The Vacuum",
    episode: "Episode 1",
    description: "Our hero faces his greatest nemesis"
  },
  {
    title: "The Great Catnip Heist",
    episode: "Episode 2", 
    description: "Fugly's plan for world domination begins"
  },
  {
    title: "3AM Zoomies Explained",
    episode: "Episode 3",
    description: "The science behind feline madness"
  }
];

const sampleNews = [
  {
    title: "Spring 2026 Production Confirmed!",
    excerpt: "All four games are heading to production! Hack Your Deck, Crime and Funishments, Dumbest Ways to Win, and #CancelMe are officially happening. Fugly demands extra catnip.",
    content: "This is huge news for all Fugly fans! After months of development and testing, we're excited to announce that all four of our flagship games are moving into production. Expected delivery: Spring 2026. Pre-orders are now live!"
  },
  {
    title: "Mayhem Machine Bundle Saves You $10",
    excerpt: "Get all three game-modifier decks for just $49.99. That's like getting Dumbest Ways to Win basically free. Math is hard. Savings are easy.",
    content: "Bundle up and save! When you buy Hack Your Deck, Crime and Funishments, and Dumbest Ways to Win together, you save $10 off the individual prices."
  },
  {
    title: "HOA: The Game Coming 2026",
    excerpt: "Development continues on the pettiest neighborhood simulator ever created. Beta testers report actual feelings of suburban rage. Perfect.",
    content: "Our next big project is in development! HOA: The Game will let you experience all the joy of dealing with homeowner associations, nosy neighbors, and lawn ordinances. Coming 2026."
  }
];

async function main() {
  console.log('🎮 Seeding games data...');
  
  // Clear existing data
  await prisma.game.deleteMany();
  await prisma.comic.deleteMany();
  await prisma.newsPost.deleteMany();
  
  // Seed games
  for (const game of sampleGames) {
    await prisma.game.create({ data: game });
  }
  
  // Seed comics
  for (const comic of sampleComics) {
    await prisma.comic.create({ data: comic });
  }
  
  // Seed news
  for (const news of sampleNews) {
    await prisma.newsPost.create({ data: news });
  }
  
  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });