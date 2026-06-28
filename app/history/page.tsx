import { prisma } from "@/lib/db";

const COLORS: Record<string, { label: string; color: string }> = {
  rouge: { label: "Rouge", color: "#c02030" },
  blanc: { label: "Blanc", color: "#c4983c" },
  rosé:  { label: "Rosé",  color: "#d4647a" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateKey(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HistoryPage() {
  const entries = await prisma.wineHistory.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Group by day
  const byDay = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = formatDateKey(new Date(entry.createdAt));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(entry);
  }

  const totalBu = entries.filter(e => e.action === "bu").reduce((s, e) => s + e.quantity, 0);
  const totalRetire = entries.filter(e => e.action === "retiré").reduce((s, e) => s + e.quantity, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 500 }}>
            Journal
          </p>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            Historique
          </h1>
          <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {entries.length === 0
              ? "Aucun événement enregistré"
              : `${totalBu} bouteille${totalBu > 1 ? "s" : ""} bue${totalBu > 1 ? "s" : ""}${totalRetire > 0 ? ` · ${totalRetire} retirée${totalRetire > 1 ? "s" : ""}` : ""}`}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {entries.length === 0 ? (
          <div className="text-center py-28">
            <div className="text-4xl mb-4" style={{ opacity: 0.3 }}>📖</div>
            <p style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              L&apos;historique apparaîtra ici quand vous boirez ou retirerez des bouteilles.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {[...byDay.entries()].map(([day, dayEntries]) => (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] shrink-0" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                    {day}
                  </p>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                {/* Entries */}
                <div className="space-y-3">
                  {dayEntries.map((entry) => {
                    const colorInfo = COLORS[entry.color ?? ""] ?? { label: entry.color ?? "", color: "#888" };
                    const isBu = entry.action === "bu";

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 rounded-2xl p-4"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.04)" }}
                      >
                        {/* Action icon */}
                        <div
                          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-base"
                          style={{
                            background: isBu ? "rgba(192,25,59,0.08)" : "rgba(26,10,14,0.06)",
                            border: isBu ? "1px solid rgba(192,25,59,0.20)" : "1px solid var(--border)",
                          }}
                        >
                          {isBu ? "🍷" : "📦"}
                        </div>

                        {/* Wine info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-semibold leading-snug" style={{ fontFamily: "var(--font-playfair)", fontSize: "0.95rem", color: "var(--foreground)" }}>
                              {entry.wineName}
                            </span>
                            {entry.vintage && (
                              <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                                {entry.vintage}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {entry.producer && (
                              <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                                {entry.producer}
                              </span>
                            )}
                            {entry.appellation && (
                              <>
                                {entry.producer && <span style={{ color: "var(--text-faint)", fontSize: "0.6rem" }}>·</span>}
                                <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                                  {entry.appellation}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-2">
                            {entry.quantity > 1 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(192,25,59,0.08)", color: "var(--wine-red)", fontFamily: "var(--font-inter)", border: "1px solid rgba(192,25,59,0.15)" }}>
                                ×{entry.quantity}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colorInfo.color }} />
                              <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>{colorInfo.label}</span>
                            </div>
                          </div>
                          <span className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
                            {formatTime(new Date(entry.createdAt))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
