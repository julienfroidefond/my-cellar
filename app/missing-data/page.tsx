import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { MissingDataList } from "@/components/MissingDataList";

type MissingField = { label: string; scope: "wine" | "vintage" };

const WINE_FIELDS: Array<[keyof { imageUrl: string | null; producer: string | null; color: string | null; region: string | null; appellation: string | null; grapeVarieties: string | null; description: string | null; notes: string | null; foodPairing: string | null }, string]> = [
  ["imageUrl", "Image"],
  ["producer", "Producteur"],
  ["color", "Couleur"],
  ["region", "Région"],
  ["appellation", "Appellation"],
  ["grapeVarieties", "Cépage(s)"],
  ["description", "Description"],
  ["notes", "Notes de dégustation"],
  ["foodPairing", "Accords mets/vin"],
];

export default async function MissingDataPage() {
  await connection();
  const wines = await prisma.wine.findMany({
    include: { vintages: { orderBy: { vintage: "desc" } } },
    orderBy: { name: "asc" },
  });

  const incompleteWines = wines.map((wine) => {
    const missing: MissingField[] = WINE_FIELDS
      .filter(([field]) => !wine[field])
      .map(([, label]) => ({ label, scope: "wine" }));

    for (const vintage of wine.vintages) {
      const prefix = vintage.vintage?.toString() ?? "Millésime inconnu";
      if (!vintage.vintage) missing.push({ label: `${prefix} · Année`, scope: "vintage" });
      if (vintage.purchasePrice == null) missing.push({ label: `${prefix} · Prix d’achat`, scope: "vintage" });
      if (vintage.marketPrice == null) missing.push({ label: `${prefix} · Estimation marché`, scope: "vintage" });
      if (vintage.drinkFrom == null || vintage.drinkUntil == null) {
        missing.push({ label: `${prefix} · Période d’apogée`, scope: "vintage" });
      }
    }

    return { wine, missing };
  }).filter(({ missing }) => missing.length > 0);

  const missingCount = incompleteWines.reduce((total, { missing }) => total + missing.length, 0);
  const fieldCounts = new Map<string, number>();
  for (const { missing } of incompleteWines) {
    for (const field of missing) {
      const label = field.label.replace(/^.+? · /, "");
      fieldCounts.set(label, (fieldCounts.get(label) ?? 0) + 1);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <PageHeader
        eyebrow="Qualité des données"
        title="Données à compléter"
        lead={
          incompleteWines.length === 0
            ? "Tous les vins possèdent les informations suivies par cette vue."
            : `${incompleteWines.length} vin${incompleteWines.length > 1 ? "s" : ""} présentent ${missingCount} information${missingCount > 1 ? "s" : ""} manquante${missingCount > 1 ? "s" : ""}.`
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {incompleteWines.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-3xl mb-3">✓</p>
            <p className="font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>La cave est complète.</p>
          </div>
        ) : (
          <MissingDataList wines={incompleteWines} fieldCounts={Array.from(fieldCounts.entries()).sort(([, a], [, b]) => b - a)} />
        )}
      </div>
    </div>
  );
}
