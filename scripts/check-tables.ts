import { prisma } from '../lib/prisma';

async function checkTables() {
  try {
    // Check what's in the database
    const games = await prisma.game.count();
    const merch = await prisma.merch.count();
    const users = await prisma.user.count();
    const comics = await prisma.comic.count();
    
    console.log('Database contents:');
    console.log(`- Games: ${games}`);
    console.log(`- Merch: ${merch}`);
    console.log(`- Users: ${users}`);
    console.log(`- Comics: ${comics}`);
    
    // Check if we have any games with images
    if (games > 0) {
      const gamesWithImages = await prisma.game.findMany({
        where: {
          imageUrl: { not: null }
        },
        take: 5
      });
      
      console.log('\nGames with images:');
      gamesWithImages.forEach(game => {
        console.log(`- ${game.title}: ${game.imageUrl}`);
      });
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();