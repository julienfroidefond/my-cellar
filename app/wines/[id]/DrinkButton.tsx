"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wine } from "lucide-react";
import { StarRatingInput } from "@/components/StarRating";
import { ActionSheet } from "./ActionSheet";

export default function DrinkButton({
  vintageId,
  wineName,
  className = "",
}: {
  vintageId: string;
  wineName: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`btn btn-primary ${className}`}>
        <Wine aria-hidden="true" />
        Boire
      </button>

      <ActionSheet
        open={open}
        onClose={handleCancel}
        title={wineName ? `Boire « ${wineName} »` : "Boire une bouteille"}
        description="Une bouteille sera retirée du stock. La note est facultative."
        footer={
          <>
            <button type="button" onClick={handleCancel} disabled={loading} className="btn btn-secondary btn-lg flex-1">
              Annuler
            </button>
            <button type="button" onClick={handleConfirm} disabled={loading} className="btn btn-primary btn-lg flex-1">
              {loading ? "Enregistrement…" : "Confirmer"}
            </button>
          </>
        }
      >
        <div className="panel py-5">
          <StarRatingInput value={rating} onChange={setRating} size={32} />
          <p className="mt-2 text-center text-sm text-muted tabular">
            {rating != null ? `${rating} / 5` : "Sans note"}
          </p>
        </div>
      </ActionSheet>
    </>
  );
}
