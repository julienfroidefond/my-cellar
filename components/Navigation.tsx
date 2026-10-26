"use client";

import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Database,
  Ellipsis,
  History,
  Hourglass,
  House,
  LayoutGrid,
  LogOut,
  Plus,
  Wine,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";

type NavLink = { href: string; label: string; icon: LucideIcon };

/** Destinations principales : barre du haut sur desktop, onglets en bas sur mobile. */
const primaryLinks: NavLink[] = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/wines", label: "Vins", icon: Wine },
  { href: "/cave", label: "Cave", icon: LayoutGrid },
  { href: "/maturity", label: "Maturité", icon: Hourglass },
];

/** Destinations secondaires : regroupées dans « Plus » sur mobile. */
const secondaryLinks: NavLink[] = [
  { href: "/missing-data", label: "À compléter", icon: ClipboardList },
  { href: "/history", label: "Historique", icon: History },
  { href: "/settings", label: "Données", icon: Database },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/wines") return pathname === "/wines" || (pathname.startsWith("/wines/") && pathname !== "/wines/add");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [renderedPathname, setRenderedPathname] = useState(pathname);

  // Ferme la feuille « Plus » au changement de route. Ajuster l'état pendant le
  // rendu (plutôt que dans un effet) évite un rendu en cascade.
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  if (pathname === "/login") return null;

  const secondaryActive = secondaryLinks.some((link) => isActive(pathname, link.href));

  return (
    <>
      {/* ── Barre du haut ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[var(--z-nav)] border-b border-border bg-background/85 backdrop-blur-xl backdrop-saturate-150">
        <nav
          aria-label="Navigation principale"
          className="container-page flex h-[var(--nav-height)] items-center gap-6"
        >
          <Link href="/" aria-label="Ma Cave — accueil" className="shrink-0 rounded-lg">
            <Logo />
          </Link>

          <ul className="hidden flex-1 items-center gap-0.5 lg:flex">
            {[...primaryLinks, ...secondaryLinks].map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-9 items-center rounded-lg px-3 text-sm transition-colors ${
                      active
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-t-sm bg-wine-red"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/wines/add" className="btn btn-primary btn-sm lg:h-9 lg:px-3.5">
              <Plus strokeWidth={2.5} />
              <span>Ajouter</span>
            </Link>
            <form action={logoutAction} className="hidden lg:block">
              <button
                type="submit"
                className="btn btn-ghost btn-icon h-9 w-9"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut />
              </button>
            </form>
          </div>
        </nav>
      </header>

      {/* ── Barre d'onglets mobile ──────────────────────────────────────── */}
      <nav
        aria-label="Navigation mobile"
        className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid h-[var(--tabbar-height)] grid-cols-5">
          {primaryLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    active ? "text-wine-red" : "text-muted"
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-[var(--wine-tint-strong)]" : ""
                    }`}
                  >
                    <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.25 : 1.75} />
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-controls="nav-more"
              className={`flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                secondaryActive ? "text-wine-red" : "text-muted"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full ${
                  secondaryActive ? "bg-[var(--wine-tint-strong)]" : ""
                }`}
              >
                <Ellipsis className="h-[20px] w-[20px]" strokeWidth={secondaryActive ? 2.25 : 1.75} />
              </span>
              Plus
            </button>
          </li>
        </ul>
      </nav>

      {/* ── Feuille « Plus » (mobile) ───────────────────────────────────── */}
      <div
        className={`overlay transition-opacity duration-200 lg:hidden ${
          moreOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMoreOpen(false)}
        aria-hidden="true"
      />
      <div
        id="nav-more"
        role="dialog"
        aria-modal="true"
        aria-label="Plus de pages"
        inert={!moreOpen}
        className={`sheet fixed inset-x-0 bottom-0 z-[var(--z-modal)] pb-[calc(1rem+env(safe-area-inset-bottom))] transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          moreOpen ? "visible translate-y-0" : "invisible translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <span className="eyebrow">Plus</span>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="btn btn-ghost btn-icon"
            aria-label="Fermer"
          >
            <X />
          </button>
        </div>
        <ul className="px-3">
          {secondaryLinks.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-14 items-center gap-3.5 rounded-xl px-3 text-base ${
                    active ? "bg-[var(--wine-tint)] font-semibold text-wine-deep" : "text-foreground"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t border-border pt-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-14 w-full items-center gap-3.5 rounded-xl px-3 text-base text-muted"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
                  <LogOut className="h-[18px] w-[18px]" />
                </span>
                Se déconnecter
              </button>
            </form>
          </li>
        </ul>
      </div>
    </>
  );
}
