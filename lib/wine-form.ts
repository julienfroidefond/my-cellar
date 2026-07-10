export const WINE_COLORS = ["rouge", "blanc", "rosé"] as const;

export const WINE_REGIONS = [
  "Bordeaux", "Bourgogne", "Rhône", "Champagne", "Alsace", "Loire",
  "Languedoc", "Provence", "Roussillon", "Sud-Ouest", "Jura", "Savoie",
  "Mendoza", "Patagonie", "Arménie", "Autre",
] as const;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNullableInt(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNullableFloat(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCreateWineForm(formData: FormData) {
  return {
    name: getString(formData, "name"),
    producer: getNullableString(formData, "producer"),
    vintage: getNullableInt(formData, "vintage"),
    quantity: getNullableInt(formData, "quantity") ?? 1,
    volume: getNullableFloat(formData, "volume") ?? 75,
    color: getNullableString(formData, "color"),
    region: getNullableString(formData, "region"),
    appellation: getNullableString(formData, "appellation"),
    country: getString(formData, "country") || "France",
    grapeVarieties: getNullableString(formData, "grapeVarieties"),
    purchasePrice: getNullableFloat(formData, "purchasePrice"),
    marketPrice: getNullableFloat(formData, "marketPrice"),
    description: getNullableString(formData, "description"),
    notes: getNullableString(formData, "notes"),
    foodPairing: getNullableString(formData, "foodPairing"),
    drinkFrom: getNullableInt(formData, "drinkFrom"),
    drinkUntil: getNullableInt(formData, "drinkUntil"),
    imageUrl: getNullableString(formData, "imageUrl"),
  };
}

export function parseUpdateWineForm(formData: FormData) {
  return {
    name: getString(formData, "name"),
    producer: getNullableString(formData, "producer"),
    color: getNullableString(formData, "color"),
    region: getNullableString(formData, "region"),
    appellation: getNullableString(formData, "appellation"),
    country: getString(formData, "country") || "France",
    grapeVarieties: getNullableString(formData, "grapeVarieties"),
    description: getNullableString(formData, "description"),
    notes: getNullableString(formData, "notes"),
    foodPairing: getNullableString(formData, "foodPairing"),
    imageUrl: getNullableString(formData, "imageUrl"),
  };
}
