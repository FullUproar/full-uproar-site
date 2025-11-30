import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Games & Merch | Full Uproar',
  description: 'Browse chaotic party games, game-mod decks, and Fugly-approved merchandise. Find the perfect way to destroy your next game night.',
  keywords: 'board games, party games, game mods, fugly, chaos games, tabletop games, game night, merchandise',
  openGraph: {
    title: 'Shop Games & Merch | Full Uproar',
    description: 'Browse chaotic party games, game-mod decks, and Fugly-approved merchandise.',
    url: 'https://fulluproar.com/shop',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Games & Merch | Full Uproar',
    description: 'Browse chaotic party games, game-mod decks, and Fugly-approved merchandise.',
  },
  alternates: {
    canonical: 'https://fulluproar.com/shop',
  },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
