import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgeRating, MerchCategory, PlayerCount, PlayTime, GameCategory } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Auth check via environment variable (never hardcode secrets)
    if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const results = [];
    
    // Check if data already exists
    const existingGames = await prisma.game.count();
    const existingMerch = await prisma.merch.count();
    
    if (existingGames > 0 || existingMerch > 0) {
      return NextResponse.json({ 
        message: 'Data already exists', 
        games: existingGames, 
        merch: existingMerch 
      });
    }
    
    // Sample games
    const games = [
      {
        title: "Chaos Cards",
        slug: "chaos-cards",
        tagline: "Where strategy meets anarchy",
        description: "A wild card game where the rules change every round. Perfect for those who think regular card games are too predictable.",
        priceCents: 2499,
        players: "2-6",
        timeToPlay: "30-45 min",
        ageRating: AgeRating.FOURTEEN_PLUS,
        category: GameCategory.GAME,
        playerCount: PlayerCount.TWO_TO_SIX,
        playTime: PlayTime.SHORT,
        featured: true,
        stock: 50,
        tags: JSON.stringify(["strategy", "party", "chaos"])
      },
      {
        title: "Fugly's Revenge",
        slug: "fuglys-revenge",
        tagline: "The board game of beautiful chaos",
        description: "Navigate through Fugly's chaotic realm, collecting chaos tokens while avoiding order police. First to embrace full chaos wins!",
        priceCents: 4999,
        players: "3-5",
        timeToPlay: "60-90 min",
        ageRating: AgeRating.SIXTEEN_PLUS,
        category: GameCategory.GAME,
        playerCount: PlayerCount.THREE_TO_FIVE,
        playTime: PlayTime.MEDIUM,
        featured: true,
        stock: 30,
        tags: JSON.stringify(["adventure", "strategy", "chaos"])
      },
      {
        title: "Dice of Doom",
        slug: "dice-of-doom",
        tagline: "Roll your way to chaos",
        description: "Custom dice with chaotic modifiers. Every roll brings new surprises and unexpected twists to any game.",
        priceCents: 1999,
        players: "Any",
        timeToPlay: "Variable",
        ageRating: AgeRating.ELEVEN_PLUS,
        category: GameCategory.GAME,
        playerCount: PlayerCount.CUSTOM,
        playTime: PlayTime.VARIES,
        stock: 100,
        tags: JSON.stringify(["dice", "modifier", "chaos"])
      }
    ];
    
    // Sample merch
    const merchItems = [
      {
        name: "Fugly Chaos Hoodie",
        slug: "fugly-chaos-hoodie",
        description: "Embrace the chaos in comfort with our signature Fugly hoodie. Features the iconic Fugly logo.",
        category: MerchCategory.APPAREL,
        priceCents: 4999,
        sizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        featured: true,
        tags: JSON.stringify(["apparel", "hoodie", "fugly"])
      },
      {
        name: "Chaos Energy Mug",
        slug: "chaos-energy-mug",
        description: "Start your day with chaos! This ceramic mug changes color when hot liquids are added.",
        category: MerchCategory.ACCESSORIES,
        priceCents: 1499,
        featured: true,
        tags: JSON.stringify(["drinkware", "mug", "color-changing"])
      },
      {
        name: "Fugly Sticker Pack",
        slug: "fugly-sticker-pack",
        description: "10 chaotic stickers featuring Fugly in various poses of beautiful disorder.",
        category: MerchCategory.STICKERS,
        priceCents: 999,
        tags: JSON.stringify(["stickers", "fugly", "pack"])
      }
    ];
    
    // Create games
    for (const game of games) {
      try {
        await prisma.game.create({ data: game });
        results.push(`Created game: ${game.title}`);
      } catch (error) {
        results.push(`Failed to create game ${game.title}: ${error}`);
      }
    }
    
    // Create merch with inventory
    for (const merch of merchItems) {
      try {
        const created = await prisma.merch.create({ data: merch });
        results.push(`Created merch: ${merch.name}`);
        
        // Add inventory for sized items
        if (merch.sizes) {
          const sizes = JSON.parse(merch.sizes);
          for (const size of sizes) {
            await prisma.inventory.create({
              data: {
                merchId: created.id,
                size: size,
                quantity: 20,
                reserved: 0
              }
            });
          }
          results.push(`Added inventory for ${merch.name}`);
        }
      } catch (error) {
        results.push(`Failed to create merch ${merch.name}: ${error}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Seeding failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}