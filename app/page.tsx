import { prisma } from "@/lib/db";
import Link from "next/link";
import CellarCharts from "@/components/CellarCharts";
import PremiumCarousel from "@/components/PremiumCarousel";
import { estimateMaturity } from "@/lib/maturity";


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

  const winesWithPrice = wines
    .filter((w) => w.marketPrice != null)
    .sort((a, b) => (b.marketPrice ?? 0) - (a.marketPrice ?? 0));
  const premiumWines = winesWithPrice.slice(0, 6);
  const premiumTotal = Math.min(winesWithPrice.length, 18);

  // ── Maturité ──────────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();

  const winesWithMaturity = wines
    .filter((w) => w.quantity > 0)
    .map((w) => {
      const hasManual = !!(w.drinkFrom && w.drinkUntil);
      const est = !hasManual
        ? estimateMaturity({ region: w.region, appellation: w.appellation, color: w.color, vintage: w.vintage })
        : null;
      const from  = w.drinkFrom  ?? est?.drinkFrom  ?? null;
      const until = w.drinkUntil ?? est?.drinkUntil ?? null;
      const status =
        from && until
          ? currentYear > until   ? "dépassé"
          : currentYear >= from   ? "optimal"
          : currentYear >= from - 2 ? "bientôt"
          : "trop-tôt"
          : null;
      return { ...w, effectiveDrinkFrom: from, effectiveDrinkUntil: until, status, isEstimated: !hasManual };
    });

  const readyWines = winesWithMaturity
    .filter((w) => w.status === "optimal")
    .sort((a, b) => (a.effectiveDrinkUntil ?? 9999) - (b.effectiveDrinkUntil ?? 9999))
    .slice(0, 8);

  const soonWines = winesWithMaturity
    .filter((w) => w.status === "bientôt")
    .sort((a, b) => (a.effectiveDrinkFrom ?? 9999) - (b.effectiveDrinkFrom ?? 9999))
    .slice(0, 4);

  const pastWines = winesWithMaturity
    .filter((w) => w.status === "dépassé")
    .sort((a, b) => (b.effectiveDrinkUntil ?? 0) - (a.effectiveDrinkUntil ?? 0))
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
        {/* Vins premium — carousel */}
        {premiumTotal > 0 && (
          <PremiumCarousel initialWines={premiumWines} total={premiumTotal} />
        )}

        {/* Charts — couleur & région */}
        <section>
          <SectionTitle eyebrow="Statistiques">Répartition de la cave</SectionTitle>
          <div className="mt-8">
            <CellarCharts byColor={byColor} topRegions={topRegions} />
          </div>
        </section>

        {/* ── Maturité ──────────────────────────────────── */}
        {(readyWines.length > 0 || soonWines.length > 0 || pastWines.length > 0) && (
          <section>
            <SectionTitle eyebrow="Maturité">Tableau de bord</SectionTitle>
            <p className="text-sm mt-2 mb-8" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Basé sur les fenêtres de dégustation saisies ou estimées automatiquement
            </p>

            <div className="grid md:grid-cols-2 gap-8">

              {/* Prêtes + bientôt */}
              {(readyWines.length > 0 || soonWines.length > 0) && (
                <div>
                  {readyWines.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full" style={{ background: "#1a7a3c" }} />
                        <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "#1a7a3c" }}>
                          Prêtes à boire — {readyWines.length} vin{readyWines.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-2 mb-6">
                        {readyWines.map((w) => (
                          <MaturityCard
                            key={w.id}
                            wine={w}
                            badge={`Boire avant ${w.effectiveDrinkUntil}`}
                            badgeColor="#1a7a3c"
                            badgeBg="rgba(26,122,60,0.09)"
                            urgent={w.effectiveDrinkUntil !== null && w.effectiveDrinkUntil <= currentYear + 1}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {soonWines.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full" style={{ background: "#b87a2c" }} />
                        <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "#b87a2c" }}>
                          Bientôt prêtes — {soonWines.length} vin{soonWines.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {soonWines.map((w) => (
                          <MaturityCard
                            key={w.id}
                            wine={w}
                            badge={`À partir de ${w.effectiveDrinkFrom}`}
                            badgeColor="#b87a2c"
                            badgeBg="rgba(184,122,44,0.09)"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Passées */}
              {pastWines.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ background: "rgba(26,10,14,0.30)" }} />
                    <span className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                      Passées leur apogée — {pastWines.length} vin{pastWines.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pastWines.map((w) => (
                      <MaturityCard
                        key={w.id}
                        wine={w}
                        badge={`Apogée jusqu'en ${w.effectiveDrinkUntil}`}
                        badgeColor="rgba(26,10,14,0.35)"
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
  wine: { id: string; name: string; vintage: number | null; color: string | null; quantity: number; isEstimated: boolean };
  badge: string;
  badgeColor: string;
  badgeBg: string;
  faded?: boolean;
  urgent?: boolean;
}) {
  return (
    <Link
      href={`/wines/${wine.id}`}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: urgent ? `1px solid rgba(26,122,60,0.25)` : "1px solid var(--border)",
        boxShadow: "0 1px 6px rgba(26,10,14,0.05)",
        opacity: faded ? 0.7 : 1,
      }}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR_DOT[wine.color ?? ""] ?? "rgba(26,10,14,0.25)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-inter)", color: faded ? "var(--text-muted)" : "var(--foreground)" }}>
          {wine.name}
        </p>
        <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
          {wine.vintage ?? "—"} · {wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}
          {wine.isEstimated && <span className="ml-1 opacity-60">~estimé</span>}
        </p>
      </div>
      <span
        className="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium"
        style={{ background: badgeBg, color: badgeColor, fontFamily: "var(--font-inter)", border: `1px solid ${badgeColor}30` }}
      >
        {badge}
      </span>
    </Link>
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
