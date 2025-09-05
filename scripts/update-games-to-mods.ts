import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGamesToMods() {
  try {
    // Update all existing games to be MODS category
    const result = await prisma.game.updateMany({
      where: {
        OR: [
          { category: 'GAME' },
          { category: null }
        ]
      },
      data: {
        category: 'MOD',
        featured: true // Since these are our featured MODS
      }
    });

    console.log(`Updated ${result.count} games to MOD category`);

    // Verify the update
    const games = await prisma.game.findMany({
      select: {
        title: true,
        category: true,
        featured: true
      }
    });

    console.log('\nCurrent games:');
    games.forEach(game => {
      console.log(`- ${game.title}: ${game.category} (Featured: ${game.featured})`);
    });

  } catch (error) {
    console.error('Error updating games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGamesToMods();