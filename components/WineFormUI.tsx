import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { WINE_COLORS, WINE_REGIONS } from "@/lib/wine-form";
import { colorLabel } from "@/components/WineTile";

/**
 * Section de formulaire : carte avec en-tête (icône, titre, aide) et grille
 * de champs sur deux colonnes à partir de `sm`. Un champ `wide` occupe toute
 * la largeur.
 */
export function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section data-reveal className="card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--wine-tint)] text-wine-red">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Champ libellé : le libellé englobe le contrôle, donc pas besoin d'identifiant. */
export function Field({
  label,
  hint,
  wide = false,
  children,
}: {
  label: string;
  hint?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

/** Liste déroulante native habillée comme les champs texte. */
export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <span className="relative block">
      <select {...props} className="input cursor-pointer appearance-none pr-10">
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </span>
  );
}

/** Champ numérique avec unité affichée à droite (€, cl…). */
export function Suffixed({ suffix, children }: { suffix: string; children: ReactNode }) {
  return (
    <span className="relative block [&_input]:pr-10">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-faint"
      >
        {suffix}
      </span>
    </span>
  );
}

/**
 * Couleur du vin : boutons radio présentés en contrôle segmenté. La valeur
 * soumise (`color`) est inchangée par rapport à l'ancienne liste déroulante.
 */
export function ColorField({ defaultValue = "rouge" }: { defaultValue?: string | null }) {
  const current = defaultValue ?? "rouge";
  return (
    <fieldset className="min-w-0">
      <legend className="label mb-1.5">Couleur</legend>
      <div className="segmented flex w-full">
        {WINE_COLORS.map((color) => (
          <label
            key={color}
            className="h-10! flex-1 cursor-pointer justify-center has-[:checked]:bg-surface has-[:checked]:font-semibold has-[:checked]:text-foreground has-[:checked]:shadow-[var(--shadow-sm)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-wine-red"
          >
            <input
              type="radio"
              name="color"
              value={color}
              defaultChecked={current === color}
              className="sr-only"
            />
            <span className="wine-dot" data-color={color} />
            {colorLabel(color)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RegionField({ defaultValue = "" }: { defaultValue?: string | null }) {
  return (
    <Field label="Région">
      <Select name="region" defaultValue={defaultValue ?? ""}>
        <option value="">Sélectionner…</option>
        {WINE_REGIONS.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/**
 * Barre d'actions collante en bas de l'écran. Sur mobile, elle se place
 * au-dessus de la barre d'onglets fixe.
 */
export function FormActions({
  cancelHref,
  submitLabel,
  icon: Icon,
}: {
  cancelHref: string;
  submitLabel: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="sticky bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] z-[var(--z-sticky)] -mx-4 mt-6 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:bottom-4 lg:mx-0 lg:mb-4 lg:rounded-[var(--radius-lg)] lg:border lg:bg-surface/90 lg:px-4 lg:shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-end gap-2">
        <Link href={cancelHref} className="btn btn-secondary btn-lg flex-1 sm:flex-none">
          Annuler
        </Link>
        <button type="submit" className="btn btn-primary btn-lg flex-1 sm:flex-none sm:min-w-40">
          {Icon && <Icon />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
