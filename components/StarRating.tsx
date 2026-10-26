"use client";

import { Star } from "lucide-react";

/**
 * Étoile pleine, demi ou vide : une étoile vide en fond et une étoile pleine
 * rognée par-dessus (largeur 0, 50 ou 100 %).
 */
function StarGlyph({ fill, size }: { fill: 0 | 0.5 | 1; size: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <Star className="absolute inset-0 text-border-strong" width={size} height={size} strokeWidth={1.5} />
      {fill > 0 && (
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star className="text-gold" width={size} height={size} strokeWidth={1.5} fill="currentColor" />
        </span>
      )}
    </span>
  );
}

function fillFor(rating: number, n: number): 0 | 0.5 | 1 {
  if (rating >= n) return 1;
  if (rating >= n - 0.5) return 0.5;
  return 0;
}

// Sélecteur interactif — la position du clic dans l'étoile (gauche/droite) détermine le demi-point.
export function StarRatingInput({
  value,
  onChange,
  size = 30,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
}) {
  const rating = value ?? 0;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>, n: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    const next = isLeftHalf ? n - 0.5 : n;
    onChange(value === next ? null : next);
  }

  // Cible tactile d'au moins 40 px, même pour les petites étoiles.
  const target = Math.max(size + 6, 40);

  return (
    <div className="flex items-center justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={(e) => handleClick(e, n)}
          aria-label={`Noter ${n} étoile${n > 1 ? "s" : ""} (cliquer côté gauche pour ${n - 0.5})`}
          className="-mx-[3px] flex items-center justify-center rounded-md transition-transform hover:scale-110 active:scale-95"
          style={{ width: target, height: target }}
        >
          <StarGlyph fill={fillFor(rating, n)} size={size} />
        </button>
      ))}
      {value !== null && (
        <span className="ml-1.5 text-sm font-semibold tabular text-muted">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Note : ${rating.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarGlyph key={n} fill={fillFor(rating, n)} size={13} />
      ))}
      <span className="ml-1 text-xs font-semibold tabular text-muted">{rating.toFixed(1)}</span>
    </span>
  );
}
