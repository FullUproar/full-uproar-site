import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Full Uproar | Our Story',
  description: 'Meet the chaos-loving team behind Full Uproar Games. We create game modifiers and party games that turn ordinary game nights into legendary disasters.',
  keywords: 'about full uproar, fugly, game designers, party game creators, board game company',
  openGraph: {
    title: 'About Full Uproar | Our Story',
    description: 'Meet the chaos-loving team behind Full Uproar Games.',
    url: 'https://fulluproar.com/about',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Full Uproar | Our Story',
    description: 'Meet the chaos-loving team behind Full Uproar Games.',
  },
  alternates: {
    canonical: 'https://fulluproar.com/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
