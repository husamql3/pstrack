import type { Metadata } from 'next'

export const siteMetaData: Metadata = {
  title: 'PSTrack',
  description: 'A platform that helps you solve, track, and grow',
  keywords: [
    'problem-solving',
    'tracking',
    'daily problems',
    'collaborative tracking dashboard',
    'leetcode',
    'LeetCode',
    'neetcode',
    'neetcode.io',
  ],
  authors: [{ name: 'Hüsam' }],
  creator: '@husamahmud',
  publisher: 'PSTrack',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL('https://www.pstrack.tech'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  openGraph: {
    title: 'PSTrack',
    description: 'A platform that helps you solve, track, and grow',
    url: 'https://www.pstrack.tech',
    siteName: 'PSTrack',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.pstrack.tech/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PSTrack - PlayStation gaming tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PSTrack',
    description: 'A platform that helps you solve, track, and grow',
    creator: '@husamahmud',
    images: ['https://www.pstrack.tech/og-image.jpg'],
  },
}
