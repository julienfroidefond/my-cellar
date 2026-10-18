export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import CaveInteractive, { type RackData, type RackConfig } from "./CaveInteractive";

// ─── Rack configs ─────────────────────────────────────────────────────────────
// levels: top → bottom  |  front = colonnes P1  |  back = colonnes P2

const RACK_CONFIGS: Record<string, RackConfig> = {
  "1A": {
    levels: [
      { front: 4, back: 0 },
      { front: 4, back: 4 },
    ],
  },
  "2A": {
    levels: [
      { front: 4, back: 4 },
      { front: 4, back: 4 },
      { front: 4, back: 4 },
    ],
  },
  "3A": {
    levels: [
      { front: 4, back: 4 },
      { front: 4, back: 4 },
      { front: 4, back: 4 },
    ],
  },
  "4A": {
    levels: [
      { front: 4, back: 4 },
      { front: 4, back: 4 },
      { front: 4, back: 4 },
    ],
  },
  "5A": {
    levels: [
      { front: 6, back: 0 },
      { front: 6, back: 0 },
      { front: 6, back: 0 },
      { front: 6, back: 0 },
    ],
  },
};

function numColsForConfig(config: RackConfig): number {
  return Math.max(...config.levels.map((l) => Math.max(l.front, l.back)));
}

function defaultConfig(): RackConfig {
  return { levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }] };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CavePage() {
  const [allRacks, allVintages] = await Promise.all([
    prisma.rack.findMany({
      include: {
        slots: {
          include: { vintage: { include: { wine: true } } },
          orderBy: [{ rackRow: "asc" }, { rackCol: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.wineVintage.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        wine: true,
        slots: { select: { quantity: true } },
      },
      orderBy: [{ wine: { color: "asc" } }, { wine: { name: "asc" } }],
    }),
  ]);

  // For each vintage, compute total bottles physically placed in racks
  function rackedTotal(v: (typeof allVintages)[number]): number {
    return v.slots.reduce((s, slot) => s + slot.quantity, 0);
  }

  // Vintages with at least one bottle not yet in a rack slot
  const unrackedVintages = allVintages.filter((v) => v.quantity > rackedTotal(v));

  const totalBottles = allRacks
    .flatMap((r) => r.slots)
    .reduce((s, slot) => s + slot.quantity, 0);

  const totalCapacity = allRacks.reduce((sum, rack) => {
    const config = RACK_CONFIGS[rack.name] ?? defaultConfig();
    return sum + config.levels.reduce((s, l) => s + l.front + l.back, 0);
  }, 0);
  const occupancyPct = totalCapacity > 0 ? Math.round((totalBottles / totalCapacity) * 100) : 0;
  const unrackedCount = unrackedVintages.reduce((s, v) => s + (v.quantity - rackedTotal(v)), 0);

  const racks: RackData[] = allRacks.map((rack) => {
    const config = RACK_CONFIGS[rack.name] ?? defaultConfig();
    return {
      id: rack.id,
      name: rack.name,
      config,
      numCols: numColsForConfig(config),
      wines: rack.slots.map((slot) => ({
        id: slot.id,
        vintageId: slot.vintageId,
        wineId: slot.vintage.wine.id,
        name: slot.vintage.wine.name,
        producer: slot.vintage.wine.producer,
        color: slot.vintage.wine.color,
        vintage: slot.vintage.vintage,
        quantity: slot.quantity,
        totalInCellar: slot.vintage.quantity,
        appellation: slot.vintage.wine.appellation,
        region: slot.vintage.wine.region,
        imageUrl: slot.vintage.wine.imageUrl,
        rackId: slot.rackId,
        rackRow: slot.rackRow,
        rackCol: slot.rackCol,
      })),
    };
  });

  const unracked = unrackedVintages.map((v) => ({
    id: v.id,
    vintageId: v.id,
    wineId: v.wine.id,
    name: v.wine.name,
    producer: v.wine.producer,
    color: v.wine.color,
    vintage: v.vintage,
    quantity: v.quantity - rackedTotal(v),
    totalInCellar: v.quantity,
    appellation: v.wine.appellation,
    region: v.wine.region,
    imageUrl: v.wine.imageUrl,
    rackId: null,
    rackRow: null,
    rackCol: null,
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="diagonal-stripe relative overflow-hidden" style={{ minHeight: 480, background: "var(--background)" }}>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 md:py-24">
          <p
            className="animate-fade-up text-xs tracking-[0.45em] uppercase mb-5 font-semibold"
            style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}
          >
            Visualisation
          </p>
          <h1
            className="animate-fade-up-1 text-6xl md:text-8xl font-bold leading-none mb-4"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
          >
            Ma Cave<br />
            <span style={{ color: "var(--wine-red)" }}>à Vin</span>
          </h1>

          <div className="animate-fade-up-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl">
            {[
              { value: allRacks.length, label: "Casier" + (allRacks.length > 1 ? "s" : "") },
              { value: totalBottles, label: "Bouteilles rangées" },
              { value: `${occupancyPct} %`, label: "Taux d'occupation" },
              ...(unrackedCount > 0
                ? [{ value: unrackedCount, label: "À ranger" }]
                : [{ value: totalCapacity, label: "Capacité totale" }]),
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 12px rgba(26,10,14,0.07)",
                }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-wider uppercase"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-fade-up-3 max-w-3xl mx-auto px-6 pb-12">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-8 text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
          {[
            { key: "rouge", color: "#c02030" },
            { key: "blanc", color: "#c4983c" },
            { key: "rosé",  color: "#d4647a" },
          ].map(({ key, color }) => (
            <div key={key} className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 10, height: 10, background: color, boxShadow: `0 0 6px ${color}80` }} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-dashed" style={{ width: 10, height: 10, borderColor: "rgba(26,10,14,0.30)" }} />
            <span>Vide</span>
          </div>
        </div>

        <CaveInteractive racks={racks} unracked={unracked} />
      </div>
    </div>
  );
}
