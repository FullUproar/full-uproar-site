import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const artwork = await prisma.artwork.findMany({
    select: { id: true, name: true, imageUrl: true, thumbnailUrl: true, largeUrl: true }
  });

  console.log('Artwork Status:');
  console.log('===============');

  for (const a of artwork) {
    const hasThumb = !!a.thumbnailUrl && a.thumbnailUrl !== a.imageUrl;
    const hasLarge = !!a.largeUrl && a.largeUrl !== a.imageUrl;

    let thumbSize = 'N/A';
    let medSize = 'N/A';
    let largeSize = 'N/A';

    try {
      if (a.thumbnailUrl?.includes(',')) {
        thumbSize = (Buffer.from(a.thumbnailUrl.split(',')[1], 'base64').length / 1024).toFixed(1) + ' KB';
      }
      if (a.imageUrl?.includes(',')) {
        medSize = (Buffer.from(a.imageUrl.split(',')[1], 'base64').length / 1024).toFixed(1) + ' KB';
      }
      if (a.largeUrl?.includes(',')) {
        largeSize = (Buffer.from(a.largeUrl.split(',')[1], 'base64').length / 1024).toFixed(1) + ' KB';
      }
    } catch (e) {
      // URL might not be base64
    }

    console.log(`${a.name} (ID: ${a.id})`);
    console.log(`  Thumbnail: ${hasThumb ? 'YES' : 'NO'} (${thumbSize})`);
    console.log(`  Medium:    YES (${medSize})`);
    console.log(`  Large:     ${hasLarge ? 'YES' : 'NO'} (${largeSize})`);
    console.log('');
  }

  await prisma.$disconnect();
}

check();
