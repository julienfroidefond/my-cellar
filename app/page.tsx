export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import Link from "next/link";
import CellarCharts from "@/components/CellarCharts";
import PremiumCarousel from "@/components/PremiumCarousel";
import FranceWineMap from "@/components/FranceWineMapClient";
import { MaturityPhaseCarousels } from "@/components/MaturityPhaseCarousels";
import { estimateMaturity } from "@/lib/maturity";
import { getMaturityPhase } from "@/lib/maturity-phase";
import { APPELLATION_COORDS } from "@/lib/appellation-coords";

// The dashboard is rendered per request (`force-dynamic`), so picking a random
// hero wine on every render is intentional. Kept out of the component body so it
// does not look like an impure call during render.
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export default async function DashboardPage() {
  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });

  const allVintages = wines.flatMap((w) => w.vintages.map((v) => ({ ...v, wine: w })));

  const totalBottles = allVintages.reduce((s, v) => s + v.quantity, 0);
  const totalValue = allVintages.reduce((s, v) => s + (v.marketPrice ?? 0) * v.quantity, 0);

  const byColor = allVintages.reduce<Record<string, number>>((acc, v) => {
    const c = v.wine.color ?? "autre";
    acc[c] = (acc[c] ?? 0) + v.quantity;
    return acc;
  }, {});

  const byRegion = allVintages.reduce<Record<string, number>>((acc, v) => {
    const r = v.wine.region ?? "Autre";
    acc[r] = (acc[r] ?? 0) + v.quantity;
    return acc;
  }, {});

  const topRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const vintageYears = allVintages.filter((v) => v.vintage).map((v) => v.vintage!);
  const oldestVintage = vintageYears.length ? Math.min(...vintageYears) : null;

  // Premium: best marketPrice vintage per wine
  const premiumItems = wines
    .flatMap((w) =>
      w.vintages
        .filter((v) => v.marketPrice != null && v.quantity > 0)
        .map((v) => ({
          id: w.id,
          name: w.name,
          producer: w.producer,
          vintage: v.vintage,
          color: w.color,
          appellation: w.appellation,
          marketPrice: v.marketPrice,
          imageUrl: w.imageUrl,
        }))
    )
    .sort((a, b) => (b.marketPrice ?? 0) - (a.marketPrice ?? 0));

  const premiumWines = premiumItems.slice(0, 6);
  const premiumTotal = Math.min(premiumItems.length, 18);

  // ── Carte géographique ────────────────────────────────────────────────────
  type AppEntry = { bottles: number; region: string | null; lat: number; lng: number; wines: { id: string; name: string; bottles: number }[] };
  const appellationBottles = new Map<string, AppEntry>();
  for (const v of allVintages) {
    if (v.quantity === 0 || !v.wine.appellation || v.wine.country !== "France") continue;
    const coords = APPELLATION_COORDS[v.wine.appellation];
    if (!coords) continue;
    if (!appellationBottles.has(v.wine.appellation)) {
      appellationBottles.set(v.wine.appellation, { bottles: 0, region: v.wine.region, lat: coords.lat, lng: coords.lng, wines: [] });
    }
    const entry = appellationBottles.get(v.wine.appellation)!;
    entry.bottles += v.quantity;
    const wineEntry = entry.wines.find((w) => w.id === v.wine.id);
    if (wineEntry) {
      wineEntry.bottles += v.quantity;
    } else {
      entry.wines.push({ id: v.wine.id, name: v.wine.name, bottles: v.quantity });
    }
  }
  const frenchMarkers = [...appellationBottles.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .filter((m) => m.bottles > 0)
    .sort((a, b) => b.bottles - a.bottles);

  const foreignMap = new Map<string, { appellation: string; country: string; bottles: number }>();
  for (const v of allVintages) {
    if (v.quantity === 0 || !v.wine.country || v.wine.country === "France") continue;
    const key = `${v.wine.appellation ?? v.wine.country}|${v.wine.country}`;
    const existing = foreignMap.get(key);
    if (existing) {
      existing.bottles += v.quantity;
    } else {
      foreignMap.set(key, { appellation: v.wine.appellation ?? v.wine.country, country: v.wine.country, bottles: v.quantity });
    }
  }
  const foreignWines = [...foreignMap.values()].sort((a, b) => b.bottles - a.bottles);

  // Maturity — per vintage
  const currentYear = new Date().getFullYear();

  const winesWithMaturity = allVintages
    .filter((v) => v.quantity > 0)
    .map((v) => {
      const hasManual = !!(v.drinkFrom && v.drinkUntil);
      const est = !hasManual
        ? estimateMaturity({ region: v.wine.region, appellation: v.wine.appellation, color: v.wine.color, vintage: v.vintage })
        : null;
      const from = v.drinkFrom ?? est?.drinkFrom ?? null;
      const until = v.drinkUntil ?? est?.drinkUntil ?? null;
      return {
        wineId: v.wine.id,
        name: v.wine.name,
        vintage: v.vintage,
        color: v.wine.color,
        quantity: v.quantity,
        imageUrl: v.wine.imageUrl,
        effectiveDrinkFrom: from,
        effectiveDrinkUntil: until,
        phase: from && until ? getMaturityPhase(from, until, currentYear) : null,
      };
    });

  const winesWithImage = wines.filter((w) => w.imageUrl && w.vintages.some((v) => v.quantity > 0));
  const heroWine = winesWithImage.length > 0 ? pickRandom(winesWithImage) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div
        className="diagonal-stripe relative overflow-hidden"
        style={{ minHeight: 480, background: "var(--background)" }}
      >
        {heroWine?.imageUrl && (
          <div
            className="animate-fade-bottle absolute hidden md:block"
            style={{ right: "16%", top: "-5%", bottom: "-5%", width: 200, zIndex: 20, pointerEvents: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroWine.imageUrl}
              alt={heroWine.name}
              style={{ height: "110%", width: "100%", objectFit: "contain", objectPosition: "center" }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 md:py-24">
          <div className="max-w-xl">
            <p
              className="animate-fade-up text-xs tracking-[0.45em] uppercase mb-5"
              style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}
            >
              Collection personnelle
            </p>
            <h1
              className="animate-fade-up-1 text-6xl md:text-8xl font-bold mb-4 leading-none"
              style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
            >
              Ma Cave<br />
              <span style={{ color: "var(--wine-red)" }}>à Vin</span>
            </h1>
          </div>

          <div className="animate-fade-up-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl">
            {[
              { value: totalBottles, label: "Bouteilles" },
              { value: wines.length, label: "Références" },
              { value: `${totalValue.toFixed(0)} €`, label: "Valeur estimée" },
              { value: oldestVintage ?? "—", label: "Millésime le + ancien" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}
              >
                <div className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                  {stat.value}
                </div>
                <div className="text-xs tracking-wider uppercase" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-fade-up-3 max-w-7xl mx-auto px-6 py-14 space-y-14">
        {premiumTotal > 0 && (
          <PremiumCarousel initialWines={premiumWines} total={premiumTotal} />
        )}

        <section>
          <SectionTitle eyebrow="Statistiques">Répartition de la cave</SectionTitle>
          <div className="mt-8">
            <CellarCharts byColor={byColor} topRegions={topRegions} />
          </div>
        </section>

        {(frenchMarkers.length > 0 || foreignWines.length > 0) && (
          <section>
            <SectionTitle eyebrow="Origine">Carte des appellations</SectionTitle>
            <div className="mt-8">
              <FranceWineMap markers={frenchMarkers} foreignWines={foreignWines} />
            </div>
          </section>
        )}

        {winesWithMaturity.some((wine) => wine.phase) && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <SectionTitle eyebrow="Maturité">Les moments de la cave</SectionTitle>
                <p className="text-sm mt-2" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  Les bouteilles classées selon leur fenêtre de dégustation.
                </p>
              </div>
              <Link href="/maturity" className="px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-80" style={{ border: "1px solid var(--border)", color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
                Voir la maturité en détail →
              </Link>
            </div>
            <MaturityPhaseCarousels wines={winesWithMaturity.flatMap((wine) => wine.phase && wine.effectiveDrinkFrom && wine.effectiveDrinkUntil ? [{ wineId: wine.wineId, name: wine.name, vintage: wine.vintage, imageUrl: wine.imageUrl, color: wine.color, from: wine.effectiveDrinkFrom, until: wine.effectiveDrinkUntil, quantity: wine.quantity, phase: wine.phase }] : [])} />
          </section>
        )}

        <section className="flex gap-3 flex-wrap pb-8">
          <Link
            href="/wines"
            className="px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
          >
            Voir tous les vins
          </Link>
          <Link
            href="/cave"
            className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:border-[var(--wine-red)] hover:text-[var(--wine-red)]"
            style={{ background: "transparent", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
          >
            Voir la cave
          </Link>
          <Link
            href="/wines/add"
            className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "rgba(184, 122, 44, 0.10)", border: "1px solid rgba(184, 122, 44, 0.28)", color: "var(--gold)", fontFamily: "var(--font-inter)" }}
          >
            + Ajouter un vin
          </Link>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
        {children}
      </h2>
    </div>
  );
}
