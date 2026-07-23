import { WINE_COLORS, WINE_REGIONS } from "@/lib/wine-form";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  fontSize: "0.875rem",
  lineHeight: "20px",
  height: "42px",
  boxSizing: "border-box",
  fontFamily: "var(--font-inter)",
  outline: "none",
};

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
    >
      <h2 className="text-base font-semibold mb-5" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs opacity-50 mb-1.5 tracking-wider uppercase" style={{ fontFamily: "var(--font-inter)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function ColorField({ defaultValue = "rouge" }: { defaultValue?: string | null }) {
  return (
    <Field label="Couleur">
      <select name="color" defaultValue={defaultValue ?? "rouge"} style={inputStyle}>
        {WINE_COLORS.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function RegionField({ defaultValue = "" }: { defaultValue?: string | null }) {
  return (
    <Field label="Région">
      <select name="region" defaultValue={defaultValue ?? ""} style={inputStyle}>
        <option value="">— Sélectionner —</option>
        {WINE_REGIONS.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </Field>
  );
}
