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
  weight: ["400", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Vivre",
    default: "Vivre | Constellation Atlas",
  },
  description: "Server-authoritative personal star atlas and expedition platform.",
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
