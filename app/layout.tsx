import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { IconSettings } from '@/components/Icons';
import TrekkingLiveOverlay from '@/components/TrekkingLiveOverlay';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rotary Experiences — Loterij Soest-Baarn',
  description:
    'Winnaars, goede doelen en digitale loten van de dinsdagavondloterij van Rotary Club Soest-Baarn.',
  // "Zet op beginscherm" op de iPhone: schermvullend, eigen naam onder het icoon.
  appleWebApp: {
    capable: true,
    title: 'Loterij',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#17458f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-wheel" src="/RotaryMoE-R_CMYK-C.png" alt="" aria-hidden />

              <span className="brand-text">
                <strong>Loterij</strong>
                <small>Rotary Club Soest-Baarn</small>
              </span>
            </Link>
            <nav className="site-nav">
              <Link href="/">Winnaars</Link>
              <Link href="/goede-doelen">Goede doelen</Link>
              <Link href="/meedoen">Meedoen</Link>
              <Link
                href="/beheer"
                className="beheer-link"
                title="Beheer"
                aria-label="Beheer"
              >
                <IconSettings size={20} />
              </Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>

        {/* Trekking bezig? Dan komt die vanzelf in beeld, op welke pagina de
            bezoeker ook zit. Staat uit op /beheer en /live. */}
        <TrekkingLiveOverlay />
        <footer className="site-footer">
          <div className="container">
            <p>Rotary Club Soest-Baarn · Loterijcommissie</p>
            <p className="footer-note">
              “De mooiste prijs zit niet in een fles wijn, maar in de tijd en
              aandacht die we met elkaar delen.”
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
