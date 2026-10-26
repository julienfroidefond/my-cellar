"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { ActionSheet } from "./ActionSheet";

export default function AddBottleButton({ id, vintage }: { id: string; vintage: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(vintage ?? new Date().getFullYear());
  const [quantity, setQuantity] = useState("1");
  const qty = Math.min(99, Math.max(1, parseInt(quantity) || 1));
  const [loading, setLoading] = useState(false);

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
    <>
      <button type="button" onClick={toggle} className="btn btn-secondary">
        <Plus aria-hidden="true" />
        Ajouter
      </button>

      <ActionSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter des bouteilles"
        description="Le millésime est créé s’il n’existe pas encore."
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-lg flex-1">
              Annuler
            </button>
            <button type="button" onClick={confirm} disabled={loading} className="btn btn-primary btn-lg flex-1">
              {loading ? "Ajout…" : "Ajouter"}
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <div>
            <label htmlFor="add-vintage" className="label mb-1.5 block">
              Millésime
            </label>
            <input
              id="add-vintage"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2050}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || year)}
              className="input tabular text-center text-lg font-semibold"
            />
          </div>

          <div>
            <label htmlFor="add-quantity" className="label mb-1.5 block">
              Quantité
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(String(Math.max(1, qty - 1)))}
                disabled={qty <= 1}
                aria-label="Diminuer la quantité"
                className="btn btn-secondary btn-icon h-11 w-11 shrink-0"
              >
                <Minus aria-hidden="true" />
              </button>
              <input
                id="add-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                onBlur={() => setQuantity(String(qty))}
                className="input tabular min-w-0 flex-1 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(String(Math.min(99, qty + 1)))}
                disabled={qty >= 99}
                aria-label="Augmenter la quantité"
                className="btn btn-secondary btn-icon h-11 w-11 shrink-0"
              >
                <Plus aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </ActionSheet>
    </>
  );
}
