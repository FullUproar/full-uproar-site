import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MerchProductClient from './MerchProductClient';

interface MerchPageProps {
  params: Promise<{ slug: string }>;
}

async function getMerch(slug: string) {
  const merch = await prisma.merch.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      inventory: true
    }
  });

  if (!merch) {
    notFound();
  }

  // Add totalStock for POD products
  const merchWithStock = {
    ...merch,
    totalStock: merch.isPrintify ? 999 : 
      merch.inventory.reduce((sum, inv) => sum + (inv.quantity - inv.reserved), 0)
  };

  return merchWithStock;
}

async function getSimilarMerch(currentMerch: any) {
  // Get merch in the same category or with similar tags
  const tags = currentMerch.tags ? JSON.parse(currentMerch.tags) : [];
  
  const similarMerch = await prisma.merch.findMany({
    where: {
      AND: [
        { id: { not: currentMerch.id } },
        {
          OR: [
            // Same category
            { category: currentMerch.category },
            // Similar price range (within 30%)
            {
              priceCents: {
                gte: Math.floor(currentMerch.priceCents * 0.7),
                lte: Math.ceil(currentMerch.priceCents * 1.3)
              }
            },
            // Featured items
            { featured: true }
          ]
        }
      ]
    },
    take: 4,
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      },
      inventory: true
    }
  });

  return similarMerch;
}

export default async function MerchPage({ params }: MerchPageProps) {
  const { slug } = await params;
  const merch = await getMerch(slug);
  const similarMerch = await getSimilarMerch(merch);

  return (
    <MerchProductClient 
      merch={merch} 
      similarMerch={similarMerch}
    />
  );
}