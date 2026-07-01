"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = ["rouge", "blanc", "rosé"];
const REGIONS = [
  "Bordeaux", "Bourgogne", "Rhône", "Champagne", "Alsace", "Loire",
  "Languedoc", "Provence", "Roussillon", "Sud-Ouest", "Jura", "Savoie",
  "Mendoza", "Patagonie", "Arménie", "Autre",
];

export default function AddWinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    producer: "",
    vintage: "",
    quantity: "1",
    volume: "75",
    color: "rouge",
    region: "",
    appellation: "",
    country: "France",
    grapeVarieties: "",
    purchasePrice: "",
    marketPrice: "",
    description: "",
    notes: "",
    foodPairing: "",
    drinkFrom: "",
    drinkUntil: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);

    // Flat payload — API creates Wine + first WineVintage
    const payload: Record<string, unknown> = {
      name: form.name,
      producer: form.producer || null,
      vintage: form.vintage ? parseInt(form.vintage) : null,
      quantity: parseInt(form.quantity) || 1,
      volume: parseInt(form.volume) || 75,
      color: form.color || null,
      region: form.region || null,
      appellation: form.appellation || null,
      country: form.country || "France",
      grapeVarieties: form.grapeVarieties || null,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
      marketPrice: form.marketPrice ? parseFloat(form.marketPrice) : null,
      description: form.description || null,
      notes: form.notes || null,
      foodPairing: form.foodPairing || null,
      drinkFrom: form.drinkFrom ? parseInt(form.drinkFrom) : null,
      drinkUntil: form.drinkUntil ? parseInt(form.drinkUntil) : null,
    };

    const res = await fetch("/api/wines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const wine = await res.json();
      router.push(`/wines/${wine.id}`);
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Ajouter un vin
          </h1>
          <p className="opacity-40 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            Renseigner les informations de la bouteille
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations principales */}
          <Section title="Informations principales">
            <Field label="Nom du vin *">
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Château Margaux"
                style={inputStyle}
              />
            </Field>
            <Field label="Producteur / Domaine">
              <input
                value={form.producer}
                onChange={(e) => set("producer", e.target.value)}
                placeholder="Ex: Château Margaux"
                style={inputStyle}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Millésime">
                <input
                  type="number"
                  min="1900"
                  max="2030"
                  value={form.vintage}
                  onChange={(e) => set("vintage", e.target.value)}
                  placeholder="2019"
                  style={inputStyle}
                />
              </Field>
              <Field label="Quantité">
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Volume (cl)">
                <select
                  value={form.volume}
                  onChange={(e) => set("volume", e.target.value)}
                  style={inputStyle}
                >
                  {[37.5, 50, 75, 100, 150, 300].map((v) => (
                    <option key={v} value={v}>{v} cl</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Classification */}
          <Section title="Classification">
            <Field label="Couleur">
              <div className="flex gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className="px-4 py-2 rounded-full text-sm capitalize transition-all"
                    style={{
                      background:
                        form.color === c
                          ? c === "rouge"
                            ? "var(--wine-red)"
                            : c === "blanc"
                            ? "rgba(160,120,44,0.18)"
                            : "rgba(184,64,96,0.18)"
                          : "var(--surface)",
                      border: `1px solid ${form.color === c ? "transparent" : "var(--border)"}`,
                      color: form.color === c ? "white" : "var(--text-muted)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Région">
                <select
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Sélectionner —</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Appellation">
                <input
                  value={form.appellation}
                  onChange={(e) => set("appellation", e.target.value)}
                  placeholder="Ex: Margaux"
                  style={inputStyle}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Pays">
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="France"
                  style={inputStyle}
                />
              </Field>
              <Field label="Cépage(s)">
                <input
                  value={form.grapeVarieties}
                  onChange={(e) => set("grapeVarieties", e.target.value)}
                  placeholder="Ex: Cabernet Sauvignon"
                  style={inputStyle}
                />
              </Field>
            </div>
          </Section>

          {/* Prix */}
          <Section title="Prix">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Prix d'achat (€)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.purchasePrice}
                  onChange={(e) => set("purchasePrice", e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </Field>
              <Field label="Estimation marché (€)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.marketPrice}
                  onChange={(e) => set("marketPrice", e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </Field>
            </div>
          </Section>

          {/* Dégustation */}
          <Section title="Dégustation">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="À boire à partir de">
                <input
                  type="number"
                  min="2000"
                  max="2050"
                  value={form.drinkFrom}
                  onChange={(e) => set("drinkFrom", e.target.value)}
                  placeholder="2024"
                  style={inputStyle}
                />
              </Field>
              <Field label="À boire avant">
                <input
                  type="number"
                  min="2000"
                  max="2060"
                  value={form.drinkUntil}
                  onChange={(e) => set("drinkUntil", e.target.value)}
                  placeholder="2035"
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Description du vin (cépage, terroir, style…)"
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Notes de dégustation, occasion d'achat…"
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </Field>
            <Field label="Accords mets/vin">
              <input
                value={form.foodPairing}
                onChange={(e) => set("foodPairing", e.target.value)}
                placeholder="Magret de canard, fromages affinés, gibier…"
                style={inputStyle}
              />
            </Field>
          </Section>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="px-8 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-40"
              style={{
                background: "var(--wine-red)",
                color: "white",
                fontFamily: "var(--font-inter)",
              }}
            >
              {loading ? "Ajout en cours…" : "Ajouter à la cave"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-full text-sm"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-inter)",
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  fontSize: "0.875rem",
  fontFamily: "var(--font-inter)",
  outline: "none",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}
    >
      <h2
        className="text-base font-semibold mb-5"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs opacity-50 mb-1.5 tracking-wider uppercase"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
