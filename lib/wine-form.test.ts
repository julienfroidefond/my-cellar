import { describe, expect, it } from "vitest";

import { parseCreateWineForm, parseUpdateWineForm } from "./wine-form";

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

describe("parseCreateWineForm", () => {
  it("applique les valeurs par défaut", () => {
    const parsed = parseCreateWineForm(form({ name: "Château Test" }));
    expect(parsed.name).toBe("Château Test");
    expect(parsed.quantity).toBe(1);
    expect(parsed.volume).toBe(75);
    expect(parsed.country).toBe("France");
    expect(parsed.vintage).toBeNull();
    expect(parsed.producer).toBeNull();
    expect(parsed.purchasePrice).toBeNull();
    expect(parsed.drinkFrom).toBeNull();
  });

  it("trime les chaînes et convertit les vides en null", () => {
    const parsed = parseCreateWineForm(form({ name: "  Vin  ", producer: "   ", color: "rouge" }));
    expect(parsed.name).toBe("Vin");
    expect(parsed.producer).toBeNull();
    expect(parsed.color).toBe("rouge");
  });

  it("parse les entiers et les décimaux", () => {
    const parsed = parseCreateWineForm(
      form({
        name: "X",
        vintage: "2015",
        quantity: "6",
        volume: "150",
        purchasePrice: "12.5",
        marketPrice: "20",
        drinkUntil: "2040",
      }),
    );
    expect(parsed.vintage).toBe(2015);
    expect(parsed.quantity).toBe(6);
    expect(parsed.volume).toBe(150);
    expect(parsed.purchasePrice).toBe(12.5);
    expect(parsed.marketPrice).toBe(20);
    expect(parsed.drinkUntil).toBe(2040);
  });

  it("conserve une quantité 0 fournie explicitement", () => {
    expect(parseCreateWineForm(form({ name: "X", quantity: "0" })).quantity).toBe(0);
  });

  it("retombe sur les défauts pour des nombres invalides", () => {
    const parsed = parseCreateWineForm(form({ name: "X", vintage: "abc", quantity: "abc", volume: "abc" }));
    expect(parsed.vintage).toBeNull();
    expect(parsed.quantity).toBe(1);
    expect(parsed.volume).toBe(75);
  });

  it("utilise France quand le pays est vide ou blanc", () => {
    expect(parseCreateWineForm(form({ name: "X", country: "  " })).country).toBe("France");
    expect(parseCreateWineForm(form({ name: "X" })).country).toBe("France");
  });

  it("conserve un pays explicite", () => {
    expect(parseCreateWineForm(form({ name: "X", country: "Italie" })).country).toBe("Italie");
  });
});

describe("parseUpdateWineForm", () => {
  it("ne renvoie pas les champs de stockage gérés ailleurs", () => {
    const parsed = parseUpdateWineForm(form({ name: "X", vintage: "2015", quantity: "6" })) as Record<
      string,
      unknown
    >;
    expect(parsed).not.toHaveProperty("vintage");
    expect(parsed).not.toHaveProperty("quantity");
    expect(parsed).not.toHaveProperty("volume");
    expect(parsed).not.toHaveProperty("purchasePrice");
  });

  it("applique France par défaut et null pour les champs vides", () => {
    const parsed = parseUpdateWineForm(form({ name: "X", notes: "" }));
    expect(parsed.country).toBe("France");
    expect(parsed.notes).toBeNull();
    expect(parsed.producer).toBeNull();
  });

  it("trime et conserve les champs texte renseignés", () => {
    const parsed = parseUpdateWineForm(
      form({ name: "  Vin  ", grapeVarieties: " Merlot ", region: "Bordeaux" }),
    );
    expect(parsed.name).toBe("Vin");
    expect(parsed.grapeVarieties).toBe("Merlot");
    expect(parsed.region).toBe("Bordeaux");
  });
});
