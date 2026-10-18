"use client";

import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/cave", label: "Cave" },
  { href: "/wines", label: "Vins" },
  { href: "/maturity", label: "Maturité" },
  { href: "/missing-data", label: "À compléter" },
  { href: "/history", label: "Historique" },
  { href: "/settings", label: "Données" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [renderedPathname, setRenderedPathname] = useState(pathname);

  // Close the mobile menu when the route changes. Adjusting the state during
  // render (instead of in an effect) avoids a cascading re-render.
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
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
            <form action={logoutAction}>
              <button
                type="submit"
                className="ml-1 px-3 py-2 rounded-full text-sm transition-all duration-150 hover:opacity-80"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--text-muted)",
                  border: "1px solid transparent",
                }}
                title="Se déconnecter"
              >
                ↪
              </button>
            </form>
          </div>

          {/* Mobile: bouton + et hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/wines/add"
              className="h-8 px-3.5 rounded-full text-sm font-semibold flex items-center"
              style={{
                fontFamily: "var(--font-inter)",
                background: "var(--wine-red)",
                color: "white",
              }}
            >
              + Ajouter
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
            >
              <span
                className="block w-5 h-0.5"
                style={{
                  background: "var(--foreground)",
                  transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
                  transform: isOpen ? "translateY(8px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block w-5 h-0.5"
                style={{
                  background: "var(--foreground)",
                  transition: "opacity 0.15s ease, transform 0.22s ease",
                  opacity: isOpen ? 0 : 1,
                  transform: isOpen ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block w-5 h-0.5"
                style={{
                  background: "var(--foreground)",
                  transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
                  transform: isOpen ? "translateY(-8px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop mobile */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{
          background: "rgba(26,10,14,0.25)",
          backdropFilter: "blur(3px)",
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Menu mobile slide-down */}
      <div
        className="fixed top-16 left-0 right-0 z-40 md:hidden"
        style={{
          background: "rgba(245,240,236,0.98)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(26,10,14,0.10)",
          boxShadow: "0 8px 32px rgba(26,10,14,0.12)",
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1), transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="px-4 py-3">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-base transition-all duration-150"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: isActive ? "rgba(192,25,59,0.07)" : "transparent",
                  color: isActive ? "var(--wine-red)" : "var(--foreground)",
                  fontWeight: isActive ? 600 : 400,
                  marginBottom: 2,
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--wine-red)", flexShrink: 0 }}
                  />
                )}
              </Link>
            );
          })}

          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(26,10,14,0.08)" }}>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm transition-all duration-150"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--text-muted)",
                }}
              >
                <span style={{ fontSize: 15 }}>↪</span>
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
