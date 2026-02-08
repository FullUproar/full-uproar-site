import { Metadata } from 'next';
import EmailSlideIn from '@/app/components/EmailSlideIn';

export const metadata: Metadata = {
  title: 'Shop Merch | Full Uproar',
  description: 'Gear up with Full Uproar merchandise. T-shirts, hoodies, accessories and more chaos for your wardrobe.',
  openGraph: {
    title: 'Shop Merch | Full Uproar',
    description: 'Gear up with Full Uproar merchandise. T-shirts, hoodies, accessories and more chaos for your wardrobe.',
    type: 'website',
    url: 'https://fulluproar.com/shop/merch',
    images: [
      {
        url: 'https://fulluproar.com/og-merch.jpg',
        width: 1200,
        height: 630,
        alt: 'Full Uproar Merchandise',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Merch | Full Uproar',
    description: 'Gear up with Full Uproar merchandise.',
  },
};

export default function MerchShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <EmailSlideIn />
    </>
  );
}
