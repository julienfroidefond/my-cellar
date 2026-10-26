"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Stars, StarRatingInput } from "@/components/StarRating";

export function RateEntry({ id, rating }: { id: string; rating: number | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  if (rating !== null) {
    return <Stars rating={rating} />;
  }

  async function save() {
    if (draft === null) return;
    setSaving(true);
    await fetch(`/api/history/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: draft }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <StarRatingInput value={draft} onChange={setDraft} size={18} />
      {draft !== null && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn btn-primary btn-sm shrink-0"
        >
          <Check />
          {saving ? "…" : "Noter"}
        </button>
      )}
    </div>
  );
}
