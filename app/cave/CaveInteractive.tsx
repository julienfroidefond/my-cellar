"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WineRef = {
  id: string;
  name: string;
  color: string | null;
  vintage: number | null;
  quantity: number;
  totalInCellar: number;
  appellation: string | null;
  region: string | null;
  rackId: string | null;
  rackRow: number | null;
  rackCol: number | null;
};

export type LevelConfig = { front: number; back: number };
export type RackConfig  = { levels: LevelConfig[] };
export type RackData    = {
  id: string;
  name: string;
  wines: WineRef[];
  config: RackConfig;
  numCols: number; // colonnes par rangée DB (4 ou 6)
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_FRONT = 44;
const SLOT_BACK  = 34;

const BOTTLE: Record<string, { base: string; hi: string; label: string }> = {
  rouge: { base: "#962030", hi: "#d05870", label: "Rouge" },
  blanc: { base: "#a89010", hi: "#dcc030", label: "Blanc" },
  rosé:  { base: "#c45070", hi: "#e88098", label: "Rosé" },
};

// ─── Slot map ─────────────────────────────────────────────────────────────────
// Construit un tableau [slotIndex → WineRef|null] en se basant sur rackRow/rackCol.
// Les vins sans position sont ignorés (ils sont dans "À ranger").

function buildSlotMap(wines: WineRef[], config: RackConfig, numCols: number): (WineRef | null)[] {
  const totalSlots = config.levels.reduce((s, l) => s + l.front + l.back, 0);
  const map: (WineRef | null)[] = new Array(totalSlots).fill(null);

  for (const wine of wines) {
    if (wine.rackRow == null || wine.rackCol == null) continue;
    const startSlot = wine.rackRow * numCols + wine.rackCol;
    for (let j = 0; j < wine.quantity; j++) {
      const s = startSlot + j;
      if (s < totalSlots) map[s] = wine;
    }
  }

  return map;
}

// Calcule les niveaux avec leur slotIndex absolu (pas de distribution séquentielle)
function buildLevels(slotMap: (WineRef | null)[], config: RackConfig) {
  let offset = 0;
  return config.levels.map(({ front, back }, levelIdx) => {
    const frontSlots = Array.from({ length: front }, (_, i) => ({
      wine: slotMap[offset + i] ?? null,
      slotIndex: offset + i,
    }));
    offset += front;
    const backSlots = Array.from({ length: back }, (_, i) => ({
      wine: slotMap[offset + i] ?? null,
      slotIndex: offset + i,
    }));
    offset += back;
    return { frontSlots, backSlots, levelIdx };
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CaveInteractive({
  racks,
  unracked,
}: {
  racks: RackData[];
  unracked: WineRef[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [placing, setPlacing] = useState<WineRef | null>(null);
  const [selected, setSelected] = useState<WineRef | null>(null);
  const [pending, setPending] = useState<"drink" | "unrack" | "delete" | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function openBottle(wine: WineRef) {
    setSelected(wine);
    setPending(null);
  }

  async function confirmDrink() {
    if (!selected) return;
    setPending("drink");
    await fetch(`/api/wines/${selected.id}/drink`, { method: "POST" });
    setSelected(null);
    setPending(null);
    refresh();
  }

  async function confirmUnrack() {
    if (!selected) return;
    setPending("unrack");
    await fetch(`/api/wines/${selected.id}/unrack`, { method: "POST" });
    setSelected(null);
    setPending(null);
    refresh();
  }

  async function confirmDelete() {
    if (!selected) return;
    setPending("delete");
    await fetch(`/api/wines/${selected.id}`, { method: "DELETE" });
    setSelected(null);
    setPending(null);
    refresh();
  }

  async function placeWine(wine: WineRef, rackId: string, slotIndex: number, numCols: number) {
    const rackRow = Math.floor(slotIndex / numCols);
    const rackCol = slotIndex % numCols;
    await fetch(`/api/wines/${wine.id}/rack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rackId, rackRow, rackCol }),
    });
    setPlacing(null);
    refresh();
  }

  return (
    <div>
      {/* Mode banner */}
      {placing && (
        <div
          className="flex items-center justify-between px-5 py-3.5 rounded-xl mb-5"
          style={{ background: "rgba(196,152,60,0.10)", border: "1px solid rgba(196,152,60,0.38)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--gold)" }}>
              Ranger — {placing.name}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Clique sur un emplacement vide
            </p>
          </div>
          <button
            onClick={() => setPlacing(null)}
            className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-100"
            style={{ fontFamily: "var(--font-inter)", border: "1px solid rgba(255,255,255,0.22)", color: "var(--text-muted)" }}
          >
            Annuler
          </button>
        </div>
      )}

      {/* Racks */}
      <div className="space-y-5">
        {racks.map((rack) => {
          const slotMap = buildSlotMap(rack.wines, rack.config, rack.numCols);
          const levels  = buildLevels(slotMap, rack.config);
          const totalSlots  = rack.config.levels.reduce((s, l) => s + l.front + l.back, 0);
          const filledSlots = slotMap.filter(Boolean).length;
          const fillPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

          return (
            <div
              key={rack.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: "var(--surface)",
                border: placing
                  ? "1px solid rgba(196,152,60,0.38)"
                  : "1px solid var(--border)",
              }}
            >
              <div
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
              >
                <span
                  className="font-bold px-3 py-1 rounded-lg text-sm tracking-wide"
                  style={{ background: "#a05828", color: "#fff", fontFamily: "var(--font-inter)" }}
                >
                  {rack.name}
                </span>
                <span className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {filledSlots} / {totalSlots}
                </span>
                <div className="flex-1 h-1 rounded-full ml-1" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${fillPct}%`, background: "var(--wine-red)" }}
                  />
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                {levels.map((lv, i) => (
                  <div key={i}>
                    <ShelfLevel
                      frontSlots={lv.frontSlots}
                      backSlots={lv.backSlots}
                      label={`Étagère ${levels.length - i}`}
                      onSelect={openBottle}
                      selectedId={selected?.id ?? null}
                      placing={placing}
                      rackId={rack.id}
                      numCols={rack.numCols}
                      onPlace={placeWine}
                    />
                    <Plank />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vins à ranger */}
      {unracked.length > 0 && (
        <div className="mt-10">
          <div className="mb-5">
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--gold)", fontWeight: 500 }}>
              Non rangés
            </p>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
              À ranger
            </h2>
            <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              {unracked.reduce((s, w) => s + w.quantity, 0)} bouteille{unracked.reduce((s, w) => s + w.quantity, 0) > 1 ? "s" : ""} sans emplacement
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unracked.map((wine) => {
              const c = BOTTLE[wine.color ?? ""] ?? { base: "#555", hi: "#888", label: "" };
              return (
                <div
                  key={wine.id}
                  className="flex items-center gap-4 rounded-xl p-3.5"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="rounded-full shrink-0"
                    style={{
                      width: 40, height: 40,
                      background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`,
                      boxShadow: `0 2px 10px ${c.base}55`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-playfair)" }}>
                      {wine.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                      {wine.vintage ? `${wine.vintage} · ` : ""}{wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/wines/${wine.id}`}
                      className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                      style={{ fontFamily: "var(--font-inter)", border: "1px solid rgba(255,255,255,0.18)", color: "var(--text-muted)" }}
                    >
                      Voir
                    </Link>
                    <button
                      onClick={() => setPlacing(wine)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-90"
                      style={{
                        fontFamily: "var(--font-inter)",
                        background: placing?.id === wine.id ? "var(--gold)" : "rgba(196,152,60,0.18)",
                        color: placing?.id === wine.id ? "#fff" : "var(--gold)",
                        border: "1px solid rgba(196,152,60,0.35)",
                        fontWeight: 500,
                      }}
                    >
                      {placing?.id === wine.id ? "En cours…" : "Ranger"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Wine detail modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "#160d10", border: "1px solid rgba(196,152,60,0.24)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const c = BOTTLE[selected.color ?? ""] ?? { base: "#333", hi: "#555", label: selected.color ?? "" };
              return (
                <>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${c.base}, ${c.hi} 50%, ${c.base})` }} />
                  <div className="px-6 pt-6 pb-5">
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className="shrink-0 rounded-full"
                        style={{
                          width: 56, height: 56,
                          background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`,
                          boxShadow: `0 4px 20px ${c.base}70`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-bold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
                          {selected.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {selected.vintage && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.09)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                              {selected.vintage}
                            </span>
                          )}
                          {selected.color && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: `${c.base}28`, color: c.hi, fontFamily: "var(--font-inter)" }}>
                              {c.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelected(null)}
                        className="shrink-0 transition-opacity hover:opacity-80 text-lg leading-none"
                        style={{ marginTop: 4, color: "var(--text-faint)" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {selected.appellation && (
                        <Detail label="Appellation" value={selected.appellation} />
                      )}
                      {selected.region && (
                        <Detail label="Région" value={selected.region} />
                      )}
                      <Detail
                        label="En cave"
                        value={`${selected.totalInCellar} bouteille${selected.totalInCellar > 1 ? "s" : ""}`}
                      />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <Link
                        href={`/wines/${selected.id}`}
                        className="flex items-center justify-center py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ fontFamily: "var(--font-inter)", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                        onClick={() => setSelected(null)}
                      >
                        Voir la fiche complète
                      </Link>
                      <button
                        onClick={confirmDrink}
                        disabled={!!pending}
                        className="flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ fontFamily: "var(--font-inter)", background: "var(--wine-red)", color: "#fff" }}
                      >
                        {pending === "drink" ? "En cours…" : "🍷 Boire une bouteille"}
                      </button>
                      {selected.rackId && (
                        <button
                          onClick={confirmUnrack}
                          disabled={!!pending}
                          className="flex items-center justify-center py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ fontFamily: "var(--font-inter)", background: "rgba(196,152,60,0.12)", color: "var(--gold)", border: "1px solid rgba(196,152,60,0.28)" }}
                        >
                          {pending === "unrack" ? "En cours…" : "↩ Retirer de la cave"}
                        </button>
                      )}
                      <button
                        onClick={confirmDelete}
                        disabled={!!pending}
                        className="flex items-center justify-center py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ fontFamily: "var(--font-inter)", background: "rgba(255,255,255,0.03)", color: "rgba(255,80,80,0.78)", border: "1px solid rgba(255,80,80,0.18)" }}
                      >
                        {pending === "delete" ? "En cours…" : "🗑 Retirer du stock"}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shelf helpers ────────────────────────────────────────────────────────────

function Plank() {
  return (
    <div
      className="h-2.5 rounded mx-1"
      style={{
        background: "linear-gradient(90deg, #6a3e18 0%, #a86828 20%, #cc8840 50%, #a86828 80%, #6a3e18 100%)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.45)",
      }}
    />
  );
}

type SlotEntry = { wine: WineRef | null; slotIndex: number };

function ShelfLevel({
  frontSlots, backSlots, label, onSelect, selectedId, placing, rackId, numCols, onPlace,
}: {
  frontSlots: SlotEntry[];
  backSlots: SlotEntry[];
  label: string;
  onSelect: (w: WineRef) => void;
  selectedId: string | null;
  placing: WineRef | null;
  rackId: string;
  numCols: number;
  onPlace: (w: WineRef, rackId: string, slotIndex: number, numCols: number) => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden mb-0.5"
      style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.055)" }}
    >
      <p
        className="text-center pt-1.5"
        style={{ fontFamily: "var(--font-inter)", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.30)" }}
      >
        {label.toUpperCase()}
      </p>
      {backSlots.length > 0 && (
        <div className="px-4 pt-2 pb-1">
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "8px", color: "rgba(255,255,255,0.28)", marginBottom: 6 }}>arrière (P2)</p>
          <div className="flex gap-2">
            {backSlots.map(({ wine, slotIndex }) => (
              <Slot
                key={slotIndex}
                wine={wine}
                size={SLOT_BACK}
                dim
                onSelect={onSelect}
                isSelected={wine?.id === selectedId}
                onEmptyClick={!wine && placing ? () => onPlace(placing, rackId, slotIndex, numCols) : null}
              />
            ))}
          </div>
        </div>
      )}
      <div className="px-4 pt-1 pb-3">
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "8px", color: "rgba(255,255,255,0.28)", marginBottom: 6 }}>avant (P1)</p>
        <div className="flex gap-2">
          {frontSlots.map(({ wine, slotIndex }) => (
            <Slot
              key={slotIndex}
              wine={wine}
              size={SLOT_FRONT}
              dim={false}
              onSelect={onSelect}
              isSelected={wine?.id === selectedId}
              onEmptyClick={!wine && placing ? () => onPlace(placing, rackId, slotIndex, numCols) : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slot ─────────────────────────────────────────────────────────────────────

function Slot({
  wine, size, dim, onSelect, isSelected, onEmptyClick,
}: {
  wine: WineRef | null;
  size: number;
  dim: boolean;
  onSelect: (w: WineRef) => void;
  isSelected: boolean;
  onEmptyClick: (() => void) | null;
}) {
  if (!wine) {
    if (onEmptyClick) {
      return (
        <button
          onClick={onEmptyClick}
          style={{ width: size, height: size, flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
          className="hover:scale-110 active:scale-95 transition-transform"
        >
          <div style={{
            width: size * 0.82, height: size * 0.82, borderRadius: "50%",
            border: "1.5px dashed rgba(201,169,110,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(201,169,110,0.6)", fontSize: size * 0.38, lineHeight: 1,
            background: "rgba(201,169,110,0.06)",
          }}>
            +
          </div>
        </button>
      );
    }
    return (
      <div style={{ width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * 0.72, height: size * 0.72, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.08)" }} />
      </div>
    );
  }

  const c = BOTTLE[wine.color ?? ""] ?? { base: "#555", hi: "#888", label: "" };

  return (
    <button
      onClick={() => onSelect(wine)}
      style={{
        width: size, height: size, flexShrink: 0,
        opacity: dim ? 0.65 : 1,
        borderRadius: "50%",
        position: "relative",
      }}
      className="hover:scale-110 active:scale-95 transition-transform"
    >
      <div style={{
        width: "100%", height: "100%", borderRadius: "50%",
        background: `radial-gradient(circle at 35% 32%, ${c.hi}cc, ${c.base}ee 55%, ${c.base})`,
        boxShadow: isSelected
          ? `0 0 0 2.5px #c9a96e, 0 4px 12px ${c.base}88`
          : `0 2px 6px ${c.base}44, inset 0 1px 2px rgba(255,255,255,0.16)`,
        transition: "box-shadow 0.15s",
      }}>
        <div style={{
          position: "absolute", top: "15%", left: "20%", width: "27%", height: "17%",
          borderRadius: "50%", background: "rgba(255,255,255,0.35)", transform: "rotate(-30deg)",
        }} />
      </div>
    </button>
  );
}

// ─── Detail cell ─────────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
      <p className="text-xs opacity-35 mb-0.5" style={{ fontFamily: "var(--font-inter)" }}>{label}</p>
      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-playfair)" }}>{value}</p>
    </div>
  );
}
