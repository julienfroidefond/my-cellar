export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import Link from "next/link";
import CellarCharts from "@/components/CellarCharts";
import PremiumCarousel from "@/components/PremiumCarousel";
import { estimateMaturity } from "@/lib/maturity";

export default async function DashboardPage() {
  const wines = await prisma.wine.findMany({
    orderBy: { name: "asc" },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });

  const allVintages = wines.flatMap((w) => w.vintages.map((v) => ({ ...v, wine: w })));

  const totalBottles = allVintages.reduce((s, v) => s + v.quantity, 0);
  const totalValue = allVintages.reduce((s, v) => s + (v.marketPrice ?? 0) * v.quantity, 0);

  const byColor = allVintages.reduce<Record<string, number>>((acc, v) => {
    const c = v.wine.color ?? "autre";
    acc[c] = (acc[c] ?? 0) + v.quantity;
    return acc;
  }, {});

  const byRegion = allVintages.reduce<Record<string, number>>((acc, v) => {
    const r = v.wine.region ?? "Autre";
    acc[r] = (acc[r] ?? 0) + v.quantity;
    return acc;
  }, {});

  const topRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const vintageYears = allVintages.filter((v) => v.vintage).map((v) => v.vintage!);
  const oldestVintage = vintageYears.length ? Math.min(...vintageYears) : null;

  // Premium: best marketPrice vintage per wine
  const premiumItems = wines
    .flatMap((w) =>
      w.vintages
        .filter((v) => v.marketPrice != null && v.quantity > 0)
        .map((v) => ({
          id: w.id,
          name: w.name,
          producer: w.producer,
          vintage: v.vintage,
          color: w.color,
          appellation: w.appellation,
          marketPrice: v.marketPrice,
          imageUrl: w.imageUrl,
        }))
    )
    .sort((a, b) => (b.marketPrice ?? 0) - (a.marketPrice ?? 0));

  const premiumWines = premiumItems.slice(0, 6);
  const premiumTotal = Math.min(premiumItems.length, 18);

  // Maturity — per vintage
  const currentYear = new Date().getFullYear();

  const winesWithMaturity = allVintages
    .filter((v) => v.quantity > 0)
    .map((v) => {
      const hasManual = !!(v.drinkFrom && v.drinkUntil);
      const est = !hasManual
        ? estimateMaturity({ region: v.wine.region, appellation: v.wine.appellation, color: v.wine.color, vintage: v.vintage })
        : null;
      const from = v.drinkFrom ?? est?.drinkFrom ?? null;
      const until = v.drinkUntil ?? est?.drinkUntil ?? null;
      const status =
        from && until
          ? currentYear > until
            ? "dépassé"
            : currentYear >= from
            ? "optimal"
            : currentYear >= from - 2
            ? "bientôt"
            : "trop-tôt"
          : null;
      return {
        id: v.wine.id,
        name: v.wine.name,
        vintage: v.vintage,
        color: v.wine.color,
        quantity: v.quantity,
        imageUrl: v.wine.imageUrl,
        effectiveDrinkFrom: from,
        effectiveDrinkUntil: until,
        status,
        isEstimated: !hasManual,
      };
    });

  const allReadyWines = winesWithMaturity
    .filter((w) => w.status === "optimal")
    .sort((a, b) => (a.effectiveDrinkUntil ?? 9999) - (b.effectiveDrinkUntil ?? 9999));
  const readyWines = allReadyWines.slice(0, 8);

  const allSoonWines = winesWithMaturity
    .filter((w) => w.status === "bientôt")
    .sort((a, b) => (a.effectiveDrinkFrom ?? 9999) - (b.effectiveDrinkFrom ?? 9999));
  const soonWines = allSoonWines.slice(0, 4);

  const allPastWines = winesWithMaturity
    .filter((w) => w.status === "dépassé")
    .sort((a, b) => (b.effectiveDrinkUntil ?? 0) - (a.effectiveDrinkUntil ?? 0));
  const pastWines = allPastWines.slice(0, 6);

  const winesWithImage = wines.filter((w) => w.imageUrl && w.vintages.some((v) => v.quantity > 0));
  const heroWine = winesWithImage.length > 0
    ? winesWithImage[Math.floor(Math.random() * winesWithImage.length)]
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div
        className="diagonal-stripe relative overflow-hidden"
        style={{ minHeight: 480, background: "var(--background)" }}
      >
        {heroWine?.imageUrl && (
          <div
            className="animate-fade-bottle absolute hidden md:block"
            style={{ right: "16%", top: "-5%", bottom: "-5%", width: 200, zIndex: 20, pointerEvents: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroWine.imageUrl}
              alt={heroWine.name}
              style={{ height: "110%", width: "100%", objectFit: "contain", objectPosition: "center" }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <p
              className="animate-fade-up text-xs tracking-[0.45em] uppercase mb-5"
              style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}
            >
              Collection personnelle
            </p>
            <h1
              className="animate-fade-up-1 text-6xl md:text-8xl font-bold mb-4 leading-none"
              style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
            >
              Ma Cave<br />
              <span style={{ color: "var(--wine-red)" }}>à Vin</span>
            </h1>
          </div>

          <div className="animate-fade-up-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl">
            {[
              { value: totalBottles, label: "Bouteilles" },
              { value: wines.length, label: "Références" },
              { value: `${totalValue.toFixed(0)} €`, label: "Valeur estimée" },
              { value: oldestVintage ?? "—", label: "Millésime le + ancien" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 text-left"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}
              >
                <div className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
                  {stat.value}
                </div>
                <div className="text-xs tracking-wider uppercase" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-fade-up-3 max-w-7xl mx-auto px-6 py-14 space-y-14">
        {premiumTotal > 0 && (
          <PremiumCarousel initialWines={premiumWines} total={premiumTotal} />
        )}

        <section>
          <SectionTitle eyebrow="Statistiques">Répartition de la cave</SectionTitle>
          <div className="mt-8">
            <CellarCharts byColor={byColor} topRegions={topRegions} />
          </div>
        </section>

        {(readyWines.length > 0 || soonWines.length > 0 || pastWines.length > 0) && (
          <section>
            <SectionTitle eyebrow="Maturité">Tableau de bord</SectionTitle>
            <p className="text-sm mt-2 mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Basé sur les fenêtres de dégustation saisies ou estimées automatiquement
            </p>

            <div className="space-y-8">
              {readyWines.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#1a7a3c" }} />
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "#1a7a3c" }}>
                        Prêtes à boire — {allReadyWines.length} vin{allReadyWines.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Link href="/wines?maturity=optimal" className="text-xs transition-opacity hover:opacity-70" style={{ fontFamily: "var(--font-inter)", color: "#1a7a3c" }}>
                      Voir tous →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {readyWines.map((w, i) => (
                      <MaturityCard
                        key={`${w.id}-${w.vintage ?? i}`}
                        wine={w}
                        badge={`avant ${w.effectiveDrinkUntil}`}
                        badgeColor="#1a7a3c"
                        badgeBg="rgba(26,122,60,0.09)"
                        urgent={w.effectiveDrinkUntil !== null && w.effectiveDrinkUntil <= currentYear + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {soonWines.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#b87a2c" }} />
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "#b87a2c" }}>
                        Bientôt prêtes — {allSoonWines.length} vin{allSoonWines.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Link href="/wines?maturity=bientôt" className="text-xs transition-opacity hover:opacity-70" style={{ fontFamily: "var(--font-inter)", color: "#b87a2c" }}>
                      Voir tous →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {soonWines.map((w, i) => (
                      <MaturityCard
                        key={`${w.id}-${w.vintage ?? i}`}
                        wine={w}
                        badge={`dès ${w.effectiveDrinkFrom}`}
                        badgeColor="#b87a2c"
                        badgeBg="rgba(184,122,44,0.09)"
                      />
                    ))}
                  </div>
                </div>
              )}

              {pastWines.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "rgba(26,10,14,0.28)" }} />
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                        Passées leur apogée — {allPastWines.length} vin{allPastWines.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Link href="/wines?maturity=dépassé" className="text-xs transition-opacity hover:opacity-70" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                      Voir tous →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {pastWines.map((w, i) => (
                      <MaturityCard
                        key={`${w.id}-${w.vintage ?? i}`}
                        wine={w}
                        badge={`apogée ${w.effectiveDrinkUntil}`}
                        badgeColor="rgba(26,10,14,0.40)"
                        badgeBg="rgba(26,10,14,0.05)"
                        faded
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="flex gap-3 flex-wrap pb-8">
          <Link
            href="/wines"
            className="px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
          >
            Voir tous les vins
          </Link>
          <Link
            href="/cave"
            className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:border-[var(--wine-red)] hover:text-[var(--wine-red)]"
            style={{ background: "transparent", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
          >
            Voir la cave
          </Link>
          <Link
            href="/wines/add"
            className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "rgba(184, 122, 44, 0.10)", border: "1px solid rgba(184, 122, 44, 0.28)", color: "var(--gold)", fontFamily: "var(--font-inter)" }}
          >
            + Ajouter un vin
          </Link>
        </section>
      </div>
    </div>
  );
}

const COLOR_DOT: Record<string, string> = {
  rouge: "#c0193b",
  blanc: "#b87a2c",
  rosé:  "#d4647a",
};

function MaturityCard({
  wine,
  badge,
  badgeColor,
  badgeBg,
  faded,
  urgent,
}: {
  wine: { id: string; name: string; vintage: number | null; color: string | null; quantity: number; imageUrl: string | null; isEstimated: boolean };
  badge: string;
  badgeColor: string;
  badgeBg: string;
  faded?: boolean;
  urgent?: boolean;
}) {
  return (
    <Link
      href={`/wines/${wine.id}`}
      className="rounded-2xl p-5 block relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: urgent ? `1px solid ${badgeColor}40` : "1px solid var(--border)",
        boxShadow: urgent ? `0 2px 16px ${badgeColor}18` : "0 2px 8px rgba(26,10,14,0.06)",
        opacity: faded ? 0.72 : 1,
      }}
    >
      {wine.imageUrl && (
        <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: 72 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--surface) 0%, transparent 55%)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wine.imageUrl}
            alt=""
            loading="lazy"
            style={{
              position: "absolute", bottom: 0, right: 6,
              height: "92%", objectFit: "contain",
              opacity: faded ? 0.5 : 0.88,
              filter: "drop-shadow(0 3px 10px rgba(26,10,14,0.15))",
            }}
          />
        </div>
      )}

      <div style={{ paddingRight: wine.imageUrl ? 64 : undefined }}>
        <span
          className="inline-block text-xs px-2.5 py-1 rounded-full font-medium mb-3"
          style={{ background: badgeBg, color: badgeColor, fontFamily: "var(--font-inter)", border: `1px solid ${badgeColor}35` }}
        >
          {badge}
        </span>

        <div className="flex items-start gap-2 mb-1">
          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: COLOR_DOT[wine.color ?? ""] ?? "rgba(26,10,14,0.25)" }} />
          <p
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ fontFamily: "var(--font-inter)", color: faded ? "var(--text-muted)" : "var(--foreground)" }}
          >
            {wine.name}
          </p>
        </div>

        <p className="text-xs ml-4" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
          {wine.vintage ?? "—"} · {wine.quantity} bt{wine.quantity > 1 ? "s" : ""}
          {wine.isEstimated && <span className="ml-1">~</span>}
        </p>
      </div>
    </Link>
  );
}

function SectionTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
        {children}
      </h2>
    </div>
  );
}
