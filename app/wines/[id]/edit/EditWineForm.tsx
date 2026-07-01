"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImagePicker from "@/components/ImagePicker";

const COLORS = ["rouge", "blanc", "rosé"];
const REGIONS = [
  "Bordeaux", "Bourgogne", "Rhône", "Champagne", "Alsace", "Loire",
  "Languedoc", "Provence", "Roussillon", "Sud-Ouest", "Jura", "Savoie",
  "Mendoza", "Patagonie", "Arménie", "Autre",
];

interface WineVintage {
  id: string;
  vintage: number | null;
  quantity: number;
  volume: number;
  purchasePrice: number | null;
  marketPrice: number | null;
  drinkFrom: number | null;
  drinkUntil: number | null;
}

interface Wine {
  id: string;
  name: string;
  producer: string | null;
  color: string | null;
  region: string | null;
  appellation: string | null;
  country: string | null;
  grapeVarieties: string | null;
  description: string | null;
  notes: string | null;
  imageUrl: string | null;
  vintages: WineVintage[];
}

export default function EditWineForm({ wine }: { wine: Wine }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(wine.imageUrl ?? "");
  const [form, setForm] = useState({
    name: wine.name,
    producer: wine.producer ?? "",
    color: wine.color ?? "rouge",
    region: wine.region ?? "",
    appellation: wine.appellation ?? "",
    country: wine.country ?? "France",
    grapeVarieties: wine.grapeVarieties ?? "",
    description: wine.description ?? "",
    notes: wine.notes ?? "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // PUT /api/wines/[id] updates wine-level fields only
    const payload: Record<string, unknown> = {
      name: form.name,
      producer: form.producer || null,
      color: form.color || null,
      region: form.region || null,
      appellation: form.appellation || null,
      country: form.country || "France",
      grapeVarieties: form.grapeVarieties || null,
      description: form.description || null,
      notes: form.notes || null,
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
          {wine.vintages.length > 0 && (
            <p className="text-sm mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Les millésimes sont modifiables depuis la fiche du vin.
            </p>
          )}
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
            </Section>
          </div>

          {/* Row 2 — Classification + Notes */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Pays">
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Cépage(s)">
                  <input value={form.grapeVarieties} onChange={(e) => set("grapeVarieties", e.target.value)} style={inputStyle} />
                </Field>
              </div>
            </Section>

            <Section title="Description & Notes">
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Description du vin (cépage, terroir, style…)" style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
              <Field label="Notes de dégustation">
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
            </Section>
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
