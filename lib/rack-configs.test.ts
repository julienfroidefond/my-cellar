import { describe, expect, it } from "vitest";

import {
  capacityForConfig,
  configFromLevels,
  decodeSlot,
  defaultRackConfig,
  depthForConfig,
  encodeSlot,
  heightForConfig,
  isUniformConfig,
  numColsForConfig,
  slotLabel,
  uniformConfig,
  type RackConfig,
} from "./rack-configs";

const RACK_1A: RackConfig = { levels: [{ front: 4, back: 0 }, { front: 4, back: 4 }] };
const RACK_2A: RackConfig = {
  levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }, { front: 4, back: 4 }],
};
const RACK_5A: RackConfig = {
  levels: [{ front: 6, back: 0 }, { front: 6, back: 0 }, { front: 6, back: 0 }, { front: 6, back: 0 }],
};

describe("mesures d'un casier", () => {
  it("prend la plus grande largeur (avant/arrière) parmi les étagères", () => {
    expect(numColsForConfig(RACK_1A)).toBe(4);
    expect(numColsForConfig(RACK_5A)).toBe(6);
    expect(numColsForConfig({ levels: [{ front: 2, back: 8 }] })).toBe(8);
    expect(numColsForConfig({ levels: [] })).toBe(0);
  });

  it("compte les emplacements de toutes les étagères", () => {
    expect(capacityForConfig(RACK_1A)).toBe(12);
    expect(capacityForConfig(RACK_2A)).toBe(24);
    expect(capacityForConfig(defaultRackConfig())).toBe(16);
  });

  it("déduit la hauteur et la profondeur", () => {
    expect(heightForConfig(RACK_5A)).toBe(4);
    expect(depthForConfig(RACK_2A)).toBe(2);
    expect(depthForConfig(RACK_5A)).toBe(1);
    expect(depthForConfig({ levels: [] })).toBe(1);
  });

  it("construit une configuration régulière bornée", () => {
    expect(uniformConfig(2, 4, 2)).toEqual({
      levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }],
    });
    expect(uniformConfig(0, 0, 1).levels).toEqual([{ front: 1, back: 0 }]);
    expect(uniformConfig(99, 99, 2).levels).toHaveLength(12);
    expect(numColsForConfig(uniformConfig(1, 99, 2))).toBe(20);
  });

  it("trie les étagères lues en base par position", () => {
    expect(configFromLevels([
      { position: 1, front: 6, back: 0 },
      { position: 0, front: 4, back: 4 },
    ])).toEqual({ levels: [{ front: 4, back: 4 }, { front: 6, back: 0 }] });
  });

  it("reconnaît les dispositions régulières et irrégulières", () => {
    expect(isUniformConfig(RACK_2A)).toBe(true);
    expect(isUniformConfig(RACK_5A)).toBe(true);
    expect(isUniformConfig(RACK_1A)).toBe(false);
    expect(isUniformConfig({ levels: [{ front: 2, back: 0 }, { front: 4, back: 0 }] })).toBe(false);
    expect(isUniformConfig({ levels: [] })).toBe(true);
  });
});

describe("encodeSlot", () => {
  it("retrouve l'index d'un emplacement avant", () => {
    expect(encodeSlot(RACK_1A, 0, "avant", 3)).toBe(3);
    expect(encodeSlot(RACK_1A, 1, "avant", 0)).toBe(4);
  });

  it("retrouve l'index d'un emplacement arrière", () => {
    expect(encodeSlot(RACK_1A, 1, "arrière", 2)).toBe(10);
    expect(encodeSlot(RACK_2A, 0, "arrière", 0)).toBe(4);
  });
});

describe("decodeSlot", () => {
  it("décode une bouteille sur l'étagère avant du premier niveau", () => {
    expect(decodeSlot(RACK_1A, 0, 0, 1)).toEqual({
      start: { levelIndex: 0, totalLevels: 2, side: "avant", col: 0, colsInRow: 4 },
    });
  });

  it("décode une bouteille sur l'étagère arrière", () => {
    // 2A : chaque niveau = 4 places avant puis 4 arrière. Le slot 4 est le 1er arrière du niveau 0.
    expect(decodeSlot(RACK_2A, 1, 0, 1)).toEqual({
      start: { levelIndex: 0, totalLevels: 3, side: "arrière", col: 0, colsInRow: 4 },
    });
  });

  it("décode une rangée sur un niveau inférieur", () => {
    // 5A : 4 niveaux de 6 places, toutes en avant (pas d'arrière).
    expect(decodeSlot(RACK_5A, 1, 0, 1)).toEqual({
      start: { levelIndex: 1, totalLevels: 4, side: "avant", col: 0, colsInRow: 6 },
    });
  });

  it("décode un lot s'étalant de l'avant vers l'arrière", () => {
    // 2A, (0,3) sur 2 bouteilles : commence avant n0 col3 et finit arrière n0 col0.
    expect(decodeSlot(RACK_2A, 0, 3, 2)).toEqual({
      start: { levelIndex: 0, totalLevels: 3, side: "avant", col: 3, colsInRow: 4 },
      end: { levelIndex: 0, totalLevels: 3, side: "arrière", col: 0, colsInRow: 4 },
    });
  });

  it("décode un lot s'étalant d'un niveau au suivant", () => {
    // 1A, (0,3) sur 2 bouteilles : niveau 0 → niveau 1 (tous deux avant).
    expect(decodeSlot(RACK_1A, 0, 3, 2)).toEqual({
      start: { levelIndex: 0, totalLevels: 2, side: "avant", col: 3, colsInRow: 4 },
      end: { levelIndex: 1, totalLevels: 2, side: "avant", col: 0, colsInRow: 4 },
    });
  });

  it("renvoie null quand l'emplacement dépasse la configuration", () => {
    expect(decodeSlot(RACK_1A, 100, 0, 1)).toBeNull();
  });

  it("renvoie null pour une configuration vide", () => {
    expect(decodeSlot({ levels: [] }, 0, 0, 1)).toBeNull();
  });

  it("laisse la fin indéfinie si elle dépasse la capacité", () => {
    const result = decodeSlot(RACK_1A, 1, 0, 10);
    expect(result?.start).toEqual({
      levelIndex: 1,
      totalLevels: 2,
      side: "avant",
      col: 0,
      colsInRow: 4,
    });
    expect(result?.end).toBeUndefined();
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
    const decoded = decodeSlot(RACK_2A, 0, 0, 1);
    expect(decoded).not.toBeNull();
    expect(slotLabel(decoded!.start)).toBe("Étagère 3 · avant · pos. 1");
  });
});
