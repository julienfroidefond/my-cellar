import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Carte de vin compacte, partagée par toutes les listes (pépites, maturité,
 * collection…) : texte à gauche, bouteille détourée en grand sur un bandeau
 * à droite. Rien ne se superpose à la bouteille.
 *
 * - `meta`   : ligne du haut (pastille de couleur, millésime…)
 * - `footer` : bas de carte (étiquettes, quantité…)
 * - `aside`  : valeur mise en avant en haut à droite du texte (prix…)
 */
export function WineTile({
  href,
  name,
  imageUrl,
  meta,
  footer,
  aside,
  className = "",
}: {
  href: string;
  name: string;
  imageUrl?: string | null;
  meta?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`card-link group relative flex min-h-[140px] items-stretch overflow-hidden ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        {(meta || aside) && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted">{meta}</div>
            {aside && <div className="-mt-0.5 shrink-0 leading-none">{aside}</div>}
          </div>
        )}
        <h3 className="mt-1.5 line-clamp-2 font-display text-[1.0625rem] font-semibold leading-snug">
          {name}
        </h3>
        {footer && <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-xs text-muted">{footer}</div>}
      </div>
      <div className="relative flex w-[100px] shrink-0 items-center justify-center bg-surface-2 px-2 py-2.5 sm:w-[108px]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-float
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-x-2 inset-y-2.5 m-auto h-[calc(100%-1.25rem)] max-h-[150px] w-[calc(100%-1rem)] object-contain drop-shadow-[0_8px_12px_rgba(43,9,18,0.28)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03]"
          />
        ) : (
          <BottleSilhouette className="h-[96px] w-auto text-surface-3" />
        )}
      </div>
    </Link>
  );
}

/** Silhouette de bouteille (même dessin que la marque) quand le vin n'a pas d'image. */
export function BottleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="14 7 22 52" className={className} aria-hidden="true" fill="currentColor">
      <path d="M21.5 7.5h7v11.5c0 3.6 7 5.4 7 12.4V56a2 2 0 0 1-2 2H16.5a2 2 0 0 1-2-2V31.4c0-7 7-8.8 7-12.4Z" />
    </svg>
  );
}

const COLOR_LABELS: Record<string, string> = {
  rouge: "Rouge",
  blanc: "Blanc",
  rosé: "Rosé",
  effervescent: "Effervescent",
};

export function colorLabel(color: string | null | undefined) {
  if (!color) return null;
  return COLOR_LABELS[color] ?? color;
}

/** Pastille + libellé de couleur de vin. */
export function WineColor({ color, label }: { color: string | null | undefined; label?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="wine-dot" data-color={color ?? undefined} />
      {label ?? colorLabel(color)}
    </span>
  );
}
