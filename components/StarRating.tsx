"use client";

// Sélecteur interactif — cliquer sur la moitié gauche/droite d'une étoile pose un demi-point.
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
  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        return (
          <div key={n} className="relative" style={{ width: size, height: size }}>
            <span
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ fontSize: size, lineHeight: 1, color: filled || half ? "#c4983c" : "rgba(26,10,14,0.18)", opacity: half ? 0.65 : 1 }}
            >
              ★
            </span>
            <button
              type="button"
              aria-label={`${n - 0.5} étoile${n - 0.5 > 1 ? "s" : ""}`}
              className="absolute inset-y-0 left-0"
              style={{ width: "50%" }}
              onClick={() => onChange(value === n - 0.5 ? null : n - 0.5)}
            />
            <button
              type="button"
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className="absolute inset-y-0 right-0"
              style={{ width: "50%" }}
              onClick={() => onChange(value === n ? null : n)}
            />
          </div>
        );
      })}
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
