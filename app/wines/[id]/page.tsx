import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteWineButton from "./DeleteWineButton";

const COLOR_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  rouge: { label: "Rouge", color: "#8b1a2f", bg: "rgba(139, 26, 47, 0.2)" },
  blanc: { label: "Blanc", color: "#c9a96e", bg: "rgba(201, 169, 110, 0.15)" },
  rosé: { label: "Rosé", color: "#dc7882", bg: "rgba(220, 120, 130, 0.15)" },
};

export default async function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id }, include: { rack: true } });
  if (!wine) notFound();

  const colorConfig = COLOR_CONFIG[wine.color ?? ""] ?? {
    label: wine.color ?? "Inconnu",
    color: "#666",
    bg: "rgba(255,255,255,0.05)",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${colorConfig.bg} 0%, var(--background) 100%)` }}
      >
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link
            href="/wines"
            className="inline-flex items-center gap-2 text-sm mb-8 opacity-50 hover:opacity-100 transition-opacity"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            ← Retour à la collection
          </Link>

          {/* Color badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ background: colorConfig.color }} />
            <span
              className="text-sm tracking-widest uppercase opacity-60"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {colorConfig.label}
              {wine.appellation && ` · ${wine.appellation}`}
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {wine.name}
          </h1>

          {wine.producer && (
            <p className="text-lg opacity-50 mb-8" style={{ fontFamily: "var(--font-inter)" }}>
              {wine.producer}
            </p>
          )}

          {/* Key info */}
          <div className="flex flex-wrap gap-3">
            {wine.vintage && (
              <Badge label="Millésime" value={wine.vintage.toString()} />
            )}
            <Badge label="Bouteilles" value={`${wine.quantity} × ${wine.volume}cl`} />
            {wine.region && <Badge label="Région" value={wine.region} />}
            {wine.country && wine.country !== "France" && (
              <Badge label="Pays" value={wine.country} />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Details */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <h2
              className="text-lg font-semibold mb-5"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Détails
            </h2>
            <dl className="space-y-4">
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
                      className="text-sm opacity-40 shrink-0"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {label}
                    </dt>
                    <dd
                      className="text-sm text-right"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Prix & Position */}
          <div className="space-y-4">
            {/* Prix */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <h2
                className="text-lg font-semibold mb-5"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Valorisation
              </h2>
              <div className="space-y-4">
                {wine.purchasePrice != null && (
                  <div>
                    <p className="text-xs opacity-40 mb-1" style={{ fontFamily: "var(--font-inter)" }}>
                      Prix d&apos;achat
                    </p>
                    <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                      {wine.purchasePrice.toFixed(2)} €
                    </p>
                  </div>
                )}
                {wine.marketPrice != null && (
                  <div>
                    <p className="text-xs opacity-40 mb-1" style={{ fontFamily: "var(--font-inter)" }}>
                      Estimation marché
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ fontFamily: "var(--font-playfair)", color: "var(--gold)" }}
                    >
                      {wine.marketPrice.toFixed(2)} €
                    </p>
                    {wine.quantity > 1 && (
                      <p className="text-sm opacity-40 mt-1" style={{ fontFamily: "var(--font-inter)" }}>
                        Lot : {(wine.marketPrice * wine.quantity).toFixed(2)} €
                      </p>
                    )}
                  </div>
                )}
                {wine.marketPrice == null && wine.purchasePrice == null && (
                  <p className="opacity-30 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                    Aucun prix renseigné
                  </p>
                )}
              </div>
            </div>

            {/* Position cave */}
            {wine.rack && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Position en cave
                </h2>
                <p className="text-sm opacity-60 mb-3" style={{ fontFamily: "var(--font-inter)" }}>
                  {wine.rack.name}
                </p>
                {wine.rackRow != null && wine.rackCol != null && (
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs opacity-40" style={{ fontFamily: "var(--font-inter)" }}>
                        Rangée
                      </p>
                      <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                        {wine.rackRow + 1}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs opacity-40" style={{ fontFamily: "var(--font-inter)" }}>
                        Colonne
                      </p>
                      <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                        {wine.rackCol + 1}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {wine.notes && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-lg font-semibold mb-3"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Notes
                </h2>
                <p className="text-sm opacity-70 leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>
                  {wine.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href={`/wines/${wine.id}/edit`}
            className="px-5 py-2.5 rounded-full text-sm"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
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

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="px-4 py-2 rounded-xl"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs opacity-40 mb-0.5" style={{ fontFamily: "var(--font-inter)" }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>
        {value}
      </p>
    </div>
  );
}
