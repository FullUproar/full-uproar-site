const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: 'Fugly Mascot Tee',
        slug: 'fugly-mascot-tee',
        priceCents: 2000,
        imageUrl: '/fugly_shirt.jpg',
        stock: 42,
      },
      {
        name: 'Chaos Sticker Pack',
        slug: 'chaos-stickers',
        priceCents: 800,
        imageUrl: '/chaos_stickers.png',
        stock: 100,
      },
      {
        name: 'Limited Edition Hat',
        slug: 'limited-hat',
        priceCents: 2500,
        imageUrl: '/hat.png',
        stock: 15,
      },
    ],
  });

  console.log('✅ Seeded product data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
