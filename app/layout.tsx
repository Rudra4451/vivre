import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { AriaAnnouncer } from "@/components/ui/AriaAnnouncer";
import { LevelUpCelebration } from "@/components/quest/LevelUpCelebration";
import { SoundProvider } from "@/components/theme/SoundProvider";
import { NetworkStatusBanner } from "@/components/ui/NetworkStatusBanner";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vivre.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Vivre",
    default: "Vivre | Constellation Atlas",
  },
  description: "Server-authoritative personal star atlas and expedition platform.",
  keywords: [
    "star atlas",
    "gamified productivity",
    "constellations",
    "celestial quests",
    "habit tracking",
    "astronomical journal",
  ],
  authors: [{ name: "Vivre Observatory" }],
  creator: "Vivre Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Vivre",
    title: "Vivre | Personal Constellation Atlas",
    description: "Transform daily intentions into celestial constellations in an authoritative star atlas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vivre | Personal Constellation Atlas",
    description: "Transform daily intentions into celestial constellations in an authoritative star atlas.",
    creator: "@vivre_atlas",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cinzel.variable} ${plusJakarta.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-atlas-bg text-atlas-ink antialiased flex flex-col justify-between selection:bg-atlas-reward/20 selection:text-atlas-reward transition-colors duration-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-atlas-ink focus:text-atlas-bg focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-atlas-reward font-medium text-xs tracking-wider uppercase font-mono"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <SoundProvider />
          <AriaAnnouncer />
          <LevelUpCelebration />
          <NetworkStatusBanner />
          <Navbar isAuthenticated={!!user} />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
