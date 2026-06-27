import { prisma } from "@/lib/db";
import Link from "next/link";
import CaveInteractive, { type RackData, type LevelConfig, type RackConfig } from "./CaveInteractive";

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
  const [allRacks, unrackedWines, allWinesForTotal] = await Promise.all([
    prisma.rack.findMany({
      include: {
        wines: {
          where: { quantity: { gt: 0 } },
          orderBy: [{ rackRow: "asc" }, { rackCol: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.wine.findMany({
      where: { rackId: null, quantity: { gt: 0 } },
      orderBy: [{ color: "asc" }, { name: "asc" }],
    }),
    prisma.wine.findMany({
      where: { quantity: { gt: 0 } },
      select: { name: true, vintage: true, quantity: true },
    }),
  ]);

  // Totaux par vin (name + vintage) pour afficher le stock réel dans la popup
  const totalByKey = new Map<string, number>();
  for (const w of allWinesForTotal) {
    const k = `${w.name}|${w.vintage ?? ""}`;
    totalByKey.set(k, (totalByKey.get(k) ?? 0) + w.quantity);
  }
  function cellarTotal(name: string, vintage: number | null): number {
    return totalByKey.get(`${name}|${vintage ?? ""}`) ?? 1;
  }

  const totalBottles = allRacks
    .flatMap((r) => r.wines)
    .reduce((s, w) => s + w.quantity, 0);

  const racks: RackData[] = allRacks.map((rack) => {
    const config = RACK_CONFIGS[rack.name] ?? defaultConfig();
    return {
      id: rack.id,
      name: rack.name,
      config,
      numCols: numColsForConfig(config),
      wines: rack.wines.map((w) => ({
        id: w.id,
        name: w.name,
        color: w.color,
        vintage: w.vintage,
        quantity: w.quantity,
        totalInCellar: cellarTotal(w.name, w.vintage),
        appellation: w.appellation,
        region: w.region,
        imageUrl: w.imageUrl,
        rackId: w.rackId,
        rackRow: w.rackRow,
        rackCol: w.rackCol,
      })),
    };
  });

  const unracked = unrackedWines.map((w) => ({
    id: w.id,
    name: w.name,
    color: w.color,
    vintage: w.vintage,
    quantity: w.quantity,
    totalInCellar: cellarTotal(w.name, w.vintage),
    appellation: w.appellation,
    region: w.region,
    imageUrl: w.imageUrl,
    rackId: w.rackId,
    rackRow: w.rackRow,
    rackCol: w.rackCol,
  }));

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header avec image */}
      <div className="relative overflow-hidden" style={{ minHeight: 210 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center 55%",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,8,11,0.78) 0%, rgba(13,8,11,0.88) 60%, var(--background) 100%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p
                className="text-xs tracking-[0.35em] uppercase mb-3"
                style={{ color: "var(--gold)", fontFamily: "var(--font-inter)", fontWeight: 500 }}
              >
                Visualisation
              </p>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                Ma Cave
              </h1>
              <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                {allRacks.length} casier{allRacks.length > 1 ? "s" : ""} · {totalBottles} bouteille{totalBottles > 1 ? "s" : ""}
                {unracked.length > 0 && ` · ${unracked.reduce((s, w) => s + w.quantity, 0)} à ranger`}
              </p>
            </div>
            <Link
              href="/wines/add"
              className="px-5 py-2.5 rounded-full text-sm font-medium self-start transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
            >
              + Ajouter un vin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-12">
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
            <div className="rounded-full border border-dashed" style={{ width: 10, height: 10, borderColor: "rgba(255,255,255,0.3)" }} />
            <span>Vide</span>
          </div>
        </div>

        <CaveInteractive racks={racks} unracked={unracked} />
      </div>
    </div>
  );
}
