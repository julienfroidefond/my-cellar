"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StarRatingInput } from "@/components/StarRating";

export default function DrinkButton({ vintageId, wineName }: { vintageId: string; wineName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleCancel() {
    setOpen(false);
    setRating(null);
  }

  async function handleConfirm() {
    setLoading(true);
    await fetch(`/api/wines/${vintageId}/drink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    setLoading(false);
    setOpen(false);
    setRating(null);
    router.refresh();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
        style={{
          background: "rgba(192,25,59,0.08)",
          border: "1px solid rgba(192,25,59,0.22)",
          color: "var(--wine-red)",
          fontFamily: "var(--font-inter)",
        }}
      >
        Boire
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 rounded-2xl p-5 z-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(26,10,14,0.14)",
            width: 240,
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
            {wineName ? `Noter "${wineName}"` : "Note (optionnel)"}
          </p>
          <div className="mb-4">
            <StarRatingInput value={rating} onChange={setRating} size={26} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
            >
              {loading ? "…" : "Confirmer"}
            </button>
            <button
              onClick={handleCancel}
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
