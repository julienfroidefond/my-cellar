const COLOR_CFG: Record<string, { color: string; label: string }> = {
  rouge: { color: "var(--color-rouge)", label: "Rouge" },
  blanc: { color: "var(--color-blanc)", label: "Blanc" },
  rosé: { color: "var(--color-rose)", label: "Rosé" },
  effervescent: { color: "var(--color-effervescent)", label: "Effervescent" },
};

interface Props {
  byColor: Record<string, number>;
  topRegions: [string, number][];
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

/**
 * Répartition de la cave : barre empilée par couleur et classement des
 * régions. Des barres HTML plutôt qu'un graphique : valeurs lisibles sans
 * survol, y compris sur mobile.
 */
export default function CellarCharts({ byColor, topRegions }: Props) {
  const colorData = Object.entries(byColor)
    .map(([key, value]) => ({
      key,
      name: COLOR_CFG[key]?.label ?? key,
      value,
      color: COLOR_CFG[key]?.color ?? "var(--text-faint)",
    }))
    .sort((a, b) => b.value - a.value);
  const colorTotal = colorData.reduce((sum, d) => sum + d.value, 0);
  const maxRegion = topRegions[0]?.[1] ?? 1;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold">Par couleur</h3>
        <p className="mt-0.5 text-sm text-muted tabular">{colorTotal} bouteilles</p>

        <div
          className="mt-6 flex h-4 gap-[3px] overflow-hidden rounded-full"
          data-grow="x"
          role="img"
          aria-label={colorData.map((d) => `${d.name} ${percent(d.value, colorTotal)} %`).join(", ")}
        >
          {colorData.map((d) => (
            <div
              key={d.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ flexGrow: d.value, background: d.color }}
            />
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

      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold">Par région</h3>
        <p className="mt-0.5 text-sm text-muted">Les {topRegions.length} premières</p>

        <ul className="mt-6 space-y-3.5">
          {topRegions.map(([name, value]) => (
            <li key={name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{name}</span>
                <span className="font-semibold tabular">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-wine-red"
                  data-grow="x"
                  style={{ width: `${Math.max(3, (value / maxRegion) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
