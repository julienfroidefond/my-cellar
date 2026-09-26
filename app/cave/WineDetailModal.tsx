"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BOTTLE } from "./constants";
import { StarRatingInput } from "@/components/StarRating";
import { REMOVAL_REASON_LABELS, SELECTABLE_REMOVAL_REASONS } from "@/lib/history";
import type { WineRef } from "./types";

type RemovalReason = (typeof SELECTABLE_REMOVAL_REASONS)[number];

export type RemovalPayload = { quantity: number; reason: RemovalReason; note: string | null };

export function WineDetailModal({
  wine,
  pending,
  onClose,
  onDrink,
  onUnrack,
  onRemove,
}: {
  wine: WineRef;
  pending: "drink" | "unrack" | "remove" | null;
  onClose: () => void;
  onDrink: (rating: number | null) => void;
  onUnrack: () => void;
  onRemove: (payload: RemovalPayload) => void;
}) {
  const c = BOTTLE[wine.color ?? ""] ?? { base: "#333", hi: "#555", label: wine.color ?? "" };
  const [askingRating, setAskingRating] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [askingRemoval, setAskingRemoval] = useState(false);
  const [removeQty, setRemoveQty] = useState(1);
  const [removeReason, setRemoveReason] = useState<RemovalReason>("offert");
  const [removeNote, setRemoveNote] = useState("");

  function cancelRating() {
    setAskingRating(false);
    setRating(null);
  }

  function cancelRemoval() {
    setAskingRemoval(false);
    setRemoveQty(1);
    setRemoveReason("offert");
    setRemoveNote("");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(26,10,14,0.45)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "#ffffff", boxShadow: "0 24px 64px rgba(26,10,14,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header coloré */}
        <div
          className="relative px-6 pt-6 pb-8 text-center"
          style={{
            background: `linear-gradient(170deg, ${c.base}12 0%, ${c.base}06 60%, transparent 100%)`,
            borderBottom: `1px solid rgba(26,10,14,0.07)`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-90 transition-opacity"
            style={{ background: "rgba(26,10,14,0.07)", color: "var(--text-muted)", fontSize: 14 }}
          >
            ✕
          </button>

          {wine.imageUrl ? (
            <div className="mx-auto mb-4" style={{ width: 60, height: 120 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wine.imageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(26,10,14,0.25))" }}
              />
            </div>
          ) : (
            <div
              className="mx-auto mb-4 rounded-full"
              style={{
                width: 68, height: 68,
                background: `radial-gradient(circle at 35% 30%, ${c.hi}ff, ${c.base}ff 60%, ${c.base}cc)`,
                boxShadow: `0 0 0 6px ${c.base}14, 0 8px 28px ${c.base}40`,
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
                style={{ background: "rgba(184,122,44,0.12)", color: "var(--gold)", border: "1px solid rgba(184,122,44,0.25)", fontFamily: "var(--font-inter)" }}
              >
                {wine.vintage}
              </span>
            )}
            {wine.color && (
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: `${c.base}12`, color: c.base, border: `1px solid ${c.base}30`, fontFamily: "var(--font-inter)" }}
              >
                {c.label}
              </span>
            )}
            {wine.appellation && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(26,10,14,0.05)", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                {wine.appellation}
              </span>
            )}
          </div>
        </div>

        {/* Infos */}
        <div
          className="px-6 py-4 flex items-center gap-6"
          style={{ borderBottom: "1px solid rgba(26,10,14,0.07)" }}
        >
          {wine.region && (
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Région</p>
              <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-inter)" }}>{wine.region}</p>
            </div>
          )}
          <div className="shrink-0 text-center">
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>En cave</p>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
              {wine.totalInCellar}
              <span className="text-xs font-normal ml-1" style={{ color: "var(--text-faint)" }}>btl</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-5 flex flex-col gap-2.5">
          {askingRating ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest font-semibold text-center" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
                Note (optionnel)
              </p>
              <StarRatingInput value={rating} onChange={setRating} size={30} />
              <div className="flex gap-2">
                <button
                  onClick={() => onDrink(rating)}
                  disabled={!!pending}
                  className="flex-1 flex items-center justify-center py-3.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ fontFamily: "var(--font-inter)", background: "var(--wine-red)", color: "#fff", boxShadow: "0 4px 16px rgba(160,28,46,0.45)" }}
                >
                  {pending === "drink" ? "En cours…" : "Confirmer"}
                </button>
                <button
                  onClick={cancelRating}
                  disabled={!!pending}
                  className="flex-1 flex items-center justify-center py-3.5 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ fontFamily: "var(--font-inter)", background: "rgba(26,10,14,0.05)", border: "1px solid rgba(26,10,14,0.10)", color: "var(--foreground)" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : askingRemoval ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest font-semibold text-center" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
                Retirer du stock
              </p>
              <div className="flex items-center gap-3">
                <label className="text-xs flex-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  Quantité
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, wine.totalInCellar)}
                  value={removeQty}
                  onChange={(e) => setRemoveQty(Math.min(Math.max(1, wine.totalInCellar), Math.max(1, Number(e.target.value) || 1)))}
                  className="px-3 py-2 rounded-xl text-sm text-center"
                  style={{ width: 90, fontFamily: "var(--font-inter)", background: "rgba(26,10,14,0.04)", border: "1px solid rgba(26,10,14,0.10)", color: "var(--foreground)" }}
                />
              </div>
              <div className="flex gap-2">
                {SELECTABLE_REMOVAL_REASONS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setRemoveReason(value)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                    style={{
                      fontFamily: "var(--font-inter)",
                      background: removeReason === value ? "var(--wine-red)" : "rgba(26,10,14,0.05)",
                      color: removeReason === value ? "#fff" : "var(--text-muted)",
                      border: "1px solid rgba(26,10,14,0.10)",
                    }}
                  >
                    {REMOVAL_REASON_LABELS[value]}
                  </button>
                ))}
              </div>
              <textarea
                value={removeNote}
                onChange={(e) => setRemoveNote(e.target.value)}
                rows={2}
                placeholder="Note (optionnel)"
                className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                style={{ fontFamily: "var(--font-inter)", background: "rgba(26,10,14,0.04)", border: "1px solid rgba(26,10,14,0.10)", color: "var(--foreground)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onRemove({ quantity: removeQty, reason: removeReason, note: removeNote.trim() || null })}
                  disabled={!!pending}
                  className="flex-1 flex items-center justify-center py-3.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ fontFamily: "var(--font-inter)", background: "var(--wine-red)", color: "#fff", boxShadow: "0 4px 16px rgba(160,28,46,0.45)" }}
                >
                  {pending === "remove" ? "En cours…" : "Confirmer"}
                </button>
                <button
                  onClick={cancelRemoval}
                  disabled={!!pending}
                  className="flex-1 flex items-center justify-center py-3.5 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ fontFamily: "var(--font-inter)", background: "rgba(26,10,14,0.05)", border: "1px solid rgba(26,10,14,0.10)", color: "var(--foreground)" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setAskingRating(true)}
                disabled={!!pending}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ fontFamily: "var(--font-inter)", background: "var(--wine-red)", color: "#fff", boxShadow: "0 4px 16px rgba(160,28,46,0.45)" }}
              >
                {pending === "drink" ? "En cours…" : <><span>🍷</span> Boire une bouteille</>}
              </button>

              <div className="flex gap-2">
                <Link
                  href={`/wines/${wine.wineId}`}
                  className="flex-1 flex items-center justify-center py-3 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "var(--font-inter)", background: "rgba(26,10,14,0.05)", border: "1px solid rgba(26,10,14,0.10)", color: "var(--foreground)" }}
                  onClick={onClose}
                >
                  Voir la fiche
                </Link>
                {wine.rackId && (
                  <button
                    onClick={onUnrack}
                    disabled={!!pending}
                    className="flex-1 flex items-center justify-center py-3 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ fontFamily: "var(--font-inter)", background: "rgba(184,122,44,0.10)", color: "var(--gold)", border: "1px solid rgba(184,122,44,0.25)" }}
                  >
                    {pending === "unrack" ? "…" : "↩ Sortir du casier"}
                  </button>
                )}
              </div>

              <button
                onClick={() => setAskingRemoval(true)}
                disabled={!!pending}
                className="flex items-center justify-center py-2.5 rounded-2xl text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.20)" }}
              >
                {pending === "remove" ? "En cours…" : "Retirer du stock"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
