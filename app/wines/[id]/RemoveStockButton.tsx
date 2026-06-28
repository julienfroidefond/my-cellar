"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveStockButton({ vintageId }: { vintageId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Retirer une bouteille du stock ?")) return;
    setLoading(true);
    await fetch(`/api/wines/${vintageId}/remove`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
      style={{
        background: "rgba(26,10,14,0.05)",
        border: "1px solid rgba(26,10,14,0.15)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-inter)",
      }}
    >
      {loading ? "…" : "Retirer"}
    </button>
  );
}
