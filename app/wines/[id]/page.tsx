import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, Pencil } from "lucide-react";
import DeleteWineButton from "./DeleteWineButton";
import AddBottleButton from "./AddBottleButton";
import DrinkButton from "./DrinkButton";
import RemoveStockButton from "./RemoveStockButton";
import EditVintagePriceButton from "./EditVintagePriceButton";
import { configFromLevels, decodeSlot, defaultRackConfig } from "@/lib/rack-configs";
import { estimateMaturity } from "@/lib/maturity";
import { Stars } from "@/components/StarRating";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { BottleSilhouette, WineColor } from "@/components/WineTile";
import { MaturityTimeline } from "@/components/MaturityTimeline";
import { removalReasonLabel } from "@/lib/history";
import type { WineVintage } from "@/app/generated/prisma/client";

type SlotInfo = {
  id: string;
  rackId: string;
  rackRow: number;
  rackCol: number;
  quantity: number;
  rack: { name: string; levels: { position: number; front: number; back: number }[] };
};
type VintageWithSlots = WineVintage & { slots: SlotInfo[] };

type MaturityStatus = "optimal" | "trop-tôt" | "dépassé";

const STATUS_CONFIG: Record<MaturityStatus, { label: string; className: string }> = {
  optimal: { label: "Prêt", className: "bg-[rgba(26,122,60,0.11)] text-[#17673a]" },
  "trop-tôt": { label: "Attendre", className: "badge-gold" },
  dépassé: { label: "Passé", className: "badge-muted" },
};

/** Bloc d'information d'un millésime : libellé discret au-dessus d'une valeur. */
function Fact({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-surface-2 px-3.5 py-3">
      <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
        {label}
        {action}
      </dt>
      <dd className="mt-1 text-[0.9375rem] font-semibold tabular">{children}</dd>
    </div>
  );
}

function VintageRow({ v, wine, wineName }: {
  v: VintageWithSlots;
  wine: { color: string | null; region: string | null; appellation: string | null };
  wineName: string;
}) {
  const currentYear = new Date().getFullYear();
  const hasManual = !!(v.drinkFrom && v.drinkUntil);
  const est = !hasManual
    ? estimateMaturity({ region: wine.region, appellation: wine.appellation, color: wine.color, vintage: v.vintage })
    : null;
  const from = v.drinkFrom ?? est?.drinkFrom ?? null;
  const until = v.drinkUntil ?? est?.drinkUntil ?? null;
  const status: MaturityStatus | null =
    from && until
      ? currentYear < from ? "trop-tôt"
      : currentYear > until ? "dépassé"
      : "optimal"
      : null;

  const soldOut = v.quantity === 0;
  const slots = v.slots.flatMap((slot) => {
    const config = slot.rack.levels.length > 0
      ? configFromLevels(slot.rack.levels)
      : defaultRackConfig();
    const decoded = decodeSlot(config, slot.rackRow, slot.rackCol, slot.quantity);
    return decoded ? [{ slot, decoded }] : [];
  });

  return (
    <article className={soldOut ? "rounded-[var(--radius-lg)] border border-dashed border-border-strong p-4 opacity-70 sm:p-5" : "card p-4 sm:p-5"}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h3 className={`stat-value text-[1.75rem] ${soldOut ? "text-muted" : ""}`}>
            {v.vintage ?? <span className="font-sans text-base font-medium text-faint">Millésime inconnu</span>}
          </h3>
          <span className={`badge ${soldOut ? "badge-muted" : "badge-wine"}`}>
            {soldOut ? "Épuisé" : `${v.quantity} bouteille${v.quantity > 1 ? "s" : ""}`}
          </span>
          {status && !soldOut && (
            <span className={`badge ${STATUS_CONFIG[status].className}`}>{STATUS_CONFIG[status].label}</span>
          )}
        </div>
        {!soldOut && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <RemoveStockButton vintageId={v.id} maxQuantity={v.quantity} />
            <DrinkButton vintageId={v.id} wineName={v.vintage ? `${wineName} ${v.vintage}` : wineName} />
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Fact label={hasManual ? "Dégustation" : "Maturité estimée"}>
          {from || until ? `${from ?? "?"} – ${until ?? "?"}` : <span className="text-faint">—</span>}
        </Fact>
        <Fact label="Prix marché">
          {v.marketPrice != null ? (
            <>
              {v.marketPrice.toFixed(2)} €
              {v.quantity > 1 && (
                <span className="block text-xs font-normal text-muted">
                  {(v.marketPrice * v.quantity).toFixed(0)} € au total
                </span>
              )}
            </>
          ) : (
            <span className="text-faint">—</span>
          )}
        </Fact>
        <Fact
          label="Prix d’achat"
          action={<EditVintagePriceButton vintageId={v.id} currentPrice={v.purchasePrice} />}
        >
          {v.purchasePrice != null ? `${v.purchasePrice.toFixed(2)} €` : <span className="text-faint">—</span>}
        </Fact>
        <Fact label="Emplacement">
          {slots.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-wine-red" aria-hidden="true" />
              {slots.length === 1
                ? `Casier ${slots[0].slot.rack.name}`
                : `${slots.length} emplacements`}
            </span>
          ) : !soldOut ? (
            <Link href="/cave" className="link inline-flex items-center gap-1 text-sm">
              À ranger
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-faint">—</span>
          )}
        </Fact>
      </dl>

      {slots.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Emplacements en cave">
          {slots.map(({ slot, decoded }) => (
            <li key={slot.id} className="tag">
              {slot.rack.name} · Ét. {decoded.start.totalLevels - decoded.start.levelIndex} · {decoded.start.side} · P{decoded.start.col + 1}
              {slot.quantity > 1 && <span className="font-semibold text-foreground">×{slot.quantity}</span>}
            </li>
          ))}
        </ul>
      )}

      {est?.note && !soldOut && (
        <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed text-muted">
          {est.note}
        </p>
      )}
    </article>
  );
}

export default async function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: {
      vintages: {
        include: {
          slots: {
            include: {
              rack: { include: { levels: { orderBy: { position: "asc" } } } },
            },
            orderBy: [{ rackRow: "asc" }, { rackCol: "asc" }],
          },
        },
        orderBy: { vintage: "desc" },
      },
    },
  });
  if (!wine) notFound();

  const wineHistory = await prisma.wineHistory.findMany({
    where: { wineName: wine.name },
    orderBy: { consumedAt: "desc" },
  });

  const totalBottles = wine.vintages.reduce((s, v) => s + v.quantity, 0);
  const inStock = wine.vintages.filter((v) => v.quantity > 0);
  // Un seul millésime en stock : « Boire » remonte dans l'en-tête comme action principale.
  const singleInStock = inStock.length === 1 ? inStock[0] : null;

  const ratedEntries = wineHistory.filter((h) => h.rating != null);
  const avgRating = ratedEntries.length
    ? ratedEntries.reduce((s, h) => s + (h.rating ?? 0), 0) / ratedEntries.length
    : null;

  const details = [
    { label: "Producteur", value: wine.producer },
    { label: "Appellation", value: wine.appellation },
    { label: "Région", value: wine.region },
    { label: "Pays", value: wine.country },
    { label: "Cépages", value: wine.grapeVarieties },
  ].filter((item) => item.value);

  return (
    <div>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 normal-case tracking-normal">
            <WineColor color={wine.color} label={wine.color ? undefined : "Couleur inconnue"} />
            {wine.appellation && <span className="text-muted">· {wine.appellation}</span>}
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
                className="h-28 w-auto shrink-0 object-contain drop-shadow-[0_10px_14px_rgba(43,9,18,0.28)] lg:hidden"
              />
            )}
          </span>
        }
        lead={
          wine.producer || wine.description ? (
            <div className="space-y-2.5">
              {wine.producer && <p className="font-semibold text-gold">{wine.producer}</p>}
              {wine.description && <p className="max-w-2xl">{wine.description}</p>}
            </div>
          ) : undefined
        }
        asideSize="narrow"
        aside={
          <div className="relative hidden h-[340px] items-end justify-center overflow-hidden rounded-[var(--radius-lg)] bg-surface-2 pb-6 lg:flex">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-wine-red [clip-path:polygon(0_78%,100%_42%,100%_100%,0_100%)]"
            />
            {wine.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wine.imageUrl}
                alt={wine.name}
                className="relative max-h-[300px] w-auto max-w-[80%] object-contain drop-shadow-[0_18px_24px_rgba(43,9,18,0.35)]"
              />
            ) : (
              <BottleSilhouette className="relative h-[240px] w-auto text-ink" />
            )}
          </div>
        }
        stats={[
          { value: totalBottles, label: totalBottles > 1 ? "Bouteilles" : "Bouteille" },
          { value: wine.vintages.length, label: wine.vintages.length > 1 ? "Millésimes" : "Millésime" },
          ...(wine.region ? [{ value: wine.region, label: "Région" }] : []),
          ...(avgRating != null
            ? [{ value: `${avgRating.toFixed(1)}/5`, label: "Note moyenne" }]
            : []),
        ]}
        back={
          <Link href="/wines" className="btn btn-ghost btn-sm -ml-3">
            <ArrowLeft aria-hidden="true" />
            Collection
          </Link>
        }
        actions={
          <div className="flex w-full flex-wrap items-center gap-2">
            {singleInStock && (
              <DrinkButton
                vintageId={singleInStock.id}
                wineName={singleInStock.vintage ? `${wine.name} ${singleInStock.vintage}` : wine.name}
                className="btn-lg flex-1 sm:flex-none"
              />
            )}
            <AddBottleButton id={wine.id} vintage={wine.vintages[0]?.vintage ?? null} />
            <Link href={`/wines/${wine.id}/edit`} className="btn btn-secondary">
              <Pencil aria-hidden="true" />
              Modifier
            </Link>
            <div className="ml-auto">
              <DeleteWineButton id={wine.id} name={wine.name} />
            </div>
          </div>
        }
      />

      <div className="container-page space-y-12 py-8 md:space-y-14 md:py-12">
        <MaturityTimeline vintages={wine.vintages} wine={wine} />

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
          {/* Millésimes — 2/3 */}
          <section className="lg:col-span-2" aria-labelledby="vintages-title">
            <SectionHeader id="vintages-title" eyebrow="Stock" title="Millésimes" />
            {wine.vintages.length === 0 ? (
              <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong px-5 py-6 text-sm text-muted">
                Aucun millésime : utilisez « Ajouter » en haut de page.
              </p>
            ) : (
              <div className="space-y-3" data-reveal-stagger>
                {(wine.vintages as VintageWithSlots[]).map((v) => (
                  <VintageRow key={v.id} v={v} wine={wine} wineName={wine.name} />
                ))}
              </div>
            )}
          </section>

          {/* Fiche technique — 1/3 */}
          <aside aria-labelledby="details-title" className="space-y-3" data-reveal-stagger>
            <SectionHeader id="details-title" eyebrow="Fiche technique" title="Détails" />
            {details.length > 0 && (
              <dl className="card divide-y divide-border px-5">
                {details.map(({ label, value }) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="shrink-0 text-sm text-muted">{label}</dt>
                    <dd className="min-w-0 text-right text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {wine.foodPairing && (
              <div className="card p-5">
                <h3 className="label">Accords mets et vin</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed">{wine.foodPairing}</p>
              </div>
            )}
            {wine.notes && (
              <div className="card p-5">
                <h3 className="label">Notes</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{wine.notes}</p>
              </div>
            )}
          </aside>
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
            <section data-reveal aria-labelledby="history-title">
              <SectionHeader id="history-title" eyebrow="Historique" title="Consommation" />
              <ul className="card divide-y divide-border" data-reveal-stagger>
                {rows.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 sm:px-5">
                    <span
                      className={`badge ${
                        h.action === "bu" ? "badge-wine" : h.reason === "offert" ? "badge-gold" : "badge-muted"
                      }`}
                    >
                      {h.action === "bu" ? "Bu" : removalReasonLabel(h.reason)}
                    </span>
                    {h.vintage && <span className="font-semibold tabular">{h.vintage}</span>}
                    {h.count > 1 && <span className="tag">×{h.count}</span>}
                    {h.avgRating != null && <Stars rating={h.avgRating} />}
                    <time
                      dateTime={h.date.toISOString()}
                      className="ml-auto text-sm text-muted tabular"
                    >
                      {h.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </time>
                    {h.note && (
                      <p className="w-full text-sm italic text-muted">{h.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}
      </div>
    </div>
  );
}
