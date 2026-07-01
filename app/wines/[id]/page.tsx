import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteWineButton from "./DeleteWineButton";
import AddBottleButton from "./AddBottleButton";
import DrinkButton from "./DrinkButton";
import RemoveStockButton from "./RemoveStockButton";
import { decodeSlot } from "@/lib/rack-configs";
import { estimateMaturity } from "@/lib/maturity";
import { Stars } from "@/components/StarRating";
import type { WineVintage } from "@/app/generated/prisma/client";

const COLOR_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  rouge: { label: "Rouge", color: "#c0193b", bg: "rgba(160,28,46,0.07)", border: "rgba(160,28,46,0.18)" },
  blanc: { label: "Blanc", color: "#b87a2c", bg: "rgba(196,152,60,0.07)", border: "rgba(196,152,60,0.18)" },
  rosé:  { label: "Rosé",  color: "#d4647a", bg: "rgba(210,100,120,0.07)", border: "rgba(210,100,120,0.18)" },
};

type SlotInfo = { id: string; rackId: string; rackRow: number; rackCol: number; quantity: number; rack: { name: string } };
type VintageWithSlots = WineVintage & { slots: SlotInfo[] };

function VintageRow({ v, wine }: {
  v: VintageWithSlots;
  wine: { color: string | null; region: string | null; appellation: string | null };
}) {
  const currentYear = new Date().getFullYear();
  const hasManual = !!(v.drinkFrom && v.drinkUntil);
  const est = !hasManual
    ? estimateMaturity({ region: wine.region, appellation: wine.appellation, color: wine.color, vintage: v.vintage })
    : null;
  const from = v.drinkFrom ?? est?.drinkFrom ?? null;
  const until = v.drinkUntil ?? est?.drinkUntil ?? null;
  const status =
    from && until
      ? currentYear < from ? "trop-tôt"
      : currentYear > until ? "dépassé"
      : "optimal"
      : null;

  const statusColor = status === "optimal" ? "#1a7a3c" : status === "trop-tôt" ? "#b87a2c" : "#888";

  const firstSlot = v.slots[0] ?? null;
  const decoded = firstSlot
    ? decodeSlot(firstSlot.rack.name, firstSlot.rackRow, firstSlot.rackCol, firstSlot.quantity)
    : null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: v.quantity === 0 ? "rgba(26,10,14,0.02)" : "var(--surface)",
        border: `1px solid ${v.quantity === 0 ? "rgba(26,10,14,0.06)" : "var(--border)"}`,
        boxShadow: v.quantity === 0 ? "none" : "0 2px 8px rgba(26,10,14,0.05)",
        opacity: v.quantity === 0 ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {v.vintage ? (
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-playfair)", color: v.quantity === 0 ? "var(--text-muted)" : "var(--wine-red)" }}
            >
              {v.vintage}
            </span>
          ) : (
            <span className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Millésime inconnu</span>
          )}
          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              background: v.quantity === 0 ? "rgba(26,10,14,0.06)" : "rgba(192,25,59,0.09)",
              color: v.quantity === 0 ? "var(--text-muted)" : "var(--wine-red)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {v.quantity === 0 ? "Épuisé" : `${v.quantity} bouteille${v.quantity > 1 ? "s" : ""}`}
          </div>
        </div>
        {v.quantity > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <RemoveStockButton vintageId={v.id} />
            <DrinkButton vintageId={v.id} wineName="" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        {(from || until) && (
          <div className="rounded-xl p-3" style={{ background: `${statusColor}10`, border: `1px dashed ${statusColor}44` }}>
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
              {hasManual ? "Dégustation" : "Maturité ~"}
            </p>
            <p className="font-semibold" style={{ fontFamily: "var(--font-inter)", color: statusColor }}>
              {from}–{until}
              {status && (
                <span className="ml-1.5 text-xs font-normal opacity-70">
                  {status === "optimal" ? "✓ Prêt" : status === "trop-tôt" ? "Attendre" : "Passé"}
                </span>
              )}
            </p>
          </div>
        )}

        {v.marketPrice != null && (
          <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Marché</p>
            <p className="font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
              {v.marketPrice.toFixed(2)} €
              {v.quantity > 1 && (
                <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-faint)" }}>
                  × {v.quantity} = {(v.marketPrice * v.quantity).toFixed(0)} €
                </span>
              )}
            </p>
          </div>
        )}

        {v.purchasePrice != null && (
          <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Achat</p>
            <p className="font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{v.purchasePrice.toFixed(2)} €</p>
          </div>
        )}

        {firstSlot && decoded && (
          <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Casier</p>
            <p className="font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
              {firstSlot.rack.name} · Ét.{decoded.start.totalLevels - decoded.start.levelIndex} · P{decoded.start.col + 1}
            </p>
          </div>
        )}

        {v.slots.length === 0 && v.quantity > 0 && (
          <div className="rounded-xl p-3" style={{ background: "rgba(26,10,14,0.03)", border: "1px dashed rgba(26,10,14,0.15)" }}>
            <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Casier</p>
            <Link href="/cave" className="text-xs font-medium" style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}>
              À ranger →
            </Link>
          </div>
        )}
      </div>

      {est?.note && v.quantity > 0 && (
        <p className="mt-3 pt-3 text-xs leading-relaxed italic" style={{ borderTop: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
          {est.note}
        </p>
      )}
    </div>
  );
}

export default async function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: {
      vintages: {
        include: { slots: { include: { rack: true }, orderBy: [{ rackRow: "asc" }, { rackCol: "asc" }] } },
        orderBy: { vintage: "desc" },
      },
    },
  });
  if (!wine) notFound();

  const wineHistory = await prisma.wineHistory.findMany({
    where: { wineName: wine.name },
    orderBy: { consumedAt: "desc" },
  });

  const cfg = COLOR_CONFIG[wine.color ?? ""] ?? {
    label: wine.color ?? "Inconnu",
    color: "var(--text-muted)",
    bg: "rgba(26,10,14,0.04)",
    border: "rgba(26,10,14,0.10)",
  };

  const totalBottles = wine.vintages.reduce((s, v) => s + v.quantity, 0);
  const inStockCount = wine.vintages.filter((v) => v.quantity > 0).length;

  const ratedEntries = wineHistory.filter((h) => h.rating != null);
  const avgRating = ratedEntries.length
    ? ratedEntries.reduce((s, h) => s + (h.rating ?? 0), 0) / ratedEntries.length
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="diagonal-stripe relative overflow-hidden" style={{ minHeight: 360, background: "var(--background)" }}>
        {wine.imageUrl && (
          <div
            className="absolute hidden md:block pointer-events-none"
            style={{ right: "13%", top: "-8%", bottom: "-8%", width: 180, zIndex: 20 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wine.imageUrl}
              alt={wine.name}
              style={{ height: "116%", width: "100%", objectFit: "contain", objectPosition: "center", filter: "drop-shadow(-10px 18px 36px rgba(26,10,14,0.32))" }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-16">
          <Link href="/wines" className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-100 opacity-60" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>
            ← Collection
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: cfg.color }}>
                  {cfg.label}{wine.appellation ? ` · ${wine.appellation}` : ""}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-none mb-4 max-w-xl" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
                {wine.name}
              </h1>

              {wine.producer && (
                <p className="text-base mb-6" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{wine.producer}</p>
              )}
            </div>

            {wine.imageUrl && (
              <div className="md:hidden shrink-0 pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wine.imageUrl}
                  alt={wine.name}
                  style={{ height: 200, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(26,10,14,0.28))" }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-4 py-2.5 rounded-xl" style={{ background: "rgba(192,25,59,0.09)", border: "1px solid rgba(192,25,59,0.22)" }}>
              <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Stock total</p>
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>{totalBottles} bouteille{totalBottles !== 1 ? "s" : ""}</p>
            </div>
            <div className="px-4 py-2.5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Millésimes</p>
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>{wine.vintages.length} ({inStockCount} en stock)</p>
            </div>
            {wine.region && (
              <div className="px-4 py-2.5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Région</p>
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>{wine.region}</p>
              </div>
            )}
            {avgRating != null && (
              <div className="px-4 py-2.5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Note moyenne</p>
                <Stars rating={avgRating} />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href={`/wines/${wine.id}/edit`} className="px-5 py-2.5 rounded-full text-sm font-medium text-center transition-opacity hover:opacity-90" style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}>
              Modifier
            </Link>
            <AddBottleButton id={wine.id} vintage={wine.vintages[0]?.vintage ?? null} />
          </div>
          <div className="mt-4">
            <DeleteWineButton id={wine.id} name={wine.name} />
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Millésimes — 2/3 */}
          <div className="md:col-span-2">
            {wine.description && (
              <div
                className="rounded-2xl p-6 mb-8"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}
              >
                <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Description</p>
                <p className="text-base leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>{wine.description}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Stock</p>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>Millésimes</h2>
            </div>
            {wine.vintages.length === 0 ? (
              <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                Aucun millésime — utilisez le bouton &quot;+ Ajouter&quot; ci-dessus.
              </p>
            ) : (
              <div className="space-y-3">
                {(wine.vintages as VintageWithSlots[]).map((v) => (
                  <VintageRow key={v.id} v={v} wine={wine} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div>
            <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }}>
              <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Fiche technique</p>
              <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: "var(--font-playfair)" }}>Détails</h2>
              <dl className="space-y-4">
                {[
                  { label: "Producteur", value: wine.producer },
                  { label: "Appellation", value: wine.appellation },
                  { label: "Région", value: wine.region },
                  { label: "Pays", value: wine.country },
                  { label: "Cépage(s)", value: wine.grapeVarieties },
                ].filter((item) => item.value).map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>{label}</dt>
                    <dd className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>{value}</dd>
                  </div>
                ))}
              </dl>
              {wine.notes && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Notes</p>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{wine.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historique — pleine largeur, en bas de page */}
        {wineHistory.length > 0 && (() => {
          // Group by day + vintage + action
          const groups = new Map<string, { action: string; vintage: number | null; date: Date; count: number; ratings: number[] }>();
          for (const h of wineHistory) {
            const day = new Date(h.consumedAt).toDateString();
            const key = `${day}|${h.vintage ?? ""}|${h.action}`;
            const existing = groups.get(key);
            if (existing) {
              existing.count += h.quantity;
              if (h.rating != null) existing.ratings.push(h.rating);
            } else {
              groups.set(key, { action: h.action, vintage: h.vintage, date: new Date(h.consumedAt), count: h.quantity, ratings: h.rating != null ? [h.rating] : [] });
            }
          }
          const rows = Array.from(groups.values()).map((g) => ({
            ...g,
            avgRating: g.ratings.length ? g.ratings.reduce((s, r) => s + r, 0) / g.ratings.length : null,
          }));

          return (
            <div className="mt-10">
              <div className="mb-4">
                <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Historique</p>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>Consommation</h2>
              </div>
              <div className="space-y-2">
                {rows.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                        style={{
                          background: h.action === "bu" ? "rgba(192,25,59,0.09)" : "rgba(26,10,14,0.06)",
                          color: h.action === "bu" ? "var(--wine-red)" : "var(--text-muted)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {h.action === "bu" ? "Bu" : "Retiré"}
                      </span>
                      {h.vintage && (
                        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
                          {h.vintage}
                        </span>
                      )}
                      {h.count > 1 && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(26,10,14,0.05)", color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
                          ×{h.count}
                        </span>
                      )}
                      {h.avgRating != null && <Stars rating={h.avgRating} />}
                    </div>
                    <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                      {h.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
