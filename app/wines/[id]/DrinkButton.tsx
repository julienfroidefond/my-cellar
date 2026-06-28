"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DrinkButton({ vintageId, wineName }: { vintageId: string; wineName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDrink() {
    const label = wineName ? `Marquer une bouteille de "${wineName}" comme bue ?` : "Marquer cette bouteille comme bue ?";
    if (!confirm(label)) return;
    setLoading(true);
    await fetch(`/api/wines/${vintageId}/drink`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDrink}
      disabled={loading}
      className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
      style={{
        background: "rgba(192,25,59,0.08)",
        border: "1px solid rgba(192,25,59,0.22)",
        color: "var(--wine-red)",
        fontFamily: "var(--font-inter)",
      }}
    >
      {loading ? "…" : "Boire"}
    </button>
  );
}
