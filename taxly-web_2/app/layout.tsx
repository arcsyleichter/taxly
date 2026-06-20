import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Taxly – Adóoptimalizálás egyéni vállalkozóknak',
  description: 'KATA, Átalányadó, SZJA, Kft. – egymás mellett, 2026-os adószabályok alapján. Látod, melyikkel maradsz a legjobban.',
  keywords: 'KATA, átalányadó, SZJA, adókalkulátor, egyéni vállalkozó, adóoptimalizálás',
  openGraph: {
    title: 'Taxly – A könyvelőd nem mondja el. Mi igen.',
    description: 'Melyik adózási formával fizeted a legkevesebb adót? Kiszámoljuk.',
    url: 'https://taxly.hu',
    siteName: 'Taxly',
    locale: 'hu_HU',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  )
}
