export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
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
    <div>
      <PageHeader
        eyebrow="Visualisation"
        title="La cave"
        lead="Le plan et la vue 3D pour retrouver chaque bouteille, casier par casier."
        stats={[
          { value: allRacks.length, label: "Casier" + (allRacks.length > 1 ? "s" : "") },
          { value: totalBottles, label: "Bouteilles rangées" },
          { value: `${occupancyPct} %`, label: "Taux d'occupation" },
          ...(unrackedCount > 0
            ? [{ value: unrackedCount, label: "À ranger" }]
            : [{ value: totalCapacity, label: "Capacité totale" }]),
        ]}
      />

      <div className="container-page py-6 md:py-10">
        <CaveInteractive racks={racks} unracked={unracked} />
      </div>
    </div>
  );
}
