"use client";

import Link from "next/link";
import { BOTTLE } from "./constants";
import type { WineRef } from "./types";

export function WineDetailModal({
  wine,
  pending,
  onClose,
  onDrink,
  onUnrack,
  onDelete,
}: {
  wine: WineRef;
  pending: "drink" | "unrack" | "delete" | null;
  onClose: () => void;
  onDrink: () => void;
  onUnrack: () => void;
  onDelete: () => void;
}) {
  const c = BOTTLE[wine.color ?? ""] ?? { base: "#333", hi: "#555", label: wine.color ?? "" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "#130b0e" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header coloré */}
        <div
          className="relative px-6 pt-6 pb-8 text-center"
          style={{
            background: `linear-gradient(170deg, ${c.base}50 0%, ${c.base}20 60%, transparent 100%)`,
            borderBottom: `1px solid ${c.base}35`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", fontSize: 14 }}
          >
            ✕
          </button>

          {wine.imageUrl ? (
            <div className="mx-auto mb-4" style={{ width: 60, height: 120 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wine.imageUrl}
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
            {wine.name}
          </h2>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {wine.vintage && (
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: "rgba(196,152,60,0.18)", color: "var(--gold)", border: "1px solid rgba(196,152,60,0.3)", fontFamily: "var(--font-inter)" }}
              >
                {wine.vintage}
              </span>
            )}
            {wine.color && (
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: `${c.base}30`, color: c.hi, border: `1px solid ${c.base}50`, fontFamily: "var(--font-inter)" }}
              >
                {c.label}
              </span>
            )}
            {wine.appellation && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                {wine.appellation}
              </span>
            )}
          </div>
        </div>

        {/* Infos */}
        <div
          className="px-6 py-4 flex items-center gap-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {wine.region && (
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Région</p>
              <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-inter)" }}>{wine.region}</p>
            </div>
          )}
          <div className="shrink-0 text-center">
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>En cave</p>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--gold)" }}>
              {wine.totalInCellar}
              <span className="text-xs font-normal ml-1" style={{ color: "var(--text-faint)" }}>btl</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-5 flex flex-col gap-2.5">
          <button
            onClick={onDrink}
            disabled={!!pending}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ fontFamily: "var(--font-inter)", background: "var(--wine-red)", color: "#fff", boxShadow: "0 4px 16px rgba(160,28,46,0.45)" }}
          >
            {pending === "drink" ? "En cours…" : <><span>🍷</span> Boire une bouteille</>}
          </button>

          <div className="flex gap-2">
            <Link
              href={`/wines/${wine.id}`}
              className="flex-1 flex items-center justify-center py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ fontFamily: "var(--font-inter)", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={onClose}
            >
              Voir la fiche
            </Link>
            {wine.rackId && (
              <button
                onClick={onUnrack}
                disabled={!!pending}
                className="flex-1 flex items-center justify-center py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ fontFamily: "var(--font-inter)", background: "rgba(196,152,60,0.10)", color: "var(--gold)", border: "1px solid rgba(196,152,60,0.25)" }}
              >
                {pending === "unrack" ? "…" : "↩ Retirer"}
              </button>
            )}
          </div>

          <button
            onClick={onDelete}
            disabled={!!pending}
            className="flex items-center justify-center py-2.5 rounded-2xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ fontFamily: "var(--font-inter)", color: "rgba(255,80,80,0.65)", border: "1px solid rgba(255,80,80,0.12)" }}
          >
            {pending === "delete" ? "En cours…" : "🗑 Retirer définitivement du stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
