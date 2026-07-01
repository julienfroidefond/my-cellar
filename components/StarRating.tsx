"use client";

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

  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        return (
          <button
            key={n}
            type="button"
            onClick={(e) => handleClick(e, n)}
            aria-label={`Noter ${n} étoile${n > 1 ? "s" : ""} (cliquer côté gauche pour ${n - 0.5})`}
            style={{
              fontSize: size,
              lineHeight: 1,
              width: size,
              height: size,
              color: filled || half ? "#c4983c" : "rgba(26,10,14,0.18)",
              opacity: half ? 0.65 : 1,
            }}
          >
            ★
          </button>
        );
      })}
      {value !== null && (
        <span className="ml-1 text-sm tabular-nums font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        return (
          <span
            key={n}
            style={{
              fontSize: 11,
              color: filled || half ? "#c4983c" : "rgba(26,10,14,0.18)",
              opacity: half ? 0.65 : 1,
            }}
          >
            ★
          </span>
        );
      })}
      <span className="ml-1 text-xs tabular-nums" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
