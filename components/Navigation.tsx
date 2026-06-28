"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/cave", label: "Cave" },
  { href: "/wines", label: "Vins" },
  { href: "/history", label: "Historique" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(245,240,236,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(26,10,14,0.10)",
        boxShadow: "0 1px 0 rgba(26,10,14,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--wine-red)" }}
          >
            <span style={{ fontSize: 14 }}>🍷</span>
          </div>
          <span
            className="text-sm tracking-[0.18em] uppercase"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)", fontWeight: 700 }}
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
                className="px-4 py-2 rounded-full text-sm transition-all duration-150"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: isActive ? "rgba(192,25,59,0.08)" : "transparent",
                  color: isActive ? "var(--wine-red)" : "var(--text-muted)",
                  border: isActive ? "1px solid rgba(192,25,59,0.2)" : "1px solid transparent",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/wines/add"
            className="ml-2 px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
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
