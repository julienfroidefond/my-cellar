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
import { ArrowRight, Plus } from "lucide-react";
import { Eyebrow, SectionHeader, StatsRow } from "@/components/PageHeader";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";

// The dashboard is rendered per request (`force-dynamic`), so picking random
// hero wines on every render is intentional. Kept out of the component body so it
// does not look like an impure call during render.
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Nombre de bouteilles présentées dans le carrousel du hero. */
const HERO_SLIDES = 5;

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
  const heroSlides: HeroSlide[] = shuffle(winesWithImage)
    .slice(0, HERO_SLIDES)
    .map((wine) => {
      const vintage = wine.vintages.find((v) => v.quantity > 0) ?? null;
      const producer = wine.producer?.trim() ?? "";
      const showProducer =
        producer.length > 0 && !normalized(wine.name).includes(normalized(producer));
      return {
        id: wine.id,
        name: wine.name,
        producer: showProducer ? producer : null,
        description: wine.description?.trim() || wine.notes?.trim() || null,
        imageUrl: wine.imageUrl!,
        meta: [
          vintage?.vintage ? String(vintage.vintage) : null,
          wine.appellation?.trim() || wine.region?.trim(),
          wine.color ? COLOR_LABELS[wine.color] ?? wine.color : null,
          vintage ? `${vintage.quantity}\u00A0bouteille${vintage.quantity > 1 ? "s" : ""}` : null,
        ].filter((item): item is string => Boolean(item)),
      };
    });

  const stats = [
    { value: totalBottles, label: "Bouteilles" },
    { value: wines.length, label: "Références" },
    { value: `${Math.round(totalValue).toLocaleString("fr-FR")} €`, label: "Valeur estimée" },
    { value: oldestVintage ?? "—", label: "Plus ancien millésime" },
  ];

  return (
    <div>
      <h1 className="sr-only">Ma Cave</h1>

      {/* ── Bouteilles du moment : affiches pleine largeur ──────────────── */}
      {heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides} />
      ) : (
        <section className="relative isolate overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-wine-red [clip-path:polygon(0_100%,100%_40%,100%_100%)] md:[clip-path:polygon(60%_0,100%_0,100%_100%,42%_100%)]"
          />
          <div className="container-page py-16 md:py-28">
            <div data-enter>
              <Eyebrow className="mb-4">Collection personnelle</Eyebrow>
            </div>
            <p data-enter className="text-display text-[clamp(2.75rem,1.6rem+4vw,5.5rem)]">
              Ma Cave <span className="text-wine-red">à vin</span>
            </p>
            <div data-enter className="mt-8">
              <Link href="/wines/add" className="btn btn-primary btn-lg">
                <Plus />
                Ajouter un premier vin
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── La cave en chiffres ─────────────────────────────────────────── */}
      <section className="container-page pt-6 md:pt-8" aria-label="La cave en chiffres" data-reveal>
        <StatsRow stats={stats} />
      </section>

      <div className="container-page space-y-16 py-14 md:space-y-20 md:py-16">
        {premiumTotal > 0 && (
          <PremiumCarousel initialWines={premiumWines} total={premiumTotal} />
        )}

        <section data-reveal aria-labelledby="stats-title">
          <SectionHeader id="stats-title" eyebrow="Statistiques" title="Répartition de la cave" />
          <CellarCharts byColor={byColor} topRegions={topRegions} />
        </section>

        {(frenchMarkers.length > 0 || foreignWines.length > 0) && (
          <section data-reveal aria-labelledby="map-title">
            <SectionHeader id="map-title" eyebrow="Origine" title="Carte des appellations" />
            <FranceWineMap markers={frenchMarkers} foreignWines={foreignWines} />
          </section>
        )}

        {winesWithMaturity.some((wine) => wine.phase) && (
          <section aria-labelledby="moments-title">
            <div data-reveal>
              <SectionHeader
                id="moments-title"
                eyebrow="Maturité"
                title="Les moments de la cave"
                lead="Les bouteilles classées selon leur fenêtre de dégustation."
                actions={
                  <Link href="/maturity" className="btn btn-secondary btn-sm">
                    Maturité en détail
                    <ArrowRight />
                  </Link>
                }
              />
            </div>
            <MaturityPhaseCarousels wines={winesWithMaturity.flatMap((wine) => wine.phase && wine.effectiveDrinkFrom && wine.effectiveDrinkUntil ? [{ wineId: wine.wineId, name: wine.name, vintage: wine.vintage, imageUrl: wine.imageUrl, color: wine.color, from: wine.effectiveDrinkFrom, until: wine.effectiveDrinkUntil, quantity: wine.quantity, phase: wine.phase }] : [])} />
          </section>
        )}
      </div>
    </div>
  );
}
