"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { BottleSilhouette } from "@/components/WineTile";

type MaturityPeriod = {
  wineId: string;
  name: string;
  vintage: number | null;
  imageUrl: string | null;
  from: number;
  until: number;
  quantity: number;
  color: string | null;
};

const COLOR_SEGMENTS = [
  { key: "rouge", label: "Rouge", color: "var(--color-rouge)" },
  { key: "blanc", label: "Blanc", color: "var(--color-blanc)" },
  { key: "rosé", label: "Rosé", color: "var(--color-rose)" },
  { key: "autre", label: "Autre", color: "var(--text-faint)" },
] as const;

/** Hauteur maximale d'une barre, en pixels. */
const BAR_MAX = 150;

export function MaturityAvailabilityChart({ periods, currentYear }: { periods: MaturityPeriod[]; currentYear: number }) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 13 }, (_, index) => currentYear - 2 + index);
  const data = years.map((year) => periods.reduce(
    (totals, period) => {
      if (year >= period.from && year <= period.until) {
        const color = period.color && COLOR_SEGMENTS.some((segment) => segment.key === period.color) ? period.color : "autre";
        totals[color as keyof typeof totals] += period.quantity;
      }
      return totals;
    },
    { rouge: 0, blanc: 0, rosé: 0, autre: 0 },
  ));
  const totalFor = (item: typeof data[number]) => item.rouge + item.blanc + item.rosé + item.autre;
  const max = Math.max(...data.map(totalFor), 1);
  const readyNow = totalFor(data[2]);
  const peak = Math.max(...data.map(totalFor));
  const peakYear = years[data.findIndex((item) => totalFor(item) === peak)];
  const selectedWines = periods
    .filter((period) => selectedYear >= period.from && selectedYear <= period.until)
    .sort((a, b) => a.until - b.until || a.name.localeCompare(b.name));
  const selectedBottles = selectedWines.reduce((total, wine) => total + wine.quantity, 0);

  return (
    <div className="card overflow-hidden">
      <div className="p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold">
              <span className="tabular">{readyNow}</span> bouteille{readyNow !== 1 ? "s" : ""} à l’apogée cette année
            </p>
            {peak > 0 && (
              <p className="mt-0.5 text-sm text-muted">
                Pic de disponibilité en {peakYear} · <span className="tabular">{peak}</span> bouteilles
              </p>
            )}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {COLOR_SEGMENTS.map((segment) => (
              <li key={segment.key} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: segment.color }} />
                {segment.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="mb-2 text-xs text-faint">Touchez une année pour voir les bouteilles.</p>
        <div
          className="flex h-[212px] items-end gap-1 border-b border-border sm:gap-2.5"
          role="group"
          aria-label="Nombre de bouteilles à l’apogée par année"
        >
          {years.map((year, index) => {
            const segments = data[index];
            const total = totalFor(segments);
            const isCurrent = year === currentYear;
            const isSelected = selectedYear === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                aria-pressed={isSelected}
                aria-label={`${year} : ${total} bouteille${total !== 1 ? "s" : ""} à l’apogée`}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-t-md pt-6 focus-visible:outline-offset-0"
              >
                <span
                  className={`mb-1.5 rounded px-1 text-[11px] font-semibold tabular sm:text-xs ${
                    isSelected ? "bg-ink text-background" : "text-muted"
                  }`}
                >
                  {total || ""}
                </span>
                <span
                  className={`flex w-full max-w-11 flex-col-reverse overflow-hidden rounded-t-[5px] bg-surface-2 transition-[filter,opacity] duration-200 group-hover:brightness-110 ${
                    isSelected ? "" : "opacity-80"
                  }`}
                  data-grow="y"
                  style={{ height: `${Math.max((total / max) * BAR_MAX, total ? 6 : 2)}px` }}
                >
                  {COLOR_SEGMENTS.filter((segment) => segments[segment.key] > 0).map((segment) => (
                    <span
                      key={segment.key}
                      className="block w-full"
                      style={{ height: `${(segments[segment.key] / total) * 100}%`, background: segment.color }}
                    />
                  ))}
                </span>
                {isCurrent && (
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 mx-auto h-full w-px bg-wine-red/30" />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1 sm:gap-2.5">
          {years.map((year) => {
            const isCurrent = year === currentYear;
            const isSelected = selectedYear === year;
            return (
              <span
                key={year}
                className={`min-w-0 flex-1 text-center text-[11px] tabular sm:text-xs ${
                  isSelected ? "font-bold text-foreground" : isCurrent ? "font-semibold text-wine-red" : "text-faint"
                }`}
              >
                {isCurrent ? "Auj." : <><span className="hidden sm:inline">{String(year).slice(0, 2)}</span>{String(year).slice(-2)}</>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border bg-surface-2/50 p-5 sm:p-7">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">À l’apogée en {selectedYear}</h3>
          <span className="badge badge-muted">{selectedBottles} bts</span>
        </div>
        {selectedWines.length === 0 ? (
          <p className="text-sm text-muted">Aucune bouteille avec une période d’apogée pour cette année.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {selectedWines.map((wine) => (
              <li key={`${wine.wineId}-${wine.vintage ?? "unknown"}`} className="border-b border-border">
                <Link
                  href={`/wines/${wine.wineId}`}
                  className="group flex min-h-14 items-center gap-3 py-2"
                >
                  <span className="flex h-11 w-7 shrink-0 items-center justify-center">
                    {wine.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={wine.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <BottleSilhouette className="h-9 w-auto text-surface-3" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold group-hover:text-wine-red">{wine.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <span className="wine-dot" data-color={wine.color ?? undefined} />
                      <span className="tabular">
                        {wine.vintage ?? "—"} · {wine.quantity} bt{wine.quantity > 1 ? "s" : ""} · jusqu’en {wine.until}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-wine-red" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
