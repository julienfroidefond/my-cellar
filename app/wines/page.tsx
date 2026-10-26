"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  Clock,
  Hourglass,
  LayoutGrid,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BottleSilhouette, WineColor, WineTile } from "@/components/WineTile";
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

const COLORS: Record<string, { label: string }> = {
  rouge: { label: "Rouge" },
  blanc: { label: "Blanc" },
  rosé:  { label: "Rosé" },
};

const SORT_OPTIONS: [string, string][] = [
  ["name", "Nom (A–Z)"],
  ["stock-desc", "Stock décroissant"],
  ["price-desc", "Prix décroissant"],
  ["vintage-desc", "Millésime récent"],
];

const MATURITY_OPTIONS: [Filters["maturity"], string, LucideIcon][] = [
  ["optimal", "Prêtes", Check],
  ["bientôt", "Bientôt", Hourglass],
  ["dépassé", "Passées", Clock],
];

const PRICE_PRESETS: [number, number, string][] = [
  [0, 20, "< 20 €"],
  [20, 50, "20–50 €"],
  [50, 100, "50–100 €"],
  [100, 0, "100 € et +"],
];

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
    // `search` is intentionally not persisted (it is not part of saved filters)
    const toSave: Partial<Filters> = { ...filters };
    delete toSave.search;
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

  const resultLabel = `${wines.length} vin${wines.length > 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader
        eyebrow="Inventaire"
        title="La collection"
        lead={loading ? "Chargement…" : `${wines.length} référence${wines.length > 1 ? "s" : ""} · ${totalBottles} bouteille${totalBottles > 1 ? "s" : ""}`}
      />

      {/* ── Barre d'outils collante : recherche, tri, filtres rapides ── */}
      <div className="sticky top-[var(--nav-height)] z-[var(--z-sticky)] border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container-page flex flex-col gap-3 py-3">
          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Rechercher un vin</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                placeholder="Rechercher un vin, un domaine…"
                value={filters.search}
                onChange={e => set("search", e.target.value)}
                className="input pl-9"
              />
            </label>

            <label className="relative hidden shrink-0 sm:block">
              <span className="sr-only">Trier par</span>
              <ArrowDownUp aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="input w-auto cursor-pointer appearance-none pl-9 pr-9"
              >
                {SORT_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            </label>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              aria-haspopup="dialog"
              aria-expanded={showFilters}
              className={`btn h-11 shrink-0 ${activeCount > 0 ? "btn-dark" : "btn-secondary"}`}
            >
              <SlidersHorizontal />
              <span className="hidden sm:inline">Filtres</span>
              {activeCount > 0 && (
                <span className="badge h-5 min-w-5 px-1.5 text-[0.6875rem]">{activeCount}</span>
              )}
            </button>
          </div>

          {/* Filtres rapides : défilement horizontal sur mobile */}
          <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
            <button type="button" className="chip" aria-pressed={!filters.color} onClick={() => set("color", "")}>
              Tous
            </button>
            {Object.entries(COLORS).map(([c, { label }]) => (
              <button key={c} type="button" className="chip" aria-pressed={filters.color === c} onClick={() => toggle("color", c)}>
                <span className="wine-dot" data-color={c} />
                {label}
              </button>
            ))}

            <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border-strong" />

            {MATURITY_OPTIONS.map(([v, label, Icon]) => (
              <button key={v} type="button" className="chip" aria-pressed={filters.maturity === v} onClick={() => toggle("maturity", v)}>
                <Icon />
                {label}
              </button>
            ))}

            {/* Tri accessible sur mobile, à côté des filtres rapides */}
            <label className="relative shrink-0 sm:hidden">
              <span className="sr-only">Trier par</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="chip appearance-none pr-7"
              >
                {SORT_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            </label>

            {activeCount > 0 && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="btn btn-ghost btn-sm shrink-0 lg:ml-auto">
                <X />
                Tout effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Grille des vins ── */}
      <div className="container-page py-8 md:py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[140px] animate-pulse rounded-[var(--radius-lg)] bg-surface-2" />
            ))}
          </div>
        ) : wines.length === 0 ? (
          <div className="card mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center">
            <BottleSilhouette className="h-20 w-auto text-surface-3" />
            <h2 className="text-title mt-5">Aucun vin trouvé</h2>
            <p className="mt-1.5 text-sm text-muted">
              {activeCount > 0 || filters.search
                ? "Aucun vin ne correspond à ces critères. Élargissez la recherche ou retirez des filtres."
                : "La collection est vide pour le moment."}
            </p>
            {activeCount > 0 || filters.search ? (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="btn btn-soft mt-6">
                <X />
                Effacer les filtres
              </button>
            ) : (
              <Link href="/wines/add" className="btn btn-primary mt-6">
                <Plus />
                Ajouter un vin
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {wines.map((wine) => <WineCard key={wine.id} wine={wine} />)}
          </div>
        )}
      </div>

      {/* ── Panneau de filtres avancés ── */}
      <div
        className={`overlay transition-opacity duration-200 ${showFilters ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowFilters(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        inert={!showFilters}
        className={`fixed inset-x-0 bottom-0 z-[var(--z-modal)] transition-[transform,opacity,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6 ${
          showFilters ? "visible translate-y-0 opacity-100" : "invisible translate-y-full opacity-100 sm:translate-y-4 sm:opacity-0"
        } sm:pointer-events-none`}
      >
        <div className="sheet flex w-full flex-col sm:pointer-events-auto sm:max-h-[86dvh] sm:max-w-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
            <h2 id="filters-title" className="font-display text-xl font-semibold">Filtres</h2>
            <button type="button" onClick={() => setShowFilters(false)} className="btn btn-ghost btn-icon" aria-label="Fermer les filtres">
              <X />
            </button>
          </div>

          <div className="space-y-6 px-5 py-5">
            {options.countries.length > 0 && (
              <FilterSection label="Pays">
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="chip" aria-pressed={!filters.country} onClick={() => set("country", "")}>Tous</button>
                  {options.countries.map(c => (
                    <button key={c} type="button" className="chip" aria-pressed={filters.country === c} onClick={() => toggle("country", c)}>{c}</button>
                  ))}
                </div>
              </FilterSection>
            )}

            {options.regions.length > 0 && (
              <FilterSection label="Région">
                <RegionSelect
                  options={options.regions}
                  value={filters.region}
                  onChange={v => set("region", v)}
                />
              </FilterSection>
            )}

            <FilterSection label="Cépage" htmlFor="filter-grape">
              <input
                id="filter-grape"
                type="text"
                value={filters.grape}
                onChange={e => set("grape", e.target.value)}
                placeholder="Merlot, Chardonnay…"
                className="input"
              />
              {filters.grape && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {options.grapes.filter(g => g.toLowerCase().includes(filters.grape.toLowerCase())).slice(0, 6).map(g => (
                    <button key={g} type="button" onClick={() => set("grape", g)} className="chip h-8">
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </FilterSection>

            <FilterSection label="Prix marché (€)">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={filters.priceMin}
                  onChange={e => set("priceMin", e.target.value)}
                  placeholder="Min"
                  aria-label="Prix minimum"
                  min={0}
                  className="input tabular"
                />
                <Minus aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
                <input
                  type="number"
                  inputMode="decimal"
                  value={filters.priceMax}
                  onChange={e => set("priceMax", e.target.value)}
                  placeholder="Max"
                  aria-label="Prix maximum"
                  min={0}
                  className="input tabular"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRICE_PRESETS.map(([min, max, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={filters.priceMin === (min ? String(min) : "") && filters.priceMax === (max ? String(max) : "") && Boolean(min || max)}
                    onClick={() => setFilters(f => ({ ...f, priceMin: min ? String(min) : "", priceMax: max ? String(max) : "" }))}
                    className="chip h-8"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <div className="grid gap-6">
              <FilterSection label="En possession">
                <div className="segmented w-full">
                  {([["", "Tous"], ["in", "En cave"], ["out", "Épuisé"]] as [Filters["stock"], string][]).map(([v, label]) => (
                    <button key={v} type="button" aria-pressed={filters.stock === v} onClick={() => set("stock", v)} className="flex-1 justify-center">
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection label="Casier">
                <div className="segmented w-full">
                  {([["", "Tous"], ["yes", "Rangé"], ["no", "Non rangé"]] as [Filters["racked"], string][]).map(([v, label]) => (
                    <button key={v} type="button" aria-pressed={filters.racked === v} onClick={() => set("racked", v)} className="flex-1 justify-center">
                      {label}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-surface px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
            <button
              type="button"
              onClick={() => setFilters(f => ({ ...EMPTY_FILTERS, search: f.search }))}
              disabled={activeCount === 0}
              className="btn btn-ghost"
            >
              Réinitialiser
            </button>
            <button type="button" onClick={() => setShowFilters(false)} className="btn btn-primary ml-auto">
              Voir {resultLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Wine card ────────────────────────────────────────────────────────────────

function WineCard({ wine }: { wine: Wine }) {
  const qty = totalQuantity(wine);
  const allEpuise = qty === 0;
  const hasMultipleVintages = wine.vintages.length > 1;
  const mktPrice = bestMarketPrice(wine);
  const racked = isRacked(wine);

  return (
    <div data-reveal>
      <WineTile
        href={`/wines/${wine.id}`}
        name={wine.name}
        imageUrl={wine.imageUrl}
        className={`h-full ${allEpuise ? "opacity-70" : ""}`}
        meta={
          <>
            <WineColor color={wine.color} />
            {wine.producer && (
              <span className="min-w-0 truncate text-faint">· {wine.producer}</span>
            )}
          </>
        }
        footer={
          <>
            {allEpuise ? (
              <span className="badge badge-muted">Épuisé</span>
            ) : (
              <span className="badge badge-wine" title={`${qty} bouteille${qty > 1 ? "s" : ""}`}>×{qty}</span>
            )}
            {hasMultipleVintages ? (
              wine.vintages.map(v => (
                <span key={v.id} className="tag">
                  {v.vintage ?? "N/A"} ×{v.quantity}
                </span>
              ))
            ) : wine.vintages[0]?.vintage ? (
              <span className="tag">{wine.vintages[0].vintage}</span>
            ) : null}
            {wine.appellation && !hasMultipleVintages && (
              <span className="tag max-w-[16ch] truncate">{wine.appellation}</span>
            )}
            {racked && (
              <span className="inline-flex items-center text-faint" title="Rangé en cave">
                <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="sr-only">Rangé en cave</span>
              </span>
            )}
          </>
        }
        aside={
          (mktPrice ?? 0) > 0 ? (
            <span className="stat-value text-[1.1rem] text-gold" title={`${mktPrice?.toFixed(2)} € / bouteille`}>
              {Math.round(mktPrice ?? 0)}&nbsp;€
            </span>
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Region selector (chips + « voir plus » si beaucoup) ──────────────────────

function RegionSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 8;
  const shown = expanded ? options : options.slice(0, MAX);
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="chip" aria-pressed={!value} onClick={() => onChange("")}>Toutes</button>
      {shown.map(r => (
        <button key={r} type="button" className="chip" aria-pressed={value === r} onClick={() => onChange(value === r ? "" : r)}>
          {r}
        </button>
      ))}
      {options.length > MAX && (
        <button type="button" onClick={() => setExpanded(v => !v)} className="btn btn-ghost btn-sm h-[2.125rem]">
          {expanded ? "Moins" : `+${options.length - MAX} autres`}
        </button>
      )}
    </div>
  );
}

// ─── Filter section wrapper ───────────────────────────────────────────────────

function FilterSection({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="label mb-2 block">{label}</label>
      ) : (
        <p className="label mb-2">{label}</p>
      )}
      {children}
    </div>
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
