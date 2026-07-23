"use client";

import Link from "next/link";
import { useState } from "react";

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
  { key: "rouge", label: "Rouge", color: "#b51f3b" },
  { key: "blanc", label: "Blanc", color: "#d6a24a" },
  { key: "rosé", label: "Rosé", color: "#d8768b" },
  { key: "autre", label: "Autre", color: "#927b72" },
] as const;

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

  return (
    <div className="rounded-2xl p-5 sm:p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{readyNow} bouteille{readyNow !== 1 ? "s" : ""} à l’apogée cette année</p>
          {peak > 0 && <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Pic de disponibilité en {peakYear} · {peak} bouteilles</p>}
        </div>
        <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
          {COLOR_SEGMENTS.map((segment) => (
            <span key={segment.key} className="inline-flex items-center mr-2.5">
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: segment.color }} /> {segment.label}
            </span>
          ))}
        </p>
      </div>

      <div
        className="h-56 flex items-end gap-1.5 sm:gap-3 px-1 rounded-xl"
        aria-label="Nombre de bouteilles à l’apogée par année"
        style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(26,10,14,0.07) 32px)" }}
      >
        {years.map((year, index) => {
          const segments = data[index];
          const total = totalFor(segments);
          const isCurrent = year === currentYear;
          const isSelected = selectedYear === year;
          return (
            <button key={year} type="button" onClick={() => setSelectedYear(year)} className="h-full flex-1 min-w-0 flex flex-col justify-end items-center group relative" aria-pressed={isSelected}>
              {isCurrent && <span className="absolute top-2 text-[9px] tracking-wider uppercase" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 700 }}>Aujourd’hui</span>}
              <span className="text-xs mb-2 font-medium min-h-4 px-1 rounded" style={{ fontFamily: "var(--font-inter)", color: isSelected ? "white" : "var(--text-muted)", background: isSelected ? "var(--wine-red)" : "transparent" }}>{total || ""}</span>
              <div className="w-full max-w-11 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-200 group-hover:brightness-110" style={{ height: `${Math.max((total / max) * 155, total ? 8 : 2)}px`, background: "rgba(26,10,14,0.08)", boxShadow: isSelected && total ? "0 0 0 2px var(--wine-red), 0 8px 18px rgba(192,25,59,0.22)" : "none" }} title={`${year} : ${total} bouteille${total !== 1 ? "s" : ""} à l’apogée`}>
                {COLOR_SEGMENTS.filter((segment) => segments[segment.key] > 0).map((segment) => (
                  <div key={segment.key} style={{ height: `${(segments[segment.key] / total) * 100}%`, background: segment.color }} />
                ))}
              </div>
              <span className="mt-2 text-[10px] sm:text-xs whitespace-nowrap px-1.5 py-0.5 rounded-full" style={{ fontFamily: "var(--font-inter)", color: isSelected ? "var(--wine-red)" : "var(--text-faint)", background: isSelected ? "rgba(192,25,59,0.09)" : "transparent", fontWeight: isSelected ? 700 : 400 }}>
                {isCurrent ? "Auj." : String(year).slice(-2)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>À l’apogée en {selectedYear}</h3>
          <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{selectedWines.reduce((total, wine) => total + wine.quantity, 0)} bouteilles</span>
        </div>
        {selectedWines.length === 0 ? (
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Aucune bouteille avec une période d’apogée pour cette année.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedWines.map((wine) => (
              <Link key={`${wine.wineId}-${wine.vintage ?? "unknown"}`} href={`/wines/${wine.wineId}`} className="flex items-center gap-3 rounded-xl p-3 transition-opacity hover:opacity-75" style={{ background: "var(--surface-2)" }}>
                {wine.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wine.imageUrl} alt="" className="w-9 h-14 shrink-0 object-contain" />
                ) : (
                  <span className="w-9 h-14 shrink-0 flex items-center justify-center" aria-hidden="true">🍷</span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate" style={{ fontFamily: "var(--font-inter)" }}>{wine.name}</span>
                  <span className="block text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                    {wine.vintage ?? "—"} · {wine.quantity} bt{wine.quantity > 1 ? "s" : ""} · jusqu’en {wine.until}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
