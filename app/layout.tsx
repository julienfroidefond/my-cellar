import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  themeColor: "#f6efe4",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <a
          href="#contenu"
          className="btn btn-dark sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100]"
        >
          Aller au contenu
        </a>
        <Navigation />
        {/* Réserve la place de la barre d'onglets mobile (+ zone de sécurité iOS). */}
        <main
          id="contenu"
          className="flex-1 pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] lg:pb-0"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
