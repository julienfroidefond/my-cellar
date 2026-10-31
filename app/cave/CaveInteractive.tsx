"use client";

import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Check, LayoutGrid, MapPin, Move3d, Pencil, Settings2, Tag, X } from "lucide-react";
import { BottleSilhouette } from "@/components/WineTile";
import { ShelfLevel } from "./ShelfLevel";
import { WineDetailModal, type RemovalPayload } from "./WineDetailModal";
import { SlotPickerModal } from "./SlotPickerModal";
import { BOTTLE, DEPTH_DEFAULT, DEPTH_MAX, DEPTH_MIN } from "./constants";
import { Cave3D } from "./Cave3D";
import { CellarDesigner } from "./CellarDesigner";

// Re-export types so page.tsx can keep its current import path
export type { WineRef, LevelConfig, RackConfig, RackData } from "./types";
import type { RackConfig, WineRef, RackData } from "./types";

// ─── Slot map helpers ─────────────────────────────────────────────────────────

function buildSlotMap(wines: WineRef[], config: RackData["config"], numCols: number): (WineRef | null)[] {
  const totalSlots = config.levels.reduce((s, l) => s + l.front + l.back, 0);
  const map: (WineRef | null)[] = new Array(totalSlots).fill(null);
  for (const wine of wines) {
    if (wine.rackRow == null || wine.rackCol == null) continue;
    const slotIndex = wine.rackRow * numCols + wine.rackCol;
    if (slotIndex < totalSlots) map[slotIndex] = wine;
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

type TargetSlot = { rackId: string; rackName: string; slotIndex: number; numCols: number; config: RackConfig };

export default function CaveInteractive({ racks, unracked }: { racks: RackData[]; unracked: WineRef[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [placing, setPlacing] = useState<WineRef | null>(null);
  const [selected, setSelected] = useState<WineRef | null>(null);
  const [pending, setPending] = useState<"drink" | "unrack" | "remove" | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showFront, setShowFront] = useState(true);
  const [showBack, setShowBack] = useState(true);
  const [depth, setDepth] = useState(DEPTH_DEFAULT);
  const [view, setView] = useState<"plan" | "3d">("3d");
  const [targetSlot, setTargetSlot] = useState<TargetSlot | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [designTarget, setDesignTarget] = useState<string | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  async function confirmDrink(rating: number | null) {
    if (!selected) return;
    setPending("drink");
    await fetch(`/api/wines/${selected.vintageId}/drink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: selected.id, rating }),
    });
    setSelected(null); setPending(null); refresh();
  }

  async function confirmUnrack() {
    if (!selected) return;
    setPending("unrack");
    await fetch(`/api/wines/${selected.id}/unrack`, { method: "POST" });
    setSelected(null); setPending(null); refresh();
  }

  async function confirmRemove(payload: RemovalPayload) {
    if (!selected) return;
    setPending("remove");
    await fetch(`/api/wines/${selected.vintageId}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, slotId: selected.rackId ? selected.id : null }),
    });
    setSelected(null); setPending(null); refresh();
  }

  async function placeWine(wine: WineRef, rackId: string, slotIndex: number, numCols: number) {
    const rackRow = Math.floor(slotIndex / numCols);
    const rackCol = slotIndex % numCols;
    await fetch(`/api/wines/${wine.id}/rack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rackId, rackRow, rackCol, quantity: 1 }),
    });
    setPlacing(null);
    setTargetSlot(null);
    refresh();
  }

  const unrackedBottles = unracked.reduce((s, w) => s + w.quantity, 0);

  return (
    <div>
      {/* Bandeau du mode placement : reste visible pendant le défilement */}
      {placing && (
        <div
          role="status"
          className="sticky top-[calc(var(--nav-height)+0.5rem)] z-[var(--z-sticky)] mb-4 flex items-center gap-3 rounded-[var(--radius-md)] bg-ink py-2.5 pl-4 pr-2.5 text-background shadow-[var(--shadow-lg)]"
        >
          <MapPin className="h-4 w-4 shrink-0 text-wine-light" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Ranger : {placing.name}</p>
            <p className="text-xs opacity-70">Touchez un emplacement vide</p>
          </div>
          <button
            type="button"
            onClick={() => setPlacing(null)}
            className="btn btn-sm shrink-0 bg-white/10 text-background hover:bg-white/20"
          >
            <X />
            Annuler
          </button>
        </div>
      )}

      <div className={unracked.length > 0 ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start" : undefined}>
        <div className="min-w-0">
          {/* Barre d'outils unique : vue, profondeurs, étiquettes, légende */}
          <div className="mb-4 flex flex-wrap items-center gap-2" data-reveal>
            <div className="segmented" role="group" aria-label="Type de vue">
              {(["plan", "3d"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                >
                  {value === "plan" ? <LayoutGrid className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />}
                  {value === "plan" ? "Plan" : "Vue 3D"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Profondeurs affichées">
              <button
                type="button"
                onClick={() => { if (showFront && !showBack) return; setShowFront((v) => !v); }}
                disabled={showFront && !showBack}
                aria-pressed={showFront}
                className="chip disabled:cursor-not-allowed"
                title="Rangée avant"
              >
                {showFront && <Check />}
                Avant
              </button>
              <button
                type="button"
                onClick={() => { if (showBack && !showFront) return; setShowBack((v) => !v); }}
                disabled={showBack && !showFront}
                aria-pressed={showBack}
                className="chip disabled:cursor-not-allowed"
                title="Rangée arrière"
              >
                {showBack && <Check />}
                Arrière
              </button>
              {view === "plan" && (
                <button
                  type="button"
                  onClick={() => setShowLabels((v) => !v)}
                  aria-pressed={showLabels}
                  className="chip"
                >
                  <Tag />
                  Étiquettes
                </button>
              )}
            </div>

            {view === "3d" && (
              <label
                className="depth-range"
                title="Écart entre la profondeur avant et la profondeur arrière"
              >
                <Move3d aria-hidden="true" />
                <span className="hidden sm:inline">Écart</span>
                <input
                  type="range"
                  min={DEPTH_MIN}
                  max={DEPTH_MAX}
                  step={0.01}
                  value={depth}
                  onChange={(event) => setDepth(Number(event.target.value))}
                  aria-label="Écart entre la profondeur avant et la profondeur arrière"
                  aria-valuetext={`${Math.round((depth / DEPTH_DEFAULT) * 100)} %`}
                  className="range"
                  style={{ "--range-progress": `${((depth - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN)) * 100}%` } as CSSProperties}
                />
                <span className="tabular w-9 text-right text-[0.75rem]">
                  {Math.round((depth / DEPTH_DEFAULT) * 100)} %
                </span>
              </label>
            )}

            <button
              type="button"
              onClick={() => { setDesignTarget(null); setDesignOpen(true); }}
              className="btn btn-secondary btn-sm"
            >
              <Settings2 />
              Casiers
            </button>

            <ul className="ml-auto hidden items-center gap-3 text-xs text-muted sm:flex" aria-label="Légende">
              {(["rouge", "blanc", "rosé"] as const).map((key) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="wine-dot" data-color={key} />
                  {BOTTLE[key].label}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-dashed border-border-strong" />
                Vide
              </li>
            </ul>
          </div>

          {/* Casiers */}
          {view === "3d" ? (
            <Cave3D
              racks={racks}
              selectedId={selected?.id ?? null}
              showFront={showFront}
              showBack={showBack}
              depth={depth}
              onSelect={(wine) => { setSelected(wine); setPending(null); }}
              onEmptyClick={(placing || unracked.length > 0) ? (rack, slotIndex) => {
                if (placing) placeWine(placing, rack.id, slotIndex, rack.numCols);
                else setTargetSlot({ rackId: rack.id, rackName: rack.name, slotIndex, numCols: rack.numCols, config: rack.config });
              } : null}
            />
          ) : (
            <div
              className={`grid gap-3 ${showLabels ? "xl:grid-cols-2" : "sm:grid-cols-2"}`}
              data-reveal-stagger
            >
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
                          setTargetSlot({ rackId: rack.id, rackName: rack.name, slotIndex, numCols: rack.numCols, config: rack.config });
                        }
                      }
                    : null;

                const highlighted = Boolean(placing) || targetSlot?.rackId === rack.id;

                return (
                  <section
                    key={rack.id}
                    data-reveal
                    aria-label={`Casier ${rack.name}`}
                    className={`card overflow-hidden transition-colors ${highlighted ? "border-wine-red/40" : ""}`}
                  >
                    <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                      <span className="badge h-7 min-w-9 rounded-lg bg-ink text-sm text-background">
                        {rack.name}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-wine-red" style={{ width: `${fillPct}%` }} />
                      </div>
                      <span className="text-sm font-medium tabular text-muted">
                        {filledSlots}
                        <span className="text-faint"> / {totalSlots}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setDesignTarget(rack.id); setDesignOpen(true); }}
                        className="btn btn-ghost btn-icon -my-1 -mr-1 shrink-0"
                        aria-label={`Modifier le casier ${rack.name}`}
                        title={`Modifier le casier ${rack.name}`}
                      >
                        <Pencil />
                      </button>
                    </header>

                    <div className="space-y-2 p-3 sm:p-4">
                      {levels.map((lv, i) => (
                        <ShelfLevel
                          key={i}
                          frontSlots={lv.frontSlots}
                          backSlots={lv.backSlots}
                          label={`Étagère ${levels.length - i}`}
                          onSelect={(w) => { setSelected(w); setPending(null); }}
                          selectedId={selected?.id ?? null}
                          onEmptyClick={handleEmpty}
                          labelMode={showLabels}
                          showFront={showFront}
                          showBack={showBack}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* À ranger : colonne latérale collante sur desktop */}
        {unracked.length > 0 && (
          <aside
            data-reveal
            aria-labelledby="unracked-title"
            className="lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)]"
          >
            <div className="card flex flex-col lg:max-h-[calc(100dvh-var(--nav-height)-3rem)]">
              <div className="border-b border-border px-4 pb-3 pt-4">
                <div className="flex items-center gap-2">
                  <h2 id="unracked-title" className="font-display text-lg font-semibold">À ranger</h2>
                  <span className="badge">{unrackedBottles}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {unrackedBottles} bouteille{unrackedBottles > 1 ? "s" : ""} sans emplacement. Choisissez-en une, puis un emplacement vide.
                </p>
              </div>
              <ul className="divide-y divide-border overflow-y-auto">
                {unracked.map((wine) => {
                  const isPlacing = placing?.id === wine.id;
                  return (
                    <li
                      key={wine.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isPlacing ? "bg-[var(--wine-tint)]" : ""}`}
                    >
                      <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-surface-2">
                        {wine.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={wine.imageUrl} alt="" className="h-11 w-auto object-contain" />
                        ) : (
                          <BottleSilhouette className="h-9 w-auto text-surface-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/wines/${wine.wineId}`}
                          className="block truncate text-sm font-semibold hover:text-wine-red"
                        >
                          {wine.name}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                          <span className="wine-dot" data-color={wine.color ?? undefined} />
                          {wine.vintage ? `${wine.vintage} · ` : ""}
                          <span className="tabular">{wine.quantity}</span> à ranger
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlacing(isPlacing ? null : wine)}
                        aria-pressed={isPlacing}
                        className={`btn btn-sm shrink-0 ${isPlacing ? "btn-primary" : "btn-soft"}`}
                      >
                        {isPlacing ? "En cours…" : "Ranger"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* Modals */}
      {selected && (
        <WineDetailModal
          wine={selected}
          pending={pending}
          onClose={() => setSelected(null)}
          onDrink={confirmDrink}
          onUnrack={confirmUnrack}
          onRemove={confirmRemove}
        />
      )}

      {targetSlot && (
        <SlotPickerModal
          wines={unracked}
          rackName={targetSlot.rackName}
          slotIndex={targetSlot.slotIndex}
          numCols={targetSlot.numCols}
          config={targetSlot.config}
          onPlace={(wine) => placeWine(wine, targetSlot.rackId, targetSlot.slotIndex, targetSlot.numCols)}
          onCancel={() => setTargetSlot(null)}
        />
      )}

      {designOpen && (
        <CellarDesigner
          racks={racks}
          initialRackId={designTarget ?? undefined}
          onClose={() => { setDesignOpen(false); setDesignTarget(null); }}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
