import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import WineImageField from "@/components/WineImageField";
import { updateWineAction } from "@/app/wines/actions";
import { ColorField, Field, RegionField, Section, inputStyle } from "@/components/WineFormUI";

export default async function EditWinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });
  if (!wine) notFound();
  const action = updateWineAction.bind(null, wine.id);

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
              Les périodes d’apogée se règlent ci-dessous, pour chaque millésime.
            </p>
          )}
        </div>

        <form action={action}>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Section title="Image">
              <WineImageField wineId={wine.id} wineName={wine.name} currentImage={wine.imageUrl} />
            </Section>

            <Section title="Informations principales">
              <Field label="Nom du vin *">
                <input required name="name" defaultValue={wine.name} style={inputStyle} />
              </Field>
              <Field label="Producteur">
                <input name="producer" defaultValue={wine.producer ?? ""} style={inputStyle} />
              </Field>
            </Section>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Section title="Classification">
              <ColorField defaultValue={wine.color} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RegionField defaultValue={wine.region} />
                <Field label="Appellation">
                  <input name="appellation" defaultValue={wine.appellation ?? ""} style={inputStyle} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Pays">
                  <input name="country" defaultValue={wine.country ?? "France"} style={inputStyle} />
                </Field>
                <Field label="Cépage(s)">
                  <input name="grapeVarieties" defaultValue={wine.grapeVarieties ?? ""} style={inputStyle} />
                </Field>
              </div>
            </Section>

            <Section title="Description & Notes">
              <Field label="Description">
                <textarea
                  name="description"
                  defaultValue={wine.description ?? ""}
                  rows={4}
                  placeholder="Description du vin (cépage, terroir, style…)"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Notes de dégustation">
                <textarea
                  name="notes"
                  defaultValue={wine.notes ?? ""}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </Field>
              <Field label="Accords mets/vin">
                <input
                  name="foodPairing"
                  defaultValue={wine.foodPairing ?? ""}
                  placeholder="Magret de canard, fromages affinés, gibier…"
                  style={inputStyle}
                />
              </Field>
            </Section>
          </div>

          {wine.vintages.length > 0 && (
            <Section title="Périodes d’apogée">
              <p className="-mt-2 text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                Ces périodes sont propres à chaque millésime et remplacent l’estimation automatique affichée sur la fiche.
              </p>
              <div className="space-y-4">
                {wine.vintages.map((vintage) => (
                  <div key={vintage.id} className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <p className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
                      {vintage.vintage ?? "Millésime inconnu"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="À boire à partir de">
                        <input type="number" name={`drinkFrom:${vintage.id}`} min="1900" max="2100" defaultValue={vintage.drinkFrom ?? ""} placeholder="2024" style={inputStyle} />
                      </Field>
                      <Field label="Jusqu’à">
                        <input type="number" name={`drinkUntil:${vintage.id}`} min="1900" max="2100" defaultValue={vintage.drinkUntil ?? ""} placeholder="2035" style={inputStyle} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="px-8 py-3 rounded-full font-medium text-sm"
              style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
            >
              Enregistrer
            </button>
            <Link
              href={`/wines/${wine.id}`}
              className="px-6 py-3 rounded-full text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
