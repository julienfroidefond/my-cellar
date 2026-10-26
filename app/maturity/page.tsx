export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
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
    <div>
      <PageHeader
        eyebrow="Maturité"
        title="Le temps de la cave"
        lead="Suivez les fenêtres de dégustation et repérez les bouteilles à ouvrir au bon moment."
        actions={
          <Link href="/wines" className="btn btn-secondary">
            Tous les vins
            <ArrowRight />
          </Link>
        }
      />

      <div className="container-page space-y-16 py-10 md:py-14">
        {maturityWines.length === 0 ? (
          <div className="card p-8" data-reveal>
            <h2 className="text-title">Pas encore de fenêtre de dégustation</h2>
            <p className="mt-2 text-sm text-muted">Ajoutez les périodes de dégustation de vos millésimes pour les suivre ici.</p>
          </div>
        ) : (
          <>
            <MaturityPhaseCarousels wines={maturityWines} />
            <section data-reveal aria-labelledby="projection-title">
              <SectionHeader
                id="projection-title"
                eyebrow="Projection"
                title="Potentiel de dégustation"
                lead="Bouteilles en stock dont la période d’apogée couvre chaque année."
              />
              <MaturityAvailabilityChart currentYear={currentYear} periods={maturityWines.map((wine) => ({ wineId: wine.wineId, name: wine.name, vintage: wine.vintage, imageUrl: wine.imageUrl, color: wine.color, from: wine.from, until: wine.until, quantity: wine.quantity }))} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
