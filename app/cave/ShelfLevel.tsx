"use client";

import { Plus } from "lucide-react";
import { BOTTLE, BOTTLE_FALLBACK, SLOT_FRONT, SLOT_BACK } from "./constants";
import type { WineRef } from "./types";

export type SlotEntry = { wine: WineRef | null; slotIndex: number };

// ─── ShelfLevel ───────────────────────────────────────────────────────────────

/**
 * Une étagère du plan : rangée arrière (si présente) puis rangée avant, posées
 * sur une planche. `labelMode` remplace les bouchons par des étiquettes lisibles.
 */
export function ShelfLevel({
  frontSlots, backSlots, label, onSelect, selectedId, onEmptyClick, labelMode, showFront, showBack,
}: {
  frontSlots: SlotEntry[];
  backSlots: SlotEntry[];
  label: string;
  onSelect: (w: WineRef) => void;
  selectedId: string | null;
  onEmptyClick: ((slotIndex: number) => void) | null;
  labelMode: boolean;
  showFront: boolean;
  showBack: boolean;
}) {
  const rows = [
    showBack && backSlots.length > 0 ? { key: "back", title: "Arrière", slots: backSlots, dim: true } : null,
    showFront ? { key: "front", title: "Avant", slots: frontSlots, dim: false } : null,
  ].filter((row): row is { key: string; title: string; slots: SlotEntry[]; dim: boolean } => row !== null);

  return (
    <div className="panel overflow-hidden border-b-[5px] border-b-surface-3">
      <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">{label}</p>
      {rows.map((row) => (
        <div key={row.key} className="px-3 pb-2.5 pt-1.5">
          <p className="mb-1.5 text-[11px] font-medium text-faint">{row.title}</p>
          {labelMode ? (
            <div className="grid grid-cols-2 gap-1.5">
              {row.slots.map(({ wine, slotIndex }) => (
                <LabelCard
                  key={slotIndex}
                  wine={wine}
                  dim={row.dim}
                  onSelect={onSelect}
                  isSelected={wine?.id === selectedId}
                  onEmptyClick={!wine && onEmptyClick ? () => onEmptyClick(slotIndex) : null}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-1.5">
              {row.slots.map(({ wine, slotIndex }) => (
                <Slot
                  key={slotIndex}
                  wine={wine}
                  size={row.dim ? SLOT_BACK : SLOT_FRONT}
                  dim={row.dim}
                  onSelect={onSelect}
                  isSelected={wine?.id === selectedId}
                  onEmptyClick={!wine && onEmptyClick ? () => onEmptyClick(slotIndex) : null}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── LabelCard ───────────────────────────────────────────────────────────────

function LabelCard({
  wine, dim, onSelect, isSelected, onEmptyClick,
}: {
  wine: WineRef | null;
  dim: boolean;
  onSelect: (w: WineRef) => void;
  isSelected: boolean;
  onEmptyClick: (() => void) | null;
}) {
  if (!wine) {
    if (onEmptyClick) {
      return (
        <button
          type="button"
          onClick={onEmptyClick}
          className="flex min-h-12 items-center gap-2 rounded-[var(--radius-sm)] border-[1.5px] border-dashed border-wine-red/40 bg-[var(--wine-tint)] px-2.5 text-left text-xs font-medium text-wine-red transition-colors hover:border-wine-red/70"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Placer ici
        </button>
      );
    }
    return (
      <div className="flex min-h-12 items-center rounded-[var(--radius-sm)] border border-dashed border-border-strong px-2.5 text-xs text-faint">
        Vide
      </div>
    );
  }

  const c = BOTTLE[wine.color ?? ""] ?? BOTTLE_FALLBACK;

  return (
    <button
      type="button"
      onClick={() => onSelect(wine)}
      aria-pressed={isSelected}
      className={`flex min-h-12 w-full items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-1.5 text-left shadow-[var(--shadow-sm)] transition-colors ${
        isSelected
          ? "border-wine-red bg-[var(--wine-tint)]"
          : "border-border bg-surface hover:border-border-strong"
      } ${dim ? "opacity-75" : ""}`}
    >
      <span className="flex h-10 w-6 shrink-0 items-center justify-center">
        {wine.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wine.imageUrl} alt="" className="h-10 w-6 object-contain" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.base }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold leading-tight">{wine.name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {[wine.vintage, wine.appellation ?? wine.region ?? c.label].filter(Boolean).join(" · ")}
        </span>
      </span>
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
  // Taille du bouchon : seule valeur dynamique, passée en style.
  const box = { width: size, height: size };

  if (!wine) {
    if (onEmptyClick) {
      return (
        <button
          type="button"
          onClick={onEmptyClick}
          aria-label="Placer une bouteille ici"
          style={box}
          className="flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
        >
          <span className="flex h-[84%] w-[84%] items-center justify-center rounded-full border-[1.5px] border-dashed border-wine-red/60 bg-[var(--wine-tint)] text-wine-red">
            <Plus className="h-[45%] w-[45%]" />
          </span>
        </button>
      );
    }
    return (
      <div style={box} className="flex shrink-0 items-center justify-center" aria-hidden="true">
        <span className="h-[70%] w-[70%] rounded-full border border-dashed border-border-strong" />
      </div>
    );
  }

  const c = BOTTLE[wine.color ?? ""] ?? BOTTLE_FALLBACK;
  const label = [wine.name, wine.vintage].filter(Boolean).join(" ");

  return (
    <div className="group relative shrink-0" style={box}>
      <button
        type="button"
        onClick={() => onSelect(wine)}
        aria-label={label}
        aria-pressed={isSelected}
        className={`relative h-full w-full overflow-hidden rounded-full transition-transform hover:scale-110 active:scale-95 ${dim ? "opacity-70" : ""}`}
      >
        {/* Bouchon : dégradé calculé depuis la couleur du vin */}
        <span
          className="block h-full w-full rounded-full transition-shadow"
          style={{
            background: `radial-gradient(circle at 35% 32%, ${c.hi}ee, ${c.base}ff 55%, ${c.base})`,
            boxShadow: isSelected
              ? `0 0 0 2.5px var(--ink), 0 4px 14px ${c.base}90`
              : `0 2px 6px ${c.base}40, inset 0 1px 2px rgba(255,255,255,0.15)`,
          }}
        />
        <span className="absolute left-[20%] top-[15%] h-[16%] w-[26%] -rotate-30 rounded-full bg-white/40" />
      </button>

      {/* Infobulle */}
      <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[var(--z-sticky)] -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <div className="rounded-md bg-ink px-2.5 py-1 text-[11px] leading-snug text-background shadow-[var(--shadow-md)]">
          {label}
        </div>
      </div>
    </div>
  );
}
