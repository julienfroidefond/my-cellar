"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Wine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  quantity: number;
  color: string | null;
  region: string | null;
  appellation: string | null;
  marketPrice: number | null;
  purchasePrice: number | null;
}

const COLOR_LABELS: Record<string, { label: string; color: string }> = {
  rouge: { label: "Rouge", color: "#8b1a2f" },
  blanc: { label: "Blanc", color: "#c9a96e" },
  rosé: { label: "Rosé", color: "#dc7882" },
};

function WinesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);

  const color = searchParams.get("color") ?? "";
  const region = searchParams.get("region") ?? "";
  const search = searchParams.get("search") ?? "";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (color) params.set("color", color);
    if (region) params.set("region", region);
    if (search) params.set("search", search);
    fetch(`/api/wines?${params}`)
      .then((r) => r.json())
      .then((data) => { setWines(data); setLoading(false); });
  }, [color, region, search]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/wines?${params}`);
  }

  const totalBottles = wines.reduce((s, w) => s + w.quantity, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
            >
              La collection
            </h1>
            <p className="opacity-40 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
              {loading ? "…" : `${wines.length} références · ${totalBottles} bouteilles`}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un vin…"
              value={search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-64 px-4 py-2.5 rounded-full text-sm outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontFamily: "var(--font-inter)",
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <FilterChip active={!color} onClick={() => setFilter("color", "")} label="Tous" />
          {Object.entries(COLOR_LABELS).map(([c, { label, color: dotColor }]) => (
            <FilterChip
              key={c}
              active={color === c}
              onClick={() => setFilter("color", color === c ? "" : c)}
              label={label}
              dot={dotColor}
            />
          ))}
          {region && (
            <FilterChip active onClick={() => setFilter("region", "")} label={`✕ ${region}`} />
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-40 animate-pulse"
                style={{ background: "var(--surface-2)" }}
              />
            ))}
          </div>
        ) : wines.length === 0 ? (
          <div className="text-center py-24 opacity-40">
            <div className="text-5xl mb-4">🍾</div>
            <p style={{ fontFamily: "var(--font-inter)" }}>Aucun vin trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wines.map((wine, i) => (
              <WineCard key={wine.id} wine={wine} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WineCard({ wine, index }: { wine: Wine; index: number }) {
  const colorInfo = COLOR_LABELS[wine.color ?? ""] ?? { label: wine.color ?? "", color: "#666" };

  return (
    <Link
      href={`/wines/${wine.id}`}
      className="group block rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        animationDelay: `${index * 30}ms`,
        animation: "fadeIn 0.4s ease forwards",
        opacity: 0,
      }}
    >
      {/* Color stripe */}
      <div
        className="w-full h-0.5 rounded-full mb-5"
        style={{ background: colorInfo.color, opacity: 0.6 }}
      />

      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-semibold leading-snug line-clamp-2 flex-1"
          style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem" }}
        >
          {wine.name}
        </h3>
        {wine.quantity > 1 && (
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
          >
            ×{wine.quantity}
          </span>
        )}
      </div>

      {wine.producer && (
        <p className="text-sm opacity-40 mt-1" style={{ fontFamily: "var(--font-inter)" }}>
          {wine.producer}
        </p>
      )}

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {wine.vintage && (
          <Tag>{wine.vintage}</Tag>
        )}
        {wine.appellation && <Tag>{wine.appellation}</Tag>}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colorInfo.color }} />
          <span className="text-xs opacity-50" style={{ fontFamily: "var(--font-inter)" }}>
            {colorInfo.label}
          </span>
        </div>
      </div>

      {(wine.marketPrice ?? 0) > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
          >
            {wine.marketPrice?.toFixed(2)} €
          </span>
          <span className="text-xs opacity-30 ml-1" style={{ fontFamily: "var(--font-inter)" }}>
            / bouteille
          </span>
        </div>
      )}
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded"
      style={{ background: "rgba(255,255,255,0.06)", fontFamily: "var(--font-inter)" }}
    >
      {children}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all"
      style={{
        background: active ? "var(--wine-red)" : "var(--surface-2)",
        border: `1px solid ${active ? "var(--wine-red)" : "var(--border)"}`,
        color: active ? "white" : "rgba(245, 240, 235, 0.6)",
        fontFamily: "var(--font-inter)",
      }}
    >
      {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot }} />}
      {label}
    </button>
  );
}

export default function WinesPage() {
  return (
    <Suspense>
      <WinesContent />
    </Suspense>
  );
}
