import { prisma } from "@/lib/db";
import Link from "next/link";

const colorConfig: Record<string, { label: string; bg: string; dot: string }> = {
  rouge: { label: "Rouge", bg: "rgba(139, 26, 47, 0.15)", dot: "#8b1a2f" },
  blanc: { label: "Blanc", bg: "rgba(201, 169, 110, 0.12)", dot: "#c9a96e" },
  rosé: { label: "Rosé", bg: "rgba(220, 120, 130, 0.12)", dot: "#dc7882" },
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

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #1a0a0e 0%, var(--background) 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, var(--wine-red) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, var(--gold) 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <p
            className="text-sm tracking-[0.4em] uppercase mb-4"
            style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
          >
            Collection personnelle
          </p>
          <h1
            className="text-6xl md:text-7xl font-bold mb-6"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)", lineHeight: 1.1 }}
          >
            Ma Cave à Vin
          </h1>
          <p
            className="text-lg opacity-60 max-w-xl mx-auto mb-12"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Julien Froidefond · 2, rue Winston Churchill
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: totalBottles, label: "Bouteilles" },
              { value: wines.length, label: "Références" },
              { value: `${totalValue.toFixed(0)} €`, label: "Valeur estimée" },
              { value: oldestVintage ?? "—", label: "Millésime le plus ancien" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-playfair)", color: "var(--gold)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-wider uppercase opacity-50"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        {/* Répartition par couleur */}
        <section>
          <SectionTitle>Répartition par couleur</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {Object.entries(byColor).map(([color, count]) => {
              const config = colorConfig[color] ?? {
                label: color,
                bg: "rgba(255,255,255,0.05)",
                dot: "#888",
              };
              const pct = Math.round((count / totalBottles) * 100);
              return (
                <Link
                  href={`/wines?color=${color}`}
                  key={color}
                  className="rounded-2xl p-6 block transition-all hover:scale-[1.02]"
                  style={{ background: config.bg, border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ background: config.dot }} />
                    <span
                      className="text-sm tracking-wider uppercase opacity-60"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <div
                    className="text-4xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
                  >
                    {count}
                  </div>
                  <div className="text-sm opacity-40 mb-4" style={{ fontFamily: "var(--font-inter)" }}>
                    {pct}% de la cave
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: config.dot }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Régions */}
        <section>
          <SectionTitle>Par région</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
            {topRegions.map(([region, count]) => (
              <Link
                href={`/wines?region=${encodeURIComponent(region)}`}
                key={region}
                className="rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.02]"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <span
                  className="font-medium"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "0.9rem" }}
                >
                  {region}
                </span>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
                >
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Vins premium */}
        {premiumWines.length > 0 && (
          <section>
            <SectionTitle>Les pépites de la cave</SectionTitle>
            <p className="opacity-40 text-sm mt-2 mb-8" style={{ fontFamily: "var(--font-inter)" }}>
              Vins estimés à plus de 30€ la bouteille
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumWines.map((wine) => (
                <Link
                  key={wine.id}
                  href={`/wines/${wine.id}`}
                  className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] block"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{
                        background:
                          wine.color === "blanc"
                            ? "var(--gold)"
                            : wine.color === "rosé"
                            ? "#dc7882"
                            : "var(--wine-red)",
                      }}
                    />
                    <span
                      className="text-xl font-bold"
                      style={{ color: "var(--gold)", fontFamily: "var(--font-playfair)" }}
                    >
                      {wine.marketPrice?.toFixed(2)} €
                    </span>
                  </div>
                  <h3
                    className="font-semibold mb-1 line-clamp-2 leading-snug"
                    style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem" }}
                  >
                    {wine.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-3">
                    {wine.vintage && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.06)", fontFamily: "var(--font-inter)" }}
                      >
                        {wine.vintage}
                      </span>
                    )}
                    {wine.appellation && (
                      <span className="text-xs opacity-40" style={{ fontFamily: "var(--font-inter)" }}>
                        {wine.appellation}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section className="flex gap-4 flex-wrap pb-8">
          <Link
            href="/wines"
            className="px-6 py-3 rounded-full text-sm font-medium"
            style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
          >
            Voir tous les vins
          </Link>
          <Link
            href="/cave"
            className="px-6 py-3 rounded-full text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Voir la cave
          </Link>
          <Link
            href="/wines/add"
            className="px-6 py-3 rounded-full text-sm font-medium"
            style={{
              background: "rgba(201, 169, 110, 0.1)",
              border: "1px solid rgba(201, 169, 110, 0.3)",
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl font-semibold"
      style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
    >
      {children}
    </h2>
  );
}
