import type { MaturityPhase } from "@/lib/maturity-phase";
import { WineColor, WineTile } from "@/components/WineTile";

export type MaturityWine = {
  wineId: string;
  name: string;
  vintage: number | null;
  color: string | null;
  quantity: number;
  imageUrl: string | null;
  from: number;
  until: number;
  phase: MaturityPhase;
};

/** Phases de maturité, de la plus urgente à la plus lointaine. */
export const PHASES: { key: MaturityPhase; eyebrow: string; title: string; description: string; color: string; background: string }[] = [
  { key: "nearing-end", eyebrow: "À ouvrir", title: "À boire bientôt", description: "La fenêtre se referme dans les deux ans.", color: "#a24d1f", background: "rgba(177,90,40,0.12)" },
  { key: "ready", eyebrow: "À ouvrir", title: "À l’apogée", description: "À déguster dès maintenant.", color: "#a01e35", background: "rgba(192,25,59,0.10)" },
  { key: "soon", eyebrow: "À surveiller", title: "Bientôt prêt", description: "Moins de deux ans avant le début de la fenêtre.", color: "#8f5c14", background: "rgba(184,122,44,0.14)" },
  { key: "too-early", eyebrow: "En cave", title: "Trop tôt", description: "Plus de deux ans avant le début de la fenêtre.", color: "#46604e", background: "rgba(81,106,88,0.13)" },
  { key: "past", eyebrow: "À ne pas attendre", title: "À dépasser", description: "À ouvrir sans tarder.", color: "#62505a", background: "rgba(107,88,98,0.13)" },
];

function windowLabel(wine: MaturityWine) {
  if (wine.phase === "past") return `depuis ${wine.until}`;
  if (wine.phase === "ready" || wine.phase === "nearing-end") return `jusqu’en ${wine.until}`;
  return `dès ${wine.from}`;
}

export function MaturityPhaseCarousels({ wines }: { wines: MaturityWine[] }) {
  return (
    <div className="space-y-10" data-reveal-stagger>
      {PHASES.map((phase) => {
        const phaseWines = wines
          .filter((wine) => wine.phase === phase.key)
          .sort((a, b) => a.until - b.until || a.name.localeCompare(b.name, "fr"));
        const bottles = phaseWines.reduce((total, wine) => total + wine.quantity, 0);

        return (
          <section key={phase.key} data-reveal aria-label={phase.title}>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="h-5 w-[5px] skew-x-[-20deg] rounded-[1px]"
                style={{ background: phase.color }}
              />
              <h3 className="font-display text-xl font-semibold">{phase.title}</h3>
              <span
                className="badge"
                style={{ background: phase.background, color: phase.color }}
              >
                {bottles} bt{bottles > 1 ? "s" : ""}
              </span>
              <p className="w-full pl-[17px] text-sm text-muted sm:w-auto sm:pl-0">{phase.description}</p>
            </div>

            {phaseWines.length === 0 ? (
              <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong px-5 py-5 text-sm text-muted">
                Aucune bouteille dans cette phase pour le moment.
              </p>
            ) : (
              <div
                className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
                aria-label={`${phase.title} : ${bottles} bouteilles`}
              >
                {phaseWines.map((wine) => (
                  <WineTile
                    key={`${wine.wineId}-${wine.vintage ?? "unknown"}`}
                    href={`/wines/${wine.wineId}`}
                    name={wine.name}
                    imageUrl={wine.imageUrl}
                    className="w-[272px] shrink-0 snap-start"
                    meta={<WineColor color={wine.color} label={wine.vintage ?? "Sans millésime"} />}
                    footer={
                      <>
                        <span className="tag">
                          {wine.quantity} bt{wine.quantity > 1 ? "s" : ""}
                        </span>
                        <span className="font-medium" style={{ color: phase.color }}>
                          {windowLabel(wine)}
                        </span>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
