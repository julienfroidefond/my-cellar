import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";
import ScrollReveal from "@/components/ScrollReveal";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ma Cave — Julien Froidefond",
  description: "Collection de vins premium",
  applicationName: "Ma Cave",
  appleWebApp: {
    capable: true,
    title: "Ma Cave",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#8a0f25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Navigation />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <ScrollReveal />
      </body>
    </html>
  );
}
