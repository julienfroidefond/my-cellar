"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { value: "all", label: "Tout" },
  { value: "bu", label: "Dégustations" },
  { value: "retiré", label: "Sorties de stock" },
] as const;

export function HistoryFilters({ active, counts }: { active: string; counts: Record<string, number> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    const query = params.toString();
    router.push(query ? `/history?${query}` : "/history", { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => select(f.value)}
            className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter)",
              background: isActive ? "var(--wine-red)" : "var(--surface)",
              color: isActive ? "#fff" : "var(--text-muted)",
              border: `1px solid ${isActive ? "var(--wine-red)" : "var(--border)"}`,
            }}
          >
            {f.label}
            <span className="ml-1.5 opacity-70 tabular-nums">{counts[f.value] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
