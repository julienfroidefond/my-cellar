import { describe, expect, it } from "vitest";

import { estimateMaturity } from "./maturity";

describe("estimateMaturity", () => {
  it("retourne null sans millésime", () => {
    expect(estimateMaturity({ vintage: null })).toBeNull();
    expect(estimateMaturity({})).toBeNull();
  });

  it("traite un millésime 0 comme absent (valeur falsy)", () => {
    expect(estimateMaturity({ vintage: 0, region: "Bordeaux", color: "rouge" })).toBeNull();
  });

  it("applique la règle Champagne « Blanc de Blancs »", () => {
    expect(
      estimateMaturity({ vintage: 2015, region: "Champagne", appellation: "Blanc de Blancs" }),
    ).toEqual({
      drinkFrom: 2018,
      drinkUntil: 2035,
      note: "Blanc de Blancs — acidité élevée, garde remarquable",
    });
  });

  it("retombe sur la règle Champagne générique", () => {
    expect(estimateMaturity({ vintage: 2015, region: "Champagne", appellation: "Brut" })).toEqual({
      drinkFrom: 2015,
      drinkUntil: 2023,
      note: "Champagne — à boire relativement jeune",
    });
  });

  it("priorise l'appellation spécifique sur la région générique", () => {
    // Pauillac est plus spécifique que « Bordeaux rouge ».
    expect(
      estimateMaturity({ vintage: 2015, region: "Bordeaux", appellation: "Pauillac", color: "rouge" }),
    ).toEqual({
      drinkFrom: 2023,
      drinkUntil: 2050,
      note: "Pauillac — tanins puissants, grande garde",
    });
  });

  it("est insensible à la casse et aux accents", () => {
    const expected = {
      drinkFrom: 2004,
      drinkUntil: 2022,
      note: "Saint-Émilion — diverse, de bonne garde",
    };
    expect(estimateMaturity({ vintage: 2000, appellation: "SAINT-EMILION", color: "ROUGE" })).toEqual(expected);
    expect(estimateMaturity({ vintage: 2000, appellation: "Saint-Émilion", color: "rouge" })).toEqual(expected);
  });

  it("distingue Chablis, Premier Cru et Grand Cru", () => {
    expect(estimateMaturity({ vintage: 2018, appellation: "Chablis" })).toMatchObject({
      drinkFrom: 2019,
      drinkUntil: 2024,
    });
    expect(estimateMaturity({ vintage: 2018, appellation: "Chablis Premier Cru" })).toMatchObject({
      drinkFrom: 2021,
      drinkUntil: 2030,
    });
    expect(estimateMaturity({ vintage: 2018, appellation: "Chablis Grand Cru" })).toMatchObject({
      drinkFrom: 2023,
      drinkUntil: 2038,
    });
  });

  it("applique les règles Bordeaux génériques selon la couleur", () => {
    expect(estimateMaturity({ vintage: 2010, region: "Bordeaux", color: "rouge" })).toMatchObject({
      drinkFrom: 2012,
      drinkUntil: 2020,
    });
    expect(estimateMaturity({ vintage: 2010, region: "Bordeaux", color: "blanc" })).toMatchObject({
      drinkFrom: 2011,
      drinkUntil: 2015,
    });
  });

  it("utilise le fallback par couleur", () => {
    expect(estimateMaturity({ vintage: 2020, color: "rouge" })).toEqual({
      drinkFrom: 2023,
      drinkUntil: 2030,
      note: "Vin rouge — garde estimée générique",
    });
    expect(estimateMaturity({ vintage: 2020, color: "blanc" })).toEqual({
      drinkFrom: 2021,
      drinkUntil: 2025,
      note: "Vin blanc — garde estimée générique",
    });
    expect(estimateMaturity({ vintage: 2020, color: "rosé" })).toEqual({
      drinkFrom: 2020,
      drinkUntil: 2022,
      note: "Rosé — boire dans les 2 ans",
    });
  });

  it("retourne null quand aucune règle ne correspond", () => {
    expect(estimateMaturity({ vintage: 2020 })).toBeNull();
    expect(estimateMaturity({ vintage: 2020, appellation: "Inconnu", region: "Nulle part" })).toBeNull();
  });
});
