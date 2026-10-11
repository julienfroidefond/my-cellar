import { describe, expect, it } from "vitest";

import {
  RACK_CONFIGS,
  decodeSlot,
  defaultRackConfig,
  numColsForConfig,
  slotLabel,
} from "./rack-configs";

describe("numColsForConfig", () => {
  it("prend la plus grande largeur (avant/arrière) parmi les niveaux", () => {
    expect(numColsForConfig({ levels: [{ front: 4, back: 0 }, { front: 4, back: 4 }] })).toBe(4);
    expect(numColsForConfig({ levels: [{ front: 6, back: 0 }] })).toBe(6);
    expect(numColsForConfig({ levels: [{ front: 2, back: 8 }] })).toBe(8);
  });

  it("renvoie 4 pour la configuration par défaut", () => {
    expect(numColsForConfig(defaultRackConfig())).toBe(4);
  });
});

describe("decodeSlot", () => {
  it("décode une bouteille sur l'étagère avant du premier niveau", () => {
    expect(decodeSlot("1A", 0, 0, 1)).toEqual({
      start: { levelIndex: 0, totalLevels: 2, side: "avant", col: 0, colsInRow: 4 },
    });
  });

  it("décode une bouteille sur l'étagère arrière", () => {
    // 2A : chaque niveau = 4 places avant puis 4 arrière. Le slot 4 est le 1er arrière du niveau 0.
    expect(decodeSlot("2A", 1, 0, 1)).toEqual({
      start: { levelIndex: 0, totalLevels: 3, side: "arrière", col: 0, colsInRow: 4 },
    });
  });

  it("décode une rangée sur un niveau inférieur", () => {
    // 5A : 4 niveaux de 6 places, toutes en avant (pas d'arrière).
    expect(decodeSlot("5A", 1, 0, 1)).toEqual({
      start: { levelIndex: 1, totalLevels: 4, side: "avant", col: 0, colsInRow: 6 },
    });
  });

  it("décode un lot s'étalant de l'avant vers l'arrière", () => {
    // 2A, (0,3) sur 2 bouteilles : commence avant n0 col3 et finit arrière n0 col0.
    expect(decodeSlot("2A", 0, 3, 2)).toEqual({
      start: { levelIndex: 0, totalLevels: 3, side: "avant", col: 3, colsInRow: 4 },
      end: { levelIndex: 0, totalLevels: 3, side: "arrière", col: 0, colsInRow: 4 },
    });
  });

  it("décode un lot s'étalant d'un niveau au suivant", () => {
    // 1A, (0,3) sur 2 bouteilles : niveau 0 → niveau 1 (tous deux avant).
    expect(decodeSlot("1A", 0, 3, 2)).toEqual({
      start: { levelIndex: 0, totalLevels: 2, side: "avant", col: 3, colsInRow: 4 },
      end: { levelIndex: 1, totalLevels: 2, side: "avant", col: 0, colsInRow: 4 },
    });
  });

  it("utilise la configuration par défaut pour un casier inconnu", () => {
    expect(decodeSlot("ZZ", 0, 0, 1)).toEqual({
      start: { levelIndex: 0, totalLevels: 2, side: "avant", col: 0, colsInRow: 4 },
    });
  });

  it("renvoie null quand l'emplacement dépasse la configuration", () => {
    expect(decodeSlot("1A", 100, 0, 1)).toBeNull();
  });

  it("laisse la fin indéfinie si elle dépasse la capacité", () => {
    const result = decodeSlot("1A", 1, 0, 10);
    expect(result?.start).toEqual({
      levelIndex: 1,
      totalLevels: 2,
      side: "avant",
      col: 0,
      colsInRow: 4,
    });
    expect(result?.end).toBeUndefined();
  });

  it("a des configurations cohérentes pour tous les casiers déclarés", () => {
    for (const config of Object.values(RACK_CONFIGS)) {
      expect(config.levels.length).toBeGreaterThan(0);
      for (const level of config.levels) {
        expect(level.front).toBeGreaterThanOrEqual(0);
        expect(level.back).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("slotLabel", () => {
  it("numérote les étagères du bas vers le haut", () => {
    expect(slotLabel({ levelIndex: 0, totalLevels: 2, side: "avant", col: 0, colsInRow: 4 })).toBe(
      "Étagère 2 · avant · pos. 1",
    );
    expect(slotLabel({ levelIndex: 1, totalLevels: 2, side: "arrière", col: 2, colsInRow: 4 })).toBe(
      "Étagère 1 · arrière · pos. 3",
    );
  });

  it("fournit un libellé lisible pour un emplacement décodé", () => {
    const decoded = decodeSlot("2A", 0, 0, 1);
    expect(decoded).not.toBeNull();
    expect(slotLabel(decoded!.start)).toBe("Étagère 3 · avant · pos. 1");
  });
});
