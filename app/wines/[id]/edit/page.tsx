import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpenText, CalendarClock, Check, ImageIcon, MapPin, Wine } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import WineImageField from "@/components/WineImageField";
import { updateWineAction } from "@/app/wines/actions";
import { ColorField, Field, FormActions, RegionField, Section } from "@/components/WineFormUI";

export default async function EditWinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });
  if (!wine) notFound();
  const action = updateWineAction.bind(null, wine.id);

  return (
    <div>
      <PageHeader
        eyebrow="Modifier"
        title={wine.name}
        lead={
          wine.vintages.length > 0
            ? "Les périodes d’apogée de chaque millésime se règlent en bas de page."
            : undefined
        }
        back={
          <Link href={`/wines/${wine.id}`} className="btn btn-ghost btn-sm -ml-3">
            <ArrowLeft />
            Fiche du vin
          </Link>
        }
      />

      <div className="container-page pt-6 md:pt-8">
        <form action={action}>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Section title="Image" icon={ImageIcon}>
                <div className="sm:col-span-2">
                  <WineImageField wineId={wine.id} wineName={wine.name} currentImage={wine.imageUrl} />
                </div>
              </Section>

              <Section title="Identité" icon={Wine}>
                <Field label="Nom du vin *" wide>
                  <input required name="name" defaultValue={wine.name} className="input" />
                </Field>
                <Field label="Producteur" wide>
                  <input name="producer" defaultValue={wine.producer ?? ""} className="input" />
                </Field>
                <div className="sm:col-span-2">
                  <ColorField defaultValue={wine.color} />
                </div>
              </Section>
            </div>

            <div className="space-y-4">
              <Section title="Origine" icon={MapPin}>
                <RegionField defaultValue={wine.region} />
                <Field label="Appellation">
                  <input name="appellation" defaultValue={wine.appellation ?? ""} className="input" />
                </Field>
                <Field label="Pays">
                  <input name="country" defaultValue={wine.country ?? "France"} className="input" />
                </Field>
                <Field label="Cépage(s)">
                  <input name="grapeVarieties" defaultValue={wine.grapeVarieties ?? ""} className="input" />
                </Field>
              </Section>

              <Section title="Dégustation" icon={BookOpenText}>
                <Field label="Description" wide>
                  <textarea
                    name="description"
                    defaultValue={wine.description ?? ""}
                    rows={4}
                    placeholder="Cépage, terroir, style…"
                    className="input input-area"
                  />
                </Field>
                <Field label="Notes de dégustation" wide>
                  <textarea
                    name="notes"
                    defaultValue={wine.notes ?? ""}
                    rows={4}
                    placeholder="Nez, bouche, équilibre, potentiel…"
                    className="input input-area"
                  />
                </Field>
                <Field label="Accords mets & vin" wide>
                  <input
                    name="foodPairing"
                    defaultValue={wine.foodPairing ?? ""}
                    placeholder="Magret de canard, fromages affinés, gibier…"
                    className="input"
                  />
                </Field>
              </Section>
            </div>
          </div>

          {wine.vintages.length > 0 && (
            <div className="mt-4">
              <Section
                title="Périodes d’apogée"
                icon={CalendarClock}
                description="Propres à chaque millésime, elles remplacent l’estimation automatique affichée sur la fiche."
              >
                {wine.vintages.map((vintage) => (
                  <fieldset key={vintage.id} className="panel min-w-0 p-4">
                    <legend className="sr-only">Millésime {vintage.vintage ?? "inconnu"}</legend>
                    <p aria-hidden="true" className="mb-3 font-display text-base font-semibold tabular">
                      {vintage.vintage ?? "Millésime inconnu"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="À partir de">
                        <input type="number" inputMode="numeric" name={`drinkFrom:${vintage.id}`} min="1900" max="2100" defaultValue={vintage.drinkFrom ?? ""} placeholder="2024" className="input" />
                      </Field>
                      <Field label="Jusqu’à">
                        <input type="number" inputMode="numeric" name={`drinkUntil:${vintage.id}`} min="1900" max="2100" defaultValue={vintage.drinkUntil ?? ""} placeholder="2035" className="input" />
                      </Field>
                    </div>
                  </fieldset>
                ))}
              </Section>
            </div>
          )}

          <FormActions cancelHref={`/wines/${wine.id}`} submitLabel="Enregistrer" icon={Check} />
        </form>
      </div>
    </div>
  );
}
