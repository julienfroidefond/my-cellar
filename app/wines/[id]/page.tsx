import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import DeleteWineButton from "./DeleteWineButton";
import AddBottleButton from "./AddBottleButton";
import DrinkButton from "./DrinkButton";
import RemoveStockButton from "./RemoveStockButton";
import EditVintagePriceButton from "./EditVintagePriceButton";
import { decodeSlot } from "@/lib/rack-configs";
import { estimateMaturity } from "@/lib/maturity";
import { Stars } from "@/components/StarRating";
import { PageHeader } from "@/components/PageHeader";
import { MaturityTimeline } from "@/components/MaturityTimeline";
import { removalReasonLabel } from "@/lib/history";
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
            <RemoveStockButton vintageId={v.id} maxQuantity={v.quantity} />
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

        <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>Achat</p>
            <EditVintagePriceButton vintageId={v.id} currentPrice={v.purchasePrice} />
          </div>
          <p className="font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
            {v.purchasePrice != null ? `${v.purchasePrice.toFixed(2)} €` : "—"}
          </p>
        </div>

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

  const ratedEntries = wineHistory.filter((h) => h.rating != null);
  const avgRating = ratedEntries.length
    ? ratedEntries.reduce((s, h) => s + (h.rating ?? 0), 0) / ratedEntries.length
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: cfg.color }}
            />
            {cfg.label}
            {wine.appellation ? ` · ${wine.appellation}` : ""}
          </span>
        }
        title={
          <span className="flex items-start justify-between gap-4">
            <span className="min-w-0">{wine.name}</span>
            {wine.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wine.imageUrl}
                alt=""
                aria-hidden="true"
                className="h-24 w-auto shrink-0 object-contain lg:hidden"
                style={{ filter: "drop-shadow(0 8px 16px rgba(26,10,14,0.22))" }}
              />
            )}
          </span>
        }
        lead={
          wine.producer || wine.description ? (
            <div className="space-y-2.5">
              {wine.producer && (
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {wine.producer}
                </p>
              )}
              {wine.description && (
                <p className="max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {wine.description}
                </p>
              )}
            </div>
          ) : undefined
        }
        asideSize="narrow"
        aside={
          wine.imageUrl ? (
            <div className="hidden min-h-[300px] items-center justify-center lg:flex lg:pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wine.imageUrl}
                alt={wine.name}
                style={{
                  maxHeight: 320,
                  maxWidth: "100%",
                  width: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 18px 30px rgba(26,10,14,0.25))",
                }}
              />
            </div>
          ) : undefined
        }
        stats={[
          { value: totalBottles, label: "Bouteilles" },
          { value: wine.vintages.length, label: "Millésimes" },
          ...(wine.region ? [{ value: wine.region, label: "Région" }] : []),
          ...(avgRating != null
            ? [{ value: `${avgRating.toFixed(1)} / 5`, label: "Note moyenne" }]
            : []),
        ]}
        back={
          <Link
            href="/wines"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-60"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
          >
            <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
            Collection
          </Link>
        }
        actions={
          <Link
            href={`/wines/${wine.id}/edit`}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-75"
            style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontFamily: "var(--font-inter)" }}
          >
            <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
            Modifier
          </Link>
        }
      />

      {/* ── Body ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <MaturityTimeline vintages={wine.vintages} wine={wine} />
        <div className="grid md:grid-cols-3 gap-8">

          {/* Millésimes — 2/3 */}
          <div className="md:col-span-2">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Stock</p>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>Millésimes</h2>
              </div>
              <AddBottleButton id={wine.id} vintage={wine.vintages[0]?.vintage ?? null} />
            </div>
            {wine.vintages.length === 0 ? (
              <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                Aucun millésime — utilisez le bouton « Ajouter une bouteille » ci-dessus.
              </p>
            ) : (
              <div className="space-y-3" data-reveal>
                {(wine.vintages as VintageWithSlots[]).map((v) => (
                  <VintageRow key={v.id} v={v} wine={wine} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div>
            <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.06)" }} data-reveal>
              <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Fiche technique</p>
              <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: "var(--font-playfair)" }}>Détails</h2>
              <dl className="space-y-4">
                {[
                  { label: "Producteur", value: wine.producer },
                  { label: "Appellation", value: wine.appellation },
                  { label: "Région", value: wine.region },
                  { label: "Pays", value: wine.country },
                  { label: "Cépage(s)", value: wine.grapeVarieties },
                  { label: "Accords mets/vin", value: wine.foodPairing },
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
          const groups = new Map<string, { action: string; reason: string | null; note: string | null; vintage: number | null; date: Date; count: number; ratings: number[] }>();
          for (const h of wineHistory) {
            const day = new Date(h.consumedAt).toDateString();
            const key = `${day}|${h.vintage ?? ""}|${h.action}|${h.reason ?? ""}`;
            const existing = groups.get(key);
            if (existing) {
              existing.count += h.quantity;
              if (h.rating != null) existing.ratings.push(h.rating);
              if (h.note) existing.note = existing.note ? `${existing.note} · ${h.note}` : h.note;
            } else {
              groups.set(key, { action: h.action, reason: h.reason, note: h.note, vintage: h.vintage, date: new Date(h.consumedAt), count: h.quantity, ratings: h.rating != null ? [h.rating] : [] });
            }
          }
          const rows = Array.from(groups.values()).map((g) => ({
            ...g,
            avgRating: g.ratings.length ? g.ratings.reduce((s, r) => s + r, 0) / g.ratings.length : null,
          }));

          return (
            <div className="mt-10" data-reveal>
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
                          background:
                            h.action === "bu"
                              ? "rgba(192,25,59,0.09)"
                              : h.reason === "offert"
                                ? "rgba(184,122,44,0.12)"
                                : "rgba(26,10,14,0.06)",
                          color:
                            h.action === "bu"
                              ? "var(--wine-red)"
                              : h.reason === "offert"
                                ? "var(--gold)"
                                : "var(--text-muted)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {h.action === "bu" ? "Bu" : removalReasonLabel(h.reason)}
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
                      {h.note && (
                        <span
                          className="hidden sm:block text-xs italic truncate"
                          style={{ maxWidth: 220, fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
                          title={h.note}
                        >
                          {h.note}
                        </span>
                      )}
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
        <div className="mt-10">
          <DeleteWineButton id={wine.id} name={wine.name} />
        </div>
      </div>
    </div>
  );
}
