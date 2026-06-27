"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { decodeSlot, slotLabel } from "@/lib/rack-configs";

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
  imageUrl: string | null;
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

type TargetSlot = { rackId: string; rackName: string; slotIndex: number; numCols: number };

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
  const [showLabels, setShowLabels] = useState(false);
  const [targetSlot, setTargetSlot] = useState<TargetSlot | null>(null);

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
    setTargetSlot(null);
    refresh();
  }

  return (
    <div>
      {/* Mode banner — only shown when a specific wine is in placement mode */}
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

      {/* Toggle labels */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowLabels((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            fontFamily: "var(--font-inter)",
            background: showLabels ? "rgba(196,152,60,0.18)" : "rgba(255,255,255,0.06)",
            border: showLabels ? "1px solid rgba(196,152,60,0.35)" : "1px solid rgba(255,255,255,0.12)",
            color: showLabels ? "var(--gold)" : "var(--text-muted)",
          }}
        >
          <span style={{ fontSize: 11 }}>{showLabels ? "◉" : "○"}</span>
          {showLabels ? "Masquer les noms" : "Afficher les noms"}
        </button>
      </div>

      {/* Racks */}
      <div className="space-y-5">
        {racks.map((rack) => {
          const slotMap = buildSlotMap(rack.wines, rack.config, rack.numCols);
          const levels  = buildLevels(slotMap, rack.config);
          const totalSlots  = rack.config.levels.reduce((s, l) => s + l.front + l.back, 0);
          const filledSlots = slotMap.filter(Boolean).length;
          const fillPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

          // Clicking an empty slot: direct place if placing-mode, else open picker
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
                  {wine.imageUrl ? (
                    <div className="rounded-full shrink-0 overflow-hidden flex items-center justify-center" style={{ width: 40, height: 40, background: `${c.base}33` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={wine.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div
                      className="rounded-full shrink-0"
                      style={{
                        width: 40, height: 40,
                        background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`,
                        boxShadow: `0 2px 10px ${c.base}55`,
                      }}
                    />
                  )}
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
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: "#130b0e" }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const c = BOTTLE[selected.color ?? ""] ?? { base: "#333", hi: "#555", label: selected.color ?? "" };
              return (
                <>
                  {/* ── Header coloré ── */}
                  <div
                    className="relative px-6 pt-6 pb-8 text-center"
                    style={{
                      background: `linear-gradient(170deg, ${c.base}50 0%, ${c.base}20 60%, transparent 100%)`,
                      borderBottom: `1px solid ${c.base}35`,
                    }}
                  >
                    <button
                      onClick={() => setSelected(null)}
                      className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:opacity-90"
                      style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", fontSize: 14 }}
                    >
                      ✕
                    </button>

                    {selected.imageUrl ? (
                      <div className="mx-auto mb-4" style={{ width: 60, height: 120 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
                        />
                      </div>
                    ) : (
                      <div
                        className="mx-auto mb-4 rounded-full"
                        style={{
                          width: 68, height: 68,
                          background: `radial-gradient(circle at 35% 30%, ${c.hi}ff, ${c.base}ff 60%, ${c.base}cc)`,
                          boxShadow: `0 0 0 6px ${c.base}20, 0 8px 28px ${c.base}60`,
                        }}
                      >
                        <div style={{
                          position: "relative", top: "14%", left: "20%", width: "26%", height: "15%",
                          borderRadius: "50%", background: "rgba(255,255,255,0.42)", transform: "rotate(-30deg)",
                        }} />
                      </div>
                    )}

                    <h2
                      className="text-xl font-bold leading-snug mb-3 px-4"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      {selected.name}
                    </h2>

                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {selected.vintage && (
                        <span
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ background: "rgba(196,152,60,0.18)", color: "var(--gold)", border: "1px solid rgba(196,152,60,0.3)", fontFamily: "var(--font-inter)" }}
                        >
                          {selected.vintage}
                        </span>
                      )}
                      {selected.color && (
                        <span
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ background: `${c.base}30`, color: c.hi, border: `1px solid ${c.base}50`, fontFamily: "var(--font-inter)" }}
                        >
                          {c.label}
                        </span>
                      )}
                      {selected.appellation && (
                        <span
                          className="text-xs px-3 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                        >
                          {selected.appellation}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Infos ── */}
                  <div
                    className="px-6 py-4 flex items-center gap-6"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {selected.region && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Région</p>
                        <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-inter)" }}>{selected.region}</p>
                      </div>
                    )}
                    <div className="shrink-0 text-center">
                      <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>En cave</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--gold)" }}>
                        {selected.totalInCellar}
                        <span className="text-xs font-normal ml-1" style={{ color: "var(--text-faint)" }}>btl</span>
                      </p>
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div className="px-5 py-5 flex flex-col gap-2.5">
                    <button
                      onClick={confirmDrink}
                      disabled={!!pending}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                      style={{ fontFamily: "var(--font-inter)", background: "var(--wine-red)", color: "#fff", boxShadow: "0 4px 16px rgba(160,28,46,0.45)" }}
                    >
                      {pending === "drink" ? "En cours…" : (
                        <><span>🍷</span> Boire une bouteille</>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <Link
                        href={`/wines/${selected.id}`}
                        className="flex-1 flex items-center justify-center py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ fontFamily: "var(--font-inter)", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onClick={() => setSelected(null)}
                      >
                        Voir la fiche
                      </Link>
                      {selected.rackId && (
                        <button
                          onClick={confirmUnrack}
                          disabled={!!pending}
                          className="flex-1 flex items-center justify-center py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ fontFamily: "var(--font-inter)", background: "rgba(196,152,60,0.10)", color: "var(--gold)", border: "1px solid rgba(196,152,60,0.25)" }}
                        >
                          {pending === "unrack" ? "…" : "↩ Retirer"}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={confirmDelete}
                      disabled={!!pending}
                      className="flex items-center justify-center py-2.5 rounded-2xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ fontFamily: "var(--font-inter)", color: "rgba(255,80,80,0.65)", border: "1px solid rgba(255,80,80,0.12)" }}
                    >
                      {pending === "delete" ? "En cours…" : "🗑 Retirer définitivement du stock"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Slot picker modal ── */}
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

// ─── Slot picker modal ────────────────────────────────────────────────────────

function SlotPickerModal({
  wines, rackName, slotIndex, numCols, onPlace, onCancel,
}: {
  wines: WineRef[];
  rackName: string;
  slotIndex: number;
  numCols: number;
  onPlace: (wine: WineRef) => void;
  onCancel: () => void;
}) {
  const rackRow = Math.floor(slotIndex / numCols);
  const rackCol = slotIndex % numCols;
  const decoded = decodeSlot(rackName, rackRow, rackCol, 1);
  const posLabel = decoded ? slotLabel(decoded.start) : `Emplacement ${slotIndex + 1}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "#130b0e", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onCancel}
            className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", fontSize: 14 }}
          >
            ✕
          </button>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="px-3 py-1 rounded-lg text-sm font-bold tracking-wide"
              style={{ background: "#a05828", color: "#fff", fontFamily: "var(--font-inter)" }}
            >
              Casier {rackName}
            </span>
            <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
              {posLabel}
            </span>
          </div>
          <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
            Quel vin ranger ici ?
          </p>
        </div>

        {/* Wine list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1.5">
          {wines.map((wine) => {
            const c = BOTTLE[wine.color ?? ""] ?? { base: "#555", hi: "#888", label: "" };
            return (
              <button
                key={wine.id}
                onClick={() => onPlace(wine)}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-left transition-all hover:brightness-110 active:scale-[0.99]"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                {wine.imageUrl ? (
                  <div
                    className="rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ width: 38, height: 38, background: `${c.base}33` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={wine.imageUrl} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
                  </div>
                ) : (
                  <div
                    className="rounded-full shrink-0"
                    style={{
                      width: 38, height: 38,
                      background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`,
                      boxShadow: `0 2px 8px ${c.base}55`,
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-playfair)" }}>
                    {wine.name}
                  </p>
                  {(wine.vintage || wine.appellation) && (
                    <p className="text-xs mt-0.5 truncate" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                      {[wine.vintage?.toString(), wine.appellation].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium"
                  style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
                >
                  ×{wine.quantity}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cancel */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-inter)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}
          >
            Annuler
          </button>
        </div>
      </div>
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
  frontSlots, backSlots, label, onSelect, selectedId, onEmptyClick, labelMode,
}: {
  frontSlots: SlotEntry[];
  backSlots: SlotEntry[];
  label: string;
  onSelect: (w: WineRef) => void;
  selectedId: string | null;
  onEmptyClick: ((slotIndex: number) => void) | null;
  labelMode: boolean;
}) {
  const sharedStyle = {
    background: "rgba(255,255,255,0.018)",
    border: "1px solid rgba(255,255,255,0.055)",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: "9px",
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.30)",
  };
  const subLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: "8px",
    color: "rgba(255,255,255,0.28)",
    marginBottom: 6,
  };

  if (labelMode) {
    return (
      <div className="rounded-xl overflow-hidden mb-0.5" style={sharedStyle}>
        <p className="text-center pt-1.5" style={labelStyle}>{label.toUpperCase()}</p>
        {backSlots.length > 0 && (
          <div className="px-3 pt-2 pb-1">
            <p style={subLabelStyle}>arrière (P2)</p>
            <div className="space-y-0.5">
              {backSlots.map(({ wine, slotIndex }) => (
                <LabelRow
                  key={slotIndex}
                  wine={wine}
                  dim
                  onSelect={onSelect}
                  isSelected={wine?.id === selectedId}
                  onEmptyClick={!wine && onEmptyClick ? () => onEmptyClick(slotIndex) : null}
                />
              ))}
            </div>
          </div>
        )}
        <div className="px-3 pt-1 pb-2">
          <p style={subLabelStyle}>avant (P1)</p>
          <div className="space-y-0.5">
            {frontSlots.map(({ wine, slotIndex }) => (
              <LabelRow
                key={slotIndex}
                wine={wine}
                dim={false}
                onSelect={onSelect}
                isSelected={wine?.id === selectedId}
                onEmptyClick={!wine && onEmptyClick ? () => onEmptyClick(slotIndex) : null}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden mb-0.5" style={sharedStyle}>
      <p className="text-center pt-1.5" style={labelStyle}>{label.toUpperCase()}</p>
      {backSlots.length > 0 && (
        <div className="px-4 pt-2 pb-1">
          <p style={subLabelStyle}>arrière (P2)</p>
          <div className="flex gap-2">
            {backSlots.map(({ wine, slotIndex }) => (
              <Slot
                key={slotIndex}
                wine={wine}
                size={SLOT_BACK}
                dim
                onSelect={onSelect}
                isSelected={wine?.id === selectedId}
                onEmptyClick={!wine && onEmptyClick ? () => onEmptyClick(slotIndex) : null}
              />
            ))}
          </div>
        </div>
      )}
      <div className="px-4 pt-1 pb-3">
        <p style={subLabelStyle}>avant (P1)</p>
        <div className="flex gap-2">
          {frontSlots.map(({ wine, slotIndex }) => (
            <Slot
              key={slotIndex}
              wine={wine}
              size={SLOT_FRONT}
              dim={false}
              onSelect={onSelect}
              isSelected={wine?.id === selectedId}
              onEmptyClick={!wine && onEmptyClick ? () => onEmptyClick(slotIndex) : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LabelRow : slot en mode texte ───────────────────────────────────────────

function LabelRow({
  wine, dim, onSelect, isSelected, onEmptyClick,
}: {
  wine: WineRef | null;
  dim: boolean;
  onSelect: (w: WineRef) => void;
  isSelected: boolean;
  onEmptyClick: (() => void) | null;
}) {
  const c = wine ? (BOTTLE[wine.color ?? ""] ?? { base: "#555", hi: "#888" }) : null;

  if (!wine) {
    if (onEmptyClick) {
      return (
        <button
          onClick={onEmptyClick}
          className="flex items-center gap-2.5 w-full px-2 py-1 rounded-lg text-left transition-all hover:bg-white/5"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center"
            style={{ border: "1.5px dashed rgba(196,152,60,0.6)", color: "rgba(196,152,60,0.7)", fontSize: 8 }}
          >
            +
          </div>
          <span className="text-xs italic" style={{ color: "rgba(196,152,60,0.6)" }}>Placer ici</span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ border: "1px dashed rgba(255,255,255,0.15)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>—</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(wine)}
      className="flex items-center gap-2.5 w-full px-2 py-1 rounded-lg text-left transition-all hover:bg-white/5 active:scale-[0.99]"
      style={{
        background: isSelected ? "rgba(196,152,60,0.1)" : "transparent",
        outline: isSelected ? "1px solid rgba(196,152,60,0.35)" : "none",
        opacity: dim ? 0.75 : 1,
      }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: c!.base, boxShadow: `0 0 5px ${c!.base}80` }}
      />
      <span
        className="text-xs truncate flex-1"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
      >
        {wine.name}
      </span>
      {wine.vintage && (
        <span
          className="text-xs shrink-0 tabular-nums"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
        >
          {wine.vintage}
        </span>
      )}
    </button>
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
            border: "1.5px dashed rgba(196,152,60,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(196,152,60,0.7)", fontSize: size * 0.38, lineHeight: 1,
            background: "rgba(196,152,60,0.07)",
          }}>
            +
          </div>
        </button>
      );
    }
    return (
      <div style={{ width: size, height: size, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * 0.72, height: size * 0.72, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.15)" }} />
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
        overflow: "hidden",
      }}
      className="hover:scale-110 active:scale-95 transition-transform"
    >
      {wine.imageUrl ? (
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
          background: `radial-gradient(circle at 35% 32%, ${c.hi}44, ${c.base}99)`,
          boxShadow: isSelected
            ? `0 0 0 2.5px var(--gold), 0 4px 14px ${c.base}90`
            : `0 2px 8px ${c.base}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wine.imageUrl}
            alt=""
            style={{ width: "90%", height: "90%", objectFit: "contain", borderRadius: "50%" }}
          />
        </div>
      ) : (
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`,
          boxShadow: isSelected
            ? `0 0 0 2.5px var(--gold), 0 4px 14px ${c.base}90`
            : `0 2px 8px ${c.base}55, inset 0 1px 2px rgba(255,255,255,0.2)`,
          transition: "box-shadow 0.15s",
        }}>
          <div style={{
            position: "absolute", top: "15%", left: "20%", width: "26%", height: "16%",
            borderRadius: "50%", background: "rgba(255,255,255,0.40)", transform: "rotate(-30deg)",
          }} />
        </div>
      )}
    </button>
  );
}
