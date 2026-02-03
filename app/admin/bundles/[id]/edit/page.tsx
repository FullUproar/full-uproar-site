import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BundleForm from '../../BundleForm';

interface EditBundlePageProps {
  params: Promise<{ id: string }>;
}

async function getBundle(id: number) {
  const bundle = await prisma.game.findUnique({
    where: { id, isBundle: true },
    select: {
      id: true,
      title: true,
      slug: true,
      tagline: true,
      description: true,
      priceCents: true,
      imageUrl: true,
      featured: true,
      isNew: true,
      stock: true,
      bundleInfo: true,
    },
  });

  if (!bundle) {
    notFound();
  }

  return bundle;
}

export default async function EditBundlePage({ params }: EditBundlePageProps) {
  const { id } = await params;
  const bundleId = parseInt(id);

  if (isNaN(bundleId)) {
    notFound();
  }

  const bundle = await getBundle(bundleId);

  // Ensure isNew has a boolean value (not null)
  const bundleWithDefaults = {
    ...bundle,
    isNew: bundle.isNew ?? true
  };

  return <BundleForm bundle={bundleWithDefaults} isEdit />;
}
