import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

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
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
