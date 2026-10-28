"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { decodeSlot, slotLabel, type RackConfig } from "@/lib/rack-configs";
import { Search, X } from "lucide-react";
import { BottleSilhouette, colorLabel } from "@/components/WineTile";
import type { WineRef } from "./types";

export function SlotPickerModal({
  wines, rackName, slotIndex, numCols, config, onPlace, onCancel,
}: {
  wines: WineRef[];
  rackName: string;
  slotIndex: number;
  numCols: number;
  config: RackConfig;
  onPlace: (wine: WineRef) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");

  const rackRow = Math.floor(slotIndex / numCols);
  const rackCol = slotIndex % numCols;
  const decoded = decodeSlot(config, rackRow, rackCol, 1);
  const posLabel = decoded ? slotLabel(decoded.start) : `Emplacement ${slotIndex + 1}`;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? wines.filter((w) =>
        w.name.toLowerCase().includes(q) ||
        w.producer?.toLowerCase().includes(q) ||
        w.appellation?.toLowerCase().includes(q) ||
        w.vintage?.toString().includes(q)
      )
    : wines;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-picker-title"
    >
      <div className="overlay" onClick={onCancel} aria-hidden="true" />
      <div className="sheet relative z-[var(--z-modal)] flex max-h-[85dvh] w-full flex-col overflow-hidden sm:max-w-md">
        {/* En-tête */}
        <div className="border-b border-border px-5 pb-4 pt-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge h-7 rounded-lg bg-ink px-2.5 text-background">Casier {rackName}</span>
              <span className="text-xs text-muted">{posLabel}</span>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-icon -mr-2 -mt-1.5 shrink-0"
              aria-label="Fermer"
            >
              <X />
            </button>
          </div>
          <h2 id="slot-picker-title" className="text-title mb-3">
            Quel vin ranger ici ?
          </h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              autoFocus
              type="search"
              placeholder="Rechercher un vin, un millésime…"
              aria-label="Rechercher un vin"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {/* Liste des vins à ranger */}
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="py-8 text-center text-sm text-muted">Aucun résultat</li>
          )}
          {filtered.map((wine) => (
            <li key={wine.id}>
              <button
                type="button"
                onClick={() => onPlace(wine)}
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors hover:bg-surface-2 active:scale-[0.99]"
              >
                <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-surface-2">
                  {wine.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wine.imageUrl} alt="" className="h-11 w-auto object-contain" />
                  ) : (
                    <BottleSilhouette className="h-9 w-auto text-surface-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{wine.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
                    <span className="wine-dot" data-color={wine.color ?? undefined} />
                    {[wine.vintage?.toString(), wine.appellation].filter(Boolean).join(" · ") || colorLabel(wine.color)}
                  </span>
                </span>
                <span className="badge shrink-0">×{wine.quantity}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-border px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={onCancel} className="btn btn-secondary w-full">
            Annuler
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
