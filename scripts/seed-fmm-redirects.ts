/**
 * Seed URL redirects for Fugly's Mayhem Machine game series
 * Run with: npx ts-node scripts/seed-fmm-redirects.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const games = [
  {
    slug: 'hack-your-deck',
    name: 'Hack Your Deck',
    abbrev: 'hyd',
  },
  {
    slug: 'dumbest-ways-to-win',
    name: 'Dumbest Ways To Win',
    abbrev: 'dwtw',
  },
  {
    slug: 'crime-and-funishment',
    name: 'Crime And Funishment',
    abbrev: 'caf',
  },
  {
    slug: 'dice-not-included',
    name: 'Dice Not Included',
    abbrev: 'dni',
  },
];

async function seedRedirects() {
  console.log('Seeding Fugly\'s Mayhem Machine redirects...\n');

  // Series overview redirect
  const seriesRedirect = await prisma.redirect.upsert({
    where: { slug: 'fmm' },
    update: {},
    create: {
      slug: 'fmm',
      destination: '/games/fugly-mayhem-machine',
      name: "Fugly's Mayhem Machine - Series",
      description: 'QR code landing page for the Fugly\'s Mayhem Machine series overview',
      isActive: true,
    },
  });
  console.log(`✓ Created redirect: /go/fmm → ${seriesRedirect.destination}`);

  // Individual game redirects
  for (const game of games) {
    // Pre-purchase redirect (for packaging)
    const preRedirect = await prisma.redirect.upsert({
      where: { slug: `fmm-${game.abbrev}` },
      update: {},
      create: {
        slug: `fmm-${game.abbrev}`,
        destination: `/games/fugly-mayhem-machine/${game.slug}`,
        name: `${game.name} - Pre-Purchase`,
        description: `QR code on packaging for ${game.name}`,
        isActive: true,
      },
    });
    console.log(`✓ Created redirect: /go/fmm-${game.abbrev} → ${preRedirect.destination}`);

    // How-to-play redirect (for instructions)
    const playRedirect = await prisma.redirect.upsert({
      where: { slug: `fmm-${game.abbrev}-play` },
      update: {},
      create: {
        slug: `fmm-${game.abbrev}-play`,
        destination: `/games/fugly-mayhem-machine/${game.slug}/how-to-play`,
        name: `${game.name} - How To Play`,
        description: `QR code on instructions for ${game.name}`,
        isActive: true,
      },
    });
    console.log(`✓ Created redirect: /go/fmm-${game.abbrev}-play → ${playRedirect.destination}`);
  }

  console.log('\n✅ All redirects created successfully!');
  console.log('\nQR Code URLs:');
  console.log('─'.repeat(60));
  console.log('Series:     https://fulluproar.com/go/fmm');
  console.log('');
  for (const game of games) {
    console.log(`${game.name}:`);
    console.log(`  Package:     https://fulluproar.com/go/fmm-${game.abbrev}`);
    console.log(`  Instructions: https://fulluproar.com/go/fmm-${game.abbrev}-play`);
  }
}

seedRedirects()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
