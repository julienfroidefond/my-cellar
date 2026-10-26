"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Eye, PackageMinus, Undo2, Wine, X } from "lucide-react";
import { WineColor } from "@/components/WineTile";
import { BOTTLE, BOTTLE_FALLBACK } from "./constants";
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
  const c = BOTTLE[wine.color ?? ""] ?? BOTTLE_FALLBACK;
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
      className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wine-detail-title"
    >
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="sheet relative z-[var(--z-modal)] w-full sm:max-w-md">
        {/* En-tête : bouteille sur bandeau, nom, étiquettes */}
        <div className="relative flex gap-4 border-b border-border p-5">
          <div className="flex h-32 w-20 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-2">
            {wine.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wine.imageUrl}
                alt=""
                className="h-28 w-auto object-contain drop-shadow-[0_6px_10px_rgba(43,9,18,0.25)]"
              />
            ) : (
              <span
                className="h-12 w-12 rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${c.hi}ff, ${c.base}ff 60%, ${c.base}cc)`,
                  boxShadow: `0 6px 18px ${c.base}40`,
                }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 pr-8">
            <h2 id="wine-detail-title" className="font-display text-xl font-semibold leading-snug">
              {wine.name}
            </h2>
            {wine.producer && <p className="mt-0.5 truncate text-sm text-gold">{wine.producer}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {wine.vintage && <span className="tag">{wine.vintage}</span>}
              {wine.color && (
                <span className="tag">
                  <WineColor color={wine.color} />
                </span>
              )}
              {wine.appellation && <span className="tag">{wine.appellation}</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon absolute right-3 top-3"
            aria-label="Fermer"
          >
            <X />
          </button>
        </div>

        {/* Infos */}
        <dl className="grid grid-cols-2 gap-px border-b border-border bg-border">
          <div className="bg-surface px-5 py-3">
            <dt className="label">Région</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">{wine.region ?? "—"}</dd>
          </div>
          <div className="bg-surface px-5 py-3">
            <dt className="label">En cave</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular">
              {wine.totalInCellar} bouteille{wine.totalInCellar > 1 ? "s" : ""}
            </dd>
          </div>
        </dl>

        {/* Actions */}
        <div className="flex flex-col gap-2 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {askingRating ? (
            <div className="flex flex-col gap-4">
              <p className="label text-center">Note de dégustation (facultative)</p>
              <StarRatingInput value={rating} onChange={setRating} size={30} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={cancelRating}
                  disabled={!!pending}
                  className="btn btn-secondary btn-lg"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => onDrink(rating)}
                  disabled={!!pending}
                  className="btn btn-primary btn-lg"
                >
                  {pending === "drink" ? "En cours…" : "Confirmer"}
                </button>
              </div>
            </div>
          ) : askingRemoval ? (
            <div className="flex flex-col gap-3">
              <p className="font-display text-lg font-semibold">Retirer du stock</p>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="remove-qty" className="label">
                  Quantité
                </label>
                <input
                  id="remove-qty"
                  type="number"
                  min={1}
                  max={Math.max(1, wine.totalInCellar)}
                  value={removeQty}
                  onChange={(e) => setRemoveQty(Math.min(Math.max(1, wine.totalInCellar), Math.max(1, Number(e.target.value) || 1)))}
                  className="input w-24 text-center tabular"
                />
              </div>
              <div className="segmented w-full" role="group" aria-label="Motif">
                {SELECTABLE_REMOVAL_REASONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRemoveReason(value)}
                    aria-pressed={removeReason === value}
                    className="flex-1 justify-center"
                  >
                    {REMOVAL_REASON_LABELS[value]}
                  </button>
                ))}
              </div>
              <textarea
                value={removeNote}
                onChange={(e) => setRemoveNote(e.target.value)}
                rows={2}
                placeholder="Note (facultative)"
                aria-label="Note"
                className="input input-area min-h-0 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={cancelRemoval}
                  disabled={!!pending}
                  className="btn btn-secondary btn-lg"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => onRemove({ quantity: removeQty, reason: removeReason, note: removeNote.trim() || null })}
                  disabled={!!pending}
                  className="btn btn-primary btn-lg"
                >
                  {pending === "remove" ? "En cours…" : "Confirmer"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAskingRating(true)}
                disabled={!!pending}
                className="btn btn-primary btn-lg w-full"
              >
                {pending === "drink" ? "En cours…" : <><Wine /> Boire une bouteille</>}
              </button>

              <div className={`grid gap-2 ${wine.rackId ? "grid-cols-2" : "grid-cols-1"}`}>
                <Link href={`/wines/${wine.wineId}`} className="btn btn-secondary" onClick={onClose}>
                  <Eye />
                  Voir la fiche
                </Link>
                {wine.rackId && (
                  <button
                    type="button"
                    onClick={onUnrack}
                    disabled={!!pending}
                    className="btn btn-secondary"
                  >
                    <Undo2 />
                    {pending === "unrack" ? "En cours…" : "Sortir du casier"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAskingRemoval(true)}
                disabled={!!pending}
                className="btn btn-ghost btn-sm mx-auto mt-1 text-wine-deep"
              >
                <PackageMinus />
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
