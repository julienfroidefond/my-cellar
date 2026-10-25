import Link from "next/link";
import { createWineAction } from "@/app/wines/actions";
import { PageHeader } from "@/components/PageHeader";
import { ColorField, Field, RegionField, Section, inputStyle } from "@/components/WineFormUI";

export default function AddWinePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <PageHeader
        eyebrow="Collection"
        title="Ajouter un vin"
        lead="Renseigner les informations de la bouteille."
        actions={
          <Link href="/wines" className="px-4 py-2 rounded-full text-sm" style={{ border: "1px solid var(--border)", color: "var(--wine-red)", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
            ← Collection
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <form action={createWineAction}>
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <Section title="Informations principales">
                <Field label="Nom du vin *">
                  <input required name="name" placeholder="Ex: Château Margaux" style={inputStyle} />
                </Field>
                <Field label="Producteur / Domaine">
                  <input name="producer" placeholder="Ex: Château Margaux" style={inputStyle} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Millésime">
                    <input type="number" name="vintage" min="1900" max="2030" placeholder="2019" style={inputStyle} />
                  </Field>
                  <Field label="Quantité">
                    <input type="number" name="quantity" min="1" defaultValue="1" style={inputStyle} />
                  </Field>
                  <Field label="Volume (cl)">
                    <select name="volume" defaultValue="75" style={inputStyle}>
                      {[37.5, 50, 75, 100, 150, 300].map((value) => (
                        <option key={value} value={value}>
                          {value} cl
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="Classification">
                <ColorField />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RegionField />
                  <Field label="Appellation">
                    <input name="appellation" placeholder="Ex: Margaux" style={inputStyle} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Pays">
                    <input name="country" defaultValue="France" placeholder="France" style={inputStyle} />
                  </Field>
                  <Field label="Cépage(s)">
                    <input name="grapeVarieties" placeholder="Ex: Cabernet Sauvignon" style={inputStyle} />
                  </Field>
                </div>
              </Section>

              <Section title="Prix">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Prix d'achat (€)">
                    <input type="number" name="purchasePrice" step="0.01" min="0" placeholder="0.00" style={inputStyle} />
                  </Field>
                  <Field label="Estimation marché (€)">
                    <input type="number" name="marketPrice" step="0.01" min="0" placeholder="0.00" style={inputStyle} />
                  </Field>
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Dégustation">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="À boire à partir de">
                    <input type="number" name="drinkFrom" min="2000" max="2050" placeholder="2024" style={inputStyle} />
                  </Field>
                  <Field label="Jusqu'à">
                    <input type="number" name="drinkUntil" min="2000" max="2060" placeholder="2035" style={inputStyle} />
                  </Field>
                </div>
              </Section>

              <Section title="Description & Notes">
                <Field label="Description">
                  <textarea name="description" rows={4} placeholder="Description du vin (cépage, terroir, style…)" style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
                <Field label="Notes de dégustation">
                  <textarea name="notes" rows={4} placeholder="Nez, bouche, équilibre, potentiel…" style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
                <Field label="Accords mets/vin">
                  <input name="foodPairing" placeholder="Magret de canard, fromages affinés, gibier…" style={inputStyle} />
                </Field>
              </Section>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full font-medium text-sm"
                  style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
