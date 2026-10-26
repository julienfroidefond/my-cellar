"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { value: "all", label: "Tout" },
  { value: "bu", label: "Dégustations" },
  { value: "ajout", label: "Ajouts" },
  { value: "retiré", label: "Sorties de stock" },
] as const;

export function HistoryFilters({ active, counts }: { active: string; counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", value);
    router.push(`/history?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
      role="group"
      aria-label="Filtrer l’historique"
      data-reveal
    >
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => select(f.value)}
            aria-pressed={isActive}
            className="chip h-10 shrink-0"
          >
            {f.label}
            <span className="tabular opacity-60">{counts[f.value] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
