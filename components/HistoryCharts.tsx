const COLOR_CFG: Record<string, { color: string; label: string }> = {
  rouge: { color: "var(--color-rouge)", label: "Rouge" },
  blanc: { color: "var(--color-blanc)", label: "Blanc" },
  rosé: { color: "var(--color-rose)", label: "Rosé" },
  effervescent: { color: "var(--color-effervescent)", label: "Effervescent" },
};

interface Props {
  byColor: Record<string, number>;
  byMonth: Array<{ month: string; value: number }>;
  ratingDist: Array<{ label: string; value: number }>;
  hasRatings: boolean;
  topAppellations: Array<{ name: string; value: number }>;
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

/**
 * Statistiques de dégustation. Des barres HTML plutôt qu'un graphique (même
 * langage que CellarCharts sur l'accueil) : valeurs lisibles sans survol, y
 * compris sur mobile.
 */
export default function HistoryCharts({ byColor, byMonth, ratingDist, hasRatings, topAppellations }: Props) {
  const colorData = Object.entries(byColor)
    .map(([key, value]) => ({
      key,
      name: COLOR_CFG[key]?.label ?? key,
      value,
      color: COLOR_CFG[key]?.color ?? "var(--text-faint)",
    }))
    .sort((a, b) => b.value - a.value);
  const colorTotal = colorData.reduce((sum, d) => sum + d.value, 0);

  const maxMonth = Math.max(1, ...byMonth.map((m) => m.value));
  const monthTotal = byMonth.reduce((sum, m) => sum + m.value, 0);
  const maxAppellation = topAppellations[0]?.value ?? 1;
  const maxRating = Math.max(1, ...ratingDist.map((r) => r.value));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* Couleurs bues */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold">Par couleur</h3>
        <p className="mt-0.5 text-sm text-muted tabular">{plural(colorTotal, "bouteille")} bue{colorTotal > 1 ? "s" : ""}</p>

        <div
          className="mt-6 flex h-4 gap-[3px] overflow-hidden rounded-full"
          data-grow="x"
          role="img"
          aria-label={colorData.map((d) => `${d.name} ${percent(d.value, colorTotal)} %`).join(", ")}
        >
          {colorData.map((d) => (
            <div key={d.key} className="h-full" style={{ flexGrow: d.value, background: d.color }} />
          ))}
        </div>

        <ul className="mt-6 divide-y divide-border">
          {colorData.map((d) => (
            <li key={d.key} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="flex-1 font-medium">{d.name}</span>
              <span className="tabular text-muted">{percent(d.value, colorTotal)} %</span>
              <span className="w-10 text-right font-semibold tabular">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Activité mensuelle */}
      <div className="card flex flex-col p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold">Par mois</h3>
        <p className="mt-0.5 text-sm text-muted tabular">
          {plural(monthTotal, "bouteille")} sur {byMonth.length} mois
        </p>

        <ol className="mt-6 flex min-h-[176px] flex-1 items-end gap-1 sm:gap-1.5" aria-label="Bouteilles bues par mois">
          {byMonth.map((m, index) => (
            <li
              key={m.month}
              // Sur mobile, seuls les 12 derniers mois tiennent lisiblement.
              className={`group h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 ${
                index < byMonth.length - 12 ? "hidden sm:flex" : "flex"
              }`}
              title={`${m.month} : ${plural(m.value, "bouteille")}`}
            >
              <span className={`text-[10px] font-semibold tabular ${m.value > 0 ? "text-muted" : "text-transparent"}`}>
                {m.value}
              </span>
              <span
                className={`w-full max-w-[22px] rounded-t-[4px] transition-colors ${
                  m.value > 0 ? "bg-wine-red group-hover:bg-wine-deep" : "bg-surface-2"
                }`}
                data-grow="y"
                style={{ height: m.value > 0 ? `${(m.value / maxMonth) * 120}px` : "3px" }}
              />
              <span className="w-full overflow-hidden text-center text-[10px] leading-tight text-faint">
                {m.month.split(" ")[0].replace(".", "").slice(0, 4)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Top appellations */}
      {topAppellations.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold">Top appellations</h3>
          <p className="mt-0.5 text-sm text-muted">Les plus dégustées</p>

          <ul className="mt-6 space-y-3.5">
            {topAppellations.map(({ name, value }) => (
              <li key={name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{name}</span>
                  <span className="font-semibold tabular">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-wine-red"
                    data-grow="x"
                    style={{ width: `${Math.max(3, (value / maxAppellation) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Distribution des notes */}
      {hasRatings && (
        <div className="card p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold">Notes</h3>
          <p className="mt-0.5 text-sm text-muted">Répartition des vins notés</p>

          <ul className="mt-6 space-y-3">
            {[...ratingDist].reverse().map((r) => (
              <li key={r.label} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 font-semibold tabular text-gold">{r.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gold-light"
                    data-grow="x"
                    style={{ width: r.value > 0 ? `${Math.max(3, (r.value / maxRating) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="w-6 text-right font-semibold tabular">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
