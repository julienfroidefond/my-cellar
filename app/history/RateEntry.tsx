"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stars, StarRatingInput } from "@/components/StarRating";

export function RateEntry({ id, rating }: { id: string; rating: number | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  if (rating !== null) {
    return (
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <Stars rating={rating} />
      </div>
    );
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
    <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: "1px solid var(--border)" }}>
      <StarRatingInput value={draft} onChange={setDraft} size={18} />
      {draft !== null && (
        <button
          onClick={save}
          disabled={saving}
          className="text-xs font-medium px-3 py-1 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
          style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
        >
          {saving ? "…" : "Enregistrer"}
        </button>
      )}
    </div>
  );
}
