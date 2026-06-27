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
  imageUrl: string | null;
}

const COLOR_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  rouge: { label: "Rouge", color: "#c02030", bg: "rgba(160, 28, 46, 0.18)" },
  blanc: { label: "Blanc", color: "#c4983c", bg: "rgba(196, 152, 60, 0.15)" },
  rosé: { label: "Rosé", color: "#d4647a", bg: "rgba(210, 100, 120, 0.15)" },
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
      {/* Page header with subtle background */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(24,15,18,0.8) 0%, var(--background) 100%)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p
            className="text-xs tracking-[0.35em] uppercase mb-3"
            style={{ color: "var(--gold)", fontFamily: "var(--font-inter)", fontWeight: 500 }}
          >
            Inventaire
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
              >
                La collection
              </h1>
              <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                {loading ? "…" : `${wines.length} références · ${totalBottles} bouteilles`}
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un vin…"
                value={search}
                onChange={(e) => setFilter("search", e.target.value)}
                className="w-72 px-5 py-2.5 rounded-full text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-inter)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(196, 152, 60, 0.45)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-6">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-44 animate-pulse"
                style={{ background: "var(--surface-2)" }}
              />
            ))}
          </div>
        ) : wines.length === 0 ? (
          <div className="text-center py-28">
            <div className="text-5xl mb-4">🍾</div>
            <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Aucun vin trouvé</p>
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
  const colorInfo = COLOR_LABELS[wine.color ?? ""] ?? { label: wine.color ?? "", color: "#666", bg: "rgba(255,255,255,0.04)" };

  return (
    <Link
      href={`/wines/${wine.id}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        animationDelay: `${index * 30}ms`,
        animation: "fadeIn 0.4s ease forwards",
        opacity: 0,
      }}
    >
      {/* Top color stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${colorInfo.color}cc, ${colorInfo.color}66)` }} />

      {/* Bottle image — right side, fades into background */}
      {wine.imageUrl && (
        <div
          className="absolute right-0 bottom-0 pointer-events-none"
          style={{ width: 72, top: 3 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, var(--surface-2) 0%, transparent 45%)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wine.imageUrl}
            alt=""
            style={{
              position: "absolute", bottom: 0, right: 6,
              height: "92%", objectFit: "contain",
              opacity: 0.88,
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5))",
            }}
          />
        </div>
      )}

      <div className="p-5" style={{ paddingRight: wine.imageUrl ? 80 : undefined }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="font-semibold leading-snug line-clamp-2 flex-1"
            style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem" }}
          >
            {wine.name}
          </h3>
          {wine.quantity > 1 && (
            <span
              className="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
            >
              ×{wine.quantity}
            </span>
          )}
        </div>

        {wine.producer && (
          <p className="text-sm mb-4" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            {wine.producer}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {wine.vintage && <Tag>{wine.vintage}</Tag>}
          {wine.appellation && <Tag>{wine.appellation}</Tag>}
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: colorInfo.color, boxShadow: `0 0 5px ${colorInfo.color}80` }}
            />
            <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              {colorInfo.label}
            </span>
          </div>
        </div>

        {(wine.marketPrice ?? 0) > 0 && (
          <div
            className="mt-4 pt-4 flex items-baseline gap-1"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="text-base font-bold"
              style={{ color: "var(--gold)", fontFamily: "var(--font-playfair)" }}
            >
              {wine.marketPrice?.toFixed(2)} €
            </span>
            <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
              / bouteille
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full"
      style={{
        background: "rgba(255,255,255,0.07)",
        fontFamily: "var(--font-inter)",
        color: "var(--text-muted)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
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
      className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all duration-200"
      style={{
        background: active ? "var(--wine-red)" : "var(--surface-2)",
        border: `1px solid ${active ? "var(--wine-red)" : "var(--border)"}`,
        color: active ? "white" : "var(--text-muted)",
        fontFamily: "var(--font-inter)",
        fontWeight: active ? 500 : 400,
      }}
    >
      {dot && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: dot, boxShadow: active ? `0 0 6px ${dot}90` : "none" }}
        />
      )}
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
