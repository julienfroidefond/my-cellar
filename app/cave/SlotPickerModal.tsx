"use client";

import { decodeSlot, slotLabel } from "@/lib/rack-configs";
import { BOTTLE } from "./constants";
import type { WineRef } from "./types";

export function SlotPickerModal({
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
      style={{ background: "rgba(26,10,14,0.45)", backdropFilter: "blur(12px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "#ffffff", boxShadow: "0 24px 64px rgba(26,10,14,0.18)", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(26,10,14,0.07)" }}>
          <button
            onClick={onCancel}
            className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-90 transition-opacity"
            style={{ background: "rgba(26,10,14,0.07)", color: "var(--text-muted)", fontSize: 14 }}
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
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-left hover:opacity-90 transition-opacity active:scale-[0.99]"
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
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(26,10,14,0.07)" }}>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ fontFamily: "var(--font-inter)", background: "rgba(26,10,14,0.05)", border: "1px solid rgba(26,10,14,0.10)", color: "var(--text-muted)" }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
