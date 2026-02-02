const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const games = await prisma.game.findMany({
    select: { id: true, title: true, slug: true }
  });
  console.log('Available games:');
  games.forEach(g => console.log(`  ID: ${g.id} - ${g.title} (slug: ${g.slug})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
