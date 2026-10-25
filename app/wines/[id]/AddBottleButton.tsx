"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

export default function AddBottleButton({ id, vintage }: { id: string; vintage: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(vintage ?? new Date().getFullYear());
  const [quantity, setQuantity] = useState("1");
  const qty = Math.min(99, Math.max(1, parseInt(quantity) || 1));
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/wines/${id}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vintage: year, quantity: qty }),
    });
    setLoading(false);
    setOpen(false);
    setQuantity("1");
    router.refresh();
  }

  function toggle() {
    if (!open) setQuantity("1");
    setOpen((v) => !v);
  }

  return (
    <div className="relative sm:inline-block" ref={panelRef}>
      <button
        onClick={toggle}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          background: "var(--wine-red)",
          color: "#fff",
          fontFamily: "var(--font-inter)",
        }}
      >
        <Plus size={16} strokeWidth={2.1} aria-hidden="true" />
        Ajouter une bouteille
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-2xl p-5 z-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(26,10,14,0.14)",
            width: 260,
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
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

          <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
            Quantité
          </p>
          <div className="mb-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(String(Math.max(1, qty - 1)))}
              disabled={qty <= 1}
              aria-label="Diminuer la quantité"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-70 disabled:opacity-30 disabled:hover:opacity-30"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Minus size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
              onBlur={() => setQuantity(String(qty))}
              aria-label="Quantité"
              className="h-10 min-w-0 flex-1 rounded-xl text-center text-xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              style={{
                fontFamily: "var(--font-playfair)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <button
              type="button"
              onClick={() => setQuantity(String(Math.min(99, qty + 1)))}
              disabled={qty >= 99}
              aria-label="Augmenter la quantité"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-70 disabled:opacity-30 disabled:hover:opacity-30"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={confirm}
              disabled={loading}
              className="h-9 flex-1 whitespace-nowrap rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
            >
              {loading ? "…" : "Confirmer"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="h-9 flex-1 rounded-full text-sm transition-opacity hover:opacity-70"
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
