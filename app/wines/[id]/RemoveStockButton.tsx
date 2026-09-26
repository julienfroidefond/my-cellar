"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { REMOVAL_REASON_LABELS, SELECTABLE_REMOVAL_REASONS } from "@/lib/history";

type RemovalReason = (typeof SELECTABLE_REMOVAL_REASONS)[number];

export default function RemoveStockButton({
  vintageId,
  maxQuantity,
}: {
  vintageId: string;
  maxQuantity: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<RemovalReason>("offert");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const max = Math.max(1, maxQuantity);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
        style={{
          background: "rgba(26,10,14,0.05)",
          border: "1px solid rgba(26,10,14,0.15)",
          color: "var(--text-muted)",
          fontFamily: "var(--font-inter)",
        }}
      >
        Retirer
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 rounded-2xl p-5 z-50 text-left"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(26,10,14,0.14)",
            width: 280,
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
            Retirer du stock
          </p>

          <label className="block text-xs mb-1.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Quantité
          </label>
          <input
            type="number"
            min={1}
            max={max}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
            className="w-full px-3 py-2 rounded-xl text-sm mb-3"
            style={{ fontFamily: "var(--font-inter)", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />

          <label className="block text-xs mb-1.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Raison
          </label>
          <div className="flex gap-2 mb-3">
            {SELECTABLE_REMOVAL_REASONS.map((value) => (
              <button
                key={value}
                onClick={() => setReason(value)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "var(--font-inter)",
                  background: reason === value ? "var(--wine-red)" : "var(--surface-2)",
                  color: reason === value ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {REMOVAL_REASON_LABELS[value]}
              </button>
            ))}
          </div>

          <label className="block text-xs mb-1.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Note (optionnel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex : offert à Léa, erreur d'inventaire…"
            className="w-full px-3 py-2 rounded-xl text-sm mb-4 resize-none"
            style={{ fontFamily: "var(--font-inter)", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />

          <div className="flex gap-2">
            <button
              onClick={confirm}
              disabled={loading}
              className="flex-1 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
            >
              {loading ? "…" : "Confirmer"}
            </button>
            <button
              onClick={cancel}
              disabled={loading}
              className="flex-1 py-2 rounded-full text-sm transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
