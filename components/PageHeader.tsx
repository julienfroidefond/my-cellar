import type { ReactNode } from "react";

type HeaderStat = {
  value: ReactNode;
  label: string;
};

/**
 * Shared header for every view except the home page.
 *
 * One type scale and one grid for all inner pages: same eyebrow, title size,
 * lead and vertical rhythm. Pages can add a stats ledger, an optional aside
 * (a bottle portrait, for example) and page-specific actions.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  back,
  actions,
  aside,
  asideSize = "default",
  stats,
  bottom,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  back?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  asideSize?: "default" | "narrow";
  stats?: HeaderStat[];
  bottom?: ReactNode;
}) {
  const hasAside = Boolean(aside);
  const hasTitleActions = Boolean(actions) && !hasAside;

  return (
    <header
      className="relative"
      style={{
        background: "var(--background)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div
          className={
            hasAside
              ? asideSize === "narrow"
                ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start"
                : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
              : undefined
          }
        >
          <div className="min-w-0">
            <div
              className={
                hasTitleActions
                  ? "flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
                  : undefined
              }
            >
              <div className="min-w-0 max-w-3xl">
                {back && <div className="animate-fade-up-1 mb-5">{back}</div>}

                <p
                  className="animate-fade-up-1 mb-3 text-[11px] font-semibold uppercase tracking-[0.35em]"
                  style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}
                >
                  {eyebrow}
                </p>

                <h1
                  className="animate-fade-up-2 text-4xl md:text-5xl font-bold leading-[0.98]"
                  style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
                >
                  {title}
                </h1>

                {lead && (
                  <div
                    className="animate-fade-up-3 mt-3 max-w-2xl text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                  >
                    {lead}
                  </div>
                )}
              </div>

              {hasTitleActions && (
                <div className="animate-fade-up-3 flex flex-wrap items-center gap-2 md:justify-end">
                  {actions}
                </div>
              )}
            </div>

            {stats && stats.length > 0 && (
              <div
                className={`animate-fade-up-4 mt-8 grid grid-cols-2 gap-y-6 border-t pt-6 ${
                  stats.length === 3
                    ? "sm:grid-cols-3"
                    : stats.length === 2
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-4"
                }`}
                style={{ borderColor: "var(--border)" }}
              >
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={index > 0 ? "sm:border-l sm:pl-5" : undefined}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="text-3xl font-bold leading-none break-words"
                      style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="mt-2 text-[10px] uppercase leading-tight tracking-[0.14em]"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {actions && hasAside && (
              <div className="animate-fade-up-4 mt-6 flex flex-wrap items-center gap-2">{actions}</div>
            )}

            {bottom && <div className="animate-fade-up-4 mt-8">{bottom}</div>}
          </div>

          {aside && (
            <div
              className={`animate-fade-up-3 mx-auto w-full lg:mx-0 lg:justify-self-end ${
                asideSize === "narrow" ? "max-w-[260px]" : "max-w-[380px]"
              }`}
            >
              {aside}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
