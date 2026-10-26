export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import Link from "next/link";
import { Gift, History, PackageMinus, PackagePlus, SlidersHorizontal, Trash2, Wine, type LucideIcon } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { BottleSilhouette } from "@/components/WineTile";
import HistoryCharts from "@/components/HistoryCharts";
import { removalReasonLabel } from "@/lib/history";
import { HistoryFilters } from "./HistoryFilters";
import { RateEntry } from "./RateEntry";

type HistoryKind = { icon: LucideIcon; className: string; label: string };

const KIND_DRINK: HistoryKind = { icon: Wine, className: "bg-[var(--wine-tint)] text-wine-deep", label: "Dégustation" };
const KIND_ADD: HistoryKind = { icon: PackagePlus, className: "bg-success-tint text-success", label: "Ajout" };
const KIND_GIFT: HistoryKind = { icon: Gift, className: "bg-[var(--gold-tint)] text-[#8a5a17]", label: "Don" };
const KIND_ADJUST: HistoryKind = { icon: SlidersHorizontal, className: "bg-surface-2 text-muted", label: "Régularisation" };
const KIND_DELETE: HistoryKind = { icon: Trash2, className: "bg-surface-2 text-muted", label: "Suppression" };
const KIND_REMOVE: HistoryKind = { icon: PackageMinus, className: "bg-surface-2 text-muted", label: "Retrait" };

/** Icône et couleur associées au type d'une entrée d'historique. */
function historyKind(entry: { action: string; reason: string | null }): HistoryKind {
  if (entry.action === "ajout") return KIND_ADD;
  if (entry.action === "retiré") {
    if (entry.reason === "offert") return KIND_GIFT;
    if (entry.reason === "regul") return KIND_ADJUST;
    if (entry.reason === "suppression") return KIND_DELETE;
    return KIND_REMOVE;
  }
  return KIND_DRINK;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(date).replace(".", "");
}

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "UTC" }).format(date);
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter = filter === "all" || filter === "retiré" || filter === "ajout" ? filter : "bu";

  const [allEntries, wines] = await Promise.all([
    prisma.wineHistory.findMany({
      where: { action: { in: ["bu", "retiré", "ajout"] } },
      orderBy: { consumedAt: "desc" },
    }),
    prisma.wine.findMany({
      select: { id: true, name: true, imageUrl: true },
    }),
  ]);

  const entries = activeFilter === "all" ? allEntries : allEntries.filter((e) => e.action === activeFilter);
  const filterCounts = {
    all: allEntries.length,
    bu: allEntries.filter((e) => e.action === "bu").length,
    ajout: allEntries.filter((e) => e.action === "ajout").length,
    retiré: allEntries.filter((e) => e.action === "retiré").length,
  };

  // Les statistiques ne portent que sur les dégustations, quel que soit le filtre
  // de la timeline (un ajout n'est pas une bouteille bue).
  const drinkEntries = allEntries.filter((e) => e.action === "bu");

  // Build list of [normalizedName, { id, imageUrl }] for substring matching —
  // WineHistory ne garde qu'un snapshot du nom, pas de FK vers Wine.
  const wineIndex: Array<[string, { id: string; imageUrl: string | null }]> = wines.map((w) => [
    normalize(w.name),
    { id: w.id, imageUrl: w.imageUrl },
  ]);

  function matchWine(wineName: string): { id: string; imageUrl: string | null } | null {
    const key = normalize(wineName);
    // 1. exact match
    const exact = wineIndex.find(([n]) => n === key);
    if (exact) return exact[1];
    // 2. wine DB name contains history name (e.g. "chateaubatailleylionsdebatailley" ⊃ "lionsdebatailley")
    const contains = wineIndex.find(([n]) => n.includes(key));
    if (contains) return contains[1];
    // 3. history name contains wine DB name (reverse)
    const reverse = wineIndex.find(([n]) => key.includes(n));
    if (reverse) return reverse[1];
    return null;
  }

  const total = drinkEntries.reduce((s, e) => s + e.quantity, 0);
  const withRating = drinkEntries.filter((e) => e.rating !== null);
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, e) => s + (e.rating ?? 0), 0) / withRating.length
      : null;
  const uniqueNames = new Set(drinkEntries.map((e) => `${e.wineName}|${e.vintage ?? ""}`));

  // ── Charts data ────────────────────────────────────────────────────────────
  const byColor = drinkEntries.reduce<Record<string, number>>((acc, e) => {
    const c = e.color ?? "autre";
    acc[c] = (acc[c] ?? 0) + e.quantity;
    return acc;
  }, {});

  const monthMap = new Map<string, number>();
  for (const e of drinkEntries) {
    const d = new Date(e.consumedAt);
    const mk = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthMap.set(mk, (monthMap.get(mk) ?? 0) + e.quantity);
  }

  function buildMonthRange(first: string, last: string): string[] {
    const [sy, sm] = first.split("-").map(Number);
    const [ey, em] = last.split("-").map(Number);
    const keys: string[] = [];
    let y = sy, m = sm;
    while (y < ey || (y === ey && m <= em)) {
      keys.push(`${y}-${String(m).padStart(2, "0")}`);
      if (++m > 12) { m = 1; y++; }
    }
    return keys;
  }

  const now = new Date();
  const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const firstKey = [...monthMap.keys()].sort()[0] ?? todayKey;
  const byMonth = buildMonthRange(firstKey, todayKey).slice(-18).map((mk) => {
    const [yr, mo] = mk.split("-").map(Number);
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" })
      .format(new Date(yr, mo - 1, 1));
    return { month: label, value: monthMap.get(mk) ?? 0 };
  });

  const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
    label: `${star}★`,
    value: drinkEntries.filter((e) => e.rating !== null && Math.round(e.rating!) === star).length,
  }));
  const hasRatings = withRating.length > 0;

  const appellationMap = drinkEntries.reduce<Record<string, number>>((acc, e) => {
    if (!e.appellation) return acc;
    acc[e.appellation] = (acc[e.appellation] ?? 0) + e.quantity;
    return acc;
  }, {});
  const topAppellations = Object.entries(appellationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Regroupement par mois (en-tête collant), puis par jour (date en marge).
  const byMonthGroup = new Map<string, Map<string, typeof entries>>();
  for (const entry of entries) {
    const date = new Date(entry.consumedAt);
    const mk = monthKey(date);
    const dk = dateKey(date);
    if (!byMonthGroup.has(mk)) byMonthGroup.set(mk, new Map());
    const days = byMonthGroup.get(mk)!;
    if (!days.has(dk)) days.set(dk, []);
    days.get(dk)!.push(entry);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Journal"
        title="Mes dégustations"
        lead="Les bouteilles ouvertes, les notes et les mouvements qui font vivre la cave."
        stats={[
          { value: total, label: "Bouteilles bues" },
          { value: uniqueNames.size, label: "Vins différents" },
          ...(avgRating !== null
            ? [{ value: avgRating.toFixed(1) + "\u00A0/\u00A05", label: "Note moyenne" }]
            : []),
        ]}
      />

      <div className="container-page space-y-14 py-10 md:py-14">
        {drinkEntries.length > 0 && (
          <section data-reveal aria-labelledby="history-stats-title">
            <SectionHeader id="history-stats-title" eyebrow="Analyse" title="Statistiques" />
            <HistoryCharts byColor={byColor} byMonth={byMonth} ratingDist={ratingDist} hasRatings={hasRatings} topAppellations={topAppellations} />
          </section>
        )}

        <section aria-labelledby="history-timeline-title">
          <SectionHeader
            id="history-timeline-title"
            eyebrow="Chronologie"
            title="Le journal"
            lead={`${entries.length} entrée${entries.length > 1 ? "s" : ""}, de la plus récente à la plus ancienne.`}
          />
          <HistoryFilters active={activeFilter} counts={filterCounts} />

          {entries.length === 0 ? (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-16 text-center">
              <History className="mx-auto h-6 w-6 text-faint" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted">Aucune entrée pour ce filtre.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {[...byMonthGroup.entries()].map(([mk, days]) => {
                const monthEntries = [...days.values()].flat();
                const monthBottles = monthEntries.reduce((s, e) => s + e.quantity, 0);
                return (
                  <section key={mk} aria-label={formatMonthLabel(new Date(mk + "-15T12:00:00Z"))}>
                    {/* En-tête de mois, collant sous la barre de navigation */}
                    <div className="sticky top-[var(--nav-height)] z-[var(--z-sticky)] -mx-4 flex items-baseline justify-between gap-3 bg-background/90 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:px-1">
                      <h3 className="font-display text-lg font-semibold capitalize">
                        {formatMonthLabel(new Date(mk + "-15T12:00:00Z"))}
                      </h3>
                      <span className="text-sm text-muted tabular">
                        {monthEntries.length} entrée{monthEntries.length > 1 ? "s" : ""} · {monthBottles} bt{monthBottles > 1 ? "s" : ""}
                      </span>
                    </div>

                    <ol className="card divide-y divide-border overflow-hidden">
                      {[...days.entries()].map(([dk, dayEntries]) => {
                        const date = new Date(dk + "T12:00:00Z");
                        return (
                          <li key={dk} className="grid grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[4rem_minmax(0,1fr)]">
                            {/* Date en marge */}
                            <div className="flex flex-col items-center border-r border-border bg-surface-2/50 pt-3.5 text-center">
                              <time dateTime={dk} title={formatFullDate(date)} className="contents">
                                <span className="stat-value text-[1.35rem]">{date.getUTCDate()}</span>
                                <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">{formatWeekday(date)}</span>
                              </time>
                            </div>

                            <ul className="divide-y divide-border">
                              {dayEntries.map((entry) => {
                                const match = matchWine(entry.wineName);
                                const imgUrl = match?.imageUrl ?? null;
                                const isRemoval = entry.action === "retiré";
                                const isAddition = entry.action === "ajout";
                                const kind = historyKind(entry);
                                const KindIcon = kind.icon;
                                const details = [
                                  entry.vintage ? String(entry.vintage) : null,
                                  entry.appellation,
                                  entry.country && entry.country !== "France" ? entry.country : null,
                                ].filter((item): item is string => Boolean(item));

                                return (
                                  <li
                                    key={entry.id}
                                    data-reveal
                                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:flex-nowrap sm:px-4"
                                  >
                                    {/* Miniature */}
                                    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                                      {imgUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imgUrl} alt="" loading="lazy" className="h-12 w-auto object-contain" />
                                      ) : (
                                        <BottleSilhouette className="h-9 w-auto text-surface-3" />
                                      )}
                                    </div>

                                    {/* Vin */}
                                    <div className="min-w-0 flex-1">
                                      {match ? (
                                        <Link
                                          href={`/wines/${match.id}`}
                                          className="line-clamp-1 font-display text-[1rem] font-semibold leading-snug hover:text-wine-red"
                                        >
                                          {entry.wineName}
                                        </Link>
                                      ) : (
                                        <p className="line-clamp-1 font-display text-[1rem] font-semibold leading-snug">
                                          {entry.wineName}
                                        </p>
                                      )}
                                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-muted">
                                        <span className="wine-dot" data-color={entry.color ?? undefined} />
                                        <span className="truncate">
                                          {[entry.producer, ...details].filter(Boolean).join(" · ")}
                                        </span>
                                      </p>
                                      {entry.note && (
                                        <p className="mt-1 line-clamp-2 text-[0.8125rem] italic text-faint">{entry.note}</p>
                                      )}
                                    </div>

                                    {/* Action et note */}
                                    <div className="ml-[3.25rem] flex w-full items-center gap-2 sm:ml-0 sm:w-auto sm:shrink-0 sm:justify-end">
                                      {/* Le badge « Dégustation » n'apporte rien quand on ne voit que des dégustations. */}
                                      {(isAddition || isRemoval || activeFilter === "all") && (
                                      <span className={`badge gap-1 px-2 font-semibold ${kind.className}`}>
                                        <KindIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                                        {isAddition ? "Ajout" : isRemoval ? removalReasonLabel(entry.reason) : kind.label}
                                        {entry.quantity > 1 && <span className="tabular opacity-70">×{entry.quantity}</span>}
                                      </span>
                                      )}
                                      {!isAddition && !isRemoval && (
                                        <div className="sm:w-[190px] sm:flex sm:justify-end">
                                          <RateEntry id={entry.id} rating={entry.rating} />
                                        </div>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
