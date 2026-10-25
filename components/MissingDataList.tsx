"use client";

import Link from "next/link";
import { useState } from "react";

type MissingField = { label: string; scope: "wine" | "vintage" };
type IncompleteWine = {
  wine: { id: string; name: string; producer: string | null; imageUrl: string | null };
  missing: MissingField[];
};

function fieldKind(label: string) {
  return label.replace(/^.+? · /, "");
}

const FIELD_ICONS: Record<string, string> = {
  "Image": "🖼️",
  "Producteur": "👤",
  "Couleur": "🎨",
  "Région": "📍",
  "Appellation": "🏷️",
  "Cépage(s)": "🌱",
  "Description": "📝",
  "Notes de dégustation": "✍️",
  "Accords mets/vin": "🍽️",
  "Année": "📅",
  "Prix d’achat": "💶",
  "Estimation marché": "📈",
  "Période d’apogée": "⌛",
};

function FieldIcon({ label }: { label: string }) {
  return <span aria-hidden="true">{FIELD_ICONS[fieldKind(label)] ?? "•"}</span>;
}

export function MissingDataList({ wines, fieldCounts }: { wines: IncompleteWine[]; fieldCounts: Array<[string, number]> }) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filteredWines = activeFilter
    ? wines.filter(({ missing }) => missing.some((field) => fieldKind(field.label) === activeFilter))
    : wines;

  return (
    <>
      <section className="rounded-2xl p-6 mb-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }} data-reveal>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>Les plus fréquentes</p>
          {activeFilter && (
            <button type="button" onClick={() => setActiveFilter(null)} className="text-xs underline" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Effacer le filtre
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {fieldCounts.map(([label, count]) => {
            const isActive = activeFilter === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(isActive ? null : label)}
                aria-pressed={isActive}
                className="px-3 py-1.5 rounded-full text-sm transition-opacity hover:opacity-80"
                style={{ background: isActive ? "var(--wine-red)" : "var(--surface-2)", color: isActive ? "white" : "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                <FieldIcon label={label} /> {label} <strong>· {count}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-sm mb-3" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
        {filteredWines.length} vin{filteredWines.length > 1 ? "s" : ""}{activeFilter ? ` sans « ${activeFilter} »` : " à compléter"}
      </p>
      <div className="space-y-3" data-reveal-stagger>
        {filteredWines.map(({ wine, missing }) => (
          <article key={wine.id} data-reveal className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.05)" }}>
            <div className="flex gap-4">
              {wine.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wine.imageUrl} alt="" className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 object-contain" />
              ) : (
                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 flex items-center justify-center text-3xl" aria-label="Image manquante">🍷</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--wine-red)" }} />
                      <h2 className="text-xl font-semibold truncate" style={{ fontFamily: "var(--font-playfair)" }}>{wine.name}</h2>
                    </div>
                    {wine.producer && <p className="text-sm ml-5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{wine.producer}</p>}
                  </div>
                  <Link href={`/wines/${wine.id}/edit`} className="shrink-0 px-4 py-2 rounded-full text-sm font-medium text-center" style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}>
                    Compléter
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {missing.map((field) => (
                    <span key={field.label} className="px-2.5 py-1 rounded-lg text-xs" style={{ background: field.scope === "wine" ? "rgba(192,25,59,0.08)" : "var(--surface-2)", color: field.scope === "wine" ? "var(--wine-red)" : "var(--text-muted)", fontFamily: "var(--font-inter)" }}>
                      <FieldIcon label={field.label} /> {field.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
