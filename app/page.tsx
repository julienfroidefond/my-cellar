import { prisma } from "@/lib/db";
import Link from "next/link";

const colorConfig: Record<string, { label: string; bg: string; dot: string; border: string; text: string }> = {
  rouge: {
    label: "Rouge",
    bg: "rgba(160, 28, 46, 0.18)",
    dot: "#c02030",
    border: "rgba(160, 28, 46, 0.40)",
    text: "#e06070",
  },
  blanc: {
    label: "Blanc",
    bg: "rgba(196, 152, 60, 0.15)",
    dot: "#c4983c",
    border: "rgba(196, 152, 60, 0.35)",
    text: "#d8b05a",
  },
  rosé: {
    label: "Rosé",
    bg: "rgba(210, 100, 120, 0.15)",
    dot: "#d4647a",
    border: "rgba(210, 100, 120, 0.35)",
    text: "#e07a90",
  },
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

  const maxRegion = topRegions[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: 480 }}>
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        {/* Overlay gradients */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,8,11,0.72) 0%, rgba(13,8,11,0.85) 60%, var(--background) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 50%, var(--wine-red) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, var(--gold) 0%, transparent 45%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <p
            className="text-xs tracking-[0.45em] uppercase mb-5"
            style={{ color: "var(--gold)", fontFamily: "var(--font-inter)", fontWeight: 500 }}
          >
            Collection personnelle
          </p>
          <h1
            className="text-6xl md:text-7xl font-bold mb-4"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)", lineHeight: 1.1 }}
          >
            Ma Cave à Vin
          </h1>
          <p
            className="text-base mb-14"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
          >
            Julien Froidefond · 2, rue Winston Churchill
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { value: totalBottles, label: "Bouteilles" },
              { value: wines.length, label: "Références" },
              { value: `${totalValue.toFixed(0)} €`, label: "Valeur estimée" },
              { value: oldestVintage ?? "—", label: "Millésime le + ancien" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 relative overflow-hidden text-left"
                style={{
                  background: "rgba(13, 8, 11, 0.70)",
                  border: "1px solid rgba(196, 152, 60, 0.22)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="absolute top-0 left-0 w-0.5 h-full rounded-l"
                  style={{ background: "var(--gold)", opacity: 0.7 }}
                />
                <div
                  className="text-3xl font-bold mb-1 pl-3"
                  style={{ fontFamily: "var(--font-playfair)", color: "var(--gold)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-wider uppercase pl-3"
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
        {/* Répartition par couleur */}
        <section>
          <SectionTitle eyebrow="Collection">Répartition par couleur</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {Object.entries(byColor).map(([color, count]) => {
              const cfg = colorConfig[color] ?? {
                label: color,
                bg: "rgba(255,255,255,0.05)",
                dot: "#888",
                border: "rgba(255,255,255,0.12)",
                text: "rgba(255,255,255,0.7)",
              };
              const pct = Math.round((count / totalBottles) * 100);
              return (
                <Link
                  href={`/wines?color=${color}`}
                  key={color}
                  className="rounded-2xl p-6 block transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}80` }}
                    />
                    <span
                      className="text-xs tracking-[0.15em] uppercase font-medium"
                      style={{ fontFamily: "var(--font-inter)", color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div
                    className="text-5xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
                  >
                    {count}
                  </div>
                  <div className="text-sm mb-5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                    {pct}% de la cave
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}60` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Régions */}
        <section>
          <SectionTitle eyebrow="Géographie">Par région</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
            {topRegions.map(([region, count]) => (
              <Link
                href={`/wines?region=${encodeURIComponent(region)}`}
                key={region}
                className="rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <span
                    className="font-medium text-sm block truncate"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                  >
                    {region}
                  </span>
                  <div className="mt-2 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((count / maxRegion) * 100)}%`,
                        background: "var(--wine-red)",
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-sm font-bold shrink-0 w-8 text-right"
                  style={{ color: "var(--gold)", fontFamily: "var(--font-playfair)" }}
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
            <SectionTitle eyebrow="Pépites">Les trésors de la cave</SectionTitle>
            <p className="text-sm mt-2 mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Vins estimés à plus de 30 € la bouteille
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumWines.map((wine) => {
                const cfg = colorConfig[wine.color ?? ""] ?? {
                  dot: "#888",
                  border: "rgba(255,255,255,0.1)",
                  text: "rgba(255,255,255,0.6)",
                };
                return (
                  <Link
                    key={wine.id}
                    href={`/wines/${wine.id}`}
                    className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] block"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}70` }}
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
                        style={{ color: "var(--gold)", fontFamily: "var(--font-playfair)" }}
                      >
                        {wine.marketPrice?.toFixed(0)} €
                      </span>
                    </div>
                    <h3
                      className="font-semibold mb-1 line-clamp-2 leading-snug"
                      style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem" }}
                    >
                      {wine.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-3">
                      {wine.vintage && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "rgba(255,255,255,0.07)",
                            fontFamily: "var(--font-inter)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {wine.vintage}
                        </span>
                      )}
                      {wine.appellation && (
                        <span
                          className="text-xs"
                          style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
                        >
                          {wine.appellation}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

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
            className="px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
              color: "var(--text-muted)",
            }}
          >
            Voir la cave
          </Link>
          <Link
            href="/wines/add"
            className="px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              background: "rgba(196, 152, 60, 0.12)",
              border: "1px solid rgba(196, 152, 60, 0.3)",
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
          style={{ fontFamily: "var(--font-inter)", color: "var(--gold)", fontWeight: 500 }}
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
