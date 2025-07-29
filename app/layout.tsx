import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import DrawerWrapper from './components/DrawerWrapper'
import TestModeBanner from './components/TestModeBanner'

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <TestModeBanner />
          {children}
          <DrawerWrapper />
        </body>
      </html>
    </ClerkProvider>
  )
}