import { describe, expect, it } from "vitest";

import {
  REMOVAL_REASON_LABELS,
  buildAdditionHistory,
  buildRemovalHistory,
  isRemovalReason,
  removalReasonLabel,
  type VintageWithWine,
} from "./history";

describe("isRemovalReason", () => {
  it("accepte les raisons connues", () => {
    expect(isRemovalReason("offert")).toBe(true);
    expect(isRemovalReason("regul")).toBe(true);
    expect(isRemovalReason("suppression")).toBe(true);
  });

  it("rejette les valeurs inconnues et non-chaînes", () => {
    expect(isRemovalReason("inconnu")).toBe(false);
    expect(isRemovalReason("")).toBe(false);
    expect(isRemovalReason(null)).toBe(false);
    expect(isRemovalReason(undefined)).toBe(false);
    expect(isRemovalReason(42)).toBe(false);
    expect(isRemovalReason({})).toBe(false);
  });

  it("rejette les clés héritées du prototype", () => {
    // `value in obj` renvoie vrai pour les propriétés héritées d'Object.prototype.
    expect(isRemovalReason("toString")).toBe(false);
    expect(isRemovalReason("hasOwnProperty")).toBe(false);
    expect(isRemovalReason("constructor")).toBe(false);
  });

  it("couvre exactement les clés déclarées", () => {
    for (const reason of Object.keys(REMOVAL_REASON_LABELS)) {
      expect(isRemovalReason(reason)).toBe(true);
    }
  });
});

describe("removalReasonLabel", () => {
  it("renvoie le libellé des raisons connues", () => {
    expect(removalReasonLabel("offert")).toBe("Offert");
    expect(removalReasonLabel("regul")).toBe("Régularisation");
    expect(removalReasonLabel("suppression")).toBe("Suppression");
  });

  it("renvoie « Retiré » pour les raisons inconnues ou absentes", () => {
    expect(removalReasonLabel("legacy")).toBe("Retiré");
    expect(removalReasonLabel(null)).toBe("Retiré");
    expect(removalReasonLabel(undefined)).toBe("Retiré");
    expect(removalReasonLabel("")).toBe("Retiré");
  });
});

describe("buildRemovalHistory", () => {
  const source: VintageWithWine = {
    vintage: 2015,
    volume: 75,
    wine: {
      name: "Château Test",
      producer: "Domaine Test",
      color: "rouge",
      appellation: "Pauillac",
      region: "Bordeaux",
      country: "France",
      imageUrl: "/wines/test.jpg",
    },
  };

  it("snapshote le millésime et la raison du retrait", () => {
    expect(buildRemovalHistory(source, 2, "offert", "Cadeau anniversaire")).toEqual({
      action: "retiré",
      reason: "offert",
      note: "Cadeau anniversaire",
      wineName: "Château Test",
      producer: "Domaine Test",
      vintage: 2015,
      color: "rouge",
      appellation: "Pauillac",
      region: "Bordeaux",
      country: "France",
      volume: 75,
      quantity: 2,
      imageUrl: "/wines/test.jpg",
    });
  });

  it("accepte une note absente", () => {
    expect(buildRemovalHistory(source, 1, "regul", null)).toMatchObject({
      reason: "regul",
      note: null,
      quantity: 1,
    });
  });
});

describe("buildAdditionHistory", () => {
  const source: VintageWithWine = {
    vintage: 2019,
    volume: 75,
    wine: {
      name: "Château Test",
      producer: "Domaine Test",
      color: "rouge",
      appellation: "Pauillac",
      region: "Bordeaux",
      country: "France",
      imageUrl: "/wines/test.jpg",
    },
  };

  it("snapshote le millésime ajouté sans raison ni note", () => {
    expect(buildAdditionHistory(source, 6)).toEqual({
      action: "ajout",
      reason: null,
      note: null,
      wineName: "Château Test",
      producer: "Domaine Test",
      vintage: 2019,
      color: "rouge",
      appellation: "Pauillac",
      region: "Bordeaux",
      country: "France",
      volume: 75,
      quantity: 6,
      imageUrl: "/wines/test.jpg",
    });
  });
});
