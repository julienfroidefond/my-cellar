"use client";

import { useState } from "react";
import Link from "next/link";

const PAGE_SIZE = 6;

const colorConfig: Record<string, { label: string; dot: string; border: string }> = {
  rouge: { label: "Rouge", dot: "#c02030", border: "rgba(160, 28, 46, 0.20)" },
  blanc: { label: "Blanc", dot: "#b87a2c", border: "rgba(196, 152, 60, 0.22)" },
  rosé:  { label: "Rosé",  dot: "#d4647a", border: "rgba(210, 100, 120, 0.22)" },
};

interface Wine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  color: string | null;
  appellation: string | null;
  marketPrice: number | null;
  imageUrl: string | null;
}

interface Props {
  initialWines: Wine[];
  total: number;
}

export default function PremiumCarousel({ initialWines, total }: Props) {
  const [wines, setWines] = useState<Wine[]>(initialWines);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [tick, setTick] = useState(0);

  if (total === 0) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const visible = wines.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  async function navigate(dir: "prev" | "next") {
    if (dir === "prev" && !canPrev) return;
    if (dir === "next" && !canNext) return;

    const nextPage = dir === "next" ? page + 1 : page - 1;

    // Fetch if we don't have the next page yet
    if (dir === "next" && (nextPage + 1) * PAGE_SIZE > wines.length && wines.length < total) {
      setLoading(true);
      const res = await fetch(`/api/wines/premium?skip=${wines.length}&take=${PAGE_SIZE}`);
      const data: { wines: Wine[] } = await res.json();
      setWines(prev => [...prev, ...data.wines]);
      setLoading(false);
    }

    setDirection(dir === "next" ? "left" : "right");
    setPage(nextPage);
    setTick(t => t + 1); // bump the key below to replay the slide animation
  }

  const animClass = direction === "left" ? "animate-slide-left" : "animate-slide-right";

  return (
    <section data-reveal>
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}>
            Pépites
          </p>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            Les trésors de la cave
          </h2>
          <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Les vins les plus valorisés de la cave
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 shrink-0 pt-1">
          <span className="text-xs tabular-nums" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
            {page + 1} <span style={{ color: "var(--border)", fontSize: "0.65rem" }}>/ {totalPages}</span>
          </span>
          <div className="flex gap-1.5">
            <NavBtn onClick={() => navigate("prev")} disabled={!canPrev} label="←" />
            <NavBtn onClick={() => navigate("next")} disabled={!canNext || loading} label={loading ? "…" : "→"} />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div key={`${page}-${tick}`} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${animClass}`}>
        {visible.map((wine) => {
          const cfg = colorConfig[wine.color ?? ""] ?? { dot: "#888", border: "rgba(26,10,14,0.10)", label: wine.color ?? "" };
          return (
            <Link
              key={wine.id}
              href={`/wines/${wine.id}`}
              className="rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 block relative overflow-hidden"
              style={{ background: "var(--surface)", border: `1px solid ${cfg.border}`, boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}
            >
              {wine.imageUrl && (
                <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: 80 }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--surface) 0%, transparent 50%)" }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={wine.imageUrl}
                    alt=""
                    loading="lazy"
                    style={{ position: "absolute", bottom: 0, right: 8, height: "95%", objectFit: "contain", opacity: 0.90, filter: "drop-shadow(0 4px 16px rgba(26,10,14,0.18))" }}
                  />
                </div>
              )}

              <div style={{ paddingRight: wine.imageUrl ? 72 : undefined }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                    <span className="text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: "var(--wine-red)", fontFamily: "var(--font-playfair)" }}>
                    {wine.marketPrice?.toFixed(0)} €
                  </span>
                </div>
                <h3 className="font-semibold mb-1 line-clamp-2 leading-snug" style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem", color: "var(--foreground)" }}>
                  {wine.name}
                </h3>
                <div className="flex items-center gap-2 mt-3">
                  {wine.vintage && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface-2)", fontFamily: "var(--font-inter)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      {wine.vintage}
                    </span>
                  )}
                  {wine.appellation && (
                    <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                      {wine.appellation}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {/* Skeleton placeholders while loading */}
        {loading && Array.from({ length: PAGE_SIZE - visible.length }).map((_, i) => (
          <div key={`sk-${i}`} className="rounded-2xl animate-pulse" style={{ height: 160, background: "var(--surface-2)", border: "1px solid var(--border)" }} />
        ))}
      </div>

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === page ? 20 : 6,
                height: 6,
                background: i === page ? "var(--wine-red)" : "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NavBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all"
      style={{
        background: disabled ? "var(--surface-2)" : "var(--surface)",
        border: `1px solid ${disabled ? "var(--border)" : "rgba(192,25,59,0.25)"}`,
        color: disabled ? "var(--text-faint)" : "var(--wine-red)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-inter)",
      }}
    >
      {label}
    </button>
  );
}
