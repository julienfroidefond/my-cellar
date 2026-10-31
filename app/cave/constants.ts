export const SLOT_FRONT = 44;
export const SLOT_BACK  = 36;

// Réglage de l'éloignement entre la rangée avant (profondeur 1) et la rangée
// arrière (profondeur 2) de la vue isométrique. 1 = écart de référence.
export const DEPTH_MIN = 0.55;
export const DEPTH_MAX = 1.35;
export const DEPTH_DEFAULT = 1;

// Teintes des bouchons dessinés sur le plan (dégradé radial base → reflet),
// alignées sur les couleurs de vin du système (--color-rouge, --color-blanc…).
export const BOTTLE: Record<string, { base: string; hi: string; label: string }> = {
  rouge: { base: "#a3142f", hi: "#e0566f", label: "Rouge" },
  blanc: { base: "#b8862e", hi: "#e8c872", label: "Blanc" },
  rosé:  { base: "#cc5c77", hi: "#f2a3b5", label: "Rosé" },
};

/** Teinte de repli pour une couleur inconnue. */
export const BOTTLE_FALLBACK = { base: "#5a4a50", hi: "#9a8a90", label: "" };
