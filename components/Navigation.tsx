"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/cave", label: "Cave" },
  { href: "/wines", label: "Vins" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(13, 8, 11, 0.95)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(61, 34, 41, 0.9)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-xl">🍷</span>
          <span
            className="text-sm tracking-[0.25em] uppercase"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--gold)",
              fontWeight: 600,
            }}
          >
            Ma Cave
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: isActive ? "rgba(196, 152, 60, 0.14)" : "transparent",
                  color: isActive ? "var(--gold)" : "var(--text-muted)",
                  border: isActive ? "1px solid rgba(196, 152, 60, 0.28)" : "1px solid transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/wines/add"
            className="ml-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:opacity-90"
            style={{
              fontFamily: "var(--font-inter)",
              background: "var(--wine-red)",
              color: "white",
            }}
          >
            + Ajouter
          </Link>
        </div>
      </div>
    </nav>
  );
}
