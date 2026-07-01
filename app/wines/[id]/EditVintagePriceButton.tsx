"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function EditVintagePriceButton({ vintageId, currentPrice }: { vintageId: string; currentPrice: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentPrice?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function save() {
    setLoading(true);
    await fetch(`/api/vintages/${vintageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchasePrice: value ? parseFloat(value) : null }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs underline-offset-2 hover:underline"
        style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}
      >
        {currentPrice != null ? "Modifier" : "+ Ajouter"}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 flex items-center gap-2 rounded-xl p-2.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(26,10,14,0.14)", width: 170 }}
        >
          <input
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Prix €"
            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-inter)" }}
          />
          <button
            onClick={save}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium shrink-0 disabled:opacity-40"
            style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
          >
            {loading ? "…" : "OK"}
          </button>
        </div>
      )}
    </div>
  );
}
