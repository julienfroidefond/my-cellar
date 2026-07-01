export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import HistoryCharts from "@/components/HistoryCharts";
import { Stars } from "@/components/StarRating";

const COLOR_DOT: Record<string, string> = {
  rouge: "#c02030",
  blanc: "#c4983c",
  rosé:  "#d4647a",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export default async function HistoryPage() {
  const [entries, winesWithImages] = await Promise.all([
    prisma.wineHistory.findMany({
      where: { action: "bu" },
      orderBy: { consumedAt: "desc" },
    }),
    prisma.wine.findMany({
      where: { imageUrl: { not: null } },
      select: { name: true, imageUrl: true },
    }),
  ]);

  // Build list of [normalizedName, imageUrl] for substring matching
  const imageIndex: Array<[string, string]> = winesWithImages
    .filter((w) => w.imageUrl)
    .map((w) => [normalize(w.name), w.imageUrl!]);

  function getImage(wineName: string): string | null {
    const key = normalize(wineName);
    // 1. exact match
    const exact = imageIndex.find(([n]) => n === key);
    if (exact) return exact[1];
    // 2. wine DB name contains history name (e.g. "chateaubatailleylionsdebatailley" ⊃ "lionsdebatailley")
    const contains = imageIndex.find(([n]) => n.includes(key));
    if (contains) return contains[1];
    // 3. history name contains wine DB name (reverse)
    const reverse = imageIndex.find(([n]) => key.includes(n));
    if (reverse) return reverse[1];
    return null;
  }

  const total = entries.reduce((s, e) => s + e.quantity, 0);
  const withRating = entries.filter((e) => e.rating !== null);
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, e) => s + (e.rating ?? 0), 0) / withRating.length
      : null;
  const uniqueNames = new Set(entries.map((e) => `${e.wineName}|${e.vintage ?? ""}`));

  // ── Charts data ────────────────────────────────────────────────────────────
  const byColor = entries.reduce<Record<string, number>>((acc, e) => {
    const c = e.color ?? "autre";
    acc[c] = (acc[c] ?? 0) + e.quantity;
    return acc;
  }, {});

  const monthMap = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.consumedAt);
    const mk = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthMap.set(mk, (monthMap.get(mk) ?? 0) + e.quantity);
  }

  function buildMonthRange(first: string, last: string): string[] {
    const [sy, sm] = first.split("-").map(Number);
    const [ey, em] = last.split("-").map(Number);
    const keys: string[] = [];
    let y = sy, m = sm;
    while (y < ey || (y === ey && m <= em)) {
      keys.push(`${y}-${String(m).padStart(2, "0")}`);
      if (++m > 12) { m = 1; y++; }
    }
    return keys;
  }

  const now = new Date();
  const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const firstKey = [...monthMap.keys()].sort()[0] ?? todayKey;
  const byMonth = buildMonthRange(firstKey, todayKey).slice(-18).map((mk) => {
    const [yr, mo] = mk.split("-").map(Number);
    const label = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" })
      .format(new Date(yr, mo - 1, 1));
    return { month: label, value: monthMap.get(mk) ?? 0 };
  });

  const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
    label: `${star}★`,
    value: entries.filter((e) => e.rating !== null && Math.round(e.rating!) === star).length,
  }));
  const hasRatings = withRating.length > 0;

  const appellationMap = entries.reduce<Record<string, number>>((acc, e) => {
    if (!e.appellation) return acc;
    acc[e.appellation] = (acc[e.appellation] ?? 0) + e.quantity;
    return acc;
  }, {});
  const topAppellations = Object.entries(appellationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Group by UTC day
  const byDay = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = dateKey(new Date(entry.consumedAt));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(entry);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="diagonal-stripe relative overflow-hidden" style={{ minHeight: 480, background: "var(--background)" }}>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 md:py-24">
          <p className="animate-fade-up text-xs tracking-[0.45em] uppercase mb-5 font-semibold" style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}>
            Journal
          </p>
          <h1 className="animate-fade-up-1 text-6xl md:text-8xl font-bold leading-none mb-4" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            Mes<br />
            <span style={{ color: "var(--wine-red)" }}>Dégustations</span>
          </h1>

          <div className="animate-fade-up-2 grid grid-cols-2 md:grid-cols-3 gap-4 mt-14 max-w-3xl">
            {[
              { value: total, label: "Bouteilles bues" },
              { value: uniqueNames.size, label: "Vins différents" },
              ...(avgRating !== null ? [{ value: avgRating.toFixed(1) + " / 5", label: "Note moyenne" }] : []),
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}>
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

      {/* ── Charts ──────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="animate-fade-up-3 max-w-7xl mx-auto px-6 pb-4 pt-10">
          <div className="mb-6">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-2"
              style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
            >
              Analyse
            </p>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
            >
              Statistiques
            </h2>
          </div>
          <HistoryCharts byColor={byColor} byMonth={byMonth} ratingDist={ratingDist} hasRatings={hasRatings} topAppellations={topAppellations} />
        </div>
      )}

      {/* ── Timeline ────────────────────────────────── */}
      <div className="animate-fade-up-4 max-w-7xl mx-auto px-6 py-10">
        {entries.length === 0 ? (
          <div className="text-center py-28">
            <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Aucune dégustation enregistrée.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {[...byDay.entries()].map(([key, dayEntries]) => {
              const date = new Date(key + "T12:00:00Z");
              const label = formatDateLabel(date);
              return (
                <div key={key}>
                  {/* Day header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="shrink-0">
                      <p className="text-xs font-semibold tracking-[0.18em] uppercase capitalize" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
                        {label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                        {dayEntries.length} bouteille{dayEntries.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>

                  {/* Entries */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {dayEntries.map((entry) => {
                      const dot = COLOR_DOT[entry.color ?? ""] ?? "#888";
                      const imgUrl = getImage(entry.wineName);

                      return (
                        <div
                          key={entry.id}
                          className="relative rounded-2xl overflow-hidden"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
                        >
                          {/* Top color bar — same as WineCard */}
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${dot}cc, ${dot}33)` }} />

                          {/* Bottle image — absolutely right with fade, same as WineCard */}
                          {imgUrl && (
                            <div className="absolute right-0 bottom-0 pointer-events-none" style={{ width: 72, top: 3 }}>
                              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--surface) 0%, transparent 45%)" }} />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt=""
                                style={{ position: "absolute", bottom: 0, right: 6, height: "92%", objectFit: "contain", opacity: 0.88, filter: "drop-shadow(0 4px 16px rgba(26,10,14,0.12))" }}
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-5" style={{ paddingRight: imgUrl ? 80 : undefined }}>
                            <div className="flex items-start gap-3 mb-1">
                              <h3 className="font-semibold leading-snug flex-1" style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem", color: "var(--foreground)" }}>
                                {entry.wineName}
                              </h3>
                            </div>

                            {entry.producer && (
                              <p className="text-sm mb-3" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                                {entry.producer}
                              </p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.vintage && (
                                <span className="text-xs px-2.5 py-1 rounded-full tabular-nums" style={{ background: "rgba(26,10,14,0.06)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                                  {entry.vintage}
                                </span>
                              )}
                              {entry.appellation && (
                                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(26,10,14,0.06)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                                  {entry.appellation}
                                </span>
                              )}
                              {entry.country && entry.country !== "France" && (
                                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(26,10,14,0.06)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                                  {entry.country}
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot, boxShadow: `0 0 5px ${dot}80` }} />
                                <span className="text-xs capitalize" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{entry.color}</span>
                              </div>
                            </div>

                            {entry.rating !== null && (
                              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <Stars rating={entry.rating!} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
