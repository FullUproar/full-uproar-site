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

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Full Uproar - Fugly Approved Games',
  description: 'Game modifiers so chaotic, Fugly approves. Turn any game night into beautiful disaster.',
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
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          style={{ margin: 0, padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          <AnalyticsProvider>
            <TestModeBanner />
            <main style={{ flex: 1 }}>
              {children}
            </main>
            <GlobalFooter />
            <ToastContainer />
          </AnalyticsProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}