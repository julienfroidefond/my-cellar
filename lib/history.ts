export const REMOVAL_REASON_LABELS = {
  offert: "Offert",
  regul: "Régularisation",
  suppression: "Suppression",
} as const;

export type RemovalReason = keyof typeof REMOVAL_REASON_LABELS;

export const SELECTABLE_REMOVAL_REASONS = ["offert", "regul"] as const satisfies readonly RemovalReason[];

export function isRemovalReason(value: unknown): value is RemovalReason {
  return typeof value === "string" && value in REMOVAL_REASON_LABELS;
}

/** Libellé affichable d'une raison de retrait ("Retiré" pour les entrées legacy). */
export function removalReasonLabel(reason: string | null | undefined): string {
  return isRemovalReason(reason) ? REMOVAL_REASON_LABELS[reason] : "Retiré";
}

/** Champs nécessaires pour snapshooter un millésime dans l'historique. */
export type VintageWithWine = {
  vintage: number | null;
  volume: number;
  wine: {
    name: string;
    producer: string | null;
    color: string | null;
    appellation: string | null;
    region: string | null;
    country: string | null;
    imageUrl: string | null;
  };
};

/** Construit les données d'une entrée d'historique pour un retrait de bouteilles. */
export function buildRemovalHistory(
  source: VintageWithWine,
  quantity: number,
  reason: RemovalReason,
  note: string | null,
) {
  return {
    action: "retiré",
    reason,
    note,
    wineName: source.wine.name,
    producer: source.wine.producer,
    vintage: source.vintage,
    color: source.wine.color,
    appellation: source.wine.appellation,
    region: source.wine.region,
    country: source.wine.country,
    volume: source.volume,
    quantity,
    imageUrl: source.wine.imageUrl,
  };
}
