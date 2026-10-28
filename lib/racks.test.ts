import { describe, expect, it } from "vitest";

import { defaultRackConfig, uniformConfig, type RackConfig } from "./rack-configs";
import { planRackSlotMoves, parseRackInput } from "./racks";

const RACK_1A: RackConfig = { levels: [{ front: 4, back: 0 }, { front: 4, back: 4 }] };

describe("parseRackInput", () => {
  it("accepte et normalise l'ancienne forme régulière", () => {
    const result = parseRackInput({ name: "  6B  ", levels: 3, cols: 5, depth: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ name: "6B", levels: 3, cols: 5 });
    expect(result.config.levels).toHaveLength(3);
    expect(result.config.levels[0]).toEqual({ front: 5, back: 5 });
  });

  it("accepte une disposition étagère par étagère", () => {
    const result = parseRackInput({
      name: "1A",
      layout: [{ front: 4, back: 0 }, { front: 4, back: 4 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ name: "1A", levels: 2, cols: 4 });
    expect(result.config).toEqual(RACK_1A);
  });

  it("accepte aussi un tableau dans `levels`", () => {
    const result = parseRackInput({ name: "1A", levels: RACK_1A.levels });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config).toEqual(RACK_1A);
  });

  it("refuse un corps qui n'est pas un objet", () => {
    expect(parseRackInput(null)).toEqual({ ok: false, error: "Corps de requête invalide" });
    expect(parseRackInput("6B")).toEqual({ ok: false, error: "Corps de requête invalide" });
  });

  it("exige un nom", () => {
    expect(parseRackInput({ levels: 2, cols: 4, depth: 2 })).toEqual({
      ok: false,
      error: "Le nom du casier est requis",
    });
    expect(parseRackInput({ name: "   ", levels: 2, cols: 4, depth: 2 })).toEqual({
      ok: false,
      error: "Le nom du casier est requis",
    });
  });

  it("borne le nom", () => {
    const result = parseRackInput({ name: "x".repeat(31), levels: 2, cols: 4, depth: 2 });
    expect(result).toEqual({ ok: false, error: "Le nom ne peut pas dépasser 30 caractères" });
  });

  it("borne la hauteur de l'ancienne forme", () => {
    expect(parseRackInput({ name: "6B", levels: 0, cols: 4, depth: 2 })).toEqual({
      ok: false,
      error: "La hauteur doit être un entier entre 1 et 12",
    });
    expect(parseRackInput({ name: "6B", levels: 13, cols: 4, depth: 2 })).toEqual({
      ok: false,
      error: "La hauteur doit être un entier entre 1 et 12",
    });
    expect(parseRackInput({ name: "6B", levels: 2.5, cols: 4, depth: 2 }).ok).toBe(false);
  });

  it("borne la largeur de l'ancienne forme", () => {
    expect(parseRackInput({ name: "6B", levels: 2, cols: 0, depth: 2 })).toEqual({
      ok: false,
      error: "La largeur doit être un entier entre 1 et 20",
    });
    expect(parseRackInput({ name: "6B", levels: 2, cols: "4", depth: 2 }).ok).toBe(false);
  });

  it("n'accepte que 1 ou 2 rangées de profondeur", () => {
    expect(parseRackInput({ name: "6B", levels: 2, cols: 4, depth: 3 })).toEqual({
      ok: false,
      error: "La profondeur doit valoir 1 ou 2 rangées",
    });
    expect(parseRackInput({ name: "6B", levels: 2, cols: 4 }).ok).toBe(false);
  });

  it("borne chaque étagère de la disposition", () => {
    expect(parseRackInput({ name: "1A", layout: [] })).toEqual({
      ok: false,
      error: "La hauteur doit être un entier entre 1 et 12",
    });
    expect(
      parseRackInput({ name: "1A", layout: Array.from({ length: 13 }, () => ({ front: 4, back: 4 })) }),
    ).toEqual({ ok: false, error: "La hauteur doit être un entier entre 1 et 12" });
    expect(parseRackInput({ name: "1A", layout: [{ front: 0, back: 0 }] })).toEqual({
      ok: false,
      error: "La largeur avant de l'étagère 1 doit être un entier entre 1 et 20",
    });
    expect(parseRackInput({ name: "1A", layout: [{ front: 4, back: -1 }] })).toEqual({
      ok: false,
      error: "La profondeur arrière de l'étagère 1 doit être un entier entre 0 et 20",
    });
    expect(parseRackInput({ name: "1A", layout: [{ front: 4.5, back: 4 }] }).ok).toBe(false);
    expect(parseRackInput({ name: "1A", layout: "4x4" })).toEqual({
      ok: false,
      error: "La disposition des étagères est invalide",
    });
  });
});

describe("planRackSlotMoves", () => {
  it("ne déplace rien quand la disposition ne change pas", () => {
    const slots = [
      { id: "top", rackRow: 0, rackCol: 3, quantity: 1 },
      { id: "bottom-back", rackRow: 2, rackCol: 3, quantity: 1 },
    ];
    expect(planRackSlotMoves(RACK_1A, RACK_1A, slots)).toEqual({ overflow: [], moves: [] });
  });

  it("remonte les bouteilles quand une étagère est retirée en haut", () => {
    const slots = [
      { id: "top", rackRow: 0, rackCol: 0, quantity: 1 },
      { id: "bottom-front", rackRow: 1, rackCol: 0, quantity: 1 },
      { id: "bottom-back", rackRow: 2, rackCol: 0, quantity: 1 },
    ];
    const plan = planRackSlotMoves(RACK_1A, { levels: [{ front: 4, back: 4 }] }, slots);

    expect(plan.overflow.map((slot) => slot.id)).toEqual(["top"]);
    expect(plan.moves).toEqual([
      { id: "bottom-front", rackRow: 0, rackCol: 0 },
      { id: "bottom-back", rackRow: 1, rackCol: 0 },
    ]);
  });

  it("décale les bouteilles des étagères basses quand on ajoute une étagère en haut", () => {
    const slots = [
      { id: "old-top-front", rackRow: 0, rackCol: 0, quantity: 1 },
      { id: "old-bottom-front", rackRow: 1, rackCol: 0, quantity: 1 },
    ];
    const newConfig: RackConfig = {
      levels: [{ front: 4, back: 4 }, { front: 4, back: 0 }, { front: 4, back: 4 }],
    };

    expect(planRackSlotMoves(RACK_1A, newConfig, slots).moves).toEqual([
      { id: "old-top-front", rackRow: 2, rackCol: 0 },
      { id: "old-bottom-front", rackRow: 3, rackCol: 0 },
    ]);
  });

  it("décale les bouteilles des niveaux suivants quand une rangée arrière est ajoutée", () => {
    const slots = [
      { id: "top-front", rackRow: 0, rackCol: 0, quantity: 1 },
      { id: "bottom-front", rackRow: 1, rackCol: 0, quantity: 1 },
      { id: "bottom-back", rackRow: 2, rackCol: 0, quantity: 1 },
    ];
    const newConfig: RackConfig = {
      levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }],
    };

    expect(planRackSlotMoves(RACK_1A, newConfig, slots)).toEqual({
      overflow: [],
      moves: [
        { id: "bottom-front", rackRow: 2, rackCol: 0 },
        { id: "bottom-back", rackRow: 3, rackCol: 0 },
      ],
    });
  });

  it("signale les bouteilles qui ne tiennent plus dans une étagère rétrécie", () => {
    const config = uniformConfig(2, 4, 2);
    const narrower: RackConfig = {
      levels: [{ front: 3, back: 4 }, { front: 4, back: 4 }],
    };
    const slots = [
      { id: "edge", rackRow: 0, rackCol: 3, quantity: 2 },
      { id: "inside", rackRow: 0, rackCol: 0, quantity: 1 },
    ];

    expect(planRackSlotMoves(config, narrower, slots)).toEqual({
      overflow: [slots[0]],
      moves: [],
    });
  });

  it("signale les coordonnées corrompues et les configurations vides", () => {
    expect(
      planRackSlotMoves(RACK_1A, RACK_1A, [
        { id: "negative", rackRow: -1, rackCol: 0, quantity: 1 },
        { id: "too-wide", rackRow: 0, rackCol: 4, quantity: 1 },
      ]).overflow.map((slot) => slot.id),
    ).toEqual(["negative", "too-wide"]);

    const slots = [{ id: "orphan", rackRow: 0, rackCol: 0, quantity: 1 }];
    expect(planRackSlotMoves({ levels: [] }, RACK_1A, slots).overflow).toEqual(slots);
    expect(planRackSlotMoves(RACK_1A, { levels: [] }, slots).overflow).toEqual(slots);
  });

  it("ne fait rien sans bouteille", () => {
    expect(planRackSlotMoves(defaultRackConfig(), defaultRackConfig(), [])).toEqual({
      overflow: [],
      moves: [],
    });
  });
});
