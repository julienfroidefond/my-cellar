export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { estimateMaturity } from "@/lib/maturity";
import { getMaturityPhase } from "@/lib/maturity-phase";
import { MaturityAvailabilityChart } from "@/components/MaturityAvailabilityChart";
import { MaturityPhaseCarousels, type MaturityWine } from "@/components/MaturityPhaseCarousels";

export default async function MaturityPage() {
  const currentYear = new Date().getFullYear();
  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });
  const maturityWines: MaturityWine[] = wines.flatMap((wine) => wine.vintages.flatMap((vintage) => {
    if (vintage.quantity <= 0) return [];
    const estimate = !vintage.drinkFrom || !vintage.drinkUntil
      ? estimateMaturity({ region: wine.region, appellation: wine.appellation, color: wine.color, vintage: vintage.vintage })
      : null;
    const from = vintage.drinkFrom ?? estimate?.drinkFrom;
    const until = vintage.drinkUntil ?? estimate?.drinkUntil;
    if (!from || !until) return [];
    return [{ wineId: wine.id, name: wine.name, vintage: vintage.vintage, color: wine.color, quantity: vintage.quantity, imageUrl: wine.imageUrl, from, until, phase: getMaturityPhase(from, until, currentYear) }];
  }));

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <PageHeader
        eyebrow="Maturité"
        title="Le temps de la cave"
        lead="Suivez les fenêtres de dégustation et repérez les bouteilles à ouvrir au bon moment."
        actions={
          <Link href="/wines" className="px-4 py-2 rounded-full text-sm" style={{ border: "1px solid var(--border)", color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
            Voir tous les vins →
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-14">
        {maturityWines.length === 0 ? (
          <div className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} data-reveal>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>Pas encore de fenêtre de dégustation</h2>
            <p className="mt-2 text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Ajoutez les périodes de dégustation de vos millésimes pour les suivre ici.</p>
          </div>
        ) : (
          <>
            <MaturityPhaseCarousels wines={maturityWines} />
            <section data-reveal>
              <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}>Projection</p>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Potentiel de dégustation</h2>
              <p className="text-sm mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Bouteilles en stock dont la période d’apogée couvre chaque année.</p>
              <MaturityAvailabilityChart currentYear={currentYear} periods={maturityWines.map((wine) => ({ wineId: wine.wineId, name: wine.name, vintage: wine.vintage, imageUrl: wine.imageUrl, color: wine.color, from: wine.from, until: wine.until, quantity: wine.quantity }))} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
