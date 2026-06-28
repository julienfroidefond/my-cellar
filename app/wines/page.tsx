"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { estimateMaturity } from "@/lib/maturity";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WineVintage {
  id: string;
  wineId: string;
  vintage: number | null;
  quantity: number;
  volume: number;
  purchasePrice: number | null;
  marketPrice: number | null;
  drinkFrom: number | null;
  drinkUntil: number | null;
  slots: { id: string }[];
}

interface Wine {
  id: string;
  name: string;
  producer: string | null;
  color: string | null;
  region: string | null;
  appellation: string | null;
  country: string | null;
  grapeVarieties: string | null;
  notes: string | null;
  imageUrl: string | null;
  vintages: WineVintage[];
}

interface Filters {
  color: string;
  country: string;
  region: string;
  grape: string;
  priceMin: string;
  priceMax: string;
  stock: "" | "in" | "out";
  racked: "" | "yes" | "no";
  maturity: "" | "optimal" | "bientôt" | "dépassé";
  search: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS: Record<string, { label: string; color: string }> = {
  rouge: { label: "Rouge", color: "#c02030" },
  blanc: { label: "Blanc", color: "#c4983c" },
  rosé:  { label: "Rosé",  color: "#d4647a" },
};

const EMPTY_FILTERS: Filters = {
  color: "", country: "", region: "", grape: "",
  priceMin: "", priceMax: "", stock: "", racked: "", maturity: "", search: "",
};

function splitGrapes(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/[,;/]/).map(s => s.trim()).filter(Boolean);
}

// Helpers to compute aggregated wine properties from vintages
function totalQuantity(wine: Wine): number {
  return wine.vintages.reduce((s, v) => s + v.quantity, 0);
}

function isRacked(wine: Wine): boolean {
  return wine.vintages.some(v => v.slots?.length > 0);
}

function bestMarketPrice(wine: Wine): number | null {
  const prices = wine.vintages.map(v => v.marketPrice).filter((p): p is number => p != null);
  return prices.length > 0 ? Math.max(...prices) : null;
}

// ─── Main content ─────────────────────────────────────────────────────────────

function WinesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allWines, setAllWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  type SortKey = "name" | "stock-desc" | "price-desc" | "vintage-desc";
  const [sort, setSort] = useState<SortKey>(() => {
    try { return (localStorage.getItem("wine-sort") as SortKey) || "name"; } catch { return "name"; }
  });

  const [filters, setFilters] = useState<Filters>(() => {
    // URL params have highest priority (shareable links, dashboard clicks)
    const fromUrl: Filters = {
      color:    searchParams.get("color")    ?? "",
      country:  searchParams.get("country")  ?? "",
      region:   searchParams.get("region")   ?? "",
      grape:    searchParams.get("grape")    ?? "",
      priceMin: searchParams.get("priceMin") ?? "",
      priceMax: searchParams.get("priceMax") ?? "",
      stock:    (searchParams.get("stock")    as Filters["stock"])    ?? "",
      racked:   (searchParams.get("racked")  as Filters["racked"])   ?? "",
      maturity: (searchParams.get("maturity") as Filters["maturity"]) ?? "",
      search:   searchParams.get("search")   ?? "",
    };
    if (Object.values(fromUrl).some(Boolean)) return fromUrl;

    // Restore from localStorage (search is intentionally excluded)
    try {
      const saved = localStorage.getItem("wine-filters");
      if (saved) return { ...EMPTY_FILTERS, ...JSON.parse(saved), search: "" };
    } catch {}

    return EMPTY_FILTERS;
  });

  // Fetch once, filter client-side
  useEffect(() => {
    fetch("/api/wines")
      .then(r => r.json())
      .then(data => { setAllWines(data); setLoading(false); });
  }, []);

  // Persist sort to localStorage
  useEffect(() => {
    try { localStorage.setItem("wine-sort", sort); } catch {}
  }, [sort]);

  // Persist to localStorage + sync URL
  useEffect(() => {
    const { search: _, ...toSave } = filters;
    try { localStorage.setItem("wine-filters", JSON.stringify(toSave)); } catch {}

    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v as string);
    router.replace(`/wines${p.toString() ? `?${p}` : ""}`, { scroll: false });
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter options derived from ALL wines (not filtered subset)
  const options = useMemo(() => ({
    countries: [...new Set(allWines.map(w => w.country).filter(Boolean) as string[])].sort(),
    regions:   [...new Set(allWines.map(w => w.region).filter(Boolean) as string[])].sort(),
    grapes:    [...new Set(allWines.flatMap(w => splitGrapes(w.grapeVarieties)))].sort(),
  }), [allWines]);

  const currentYear = new Date().getFullYear();

  // Client-side filtering
  const wines = useMemo(() => allWines.filter(w => {
    if (filters.color   && w.color   !== filters.color)   return false;
    if (filters.country && w.country !== filters.country)  return false;
    if (filters.region  && w.region  !== filters.region)   return false;
    if (filters.grape) {
      const q = filters.grape.toLowerCase();
      if (!w.grapeVarieties?.toLowerCase().includes(q)) return false;
    }
    const mktPrice = bestMarketPrice(w);
    if (filters.priceMin !== "" && (mktPrice ?? 0) < parseFloat(filters.priceMin)) return false;
    if (filters.priceMax !== "" && (mktPrice ?? 0) > parseFloat(filters.priceMax)) return false;

    const qty = totalQuantity(w);
    if (filters.stock === "in"  && qty <= 0) return false;
    if (filters.stock === "out" && qty > 0)  return false;

    if (filters.racked === "yes" && !isRacked(w))  return false;
    if (filters.racked === "no"  &&  isRacked(w))  return false;

    if (filters.maturity) {
      // Use the first vintage with a drink window for maturity check
      const vintageWithWindow = w.vintages.find(v => {
        const hasManual = !!(v.drinkFrom && v.drinkUntil);
        const est = !hasManual ? estimateMaturity({ region: w.region, appellation: w.appellation, color: w.color, vintage: v.vintage }) : null;
        const from  = v.drinkFrom  ?? est?.drinkFrom  ?? null;
        const until = v.drinkUntil ?? est?.drinkUntil ?? null;
        return from && until;
      });
      if (!vintageWithWindow) return false;

      const hasManual = !!(vintageWithWindow.drinkFrom && vintageWithWindow.drinkUntil);
      const est = !hasManual ? estimateMaturity({ region: w.region, appellation: w.appellation, color: w.color, vintage: vintageWithWindow.vintage }) : null;
      const from  = vintageWithWindow.drinkFrom  ?? est?.drinkFrom  ?? null;
      const until = vintageWithWindow.drinkUntil ?? est?.drinkUntil ?? null;
      if (!from || !until) return false;
      const status =
        currentYear > until   ? "dépassé" :
        currentYear >= from   ? "optimal" :
        currentYear >= from - 2 ? "bientôt" : "trop-tôt";
      if (status !== filters.maturity) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!`${w.name} ${w.producer ?? ""} ${w.appellation ?? ""} ${w.region ?? ""} ${w.country ?? ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sort) {
      case "stock-desc":  return totalQuantity(b) - totalQuantity(a);
      case "price-desc":  return (bestMarketPrice(b) ?? -1) - (bestMarketPrice(a) ?? -1);
      case "vintage-desc": {
        const va = Math.max(0, ...a.vintages.map(v => v.vintage ?? 0));
        const vb = Math.max(0, ...b.vintages.map(v => v.vintage ?? 0));
        return vb - va;
      }
      default: return a.name.localeCompare(b.name, "fr");
    }
  }), [allWines, filters, sort, currentYear]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(f => ({ ...f, [key]: value }));
  }
  function toggle<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(f => ({ ...f, [key]: f[key] === value ? "" as Filters[K] : value }));
  }

  const activeCount = [
    filters.color, filters.country, filters.region, filters.grape,
    filters.priceMin || filters.priceMax ? "x" : "",
    filters.stock, filters.racked, filters.maturity,
  ].filter(Boolean).length;

  const totalBottles = wines.reduce((s, w) => s + totalQuantity(w), 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Page header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 500 }}>
            Inventaire
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
                La collection
              </h1>
              <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                {loading ? "…" : `${wines.length} référence${wines.length > 1 ? "s" : ""} · ${totalBottles} bouteille${totalBottles > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeCount > 0 && (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="text-xs px-3 py-2 rounded-full transition-opacity hover:opacity-80"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  Tout effacer
                </button>
              )}
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="px-4 py-2.5 rounded-full text-sm outline-none cursor-pointer"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter)", appearance: "none", paddingRight: "2rem" }}
              >
                <option value="name">A → Z</option>
                <option value="stock-desc">Stock ↓</option>
                <option value="price-desc">Prix ↓</option>
                <option value="vintage-desc">Millésime ↓</option>
              </select>
              <input
                type="text"
                placeholder="Rechercher un vin…"
                value={filters.search}
                onChange={e => set("search", e.target.value)}
                className="w-64 px-5 py-2.5 rounded-full text-sm outline-none transition-all"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-inter)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(192,25,59,0.40)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </div>

          {/* ── Filter row ── */}
          <div className="flex flex-wrap gap-2 mt-6 items-center">
            {/* Color */}
            <Chip active={!filters.color} onClick={() => set("color", "")} label="Tous" />
            {Object.entries(COLORS).map(([c, { label, color }]) => (
              <Chip key={c} active={filters.color === c} onClick={() => toggle("color", c)} label={label} dot={color} />
            ))}

            {/* Maturité */}
            <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />
            {([
              ["optimal",  "✓ Prêtes",  "#1a7a3c"],
              ["bientôt",  "~ Bientôt", "#b87a2c"],
              ["dépassé",  "✗ Passées", "rgba(26,10,14,0.4)"],
            ] as [Filters["maturity"], string, string][]).map(([v, label, color]) => (
              <button
                key={v}
                onClick={() => toggle("maturity", v)}
                className="flex items-center rounded-full transition-all duration-200"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-inter)",
                  background: filters.maturity === v ? `${color}18` : "var(--surface)",
                  border: `1px solid ${filters.maturity === v ? color : "var(--border)"}`,
                  color: filters.maturity === v ? color : "var(--text-muted)",
                  fontWeight: filters.maturity === v ? 500 : 400,
                }}
              >
                {label}
              </button>
            ))}

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all"
              style={{
                fontFamily: "var(--font-inter)",
                background: (showFilters || activeCount > 0) ? "rgba(192,25,59,0.08)" : "var(--surface-2)",
                border: (showFilters || activeCount > 0) ? "1px solid rgba(192,25,59,0.25)" : "1px solid var(--border)",
                color: (showFilters || activeCount > 0) ? "var(--wine-red)" : "var(--text-muted)",
              }}
            >
              <span style={{ fontSize: 13 }}>⚙</span>
              Filtres {activeCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--wine-red)", color: "white" }}>{activeCount}</span>}
              <span style={{ fontSize: 10 }}>{showFilters ? "▲" : "▼"}</span>
            </button>
          </div>

          {/* ── Expanded filter panel ── */}
          {showFilters && (
            <div
              className="mt-4 rounded-2xl p-5 space-y-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {/* Country */}
              {options.countries.length > 0 && (
                <FilterSection label="Pays">
                  <div className="flex flex-wrap gap-2">
                    <Chip active={!filters.country} onClick={() => set("country", "")} label="Tous" small />
                    {options.countries.map(c => (
                      <Chip key={c} active={filters.country === c} onClick={() => toggle("country", c)} label={c} small />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Region */}
              {options.regions.length > 0 && (
                <FilterSection label="Région">
                  <RegionSelect
                    options={options.regions}
                    value={filters.region}
                    onChange={v => set("region", v)}
                  />
                </FilterSection>
              )}

              {/* Grape + Price */}
              <div className="grid sm:grid-cols-2 gap-5">
                <FilterSection label="Cépage">
                  <input
                    type="text"
                    value={filters.grape}
                    onChange={e => set("grape", e.target.value)}
                    placeholder="Merlot, Chardonnay…"
                    className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-inter)" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(192,25,59,0.40)")}
                    onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                  />
                  {filters.grape && options.grapes.filter(g => g.toLowerCase().includes(filters.grape.toLowerCase())).slice(0, 6).map(g => (
                    <button
                      key={g}
                      onClick={() => set("grape", g)}
                      className="mt-1 mr-1.5 text-xs px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                      style={{ background: "rgba(26,10,14,0.06)", border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                    >
                      {g}
                    </button>
                  ))}
                </FilterSection>

                <FilterSection label="Prix marché (€)">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={filters.priceMin}
                      onChange={e => set("priceMin", e.target.value)}
                      placeholder="Min"
                      min={0}
                      className="w-full px-4 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-inter)" }}
                    />
                    <span style={{ color: "var(--text-faint)" }}>—</span>
                    <input
                      type="number"
                      value={filters.priceMax}
                      onChange={e => set("priceMax", e.target.value)}
                      placeholder="Max"
                      min={0}
                      className="w-full px-4 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-inter)" }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[[0,20,"< 20 €"],[20,50,"20–50 €"],[50,100,"50–100 €"],[100,0,"+ 100 €"]].map(([min, max, label]) => (
                      <button
                        key={label as string}
                        onClick={() => setFilters(f => ({ ...f, priceMin: min ? String(min) : "", priceMax: max ? String(max) : "" }))}
                        className="text-xs px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                        style={{ background: "rgba(26,10,14,0.06)", border: "1px solid var(--border)", color: "var(--text-faint)", fontFamily: "var(--font-inter)" }}
                      >
                        {label as string}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>

              {/* Stock + Racked */}
              <div className="grid sm:grid-cols-2 gap-5">
                <FilterSection label="En possession">
                  <div className="flex gap-2">
                    {([["", "Tous"], ["in", "En cave"], ["out", "Épuisé"]] as [Filters["stock"], string][]).map(([v, label]) => (
                      <ToggleBtn key={v} active={filters.stock === v} onClick={() => set("stock", v)} label={label} />
                    ))}
                  </div>
                </FilterSection>

                <FilterSection label="Casier">
                  <div className="flex gap-2">
                    {([["", "Tous"], ["yes", "Rangé"], ["no", "Non rangé"]] as [Filters["racked"], string][]).map(([v, label]) => (
                      <ToggleBtn key={v} active={filters.racked === v} onClick={() => set("racked", v)} label={label} />
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Wine grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        ) : wines.length === 0 ? (
          <div className="text-center py-28">
            <div className="text-4xl mb-4" style={{ opacity: 0.3 }}>🍾</div>
            <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Aucun vin ne correspond à ces filtres</p>
            {activeCount > 0 && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="mt-4 text-sm px-5 py-2 rounded-full transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.25)", background: "rgba(192,25,59,0.08)" }}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wines.map((wine, i) => <WineCard key={wine.id} wine={wine} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wine card ────────────────────────────────────────────────────────────────

function WineCard({ wine, index }: { wine: Wine; index: number }) {
  const colorInfo = COLORS[wine.color ?? ""] ?? { label: wine.color ?? "", color: "#666" };
  const qty = totalQuantity(wine);
  const allEpuise = qty === 0;
  const hasMultipleVintages = wine.vintages.length > 1;
  const mktPrice = bestMarketPrice(wine);
  const racked = isRacked(wine);

  return (
    <Link
      href={`/wines/${wine.id}`}
      className="group block rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 relative"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(26,10,14,0.06)",
        animation: `fadeIn 0.4s ease ${index * 30}ms forwards`,
        opacity: 0,
      }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${colorInfo.color}cc, ${colorInfo.color}44)` }} />

      {wine.imageUrl && (
        <div className="absolute right-0 bottom-0 pointer-events-none" style={{ width: 72, top: 3 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--surface) 0%, transparent 45%)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wine.imageUrl}
            alt=""
            style={{ position: "absolute", bottom: 0, right: 6, height: "92%", objectFit: "contain", opacity: 0.88, filter: "drop-shadow(0 4px 16px rgba(26,10,14,0.12))" }}
          />
        </div>
      )}

      <div className="p-5" style={{ paddingRight: wine.imageUrl ? 80 : undefined }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold leading-snug line-clamp-2 flex-1" style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem", color: "var(--foreground)" }}>
            {wine.name}
          </h3>
          {allEpuise ? (
            <span className="shrink-0 text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(26,10,14,0.06)", color: "var(--text-faint)", fontFamily: "var(--font-inter)", border: "1px solid var(--border)" }}>
              Épuisé
            </span>
          ) : qty > 1 ? (
            <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}>
              ×{qty}
            </span>
          ) : null}
        </div>

        {wine.producer && (
          <p className="text-sm mb-3" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{wine.producer}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Vintages display */}
          {hasMultipleVintages ? (
            <div className="flex flex-wrap gap-1">
              {wine.vintages.map(v => (
                <Tag key={v.id}>
                  {v.vintage ?? "N/A"}{v.quantity > 0 ? ` ×${v.quantity}` : " ×0"}
                </Tag>
              ))}
            </div>
          ) : wine.vintages[0]?.vintage ? (
            <Tag>{wine.vintages[0].vintage}</Tag>
          ) : null}
          {wine.appellation && !hasMultipleVintages && <Tag>{wine.appellation}</Tag>}
          <div className="ml-auto flex items-center gap-1.5">
            {racked
              ? <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>📦</span>
              : qty > 0 && <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>—</span>
            }
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colorInfo.color, boxShadow: `0 0 5px ${colorInfo.color}80` }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{colorInfo.label}</span>
          </div>
        </div>

        {(mktPrice ?? 0) > 0 && (
          <div className="mt-3 pt-3 flex items-baseline gap-1" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-base font-bold" style={{ color: "var(--gold)", fontFamily: "var(--font-playfair)" }}>
              {mktPrice?.toFixed(2)} €
            </span>
            <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>/ bouteille</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Region selector (chips + scroll si beaucoup) ─────────────────────────────

function RegionSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 8;
  const shown = expanded ? options : options.slice(0, MAX);
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={!value} onClick={() => onChange("")} label="Toutes" small />
      {shown.map(r => (
        <Chip key={r} active={value === r} onClick={() => onChange(value === r ? "" : r)} label={r} small />
      ))}
      {options.length > MAX && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs px-3 py-1 rounded-full transition-opacity hover:opacity-80"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)", border: "1px solid var(--border)" }}
        >
          {expanded ? "Moins" : `+${options.length - MAX} autres`}
        </button>
      )}
    </div>
  );
}

// ─── Filter section wrapper ───────────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] mb-2.5 font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ active, onClick, label, dot, small }: { active: boolean; onClick: () => void; label: string; dot?: string; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full transition-all duration-200"
      style={{
        padding: small ? "4px 12px" : "6px 16px",
        fontSize: small ? "0.75rem" : "0.875rem",
        background: active ? "rgba(192,25,59,0.08)" : "var(--surface)",
        border: `1px solid ${active ? "rgba(192,25,59,0.22)" : "var(--border)"}`,
        color: active ? "var(--wine-red)" : "var(--text-muted)",
        fontFamily: "var(--font-inter)",
        fontWeight: active ? 500 : 400,
      }}
    >
      {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot, boxShadow: active ? `0 0 6px ${dot}90` : "none" }} />}
      {label}
    </button>
  );
}

// ─── Toggle button (3-state row) ──────────────────────────────────────────────

function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
      style={{
        fontFamily: "var(--font-inter)",
        background: active ? "rgba(192,25,59,0.08)" : "var(--surface-2)",
        border: active ? "1px solid rgba(192,25,59,0.25)" : "1px solid var(--border)",
        color: active ? "var(--wine-red)" : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full"
      style={{ background: "var(--surface-2)", fontFamily: "var(--font-inter)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
    >
      {children}
    </span>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function WinesPage() {
  return (
    <Suspense>
      <WinesContent />
    </Suspense>
  );
}
