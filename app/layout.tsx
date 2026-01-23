import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import TestModeBanner from './components/TestModeBanner'
import GlobalFooter from './components/GlobalFooter'
import ToastContainer from './components/ToastContainer'
import AnalyticsProvider from './components/AnalyticsProvider'
import { ChaosProvider } from '@/lib/chaos-context'
import MetaPixel from './components/MetaPixel'
import UniversalTracking from './components/UniversalTracking'
import CookieConsent from './components/CookieConsent'
import ErrorBoundary from './components/ErrorBoundary'
import { OrganizationSchema, WebSiteSchema } from './components/StructuredData'
import ComingSoonBanner from './components/ComingSoonBanner'
import MetricoolTracking from './components/MetricoolTracking'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Full Uproar',
  description: 'Game modifiers so chaotic, Fugly approves. Turn any game night into beautiful disaster.',
  keywords: 'board games, party games, fugly, chaos games, tabletop games, game night, Full Uproar',
  authors: [{ name: 'Full Uproar Games' }],
  creator: 'Full Uproar Games',
  publisher: 'Full Uproar Games',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://fulluproar.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fulluproar.com',
    siteName: 'Full Uproar',
    title: 'Full Uproar',
    description: 'Game modifiers so chaotic, Fugly approves. Turn any game night into beautiful disaster.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Full Uproar - Chaos Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Full Uproar',
    description: 'Game modifiers so chaotic, Fugly approves. Turn any game night into beautiful disaster.',
    images: ['/og-image.png'],
    creator: '@fulluproar',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#f97316',
          colorText: '#fdba74',
          colorTextOnPrimaryBackground: '#111827',
          colorTextSecondary: '#94a3b8',
          colorBackground: '#1e293b',
          colorInputBackground: '#0f172a',
          colorInputText: '#fdba74',
          borderRadius: '0.5rem',
        },
        elements: {
          modalBackdrop: 'bg-black/50 backdrop-blur-sm',
          modalContent: 'bg-slate-800',
          rootBox: 'bg-slate-800',
          card: 'bg-slate-800',
        },
      }}
    >
      <html lang="en">
        <head>
          <OrganizationSchema />
          <WebSiteSchema />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          style={{ margin: 0, padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          <ErrorBoundary>
            <ChaosProvider>
              <AnalyticsProvider>
                <TestModeBanner />
                <ComingSoonBanner />
                {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
                  <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
                )}
                <UniversalTracking
                  googleAnalyticsId={process.env.NEXT_PUBLIC_GA_ID}
                  googleAdsId={process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}
                  clarityId={process.env.NEXT_PUBLIC_CLARITY_ID}
                  tiktokPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
                  pinterestTagId={process.env.NEXT_PUBLIC_PINTEREST_TAG_ID}
                  snapchatPixelId={process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID}
                />
                <MetricoolTracking />
                <main style={{ flex: 1 }}>
                  {children}
                </main>
                <GlobalFooter />
                <ToastContainer />
                <CookieConsent />
              </AnalyticsProvider>
            </ChaosProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}