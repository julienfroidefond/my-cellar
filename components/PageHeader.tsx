import type { ReactNode } from "react";

type HeaderStat = {
  value: ReactNode;
  label: string;
};

/**
 * Surtitre de section ou de page : petit trait diagonal cramoisi (le motif de
 * la marque) suivi du libellé.
 */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-2 ${className}`}>
      <span aria-hidden="true" className="h-3 w-[3px] skew-x-[-20deg] rounded-[1px] bg-current" />
      {children}
    </p>
  );
}

/**
 * Titre de section partagé : surtitre, titre, sous-titre et actions alignées
 * à droite. Utilisé par toutes les sections de contenu sous l'en-tête de page.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  actions,
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h2 id={id} className="text-title">
          {title}
        </h2>
        {lead && <p className="mt-1 max-w-2xl text-sm text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Grille de statistiques : valeurs tabulaires séparées par des filets.
 */
export function StatsRow({ stats, className = "" }: { stats: HeaderStat[]; className?: string }) {
  const columns =
    stats.length === 3 ? "sm:grid-cols-3" : stats.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-4";
  return (
    <dl
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1 ${columns} ${className}`}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse gap-2 bg-surface px-4 py-4 sm:px-5">
          <dt className="label">{stat.label}</dt>
          <dd data-count className="stat-value break-words text-[1.75rem] sm:text-[2rem]">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * En-tête partagé de toutes les vues sauf l'accueil.
 *
 * Une seule échelle typographique et une seule grille pour toutes les pages
 * internes : même surtitre, même taille de titre, même chapeau, même rythme.
 * Les pages peuvent ajouter des statistiques, un visuel à droite (portrait de
 * bouteille) et des actions propres.
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
    <header className="relative border-b border-border">
      <div className="container-page pb-8 pt-6 md:pb-10 md:pt-10">
        <div
          className={
            hasAside
              ? asideSize === "narrow"
                ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start"
                : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
              : undefined
          }
        >
          <div className="min-w-0">
            {back && <div data-enter className="mb-5">{back}</div>}

            <div
              className={
                hasTitleActions
                  ? "flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
                  : undefined
              }
            >
              <div className="min-w-0 max-w-3xl">
                <div data-enter>
                  <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
                </div>

                <h1 data-enter="title" className="text-display">
                  {title}
                </h1>

                {lead && (
                  <div data-enter className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
                    {lead}
                  </div>
                )}
              </div>

              {hasTitleActions && (
                <div data-enter className="flex flex-wrap items-center gap-2 md:justify-end">
                  {actions}
                </div>
              )}
            </div>

            {stats && stats.length > 0 && (
              <div data-enter className="mt-7">
                <StatsRow stats={stats} />
              </div>
            )}

            {actions && hasAside && (
              <div data-enter className="mt-6 flex flex-wrap items-center gap-2">{actions}</div>
            )}

            {bottom && <div data-enter className="mt-7">{bottom}</div>}
          </div>

          {aside && (
            <div
              data-enter
              className={`mx-auto w-full lg:mx-0 lg:justify-self-end ${
                asideSize === "narrow" ? "max-w-[240px]" : "max-w-[360px]"
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
