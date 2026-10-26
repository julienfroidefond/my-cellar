import { estimateMaturity } from "@/lib/maturity";
import { Eyebrow } from "@/components/PageHeader";

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
    <section className="card mb-8 p-5 sm:p-6" data-reveal aria-labelledby="maturity-timeline-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow className="mb-2">Potentiel de garde</Eyebrow>
          <h2 id="maturity-timeline-title" className="text-title">Périodes d’apogée</h2>
        </div>
        <ul className="flex gap-3 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-wine-red" /> Renseignée
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold" /> Estimée
          </li>
        </ul>
      </div>

      {/* Mobile : une carte par millésime */}
      <ul className="space-y-2 sm:hidden">
        {periods.map((period) => {
          const isCurrent = currentYear >= period.from && currentYear <= period.until;
          return (
            <li key={period.id} className="panel p-3">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="font-display font-semibold">{period.label}</span>
                <span className="text-xs tabular text-muted">
                  {period.from}–{period.until}
                  {isCurrent && <span className="font-semibold text-wine-red"> · maintenant</span>}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-background">
                <div
                  className={`absolute inset-y-0 rounded-full ${period.manual ? "bg-wine-red" : "bg-gold"}`}
                  style={{ left: `${position(period.from)}%`, width: `${Math.max(position(period.until) - position(period.from), 3)}%` }}
                />
                <div className="absolute -inset-y-1 w-0.5 rounded-full bg-ink" style={{ left: `${position(currentYear)}%` }} />
              </div>
            </li>
          );
        })}
        <li className="flex justify-between pt-1 text-[11px] tabular text-faint">
          <span>{firstYear}</span>
          <span className="font-semibold text-foreground">Aujourd’hui · {currentYear}</span>
          <span>{lastYear}</span>
        </li>
      </ul>

      {/* Desktop : frise commune */}
      <div className="hidden overflow-x-auto pb-1 sm:block">
        <div className="min-w-[520px]">
          <div className="relative ml-[4.75rem] h-6 text-xs tabular text-faint">
            {years.map((year) => (
              <span key={year} className="absolute -translate-x-1/2" style={{ left: `${position(year)}%` }}>{year}</span>
            ))}
          </div>

          <div className="space-y-2.5">
            {periods.map((period) => {
              const isCurrent = currentYear >= period.from && currentYear <= period.until;
              return (
                <div key={period.id} className="grid grid-cols-[4rem_1fr] items-center gap-3">
                  <div className="font-display text-sm font-semibold">{period.label}</div>
                  <div className="relative h-8 rounded-lg bg-surface-2">
                    <div
                      className={`absolute bottom-1 top-1 flex items-center whitespace-nowrap rounded-md px-2 text-[11px] font-semibold tabular text-white ${period.manual ? "bg-wine-red" : "bg-gold"}`}
                      style={{ left: `${position(period.from)}%`, width: `${Math.max(position(period.until) - position(period.from), 7)}%` }}
                    >
                      {period.from}–{period.until}{isCurrent ? " · maintenant" : ""}
                    </div>
                    <div
                      className="absolute -inset-y-1 w-0.5 rounded-full bg-ink"
                      style={{ left: `${position(currentYear)}%` }}
                      title={`Aujourd’hui (${currentYear})`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-5 text-xs text-faint">
        Les périodes estimées sont calculées d’après la région, l’appellation et la couleur. Une période renseignée dans l’édition est prioritaire.
      </p>
    </section>
  );
}
