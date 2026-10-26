"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { ActionSheet } from "./ActionSheet";

export default function EditVintagePriceButton({ vintageId, currentPrice }: { vintageId: string; currentPrice: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentPrice?.toString() ?? "");
  const [loading, setLoading] = useState(false);

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

  const Icon = currentPrice != null ? Pencil : Plus;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="-m-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-wine-red"
        aria-label={currentPrice != null ? "Modifier le prix d’achat" : "Ajouter un prix d’achat"}
        title={currentPrice != null ? "Modifier le prix d’achat" : "Ajouter un prix d’achat"}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <ActionSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Prix d’achat"
        description="Prix payé par bouteille. Laisser vide pour l’effacer."
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-lg flex-1">
              Annuler
            </button>
            <button type="button" onClick={save} disabled={loading} className="btn btn-primary btn-lg flex-1">
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="0,00"
            aria-label="Prix d’achat en euros"
            className="input tabular pr-9 text-lg font-semibold"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">€</span>
        </div>
      </ActionSheet>
    </>
  );
}
