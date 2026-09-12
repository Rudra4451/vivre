import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Vivre",
    default: "Vivre | Expedition Command Deck",
  },
  description: "Server-authoritative starmap and exploration platform.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col justify-between selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar isAuthenticated={!!user} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
