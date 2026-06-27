"use client";

import { BOTTLE, SLOT_FRONT, SLOT_BACK } from "./constants";
import type { WineRef } from "./types";

export type SlotEntry = { wine: WineRef | null; slotIndex: number };

// ─── Plank ────────────────────────────────────────────────────────────────────

export function Plank() {
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

// ─── ShelfLevel ───────────────────────────────────────────────────────────────

export function ShelfLevel({
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

// ─── LabelRow ─────────────────────────────────────────────────────────────────

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
          boxShadow: isSelected
            ? `0 0 0 2.5px var(--gold), 0 4px 14px ${c.base}90`
            : `0 2px 8px ${c.base}55`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wine.imageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 38%" }}
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
