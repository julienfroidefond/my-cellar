import { estimateMaturity } from "@/lib/maturity";

type Vintage = {
  id: string;
  vintage: number | null;
  drinkFrom: number | null;
  drinkUntil: number | null;
};

type MaturityTimelineProps = {
  vintages: Vintage[];
  wine: { color: string | null; region: string | null; appellation: string | null };
};

export function MaturityTimeline({ vintages, wine }: MaturityTimelineProps) {
  const currentYear = new Date().getFullYear();
  const periods = vintages.flatMap((vintage) => {
    const estimate = estimateMaturity({ ...wine, vintage: vintage.vintage });
    const from = vintage.drinkFrom ?? estimate?.drinkFrom;
    const until = vintage.drinkUntil ?? estimate?.drinkUntil;
    if (!from || !until) return [];

    return [{
      id: vintage.id,
      label: vintage.vintage?.toString() ?? "Millésime inconnu",
      from,
      until,
      manual: vintage.drinkFrom != null || vintage.drinkUntil != null,
    }];
  });

  if (periods.length === 0) return null;

  const firstYear = Math.min(...periods.map((period) => period.from), currentYear) - 1;
  const lastYear = Math.max(...periods.map((period) => period.until), currentYear) + 1;
  const duration = lastYear - firstYear;
  const position = (year: number) => ((year - firstYear) / duration) * 100;
  const years = Array.from({ length: Math.min(duration + 1, 12) }, (_, index) =>
    Math.round(firstYear + (duration * index) / Math.min(duration, 11)),
  );

  return (
    <section
      className="rounded-2xl p-6 mb-8"
      data-reveal
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
            Potentiel de garde
          </p>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>Périodes d’apogée</h2>
        </div>
        <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: "var(--wine-red)" }} /> renseignée
          <span className="inline-block w-2 h-2 rounded-full ml-3 mr-1.5" style={{ background: "#b87a2c" }} /> estimée
        </p>
      </div>

      <div className="sm:hidden space-y-4">
        {periods.map((period) => {
          const color = period.manual ? "var(--wine-red)" : "#b87a2c";
          const isCurrent = currentYear >= period.from && currentYear <= period.until;
          return (
            <div key={period.id} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{period.label}</span>
                <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {period.from}–{period.until}{isCurrent ? " · maintenant" : ""}
                </span>
              </div>
              <div className="relative h-2 rounded-full" style={{ background: "var(--background)" }}>
                <div className="absolute inset-y-0 rounded-full" style={{ left: `${position(period.from)}%`, width: `${Math.max(position(period.until) - position(period.from), 3)}%`, background: color }} />
                <div className="absolute inset-y-0 w-px" style={{ left: `${position(currentYear)}%`, background: "var(--foreground)", opacity: 0.55 }} />
              </div>
            </div>
          );
        })}
        <div className="flex justify-between text-[11px]" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
          <span>{firstYear}</span>
          <span>Aujourd’hui · {currentYear}</span>
          <span>{lastYear}</span>
        </div>
      </div>

      <div className="hidden sm:block overflow-x-auto pb-1">
        <div className="min-w-[520px]">
          <div className="ml-20 relative h-6 text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
            {years.map((year) => (
              <span key={year} className="absolute -translate-x-1/2" style={{ left: `${position(year)}%` }}>{year}</span>
            ))}
          </div>

          <div className="space-y-3">
            {periods.map((period) => {
              const color = period.manual ? "var(--wine-red)" : "#b87a2c";
              const isCurrent = currentYear >= period.from && currentYear <= period.until;
              return (
                <div key={period.id} className="grid grid-cols-[4rem_1fr] items-center gap-3">
                  <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{period.label}</div>
                  <div className="relative h-8 rounded-full" style={{ background: "var(--surface-2)" }}>
                    <div
                      className="absolute top-1 bottom-1 rounded-full flex items-center px-2 text-[11px] font-medium whitespace-nowrap"
                      style={{ left: `${position(period.from)}%`, width: `${Math.max(position(period.until) - position(period.from), 7)}%`, background: color, color: "white", fontFamily: "var(--font-inter)" }}
                    >
                      {period.from}–{period.until}{isCurrent ? " · maintenant" : ""}
                    </div>
                    <div className="absolute inset-y-0 border-l" style={{ left: `${position(currentYear)}%`, borderColor: "var(--foreground)", opacity: 0.55 }} title={`Aujourd’hui (${currentYear})`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-5 text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
        Les périodes estimées sont calculées d’après la région, l’appellation et la couleur. Une période renseignée dans l’édition est prioritaire.
      </p>
    </section>
  );
}
