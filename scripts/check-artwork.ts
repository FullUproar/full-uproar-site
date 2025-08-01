import { prisma } from '../lib/prisma';

async function checkArtwork() {
  try {
    const artworkCount = await prisma.artwork.count();
    console.log(`Total artwork in database: ${artworkCount}`);
    
    if (artworkCount > 0) {
      const artworks = await prisma.artwork.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\nFirst 10 artworks:');
      artworks.forEach((art, index) => {
        console.log(`${index + 1}. ${art.name} - ${art.category} ${art.chaosMode ? '(CHAOS MODE)' : ''}`);
        console.log(`   URL: ${art.imageUrl}`);
      });
    }
  } catch (error) {
    console.error('Error checking artwork:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArtwork();