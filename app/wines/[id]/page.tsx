import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteWineButton from "./DeleteWineButton";
import AddBottleButton from "./AddBottleButton";
import { decodeSlot } from "@/lib/rack-configs";

const COLOR_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  rouge: { label: "Rouge", color: "#c0193b", bg: "rgba(160,28,46,0.07)", border: "rgba(160,28,46,0.18)" },
  blanc: { label: "Blanc", color: "#b87a2c", bg: "rgba(196,152,60,0.07)", border: "rgba(196,152,60,0.18)" },
  rosé:  { label: "Rosé",  color: "#d4647a", bg: "rgba(210,100,120,0.07)", border: "rgba(210,100,120,0.18)" },
};

export default async function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id }, include: { rack: true } });
  if (!wine) notFound();

  const cfg = COLOR_CONFIG[wine.color ?? ""] ?? {
    label: wine.color ?? "Inconnu",
    color: "var(--text-muted)",
    bg: "rgba(26,10,14,0.04)",
    border: "rgba(26,10,14,0.10)",
  };

  const currentYear = new Date().getFullYear();
  const drinkStatus =
    wine.drinkFrom && wine.drinkUntil
      ? currentYear < wine.drinkFrom
        ? "trop-tôt"
        : currentYear > wine.drinkUntil
        ? "dépassé"
        : "optimal"
      : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="diagonal-stripe relative overflow-hidden" style={{ minHeight: 400, background: "var(--background)" }}>

        {/* Bottle image */}
        {wine.imageUrl && (
          <div
            className="absolute hidden md:block pointer-events-none"
            style={{ right: "13%", top: "-8%", bottom: "-8%", width: 180, zIndex: 20 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wine.imageUrl}
              alt={wine.name}
              style={{
                height: "116%", width: "100%",
                objectFit: "contain", objectPosition: "center",
                filter: "drop-shadow(-10px 18px 36px rgba(26,10,14,0.32))",
              }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-16">
          <Link
            href="/wines"
            className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-100 opacity-60"
            style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
          >
            ← Collection
          </Link>

          {/* Color + appellation eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
            <span
              className="text-xs tracking-[0.3em] uppercase font-semibold"
              style={{ fontFamily: "var(--font-inter)", color: cfg.color }}
            >
              {cfg.label}{wine.appellation ? ` · ${wine.appellation}` : ""}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl font-bold leading-none mb-4 max-w-xl"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
          >
            {wine.name}
          </h1>

          {wine.producer && (
            <p className="text-base mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              {wine.producer}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-8 mb-2">
            <Link
              href={`/wines/${wine.id}/edit`}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
            >
              Modifier
            </Link>
            <AddBottleButton id={wine.id} vintage={wine.vintage} />
            <DeleteWineButton id={wine.id} name={wine.name} />
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {wine.vintage && (
              <StatPill label="Millésime" value={wine.vintage.toString()} highlight />
            )}
            <StatPill label="Stock" value={`${wine.quantity} bouteille${wine.quantity > 1 ? "s" : ""}`} />
            {wine.region && <StatPill label="Région" value={wine.region} />}
            {wine.country && wine.country !== "France" && <StatPill label="Pays" value={wine.country} />}
            {drinkStatus && (
              <StatPill
                label="Dégustation"
                value={`${wine.drinkFrom}–${wine.drinkUntil}`}
                status={drinkStatus}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">

        <div className="grid md:grid-cols-3 gap-6">

          {/* Détails — 2/3 */}
          <div
            className="md:col-span-2 rounded-2xl p-7"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}
          >
            <SectionEyebrow>Fiche technique</SectionEyebrow>
            <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: "var(--font-playfair)" }}>Détails</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: "Producteur", value: wine.producer },
                { label: "Millésime", value: wine.vintage?.toString() },
                { label: "Appellation", value: wine.appellation },
                { label: "Région", value: wine.region },
                { label: "Pays", value: wine.country },
                { label: "Cépage(s)", value: wine.grapeVarieties },
                { label: "Volume", value: wine.volume ? `${wine.volume} cl` : null },
                { label: "Quantité", value: wine.quantity.toString() },
                { label: "Boire à partir de", value: wine.drinkFrom?.toString() },
                { label: "Boire avant", value: wine.drinkUntil?.toString() },
              ]
                .filter((item) => item.value)
                .map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                      {label}
                    </dt>
                    <dd className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>

            {wine.notes && (
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Notes</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {wine.notes}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">

            {/* Valorisation */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}
            >
              <SectionEyebrow>Patrimoine</SectionEyebrow>
              <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: "var(--font-playfair)" }}>Valorisation</h2>

              {wine.purchasePrice != null && (
                <div className="mb-4">
                  <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                    Prix d&apos;achat
                  </p>
                  <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
                    {wine.purchasePrice.toFixed(2)} €
                  </p>
                </div>
              )}

              {wine.marketPrice != null && (
                <div>
                  <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                    Estimation marché
                  </p>
                  <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                    {wine.marketPrice.toFixed(2)} €
                  </p>
                  {wine.quantity > 1 && (
                    <p className="text-xs mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
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

            {/* Position cave */}
            <CavePosition wine={wine} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs tracking-[0.3em] uppercase mb-1 font-semibold"
      style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}
    >
      {children}
    </p>
  );
}

function StatPill({
  label,
  value,
  highlight,
  status,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  status?: "optimal" | "trop-tôt" | "dépassé";
}) {
  const statusColor =
    status === "optimal" ? "#1a7a3c" :
    status === "trop-tôt" ? "#b87a2c" :
    status === "dépassé" ? "#888" : undefined;

  return (
    <div
      className="px-4 py-2.5 rounded-xl"
      style={{
        background: highlight
          ? "rgba(192,25,59,0.09)"
          : status
          ? `${statusColor}14`
          : "var(--surface)",
        border: highlight
          ? "1px solid rgba(192,25,59,0.22)"
          : status
          ? `1px solid ${statusColor}38`
          : "1px solid var(--border)",
        boxShadow: "0 1px 6px rgba(26,10,14,0.05)",
      }}
    >
      <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{
          fontFamily: "var(--font-inter)",
          color: highlight ? "var(--wine-red)" : status ? statusColor : "var(--foreground)",
        }}
      >
        {value}
        {status && (
          <span className="ml-2 text-xs font-normal opacity-70">
            {status === "optimal" ? "✓ Prêt" : status === "trop-tôt" ? "Attendre" : "Passé"}
          </span>
        )}
      </p>
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
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}
      >
        <SectionEyebrow>Stockage</SectionEyebrow>
        <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Cave</h2>
        <p className="text-sm mb-4" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
          Non rangée
        </p>
        <Link
          href="/cave"
          className="inline-flex text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
          style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.20)", background: "rgba(192,25,59,0.08)" }}
        >
          Ranger →
        </Link>
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
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}
    >
      <SectionEyebrow>Stockage</SectionEyebrow>
      <div className="flex items-start justify-between mb-5">
        <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>Cave</h2>
        <Link
          href="/cave"
          className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 shrink-0"
          style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.20)", background: "rgba(192,25,59,0.08)" }}
        >
          Voir →
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Casier</p>
          <p className="text-sm font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            {wine.rack.name}
          </p>
        </div>

        {decoded && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Étagère</p>
                <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                  {decoded.start.totalLevels - decoded.start.levelIndex}
                  <span className="text-xs font-normal ml-1" style={{ color: "var(--text-faint)" }}>
                    /{decoded.start.totalLevels}
                  </span>
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Côté</p>
                <p className="text-sm font-semibold capitalize" style={{ fontFamily: "var(--font-inter)" }}>
                  {decoded.start.side}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
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
                  <span className="text-xs ml-1" style={{ color: "var(--text-faint)" }}>sur {decoded.start.colsInRow}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                    {decoded.start.col + 1}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>sur {decoded.start.colsInRow}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
