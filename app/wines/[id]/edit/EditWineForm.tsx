"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImagePicker from "@/components/ImagePicker";
import { estimateMaturity } from "@/lib/maturity";

const COLORS = ["rouge", "blanc", "rosé"];
const REGIONS = [
  "Bordeaux", "Bourgogne", "Rhône", "Champagne", "Alsace", "Loire",
  "Languedoc", "Provence", "Roussillon", "Sud-Ouest", "Jura", "Savoie",
  "Mendoza", "Patagonie", "Arménie", "Autre",
];

interface Wine {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  quantity: number;
  volume: number;
  color: string | null;
  region: string | null;
  appellation: string | null;
  country: string | null;
  grapeVarieties: string | null;
  purchasePrice: number | null;
  marketPrice: number | null;
  notes: string | null;
  imageUrl: string | null;
  drinkFrom: number | null;
  drinkUntil: number | null;
}

export default function EditWineForm({ wine }: { wine: Wine }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(wine.imageUrl ?? "");
  const [form, setForm] = useState({
    name: wine.name,
    producer: wine.producer ?? "",
    vintage: wine.vintage?.toString() ?? "",
    quantity: wine.quantity.toString(),
    volume: wine.volume.toString(),
    color: wine.color ?? "rouge",
    region: wine.region ?? "",
    appellation: wine.appellation ?? "",
    country: wine.country ?? "France",
    grapeVarieties: wine.grapeVarieties ?? "",
    purchasePrice: wine.purchasePrice?.toString() ?? "",
    marketPrice: wine.marketPrice?.toString() ?? "",
    notes: wine.notes ?? "",
    drinkFrom: wine.drinkFrom?.toString() ?? "",
    drinkUntil: wine.drinkUntil?.toString() ?? "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      producer: form.producer || null,
      vintage: form.vintage ? parseInt(form.vintage) : null,
      quantity: parseInt(form.quantity) || 0,
      volume: parseInt(form.volume) || 75,
      color: form.color || null,
      region: form.region || null,
      appellation: form.appellation || null,
      country: form.country || "France",
      grapeVarieties: form.grapeVarieties || null,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
      marketPrice: form.marketPrice ? parseFloat(form.marketPrice) : null,
      notes: form.notes || null,
      drinkFrom: form.drinkFrom ? parseInt(form.drinkFrom) : null,
      drinkUntil: form.drinkUntil ? parseInt(form.drinkUntil) : null,
      imageUrl: imageUrl || null,
    };

    await fetch(`/api/wines/${wine.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    router.push(`/wines/${wine.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            Modifier
          </h1>
          <p className="opacity-40 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            {wine.name}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 1 — Image + Informations principales */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Section title="Image">
              <ImagePicker
                wineId={wine.id}
                wineName={wine.name}
                currentImage={wine.imageUrl}
                onSelect={setImageUrl}
              />
            </Section>

            <Section title="Informations principales">
              <Field label="Nom du vin *">
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Producteur">
                <input value={form.producer} onChange={(e) => set("producer", e.target.value)} style={inputStyle} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Millésime">
                  <input type="number" min="1900" max="2030" value={form.vintage} onChange={(e) => set("vintage", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Quantité">
                  <input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Volume (cl)">
                  <select value={form.volume} onChange={(e) => set("volume", e.target.value)} style={inputStyle}>
                    {[37.5, 50, 75, 100, 150, 300].map((v) => (
                      <option key={v} value={v}>{v} cl</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>
          </div>

          {/* Row 2 — Classification + Prix & Dégustation */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Section title="Classification">
              <Field label="Couleur">
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => set("color", c)} className="px-4 py-2 rounded-full text-sm capitalize transition-all"
                      style={{
                        background: form.color === c ? (c === "rouge" ? "var(--wine-red)" : c === "blanc" ? "rgba(160,120,44,0.18)" : "rgba(184,64,96,0.18)") : "var(--surface)",
                        border: `1px solid ${form.color === c ? "transparent" : "var(--border)"}`,
                        color: form.color === c ? "white" : "var(--text-muted)",
                        fontFamily: "var(--font-inter)",
                      }}
                    >{c}</button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Région">
                  <select value={form.region} onChange={(e) => set("region", e.target.value)} style={inputStyle}>
                    <option value="">— Sélectionner —</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Appellation">
                  <input value={form.appellation} onChange={(e) => set("appellation", e.target.value)} style={inputStyle} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pays">
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Cépage(s)">
                  <input value={form.grapeVarieties} onChange={(e) => set("grapeVarieties", e.target.value)} style={inputStyle} />
                </Field>
              </div>
            </Section>

            <div className="space-y-6">
              <Section title="Prix">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prix d'achat (€)">
                    <input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Estimation marché (€)">
                    <input type="number" step="0.01" min="0" value={form.marketPrice} onChange={(e) => set("marketPrice", e.target.value)} style={inputStyle} />
                  </Field>
                </div>
              </Section>

              <Section title="Dégustation">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="À boire à partir de">
                    <input type="number" value={form.drinkFrom} onChange={(e) => set("drinkFrom", e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="À boire avant">
                    <input type="number" value={form.drinkUntil} onChange={(e) => set("drinkUntil", e.target.value)} style={inputStyle} />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const est = estimateMaturity({
                      region: form.region || null,
                      appellation: form.appellation || null,
                      color: form.color || null,
                      vintage: form.vintage ? parseInt(form.vintage) : null,
                    });
                    if (est) {
                      set("drinkFrom", est.drinkFrom.toString());
                      set("drinkUntil", est.drinkUntil.toString());
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--wine-red)",
                    border: "1px solid rgba(192,25,59,0.25)",
                    background: "rgba(192,25,59,0.07)",
                  }}
                >
                  ✦ Estimer la maturité
                </button>
                <Field label="Notes">
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
              </Section>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-full font-medium text-sm disabled:opacity-40"
              style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}>
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-full text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  background: "var(--surface)", border: "1px solid var(--border)",
  color: "var(--foreground)", fontSize: "0.875rem", fontFamily: "var(--font-inter)", outline: "none",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(26,10,14,0.06)" }}>
      <h2 className="text-base font-semibold mb-5" style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs opacity-50 mb-1.5 tracking-wider uppercase" style={{ fontFamily: "var(--font-inter)" }}>{label}</label>
      {children}
    </div>
  );
}
