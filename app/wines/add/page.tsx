import Link from "next/link";
import { ArrowLeft, BookOpenText, Euro, MapPin, Package, Plus, Wine } from "lucide-react";
import { createWineAction } from "@/app/wines/actions";
import { PageHeader } from "@/components/PageHeader";
import {
  ColorField,
  Field,
  FormActions,
  RegionField,
  Section,
  Select,
  Suffixed,
} from "@/components/WineFormUI";

export default function AddWinePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Collection"
        title="Ajouter un vin"
        lead="Seul le nom est obligatoire. Le reste peut être complété plus tard."
        back={
          <Link href="/wines" className="btn btn-ghost btn-sm -ml-3">
            <ArrowLeft />
            Collection
          </Link>
        }
      />

      <div className="container-page pt-6 md:pt-8">
        <form action={createWineAction}>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Section title="Identité" icon={Wine}>
                <Field label="Nom du vin *" wide>
                  <input required name="name" placeholder="Ex : Château Margaux" className="input" />
                </Field>
                <Field label="Producteur / Domaine" wide>
                  <input name="producer" placeholder="Ex : Château Margaux" className="input" />
                </Field>
                <div className="sm:col-span-2">
                  <ColorField />
                </div>
              </Section>

              <Section title="Origine" icon={MapPin}>
                <RegionField />
                <Field label="Appellation">
                  <input name="appellation" placeholder="Ex : Margaux" className="input" />
                </Field>
                <Field label="Pays">
                  <input name="country" defaultValue="France" placeholder="France" className="input" />
                </Field>
                <Field label="Cépage(s)">
                  <input name="grapeVarieties" placeholder="Ex : Cabernet Sauvignon" className="input" />
                </Field>
              </Section>

              <Section title="Millésime & stock" icon={Package}>
                <Field label="Millésime" wide>
                  <input type="number" inputMode="numeric" name="vintage" min="1900" max="2030" placeholder="2019" className="input" />
                </Field>
                <Field label="Quantité">
                  <input type="number" inputMode="numeric" name="quantity" min="1" defaultValue="1" className="input" />
                </Field>
                <Field label="Volume">
                  <Select name="volume" defaultValue="75">
                    {[37.5, 50, 75, 100, 150, 300].map((value) => (
                      <option key={value} value={value}>
                        {value} cl
                      </option>
                    ))}
                  </Select>
                </Field>
              </Section>
            </div>

            <div className="space-y-4">
              <Section title="Prix" icon={Euro}>
                <Field label="Prix d’achat">
                  <Suffixed suffix="€">
                    <input type="number" inputMode="decimal" name="purchasePrice" step="0.01" min="0" placeholder="0,00" className="input tabular" />
                  </Suffixed>
                </Field>
                <Field label="Estimation marché">
                  <Suffixed suffix="€">
                    <input type="number" inputMode="decimal" name="marketPrice" step="0.01" min="0" placeholder="0,00" className="input tabular" />
                  </Suffixed>
                </Field>
              </Section>

              <Section
                title="Dégustation"
                icon={BookOpenText}
                description="Sans fenêtre saisie, la fiche affiche une estimation automatique."
              >
                <Field label="À boire à partir de">
                  <input type="number" inputMode="numeric" name="drinkFrom" min="2000" max="2050" placeholder="2024" className="input" />
                </Field>
                <Field label="Jusqu’à">
                  <input type="number" inputMode="numeric" name="drinkUntil" min="2000" max="2060" placeholder="2035" className="input" />
                </Field>
                <Field label="Description" wide>
                  <textarea name="description" rows={4} placeholder="Cépage, terroir, style…" className="input input-area" />
                </Field>
                <Field label="Notes de dégustation" wide>
                  <textarea name="notes" rows={4} placeholder="Nez, bouche, équilibre, potentiel…" className="input input-area" />
                </Field>
                <Field label="Accords mets & vin" wide>
                  <input name="foodPairing" placeholder="Magret de canard, fromages affinés, gibier…" className="input" />
                </Field>
              </Section>
            </div>
          </div>

          <FormActions cancelHref="/wines" submitLabel="Ajouter le vin" icon={Plus} />
        </form>
      </div>
    </div>
  );
}
