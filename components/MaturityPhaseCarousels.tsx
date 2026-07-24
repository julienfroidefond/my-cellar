import Link from "next/link";
import type { MaturityPhase } from "@/lib/maturity-phase";

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

const PHASES: { key: MaturityPhase; eyebrow: string; title: string; description: string; color: string; background: string }[] = [
  { key: "nearing-end", eyebrow: "À ouvrir", title: "À boire bientôt", description: "La fenêtre se referme dans les deux ans", color: "#b15a28", background: "rgba(177,90,40,0.12)" },
  { key: "ready", eyebrow: "À ouvrir", title: "À l’apogée", description: "À déguster dès maintenant", color: "#a01e35", background: "rgba(192,25,59,0.10)" },
  { key: "soon", eyebrow: "À surveiller", title: "Bientôt prêt", description: "Moins de deux ans avant le début de la fenêtre", color: "#a46b1e", background: "rgba(184,122,44,0.12)" },
  { key: "too-early", eyebrow: "En cave", title: "Trop tôt", description: "Plus de deux ans avant le début de la fenêtre", color: "#516a58", background: "rgba(81,106,88,0.12)" },
  { key: "past", eyebrow: "À ne pas attendre", title: "À dépasser", description: "À ouvrir sans tarder", color: "#6b5862", background: "rgba(107,88,98,0.12)" },
];

export function MaturityPhaseCarousels({ wines }: { wines: MaturityWine[] }) {
  return (
    <div className="space-y-10">
      {PHASES.map((phase) => {
        const phaseWines = wines
          .filter((wine) => wine.phase === phase.key)
          .sort((a, b) => phase.key === "past" ? a.until - b.until : a.until - b.until || a.name.localeCompare(b.name, "fr"));
        const bottles = phaseWines.reduce((total, wine) => total + wine.quantity, 0);

        return (
          <section key={phase.key}>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase mb-1.5" style={{ color: phase.color, fontFamily: "var(--font-inter)", fontWeight: 600 }}>
                  {phase.eyebrow}
                </p>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
                  {phase.title}
                </h2>
                <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {phase.description}
                </p>
              </div>
              <span className="text-sm px-3 py-1.5 rounded-full" style={{ background: phase.background, color: phase.color, fontFamily: "var(--font-inter)", fontWeight: 600 }}>
                {bottles} bouteille{bottles !== 1 ? "s" : ""}
              </span>
            </div>

            {phaseWines.length === 0 ? (
              <div className="rounded-2xl px-5 py-6 text-sm" style={{ background: "var(--surface)", border: "1px dashed var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
                Aucune bouteille dans cette phase pour le moment.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory" aria-label={`${phase.title} : ${bottles} bouteilles`}>
                {phaseWines.map((wine) => (
                  <Link
                    key={`${wine.wineId}-${wine.vintage ?? "unknown"}`}
                    href={`/wines/${wine.wineId}`}
                    className="snap-start shrink-0 w-60 sm:w-64 rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 relative overflow-hidden"
                    style={{ background: "var(--surface)", border: `1px solid ${phase.color}33`, boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}
                  >
                    {wine.imageUrl && (
                      <div className="absolute right-1 top-1 bottom-1 pointer-events-none" style={{ width: 74 }}>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--surface) 0%, transparent 55%)" }} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={wine.imageUrl} alt="" loading="lazy" style={{ position: "absolute", right: 4, bottom: 0, height: "100%", width: "100%", objectFit: "contain", opacity: 0.9, filter: "drop-shadow(0 4px 12px rgba(26,10,14,0.16))" }} />
                      </div>
                    )}
                    <div style={{ paddingRight: wine.imageUrl ? 54 : undefined }}>
                      <div className="flex items-center gap-2 mb-4 text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: wine.color === "rouge" ? "#c02030" : wine.color === "blanc" ? "#c4983c" : wine.color === "rosé" ? "#d4647a" : "#927b72" }} />
                        <span>{wine.vintage ?? "Sans millésime"}</span>
                      </div>
                      <h3 className="font-semibold leading-snug line-clamp-2" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>{wine.name}</h3>
                      <p className="text-xs mt-3" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                        {wine.quantity} bt{wine.quantity > 1 ? "s" : ""} · {phase.key === "past" ? `depuis ${wine.until}` : phase.key === "ready" || phase.key === "nearing-end" ? `jusqu’en ${wine.until}` : `à partir de ${wine.from}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
