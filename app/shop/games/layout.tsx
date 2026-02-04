import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Games | Full Uproar',
  description: 'Browse our collection of chaotic board games. From party games to strategic mayhem, find your next game night obsession.',
  openGraph: {
    title: 'Shop Games | Full Uproar',
    description: 'Browse our collection of chaotic board games. From party games to strategic mayhem, find your next game night obsession.',
    type: 'website',
    url: 'https://fulluproar.com/shop/games',
    images: [
      {
        url: 'https://fulluproar.com/og-games.jpg',
        width: 1200,
        height: 630,
        alt: 'Full Uproar Games Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Games | Full Uproar',
    description: 'Browse our collection of chaotic board games.',
  },
};

export default function GamesShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
