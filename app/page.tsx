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

const COLOR_LABELS: Record<string, string> = {
  rouge: "Rouge",
  blanc: "Blanc",
  rosé: "Rosé",
  effervescent: "Effervescent",
};

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const heroVintage = heroWine?.vintages.find((v) => v.quantity > 0) ?? null;
  const heroDescription = heroWine?.description?.trim() || heroWine?.notes?.trim() || null;
  const heroProducer = heroWine?.producer?.trim() ?? "";
  const showProducer = heroWine
    ? heroProducer.length > 0 &&
      !normalized(heroWine.name).includes(normalized(heroProducer))
    : false;
  const heroMeta = heroWine
    ? [
        heroVintage?.vintage ? String(heroVintage.vintage) : null,
        heroWine.appellation?.trim() || heroWine.region?.trim(),
        heroWine.color ? COLOR_LABELS[heroWine.color] ?? heroWine.color : null,
        heroVintage
          ? `${heroVintage.quantity}\u00A0bouteille${heroVintage.quantity > 1 ? "s" : ""}`
          : null,
      ].filter((item): item is string => Boolean(item))
    : [];

  const stats = [
    { value: totalBottles, label: "Bouteilles" },
    { value: wines.length, label: "Références" },
    { value: `${Math.round(totalValue).toLocaleString("fr-FR")} €`, label: "Valeur estimée" },
    { value: oldestVintage ?? "—", label: "Plus ancien millésime" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <section
        className="diagonal-stripe relative overflow-hidden"
        style={{ background: "var(--background)" }}
        aria-labelledby="featured-wine-title"
      >
        {heroWine?.imageUrl && (
          <div
            className="animate-fade-bottle pointer-events-none absolute bottom-[-6%] top-[-6%] z-20 hidden w-[200px] md:right-[5%] md:block lg:right-[12%] lg:w-[220px]"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroWine.imageUrl}
              alt=""
              style={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
                objectPosition: "center",
                filter: "drop-shadow(0 34px 42px rgba(26,10,14,0.30))",
              }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16 lg:py-20">
          {heroWine ? (
            <div className="max-w-[640px] md:max-w-[480px] lg:max-w-[640px]">
              {heroWine.imageUrl && (
                <div
                  className="animate-fade-bottle float-right mb-3 ml-5 w-[84px] sm:w-[104px] md:hidden"
                  aria-hidden="true"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroWine.imageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "auto",
                      filter: "drop-shadow(0 20px 26px rgba(26,10,14,0.26))",
                    }}
                  />
                </div>
              )}

              <p
                className="animate-fade-up text-[11px] font-semibold uppercase tracking-[0.35em]"
                style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}
              >
                La bouteille du moment
              </p>

              <h1
                id="featured-wine-title"
                className="animate-fade-up-1 mt-4 text-balance text-[2.5rem] font-bold leading-[0.95] sm:text-5xl lg:text-7xl"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
              >
                {heroWine.name}
              </h1>

              {showProducer && (
                <p
                  className="animate-fade-up-1 mt-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
                >
                  {heroProducer}
                </p>
              )}

              {heroMeta.length > 0 && (
                <p
                  className="animate-fade-up-1 mt-3 text-xs"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                >
                  {heroMeta.join(" · ")}
                </p>
              )}

              {heroDescription && (
                <p
                  className="animate-fade-up-2 mt-6 line-clamp-4 max-w-[52ch] text-sm leading-relaxed"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                >
                  {heroDescription}
                </p>
              )}

              <div className="animate-fade-up-2 mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={`/wines/${heroWine.id}`}
                  className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
                >
                  Découvrir cette bouteille
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
                <Link
                  href="/wines"
                  className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium transition-all hover:border-[var(--wine-red)] hover:text-[var(--wine-red)]"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Explorer la cave
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-xl">
              <p
                className="animate-fade-up text-xs tracking-[0.45em] uppercase mb-5"
                style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}
              >
                Collection personnelle
              </p>
              <h1
                id="featured-wine-title"
                className="animate-fade-up-1 text-6xl md:text-8xl font-bold leading-none"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
              >
                Ma Cave<br />
                <span style={{ color: "var(--wine-red)" }}>à Vin</span>
              </h1>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-9 md:py-10" aria-label="La cave en chiffres" data-reveal>
        <div
          className="grid grid-cols-2 gap-y-6 border-t pt-7 md:grid-cols-4 md:gap-y-0"
          style={{ borderColor: "var(--border)" }}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={index > 0 ? "md:border-l md:pl-6" : undefined}
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="text-3xl font-bold leading-none"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
              >
                {stat.value}
              </div>
              <div
                className="mt-2 text-[10px] uppercase leading-tight tracking-[0.14em]"
                style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-14" data-reveal-stagger>
        {premiumTotal > 0 && (
          <PremiumCarousel initialWines={premiumWines} total={premiumTotal} />
        )}

        <section data-reveal>
          <SectionTitle eyebrow="Statistiques">Répartition de la cave</SectionTitle>
          <div className="mt-8">
            <CellarCharts byColor={byColor} topRegions={topRegions} />
          </div>
        </section>

        {(frenchMarkers.length > 0 || foreignWines.length > 0) && (
          <section data-reveal>
            <SectionTitle eyebrow="Origine">Carte des appellations</SectionTitle>
            <div className="mt-8">
              <FranceWineMap markers={frenchMarkers} foreignWines={foreignWines} />
            </div>
          </section>
        )}

        {winesWithMaturity.some((wine) => wine.phase) && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8" data-reveal>
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

        <section className="flex gap-3 flex-wrap pb-8" data-reveal>
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
