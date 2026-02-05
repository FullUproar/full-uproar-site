/**
 * Seed Packaging Types Script
 *
 * Seeds the initial packaging types for fulfillment.
 *
 * Usage:
 *   npx tsx scripts/seed-packaging.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const packagingTypes = [
  {
    sku: 'FMM01',
    name: 'Standard Game Box',
    length: 5,
    width: 7,
    height: 3,
    material: 'Cardboard',
    weightOz: 4,
    maxWeightOz: 32,
    costCents: 75,
    notes: 'Standard box for single game shipments',
    sortOrder: 1,
  },
  {
    sku: 'FMM02',
    name: 'Large Game Box',
    length: 5,
    width: 7,
    height: 5,
    material: 'Cardboard',
    weightOz: 6,
    maxWeightOz: 48,
    costCents: 95,
    notes: 'Larger box for bundles or multiple games',
    sortOrder: 2,
  },
];

async function main() {
  console.log('🎁 Seeding Packaging Types...');
  console.log('=============================');

  for (const pkg of packagingTypes) {
    try {
      const existing = await prisma.packagingType.findUnique({
        where: { sku: pkg.sku },
      });

      if (existing) {
        console.log(`⏭️  ${pkg.sku} already exists, skipping`);
        continue;
      }

      await prisma.packagingType.create({
        data: pkg,
      });

      console.log(`✅ Created: ${pkg.sku} - ${pkg.name} (${pkg.length}x${pkg.width}x${pkg.height})`);
    } catch (error) {
      console.error(`❌ Error creating ${pkg.sku}:`, error);
    }
  }

  console.log('');
  console.log('Done!');

  await prisma.$disconnect();
}

main();
