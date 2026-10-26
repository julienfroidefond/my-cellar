import { useId } from "react";

/**
 * Marque « Ma Cave ». Même dessin que assets/logo-mark.svg (source des
 * favicons et icônes PWA, voir scripts/generate-icons.mjs) : garder les deux
 * synchronisés.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="64" height="64" fill="#f6efe4" />
        <path d="M0 52 L64 10 V64 H0 Z" fill="#c0193b" />
        <path
          d="M21.5 7.5h7v11.5c0 3.6 7 5.4 7 12.4V56a2 2 0 0 1-2 2H16.5a2 2 0 0 1-2-2V31.4c0-7 7-8.8 7-12.4Z"
          fill="#2b0912"
        />
        <path d="M21.5 7.5h7v7h-7Z" fill="#e0234b" />
        <rect x="17.5" y="35" width="15" height="12" rx="1" fill="#f6efe4" />
        <rect x="21" y="42.5" width="8" height="1.6" fill="#c0193b" />
        <path
          d="M35.3 26h17.4c1.3 6.6 1 13.2-3.2 17.4a8 8 0 0 1-11 0c-4.2-4.2-4.5-10.8-3.2-17.4Z"
          fill="#f6efe4"
        />
        <path
          d="M36.2 34.5c3.5-1.6 6.5 1 9.6 0s4.3-1.4 5.9-.5c-.2 3.4-1.2 6.4-3.4 8.4a7 7 0 0 1-9.6 0c-1.6-1.6-2.4-4.3-2.5-7.9Z"
          fill="#2b0912"
        />
        <path
          d="M36.2 34.5c3.5-1.6 6.5 1 9.6 0s4.3-1.4 5.9-.5l-.1 1.8c-1.6-.7-3 0-5.8.7-3 .8-6-1.6-9.5 0Z"
          fill="#e0234b"
        />
        <rect x="43" y="45" width="2" height="9" fill="#f6efe4" />
        <rect x="37.5" y="53.5" width="13" height="2.6" rx="1.3" fill="#f6efe4" />
      </g>
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} className="shrink-0 shadow-[var(--shadow-sm)] rounded-[22%]" />
      <span className="font-display text-[1.15rem] font-semibold leading-none tracking-[-0.01em] text-foreground">
        Ma Cave
      </span>
    </span>
  );
}
