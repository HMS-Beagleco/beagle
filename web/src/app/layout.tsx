import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import Nav from '@/components/ui/Nav'
import Footer from '@/components/ui/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'Beagle — Wildlife Trail Intelligence',
    template: '%s | Beagle',
  },
  description:
    'Find the best times and places to see specific wildlife in North American national parks. Powered by real observation data from iNaturalist and eBird.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beagleguide.com'),
  openGraph: {
    siteName: 'Beagle',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col font-[var(--font-inter)]">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
