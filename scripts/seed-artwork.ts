import { prisma } from '../lib/prisma';

const artworkData = [
  {
    name: "Fugly's Chaotic Portrait",
    description: "The original Fugly in all his chaotic glory",
    imageUrl: "/fugly_shirt.jpg",
    category: "Character Art",
    tags: JSON.stringify(["fugly", "mascot", "character"]),
    chaosMode: true
  },
  {
    name: "Chaos Cards Box Art",
    description: "Box art design for our flagship game",
    imageUrl: "/placeholder-game.jpg",
    category: "Game Art",
    tags: JSON.stringify(["game", "box-art", "cards"])
  },
  {
    name: "Full Uproar Logo",
    description: "The Full Uproar Games company logo",
    imageUrl: "/logo.png",
    category: "Logos",
    tags: JSON.stringify(["logo", "branding"])
  },
  {
    name: "Fugly T-Shirt Design",
    description: "Chaos approved apparel design",
    imageUrl: "/fugly_shirt.jpg",
    thumbnailUrl: "/fugly_shirt.jpg",
    largeUrl: "/fugly_shirt.jpg",
    category: "Apparel Design",
    tags: JSON.stringify(["apparel", "t-shirt", "design"]),
    chaosMode: true
  },
  {
    name: "Dice of Doom Concept",
    description: "Concept art for our chaotic dice",
    imageUrl: "/placeholder-game.jpg",
    category: "Concept Art",
    tags: JSON.stringify(["dice", "concept", "game"])
  },
  {
    name: "Order Police Villain",
    description: "The dreaded Order Police - enemies of chaos",
    imageUrl: "/placeholder-game.jpg",
    category: "Character Art",
    tags: JSON.stringify(["villain", "character", "order-police"])
  },
  {
    name: "Chaos Realm Background",
    description: "The swirling chaos realm where Fugly resides",
    imageUrl: "/placeholder-game.jpg",
    category: "Backgrounds",
    tags: JSON.stringify(["background", "environment", "chaos-realm"]),
    chaosMode: true
  },
  {
    name: "Game Night Chaos",
    description: "Promotional art showing a chaotic game night",
    imageUrl: "/placeholder-game.jpg",
    category: "Promotional",
    tags: JSON.stringify(["promo", "game-night", "marketing"])
  },
  {
    name: "Fugly Sticker Pack",
    description: "Various Fugly expressions for stickers",
    imageUrl: "/fugly_shirt.jpg",
    category: "Stickers",
    tags: JSON.stringify(["stickers", "fugly", "expressions"])
  },
  {
    name: "Tournament Trophy Design",
    description: "The Chaos Cup trophy design",
    imageUrl: "/placeholder-game.jpg",
    category: "3D Art",
    tags: JSON.stringify(["trophy", "tournament", "3d"])
  }
];

async function seedArtwork() {
  try {
    console.log('Seeding artwork...');
    
    for (const artwork of artworkData) {
      await prisma.artwork.create({
        data: artwork
      });
      console.log(`Created artwork: ${artwork.name}`);
    }
    
    const count = await prisma.artwork.count();
    console.log(`\n✅ Successfully created ${count} artwork entries`);
    
  } catch (error) {
    console.error('Error seeding artwork:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedArtwork();