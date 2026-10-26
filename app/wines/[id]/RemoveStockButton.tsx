"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageMinus } from "lucide-react";
import { REMOVAL_REASON_LABELS, SELECTABLE_REMOVAL_REASONS } from "@/lib/history";
import { ActionSheet } from "./ActionSheet";

type RemovalReason = (typeof SELECTABLE_REMOVAL_REASONS)[number];

export default function RemoveStockButton({
  vintageId,
  maxQuantity,
  className = "",
}: {
  vintageId: string;
  maxQuantity: number;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<RemovalReason>("offert");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const max = Math.max(1, maxQuantity);

  function cancel() {
    setOpen(false);
    setQuantity(1);
    setReason("offert");
    setNote("");
  }

  async function confirm() {
    setLoading(true);
    await fetch(`/api/wines/${vintageId}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, reason, note: note.trim() || null }),
    });
    setLoading(false);
    cancel();
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`btn btn-secondary ${className}`}>
        <PackageMinus aria-hidden="true" />
        Retirer
      </button>

      <ActionSheet
        open={open}
        onClose={cancel}
        title="Retirer du stock"
        description="Pour une bouteille offerte ou une correction d’inventaire."
        footer={
          <>
            <button type="button" onClick={cancel} disabled={loading} className="btn btn-secondary btn-lg flex-1">
              Annuler
            </button>
            <button type="button" onClick={confirm} disabled={loading} className="btn btn-primary btn-lg flex-1">
              {loading ? "Retrait…" : "Retirer"}
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div>
            <label htmlFor="remove-quantity" className="label mb-1.5 block">
              Quantité <span className="text-faint">(max. {max})</span>
            </label>
            <input
              id="remove-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
              className="input tabular"
            />
          </div>

          <div>
            <p className="label mb-1.5">Raison</p>
            <div className="segmented flex w-full">
              {SELECTABLE_REMOVAL_REASONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReason(value)}
                  aria-pressed={reason === value}
                  className="h-9 flex-1 justify-center"
                >
                  {REMOVAL_REASON_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="remove-note" className="label mb-1.5 block">
              Note <span className="text-faint">(facultatif)</span>
            </label>
            <textarea
              id="remove-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ex : offert à Léa, erreur d'inventaire…"
              className="input input-area min-h-[4.5rem] resize-none"
            />
          </div>
        </div>
      </ActionSheet>
    </>
  );
}
