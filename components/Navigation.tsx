"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/cave", label: "Cave" },
  { href: "/wines", label: "Vins" },
  { href: "/wines/add", label: "+ Ajouter" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(10, 6, 8, 0.92)",
        backdropFilter: "blur(20px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🍷</span>
          <span
            className="text-lg tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--gold)",
              letterSpacing: "0.2em",
            }}
          >
            Ma Cave
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const isAdd = link.href === "/wines/add";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: isAdd
                    ? "var(--wine-red)"
                    : isActive
                    ? "rgba(201, 169, 110, 0.12)"
                    : "transparent",
                  color: isAdd ? "white" : isActive ? "var(--gold)" : "rgba(245, 240, 235, 0.6)",
                  border: isActive && !isAdd ? "1px solid rgba(201, 169, 110, 0.2)" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
