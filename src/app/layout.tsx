import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fanki - AI-Powered Flashcards',
  description: 'Transform your language learning with AI-powered flashcards featuring dynamic content generation, spaced repetition, and multi-modal learning.',
  manifest: '/manifest.json',
  keywords: ['flashcards', 'language learning', 'AI', 'spaced repetition', 'vocabulary'],
  authors: [{ name: 'Fanki Team' }],
  creator: 'Fanki',
  publisher: 'Fanki',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Fanki - AI-Powered Flashcards',
    description: 'Transform your language learning with AI-powered flashcards',
    url: '/',
    siteName: 'Fanki',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fanki - AI-Powered Flashcards',
    description: 'Transform your language learning with AI-powered flashcards',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <div id="root">
            {children}
          </div>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}
