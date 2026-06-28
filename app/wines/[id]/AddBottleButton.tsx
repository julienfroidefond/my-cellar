"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddBottleButton({ id, vintage }: { id: string; vintage: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(vintage ?? new Date().getFullYear());
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

  async function confirm() {
    setLoading(true);
    await fetch(`/api/wines/${id}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vintage: year }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          fontFamily: "var(--font-inter)",
          boxShadow: "0 1px 6px rgba(26,10,14,0.07)",
        }}
      >
        + Ajouter une bouteille
      </button>

      {open && (
        <div
          className="absolute left-0 mt-2 rounded-2xl p-5 z-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(26,10,14,0.14)",
            width: 240,
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
            Millésime
          </p>
          <input
            type="number"
            min={1900}
            max={2050}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || year)}
            className="w-full mb-4 text-center text-2xl font-bold rounded-xl px-3 py-2 outline-none"
            style={{
              fontFamily: "var(--font-playfair)",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
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
              onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-full text-sm transition-opacity hover:opacity-70"
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
