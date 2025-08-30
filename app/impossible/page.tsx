import { prisma } from '@/lib/prisma';
import ImpossibleMerchGallery from './ImpossibleMerchGallery';

export const metadata = {
  title: 'Impossible Merchandise | Things We Definitely Cannot Sell You',
  description: 'Browse our collection of products that violate the laws of physics, good taste, and several international treaties.'
};

export default async function ImpossiblePage() {
  const products = await prisma.impossibleMerch.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });

  // If no products exist yet, create the Caffeinated Fugly-Os
  if (products.length === 0) {
    const fuglyOs = await prisma.impossibleMerch.create({
      data: {
        title: "Caffeinated Fugly-O's",
        slug: "caffeinated-fugly-os",
        tagline: "Part of This Unbalanced Breakfast!",
        description: "Start your morning with a bowl of pure chaos! Each spoonful contains enough caffeine to wake the dead, enough sugar to power a small city, and enough artificial colors to be visible from space.",
        impossiblePrice: "Your Firstborn Child",
        imageUrl: "/fugly-os-cereal.jpg",
        category: "Food",
        warning: "Not approved by the FDA, FTC, FBI, or your mother",
        ingredients: "Compressed caffeine crystals, weaponized sugar, essence of regret, yellow dye #666, crunchy bits (origin unknown), trace amounts of actual cereal, the tears of morning people, artificial chaos flavor",
        features: "• 500mg of caffeine per bite\n• Glows in the dark AND in the light\n• Milk turns concerning colors\n• Prize inside may be sentient\n• Fortified with 12 essential anxieties",
        legalDisclaimer: "Full Uproar Games is not responsible for: heart palpitations, temporary omniscience, speaking in tongues, the ability to see through time, your spoon dissolving, or becoming one with the universe. Please game responsibly after consumption.",
        stockStatus: "DISCONTINUED_BY_PHYSICS",
        rejectionReason: "The FDA has placed a restraining order on this product",
        sortOrder: 1
      }
    });
    products.push(fuglyOs);
  }

  return <ImpossibleMerchGallery products={products} />;
}