import { prisma } from "@/lib/db";
import Link from "next/link";

// ─── Rack config ──────────────────────────────────────────────────────────────
// levels: top → bottom
// front = nb colonnes P1 (rangée avant)
// back  = nb colonnes P2 (rangée arrière), 0 = pas de P2 sur ce niveau

type LevelConfig = { front: number; back: number };
type RackConfig  = { levels: LevelConfig[] };

const RACK_CONFIGS: Record<string, RackConfig> = {
  "1A": {
    levels: [
      { front: 4, back: 0 }, // P1×2 niveaux, P2×1 niveau
      { front: 4, back: 4 },
    ],
  },
  "2A": {
    levels: [
      { front: 4, back: 4 }, // P1×3, P2×3
      { front: 4, back: 4 },
      { front: 4, back: 4 },
    ],
  },
  "3A": {
    levels: [
      { front: 4, back: 4 }, // P1×3, P2×3
      { front: 4, back: 4 },
      { front: 4, back: 4 },
    ],
  },
  "4A": {
    levels: [
      { front: 4, back: 4 }, // P1×3, P2×3
      { front: 4, back: 4 },
      { front: 4, back: 4 },
    ],
  },
  "5A": {
    levels: [
      { front: 6, back: 0 }, // P1×4 (6 col), pas de P2
      { front: 6, back: 0 },
      { front: 6, back: 0 },
      { front: 6, back: 0 },
    ],
  },
};

function defaultConfig(bottleCount: number): RackConfig {
  const numLevels = Math.max(2, Math.ceil(bottleCount / 8));
  return { levels: Array.from({ length: numLevels }, () => ({ front: 4, back: 4 })) };
}

// Distribute bottles sequentially through the config (top level first)
function distribute(bottles: WineRef[], config: RackConfig) {
  let i = 0;
  return config.levels.map(({ front, back }) => {
    const f = bottles.slice(i, i + front); i += front;
    const b = bottles.slice(i, i + back);  i += back;
    return { front: f, back: b, frontCols: front, backCols: back };
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SLOT_FRONT = 40;
const SLOT_BACK  = 30;

const BOTTLE: Record<string, { base: string; hi: string }> = {
  rouge: { base: "#8b2030", hi: "#c05060" },
  blanc: { base: "#9a8420", hi: "#d4b840" },
  rosé:  { base: "#be5a6a", hi: "#e08898" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type WineRef = {
  id: string;
  name: string;
  color: string | null;
  vintage: number | null;
  quantity: number;
  appellation: string | null;
  region: string | null;
};

function expand(wines: WineRef[]): WineRef[] {
  const out: WineRef[] = [];
  for (const w of wines) for (let i = 0; i < w.quantity; i++) out.push(w);
  return out;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CavePage() {
  const allRacks = await prisma.rack.findMany({
    include: { wines: { orderBy: [{ rackRow: "asc" }, { rackCol: "asc" }] } },
    orderBy: { name: "asc" },
  });

  const totalBottles = allRacks.flatMap((r) => r.wines).reduce((s, w) => s + w.quantity, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Ma Cave
            </h1>
            <p className="text-sm opacity-40" style={{ fontFamily: "var(--font-inter)" }}>
              {allRacks.length} casiers · {totalBottles} bouteilles
            </p>
          </div>
          <Link href="/wines/add" className="px-5 py-2.5 rounded-full text-sm self-start"
            style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}>
            + Ajouter un vin
          </Link>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-8 text-xs opacity-50" style={{ fontFamily: "var(--font-inter)" }}>
          {Object.entries(BOTTLE).map(([key, c]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 10, height: 10, background: c.base }} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-dashed" style={{ width: 10, height: 10, borderColor: "#444" }} />
            <span>Vide</span>
          </div>
        </div>

        {/* Racks */}
        <div className="space-y-6">
          {allRacks.map((rack) => {
            const bottles = expand(rack.wines);
            const config  = RACK_CONFIGS[rack.name] ?? defaultConfig(bottles.length);
            const levels  = distribute(bottles, config);
            const totalSlots = config.levels.reduce((s, l) => s + l.front + l.back, 0);

            return (
              <div key={rack.id} className="rounded-2xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  <div className="flex items-center gap-3">
                    <span className="font-bold px-3 py-1 rounded-lg text-sm"
                      style={{ background: "#c07840", color: "#fff", fontFamily: "var(--font-inter)", letterSpacing: "0.05em" }}>
                      {rack.name}
                    </span>
                    <span className="text-xs opacity-35" style={{ fontFamily: "var(--font-inter)" }}>
                      {bottles.length} / {totalSlots} bouteilles
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1">
                  {levels.map((lv, i) => (
                    <div key={i}>
                      <ShelfLevel
                        front={lv.front}
                        back={lv.back}
                        frontCols={lv.frontCols}
                        backCols={lv.backCols}
                        label={`Étagère ${levels.length - i}`}
                      />
                      <Plank />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function Plank() {
  return (
    <div className="h-2.5 rounded mx-1"
      style={{ background: "linear-gradient(90deg, #7a5020, #c8954a 25%, #d4a055 50%, #c8954a 75%, #7a5020)" }} />
  );
}

function ShelfLevel({ front, back, frontCols, backCols, label }: {
  front: WineRef[]; back: WineRef[];
  frontCols: number; backCols: number;
  label: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden mb-0.5"
      style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <p className="text-center opacity-20 pt-1.5" style={{ fontFamily: "var(--font-inter)", fontSize: "9px", letterSpacing: "0.1em" }}>
        {label.toUpperCase()}
      </p>

      {/* Back row — only if backCols > 0 */}
      {backCols > 0 && (
        <div className="px-4 pt-2 pb-1">
          <p className="opacity-15 mb-1.5" style={{ fontFamily: "var(--font-inter)", fontSize: "8px" }}>arrière (P2)</p>
          <div className="flex gap-2">
            {Array.from({ length: backCols }, (_, i) => (
              <Slot key={i} wine={back[i] ?? null} size={SLOT_BACK} dim />
            ))}
          </div>
        </div>
      )}

      {/* Front row */}
      <div className="px-4 pt-1 pb-3">
        <p className="opacity-15 mb-1.5" style={{ fontFamily: "var(--font-inter)", fontSize: "8px" }}>
          avant (P1)
        </p>
        <div className="flex gap-2">
          {Array.from({ length: frontCols }, (_, i) => (
            <Slot key={i} wine={front[i] ?? null} size={SLOT_FRONT} dim={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Slot({ wine, size, dim }: { wine: WineRef | null; size: number; dim: boolean }) {
  if (!wine) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * 0.72, height: size * 0.72, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.08)" }} />
      </div>
    );
  }

  const c = BOTTLE[wine.color ?? ""] ?? { base: "#555", hi: "#888" };
  const info = [wine.vintage, wine.appellation ?? wine.region].filter(Boolean).join(" · ");

  return (
    <div className="group relative" style={{ width: size, height: size, flexShrink: 0, opacity: dim ? 0.6 : 1 }}>
      <Link href={`/wines/${wine.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 32%, ${c.hi}cc, ${c.base}ee 55%, ${c.base})`,
          boxShadow: `0 2px 6px ${c.base}44, inset 0 1px 2px rgba(255,255,255,0.16)`,
          position: "relative", transition: "transform 0.12s",
        }} className="group-hover:scale-110">
          <div style={{
            position: "absolute", top: "15%", left: "20%", width: "27%", height: "17%",
            borderRadius: "50%", background: "rgba(255,255,255,0.35)", transform: "rotate(-30deg)",
          }} />
        </div>
      </Link>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
        style={{ width: 200 }}>
        <div className="rounded-xl p-3 text-center shadow-2xl"
          style={{ background: "#1a0e10", border: "1px solid rgba(201,169,110,0.3)" }}>
          <p className="text-xs font-semibold leading-snug" style={{ fontFamily: "var(--font-playfair)", color: "#fff" }}>
            {wine.name}
          </p>
          {info && <p className="text-xs opacity-45 mt-1" style={{ fontFamily: "var(--font-inter)" }}>{info}</p>}
        </div>
      </div>
    </div>
  );
}
