import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
  userScalable: true,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'KBC Brake & Clutch - Premium Automotive Parts Supplier',
  description: 'Quality brake and clutch components for Southern Africa. Manufacturers & wholesalers since 1997. Expert technical support, competitive pricing, same-day service.',
  generator: 'v0.app',
  applicationName: 'KBC Brake & Clutch',
  keywords: 'brake parts, clutch parts, automotive components, South Africa, wholesale, manufacturer',
  authors: [{ name: 'KBC Brake & Clutch' }],
  creator: 'KBC Brake & Clutch',
  publisher: 'KBC Brake & Clutch',
  category: 'E-Commerce',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://kbc-brake-clutch.co.za',
    siteName: 'KBC Brake & Clutch',
    title: 'KBC Brake & Clutch - Premium Automotive Parts Supplier',
    description: 'Quality brake and clutch components for Southern Africa. Manufacturers & wholesalers since 1997.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'KBC Brake & Clutch - Premium Parts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KBC Brake & Clutch - Premium Automotive Parts',
    description: 'Quality brake and clutch components for Southern Africa',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
