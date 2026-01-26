/**
 * Seed a hidden test product for E2E testing
 *
 * Run with: npx tsx prisma/seed-test-product.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating hidden test product...');

  // Check if test product already exists
  const existing = await prisma.game.findUnique({
    where: { slug: 'test-product-hidden' }
  });

  if (existing) {
    console.log('Test product already exists. Updating stock and isHidden...');
    const updated = await prisma.game.update({
      where: { slug: 'test-product-hidden' },
      data: {
        stock: 100,
        isHidden: true
      }
    });
    console.log(`Updated: ${updated.title} (stock: ${updated.stock}, isHidden: ${updated.isHidden})`);
    return;
  }

  // Create new test product
  const testGame = await prisma.game.create({
    data: {
      title: 'E2E Test Product',
      slug: 'test-product-hidden',
      tagline: 'This is a hidden test product for automated testing',
      description: 'This product is hidden from the public shop and used only for E2E testing of the purchase flow. Do not delete this product.',
      priceCents: 1999, // $19.99
      players: '2-4',
      timeToPlay: '30-60 min',
      ageRating: '13+',
      category: 'MOD',
      stock: 100,
      isHidden: true,
      isPreorder: false,
      featured: false,
      imageUrl: null // Will use placeholder
    }
  });

  console.log(`Created test product: ${testGame.title}`);
  console.log(`  - ID: ${testGame.id}`);
  console.log(`  - Slug: ${testGame.slug}`);
  console.log(`  - Stock: ${testGame.stock}`);
  console.log(`  - isHidden: ${testGame.isHidden}`);
  console.log(`  - Price: $${(testGame.priceCents / 100).toFixed(2)}`);
  console.log('\nThis product will NOT appear in the public shop.');
  console.log('It can be accessed directly at: /shop/games/test-product-hidden');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
