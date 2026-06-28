"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShelfLevel, Plank } from "./ShelfLevel";
import { WineDetailModal } from "./WineDetailModal";
import { SlotPickerModal } from "./SlotPickerModal";
import { BOTTLE } from "./constants";

// Re-export types so page.tsx can keep its current import path
export type { WineRef, LevelConfig, RackConfig, RackData } from "./types";
import type { WineRef, RackData } from "./types";

// ─── Slot map helpers ─────────────────────────────────────────────────────────

function buildSlotMap(wines: WineRef[], config: RackData["config"], numCols: number): (WineRef | null)[] {
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

function buildLevels(slotMap: (WineRef | null)[], config: RackData["config"]) {
  let offset = 0;
  return config.levels.map(({ front, back }) => {
    const frontSlots = Array.from({ length: front }, (_, i) => ({ wine: slotMap[offset + i] ?? null, slotIndex: offset + i }));
    offset += front;
    const backSlots = Array.from({ length: back }, (_, i) => ({ wine: slotMap[offset + i] ?? null, slotIndex: offset + i }));
    offset += back;
    return { frontSlots, backSlots };
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

type TargetSlot = { rackId: string; rackName: string; slotIndex: number; numCols: number };

export default function CaveInteractive({ racks, unracked }: { racks: RackData[]; unracked: WineRef[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [placing, setPlacing] = useState<WineRef | null>(null);
  const [selected, setSelected] = useState<WineRef | null>(null);
  const [pending, setPending] = useState<"drink" | "unrack" | "delete" | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [targetSlot, setTargetSlot] = useState<TargetSlot | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  async function confirmDrink() {
    if (!selected) return;
    setPending("drink");
    await fetch(`/api/wines/${selected.id}/drink`, { method: "POST" });
    setSelected(null); setPending(null); refresh();
  }

  async function confirmUnrack() {
    if (!selected) return;
    setPending("unrack");
    await fetch(`/api/wines/${selected.id}/unrack`, { method: "POST" });
    setSelected(null); setPending(null); refresh();
  }

  async function confirmDelete() {
    if (!selected) return;
    setPending("delete");
    await fetch(`/api/wines/${selected.id}`, { method: "DELETE" });
    setSelected(null); setPending(null); refresh();
  }

  async function placeWine(wine: WineRef, rackId: string, slotIndex: number, numCols: number) {
    const rackRow = Math.floor(slotIndex / numCols);
    const rackCol = slotIndex % numCols;
    await fetch(`/api/wines/${wine.id}/rack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rackId, rackRow, rackCol }),
    });
    setPlacing(null); setTargetSlot(null); refresh();
  }

  return (
    <div>
      {/* Placement mode banner */}
      {placing && (
        <div
          className="flex items-center justify-between px-5 py-3.5 rounded-xl mb-5"
          style={{ background: "rgba(192,25,59,0.07)", border: "1px solid rgba(192,25,59,0.30)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
              Ranger — {placing.name}
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Clique sur un emplacement vide
            </p>
          </div>
          <button
            onClick={() => setPlacing(null)}
            className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-100"
            style={{ fontFamily: "var(--font-inter)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Annuler
          </button>
        </div>
      )}

      {/* Toggle labels */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowLabels((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            fontFamily: "var(--font-inter)",
            background: showLabels ? "rgba(192,25,59,0.08)" : "rgba(26,10,14,0.04)",
            border: showLabels ? "1px solid rgba(192,25,59,0.30)" : "1px solid var(--border)",
            color: showLabels ? "var(--wine-red)" : "var(--text-muted)",
          }}
        >
          <span style={{ fontSize: 11 }}>{showLabels ? "◉" : "○"}</span>
          {showLabels ? "Masquer les étiquettes" : "Afficher les étiquettes"}
        </button>
      </div>

      {/* Racks */}
      <div className="space-y-5">
        {racks.map((rack) => {
          const slotMap = buildSlotMap(rack.wines, rack.config, rack.numCols);
          const levels = buildLevels(slotMap, rack.config);
          const totalSlots = rack.config.levels.reduce((s, l) => s + l.front + l.back, 0);
          const filledSlots = slotMap.filter(Boolean).length;
          const fillPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

          const handleEmpty: ((slotIndex: number) => void) | null =
            (placing || unracked.length > 0)
              ? (slotIndex) => {
                  if (placing) {
                    placeWine(placing, rack.id, slotIndex, rack.numCols);
                  } else {
                    setTargetSlot({ rackId: rack.id, rackName: rack.name, slotIndex, numCols: rack.numCols });
                  }
                }
              : null;

          return (
            <div
              key={rack.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: "var(--surface)",
                border: (placing || targetSlot?.rackId === rack.id)
                  ? "1px solid rgba(192,25,59,0.35)"
                  : "1px solid var(--border)",
              }}
            >
              <div
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
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
                <div className="flex-1 h-1 rounded-full ml-1" style={{ background: "rgba(26,10,14,0.08)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, background: "var(--wine-red)" }} />
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                {levels.map((lv, i) => (
                  <div key={i}>
                    <ShelfLevel
                      frontSlots={lv.frontSlots}
                      backSlots={lv.backSlots}
                      label={`Étagère ${levels.length - i}`}
                      onSelect={(w) => { setSelected(w); setPending(null); }}
                      selectedId={selected?.id ?? null}
                      onEmptyClick={handleEmpty}
                      labelMode={showLabels}
                    />
                    <Plank />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* À ranger */}
      {unracked.length > 0 && (
        <div className="mt-10">
          <div className="mb-5">
            <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 500 }}>
              Non rangés
            </p>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>À ranger</h2>
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
                  {wine.imageUrl ? (
                    <div className="rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ width: 40, height: 40, background: `${c.base}33` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={wine.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div
                      className="rounded-full shrink-0"
                      style={{ width: 40, height: 40, background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`, boxShadow: `0 2px 10px ${c.base}55` }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-playfair)" }}>{wine.name}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                      {wine.vintage ? `${wine.vintage} · ` : ""}{wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/wines/${wine.id}`}
                      className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                      style={{ fontFamily: "var(--font-inter)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    >
                      Voir
                    </Link>
                    <button
                      onClick={() => setPlacing(wine)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-90"
                      style={{
                        fontFamily: "var(--font-inter)",
                        background: placing?.id === wine.id ? "var(--wine-red)" : "rgba(192,25,59,0.08)",
                        color: placing?.id === wine.id ? "#fff" : "var(--wine-red)",
                        border: "1px solid rgba(192,25,59,0.30)",
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

      {/* Modals */}
      {selected && (
        <WineDetailModal
          wine={selected}
          pending={pending}
          onClose={() => setSelected(null)}
          onDrink={confirmDrink}
          onUnrack={confirmUnrack}
          onDelete={confirmDelete}
        />
      )}

      {targetSlot && (
        <SlotPickerModal
          wines={unracked}
          rackName={targetSlot.rackName}
          slotIndex={targetSlot.slotIndex}
          numCols={targetSlot.numCols}
          onPlace={(wine) => placeWine(wine, targetSlot.rackId, targetSlot.slotIndex, targetSlot.numCols)}
          onCancel={() => setTargetSlot(null)}
        />
      )}
    </div>
  );
}
