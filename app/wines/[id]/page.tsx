import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteWineButton from "./DeleteWineButton";
import { decodeSlot, slotLabel } from "@/lib/rack-configs";

const COLOR_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  rouge: { label: "Rouge", color: "#c02030", bg: "rgba(160, 28, 46, 0.08)", border: "rgba(160, 28, 46, 0.20)" },
  blanc: { label: "Blanc", color: "#a07820", bg: "rgba(196, 152, 60, 0.08)", border: "rgba(196, 152, 60, 0.20)" },
  rosé:  { label: "Rosé",  color: "#b84060", bg: "rgba(210, 100, 120, 0.08)", border: "rgba(210, 100, 120, 0.20)" },
};

export default async function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id }, include: { rack: true } });
  if (!wine) notFound();

  const cfg = COLOR_CONFIG[wine.color ?? ""] ?? {
    label: wine.color ?? "Inconnu",
    color: "#666",
    bg: "rgba(26,10,14,0.04)",
    border: "rgba(26,10,14,0.12)",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${cfg.bg} 0%, var(--background) 70%)`, borderBottom: `1px solid ${cfg.border}` }}
      >
        <div className="max-w-4xl mx-auto px-6 pt-10 pb-14">
          <Link
            href="/wines"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-100"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
          >
            ← Retour à la collection
          </Link>

          <div className="flex items-start gap-8">
            <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }}
            />
            <span
              className="text-xs tracking-[0.2em] uppercase font-medium"
              style={{ fontFamily: "var(--font-inter)", color: cfg.color }}
            >
              {cfg.label}{wine.appellation && ` · ${wine.appellation}`}
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {wine.name}
          </h1>

          {wine.producer && (
            <p className="text-lg mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              {wine.producer}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {wine.vintage && <Badge label="Millésime" value={wine.vintage.toString()} accent />}
            <Badge label="Bouteilles" value={`${wine.quantity} × ${wine.volume}cl`} />
            {wine.region && <Badge label="Région" value={wine.region} />}
            {wine.country && wine.country !== "France" && (
              <Badge label="Pays" value={wine.country} />
            )}
          </div>
            </div>{/* end flex-1 */}

            {wine.imageUrl && (
              <div className="shrink-0 hidden sm:flex items-end pb-2" style={{ width: 90, height: 180 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wine.imageUrl}
                  alt={wine.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.18))" }}
                />
              </div>
            )}
          </div>{/* end flex items-start */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Détails */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
          >
            <h2
              className="text-base font-semibold mb-5 pb-4"
              style={{ fontFamily: "var(--font-playfair)", borderBottom: "1px solid var(--border)" }}
            >
              Détails
            </h2>
            <dl className="space-y-3.5">
              {[
                { label: "Nom complet", value: wine.name },
                { label: "Producteur", value: wine.producer },
                { label: "Millésime", value: wine.vintage?.toString() },
                { label: "Appellation", value: wine.appellation },
                { label: "Région", value: wine.region },
                { label: "Pays", value: wine.country },
                { label: "Cépage(s)", value: wine.grapeVarieties },
                { label: "Volume", value: wine.volume ? `${wine.volume} cl` : null },
                { label: "Quantité", value: wine.quantity.toString() },
              ]
                .filter((item) => item.value)
                .map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt
                      className="text-sm shrink-0"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
                    >
                      {label}
                    </dt>
                    <dd
                      className="text-sm text-right font-medium"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="space-y-4">
            {/* Valorisation */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
            >
              <h2
                className="text-base font-semibold mb-5 pb-4"
                style={{ fontFamily: "var(--font-playfair)", borderBottom: "1px solid var(--border)" }}
              >
                Valorisation
              </h2>
              <div className="space-y-5">
                {wine.purchasePrice != null && (
                  <div>
                    <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                      Prix d&apos;achat
                    </p>
                    <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                      {wine.purchasePrice.toFixed(2)} €
                    </p>
                  </div>
                )}
                {wine.marketPrice != null && (
                  <div>
                    <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                      Estimation marché
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
                    >
                      {wine.marketPrice.toFixed(2)} €
                    </p>
                    {wine.quantity > 1 && (
                      <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                        Lot : {(wine.marketPrice * wine.quantity).toFixed(2)} €
                      </p>
                    )}
                  </div>
                )}
                {wine.marketPrice == null && wine.purchasePrice == null && (
                  <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                    Aucun prix renseigné
                  </p>
                )}
              </div>
            </div>

            {/* Position cave */}
            <CavePosition wine={wine} />

            {/* Notes */}
            {wine.notes && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
              >
                <h2
                  className="text-base font-semibold mb-3 pb-4"
                  style={{ fontFamily: "var(--font-playfair)", borderBottom: "1px solid var(--border)" }}
                >
                  Notes
                </h2>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {wine.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href={`/wines/${wine.id}/edit`}
            className="px-5 py-2.5 rounded-full text-sm transition-all hover:opacity-80"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
              color: "var(--text-muted)",
            }}
          >
            Modifier
          </Link>
          <DeleteWineButton id={wine.id} name={wine.name} />
        </div>
      </div>
    </div>
  );
}

function CavePosition({ wine }: {
  wine: {
    rack: { name: string } | null;
    rackRow: number | null;
    rackCol: number | null;
    quantity: number;
  }
}) {
  if (!wine.rack) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
      >
        <h2
          className="text-base font-semibold mb-4 pb-4"
          style={{ fontFamily: "var(--font-playfair)", borderBottom: "1px solid var(--border)" }}
        >
          Position en cave
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "rgba(26,10,14,0.18)" }} />
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Non rangée
          </p>
          <Link
            href="/cave"
            className="ml-auto text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.20)", background: "rgba(192,25,59,0.08)" }}
          >
            Ranger →
          </Link>
        </div>
      </div>
    );
  }

  const decoded =
    wine.rackRow != null && wine.rackCol != null
      ? decodeSlot(wine.rack.name, wine.rackRow, wine.rackCol, wine.quantity)
      : null;

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
          Position en cave
        </h2>
        <Link
          href="/cave"
          className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
          style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.20)", background: "rgba(192,25,59,0.08)" }}
        >
          Voir la cave →
        </Link>
      </div>

      {/* Badge casier */}
      <div className="flex items-center gap-3 mb-5">
        <span
          className="px-3 py-1.5 rounded-lg text-sm font-bold tracking-wide"
          style={{ background: "#a05828", color: "#fff", fontFamily: "var(--font-inter)" }}
        >
          Casier {wine.rack.name}
        </span>
        <span className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
          {wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}
        </span>
      </div>

      {decoded ? (
        <div className="space-y-3">
          {/* Étagère + côté */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                Étagère
              </p>
              <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                {decoded.start.totalLevels - decoded.start.levelIndex}
                <span className="text-xs font-normal ml-1.5" style={{ color: "var(--text-faint)" }}>
                  / {decoded.start.totalLevels}
                </span>
              </p>
            </div>
            <div
              className="rounded-xl p-3.5"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                Rangée
              </p>
              <p className="text-base font-semibold capitalize" style={{ fontFamily: "var(--font-inter)" }}>
                {decoded.start.side}
              </p>
            </div>
          </div>

          {/* Position(s) */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs mb-1.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
              {wine.quantity > 1 ? "Emplacements" : "Emplacement"}
            </p>
            {wine.quantity > 1 && decoded.end ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                  {decoded.start.col + 1}
                </span>
                <span style={{ color: "var(--text-faint)" }}>→</span>
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                  {decoded.end.col + 1}
                </span>
                <span className="text-xs ml-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                  sur {decoded.start.colsInRow}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                  {decoded.start.col + 1}
                </span>
                <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                  sur {decoded.start.colsInRow}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        wine.rackRow != null && wine.rackCol != null && (
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Ligne {wine.rackRow + 1}, position {wine.rackCol + 1}
          </p>
        )
      )}
    </div>
  );
}

function Badge({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="px-4 py-2.5 rounded-xl"
      style={{
        background: accent ? "rgba(192,25,59,0.10)" : "rgba(26,10,14,0.04)",
        border: accent ? "1px solid rgba(192,25,59,0.25)" : "1px solid var(--border)",
      }}
    >
      <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{ fontFamily: "var(--font-inter)", color: accent ? "var(--wine-red)" : "var(--foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}
