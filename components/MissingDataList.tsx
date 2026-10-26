"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Circle,
  Euro,
  FileText,
  Grape,
  Hourglass,
  Image as ImageIcon,
  MapPin,
  Palette,
  PenLine,
  Tag,
  TrendingUp,
  User,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { BottleSilhouette } from "@/components/WineTile";

type MissingField = { label: string; scope: "wine" | "vintage" };
type IncompleteWine = {
  wine: { id: string; name: string; producer: string | null; imageUrl: string | null };
  missing: MissingField[];
};

function fieldKind(label: string) {
  return label.replace(/^.+? · /, "");
}

const FIELD_ICONS: Record<string, LucideIcon> = {
  "Image": ImageIcon,
  "Producteur": User,
  "Couleur": Palette,
  "Région": MapPin,
  "Appellation": Tag,
  "Cépage(s)": Grape,
  "Description": FileText,
  "Notes de dégustation": PenLine,
  "Accords mets/vin": UtensilsCrossed,
  "Année": CalendarDays,
  "Prix d’achat": Euro,
  "Estimation marché": TrendingUp,
  "Période d’apogée": Hourglass,
};

function FieldIcon({ label, size = 14 }: { label: string; size?: number }) {
  const Icon = FIELD_ICONS[fieldKind(label)] ?? Circle;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />;
}

export function MissingDataList({ wines, fieldCounts }: { wines: IncompleteWine[]; fieldCounts: Array<[string, number]> }) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filteredWines = activeFilter
    ? wines.filter(({ missing }) => missing.some((field) => fieldKind(field.label) === activeFilter))
    : wines;

  return (
    <>
      <section className="mb-8" data-reveal aria-labelledby="missing-filters-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="missing-filters-title" className="label">Filtrer par information manquante</h2>
          {activeFilter && (
            <button type="button" onClick={() => setActiveFilter(null)} className="btn btn-ghost btn-sm">
              <X />
              Effacer le filtre
            </button>
          )}
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {fieldCounts.map(([label, count]) => {
            const isActive = activeFilter === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(isActive ? null : label)}
                aria-pressed={isActive}
                className="chip h-10 shrink-0"
              >
                <FieldIcon label={label} />
                {label}
                <span className="tabular opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        <span className="font-semibold tabular text-foreground">{filteredWines.length}</span> vin{filteredWines.length > 1 ? "s" : ""}
        {activeFilter ? ` sans « ${activeFilter} »` : " à compléter"}
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" data-reveal-stagger>
        {filteredWines.map(({ wine, missing }) => {
          const wineFields = missing.filter((field) => field.scope === "wine");
          const vintageFields = missing.filter((field) => field.scope === "vintage");
          return (
            <article key={wine.id} data-reveal className="card flex overflow-hidden">
              <div className="flex w-16 shrink-0 items-center justify-center bg-surface-2 p-1.5 sm:w-24 sm:p-2">
                {wine.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wine.imageUrl} alt="" loading="lazy" className="h-20 w-auto object-contain drop-shadow-[0_6px_10px_rgba(43,9,18,0.22)] sm:h-28" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-faint" aria-label="Image manquante">
                    <BottleSilhouette className="h-12 w-auto text-surface-3 sm:h-16" />
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-semibold leading-snug">{wine.name}</h3>
                    {wine.producer && <p className="truncate text-sm text-muted">{wine.producer}</p>}
                  </div>
                  <span className="badge badge-wine shrink-0" title="Informations manquantes">
                    {missing.length}
                  </span>
                </div>

                {wineFields.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-medium text-faint">Fiche du vin</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {wineFields.map((field) => (
                        <li key={field.label} className="tag tag-wine">
                          <FieldIcon label={field.label} size={12} /> {field.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {vintageFields.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium text-faint">Millésimes</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {vintageFields.map((field) => (
                        <li key={field.label} className="tag">
                          <FieldIcon label={field.label} size={12} /> {field.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`/wines/${wine.id}/edit`} className="btn btn-primary btn-sm h-10 flex-1 sm:flex-none">
                    <PenLine />
                    Compléter
                  </Link>
                  <Link href={`/wines/${wine.id}`} className="btn btn-ghost btn-sm h-10">
                    Voir la fiche
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
