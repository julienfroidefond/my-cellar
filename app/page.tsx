import { prisma } from "@/lib/db";
import Link from "next/link";
import CellarCharts from "@/components/CellarCharts";

const colorConfig: Record<string, { label: string; dot: string; border: string }> = {
  rouge: { label: "Rouge", dot: "#c02030", border: "rgba(160, 28, 46, 0.20)" },
  blanc: { label: "Blanc", dot: "#b87a2c", border: "rgba(196, 152, 60, 0.22)" },
  rosé: { label: "Rosé", dot: "#d4647a", border: "rgba(210, 100, 120, 0.22)" },
};

export default async function DashboardPage() {
  const wines = await prisma.wine.findMany({ orderBy: { name: "asc" } });
  const totalBottles = wines.reduce((s, w) => s + w.quantity, 0);
  const totalValue = wines.reduce((s, w) => s + (w.marketPrice ?? 0) * w.quantity, 0);

  const byColor = wines.reduce<Record<string, number>>((acc, w) => {
    const c = w.color ?? "autre";
    acc[c] = (acc[c] ?? 0) + w.quantity;
    return acc;
  }, {});

  const byRegion = wines.reduce<Record<string, number>>((acc, w) => {
    const r = w.region ?? "Autre";
    acc[r] = (acc[r] ?? 0) + w.quantity;
    return acc;
  }, {});

  const topRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const vintages = wines.filter((w) => w.vintage).map((w) => w.vintage!);
  const oldestVintage = vintages.length ? Math.min(...vintages) : null;

  const premiumWines = wines
    .filter((w) => (w.marketPrice ?? 0) >= 30)
    .sort((a, b) => (b.marketPrice ?? 0) - (a.marketPrice ?? 0))
    .slice(0, 6);

  const winesWithImage = wines.filter((w) => w.imageUrl && w.quantity > 0);
  const heroWine = winesWithImage.length > 0
    ? winesWithImage[Math.floor(Math.random() * winesWithImage.length)]
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero — editorial cream + diagonal red stripe */}
      <div
        className="diagonal-stripe relative overflow-hidden"
        style={{ minHeight: 480, background: "var(--background)" }}
      >
        {/* Bottle hero image — absolutely positioned, above the stripe */}
        {heroWine?.imageUrl && (
          <div
            className="absolute hidden md:block"
            style={{ right: "16%", top: "-5%", bottom: "-5%", width: 200, zIndex: 20, pointerEvents: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroWine.imageUrl}
              alt={heroWine.name}
              style={{
                height: "110%",
                width: "100%",
                objectFit: "contain",
                objectPosition: "center",
                filter: "drop-shadow(-12px 20px 40px rgba(26,10,14,0.35))",
              }}
            />
          </div>
        )}

        {/* Everything inside is stacked above the stripe (z-index:1) */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <p
              className="text-xs tracking-[0.45em] uppercase mb-5"
              style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}
            >
              Collection personnelle
            </p>
            <h1
              className="text-6xl md:text-8xl font-bold mb-4 leading-none"
              style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
            >
              Ma Cave<br />
              <span style={{ color: "var(--wine-red)" }}>à Vin</span>
            </h1>
            <p
              className="text-sm mt-5"
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
            >
              Julien Froidefond · 2, rue Winston Churchill
            </p>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl">
            {[
              { value: totalBottles, label: "Bouteilles" },
              { value: wines.length, label: "Références" },
              { value: `${totalValue.toFixed(0)} €`, label: "Valeur estimée" },
              { value: oldestVintage ?? "—", label: "Millésime le + ancien" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 text-left"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 12px rgba(26,10,14,0.07)",
                }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-wider uppercase"
                  style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-14">
        {/* Vins premium */}
        {premiumWines.length > 0 && (
          <section>
            <SectionTitle eyebrow="Pépites">Les trésors de la cave</SectionTitle>
            <p className="text-sm mt-2 mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Vins estimés à plus de 30 € la bouteille
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumWines.map((wine) => {
                const cfg = colorConfig[wine.color ?? ""] ?? {
                  dot: "#888",
                  border: "rgba(26,10,14,0.10)",
                  text: "var(--text-muted)",
                };
                return (
                  <Link
                    key={wine.id}
                    href={`/wines/${wine.id}`}
                    className="rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 block relative overflow-hidden"
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${cfg.border}`,
                      boxShadow: "0 2px 12px rgba(26,10,14,0.07)",
                    }}
                  >
                    {/* Bottle image */}
                    {wine.imageUrl && (
                      <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: 80 }}>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--surface) 0%, transparent 50%)" }} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={wine.imageUrl}
                          alt=""
                          style={{
                            position: "absolute", bottom: 0, right: 8,
                            height: "95%", objectFit: "contain",
                            opacity: 0.90,
                            filter: "drop-shadow(0 4px 16px rgba(26,10,14,0.18))",
                          }}
                        />
                      </div>
                    )}

                    <div style={{ paddingRight: wine.imageUrl ? 72 : undefined }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: cfg.dot }}
                          />
                          <span
                            className="text-xs uppercase tracking-wider"
                            style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                          >
                            {colorConfig[wine.color ?? ""]?.label ?? wine.color}
                          </span>
                        </div>
                        <span
                          className="text-xl font-bold"
                          style={{ color: "var(--wine-red)", fontFamily: "var(--font-playfair)" }}
                        >
                          {wine.marketPrice?.toFixed(0)} €
                        </span>
                      </div>
                      <h3
                        className="font-semibold mb-1 line-clamp-2 leading-snug"
                        style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem", color: "var(--foreground)" }}
                      >
                        {wine.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-3">
                        {wine.vintage && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: "var(--surface-2)",
                              fontFamily: "var(--font-inter)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {wine.vintage}
                          </span>
                        )}
                        {wine.appellation && (
                          <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                            {wine.appellation}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Charts — couleur & région */}
        <section>
          <SectionTitle eyebrow="Statistiques">Répartition de la cave</SectionTitle>
          <div className="mt-8">
            <CellarCharts byColor={byColor} topRegions={topRegions} />
          </div>
        </section>

        {/* Quick actions */}
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
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
              color: "var(--text-muted)",
            }}
          >
            Voir la cave
          </Link>
          <Link
            href="/wines/add"
            className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: "rgba(184, 122, 44, 0.10)",
              border: "1px solid rgba(184, 122, 44, 0.28)",
              color: "var(--gold)",
              fontFamily: "var(--font-inter)",
            }}
          >
            + Ajouter un vin
          </Link>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && (
        <p
          className="text-xs tracking-[0.3em] uppercase mb-2"
          style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className="text-2xl font-semibold"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
      >
        {children}
      </h2>
    </div>
  );
}
