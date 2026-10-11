import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

import { createRack, createVintage, createWine } from "../test/factories";
import { resetDatabase } from "../test/reset-db";
import { removeBottlesFromStock } from "./removals";

describe("removeBottlesFromStock", () => {
  beforeEach(resetDatabase);

  it("rejette une raison invalide sans toucher au stock", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });

    const result = await removeBottlesFromStock({ vintageId: vintage.id, quantity: 1, reason: "constructor" });

    expect(result).toEqual({ ok: false, status: 400, error: "Raison invalide" });
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(3);
  });

  it("renvoie 404 pour un millésime inconnu", async () => {
    const result = await removeBottlesFromStock({ vintageId: "inconnu", quantity: 1, reason: "regul" });
    expect(result).toEqual({ ok: false, status: 404, error: "Millésime introuvable" });
  });

  it.each([0, -2, Number.NaN])("rejette une quantité de %s bouteille(s)", async (quantity) => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });

    const result = await removeBottlesFromStock({ vintageId: vintage.id, quantity, reason: "regul" });

    expect(result).toEqual({ ok: false, status: 400, error: "Aucune bouteille à retirer" });
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(3);
  });

  it("plafonne le retrait au stock disponible", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });

    const result = await removeBottlesFromStock({ vintageId: vintage.id, quantity: 10, reason: "offert" });

    expect(result).toEqual({ ok: true, removed: 3, remaining: 0 });
  });

  it("arrondit la quantité à l'entier inférieur", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 5 });

    const result = await removeBottlesFromStock({ vintageId: vintage.id, quantity: 2.9, reason: "regul" });

    expect(result).toEqual({ ok: true, removed: 2, remaining: 3 });
  });

  it("journalise une entrée d'historique avec raison, note et instantané du vin", async () => {
    const wine = await createWine({ name: "Château Test", producer: "Domaine", region: "Bordeaux" });
    const vintage = await createVintage(wine.id, { vintage: 2016, quantity: 4, volume: 75 });

    await removeBottlesFromStock({
      vintageId: vintage.id,
      quantity: 2,
      reason: "offert",
      note: "  Cadeau  ",
    });

    const history = await prisma.wineHistory.findFirst();
    expect(history).toMatchObject({
      action: "retiré",
      reason: "offert",
      note: "Cadeau",
      wineName: "Château Test",
      producer: "Domaine",
      region: "Bordeaux",
      vintage: 2016,
      volume: 75,
      quantity: 2,
    });
  });

  it("nettoie la note : type inattendu ou blanc deviennent null", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 2 });

    await removeBottlesFromStock({ vintageId: vintage.id, quantity: 1, reason: "regul", note: 42 });
    expect((await prisma.wineHistory.findFirst())?.note).toBeNull();

    await removeBottlesFromStock({ vintageId: vintage.id, quantity: 1, reason: "regul", note: "   " });
    const notes = await prisma.wineHistory.findMany({ orderBy: { createdAt: "desc" } });
    expect(notes[0].note).toBeNull();
  });

  it("tronque la note à 500 caractères", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 1 });

    await removeBottlesFromStock({ vintageId: vintage.id, quantity: 1, reason: "regul", note: "x".repeat(600) });

    expect((await prisma.wineHistory.findFirst())?.note).toHaveLength(500);
  });

  it("vide l'emplacement préféré avant les autres", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 5 });
    // Le slot préféré a un id qui le placerait en dernier dans l'ordre de tri.
    await prisma.wineVintageSlot.create({
      data: { id: "slot-a", vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 3 },
    });
    await prisma.wineVintageSlot.create({
      data: { id: "slot-z", vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 1, quantity: 2 },
    });

    const result = await removeBottlesFromStock({
      vintageId: vintage.id,
      quantity: 2,
      reason: "regul",
      slotId: "slot-z",
    });

    expect(result).toEqual({ ok: true, removed: 2, remaining: 3 });
    expect(await prisma.wineVintageSlot.findUnique({ where: { id: "slot-z" } })).toBeNull();
    expect((await prisma.wineVintageSlot.findUnique({ where: { id: "slot-a" } }))?.quantity).toBe(3);
  });

  it("retire ensuite des emplacements par ordre d'id croissant", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 5 });
    await prisma.wineVintageSlot.create({
      data: { id: "slot-a", vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });
    await prisma.wineVintageSlot.create({
      data: { id: "slot-b", vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 1, quantity: 2 },
    });

    const result = await removeBottlesFromStock({ vintageId: vintage.id, quantity: 3, reason: "regul" });

    expect(result).toEqual({ ok: true, removed: 3, remaining: 2 });
    expect(await prisma.wineVintageSlot.findUnique({ where: { id: "slot-a" } })).toBeNull();
    expect((await prisma.wineVintageSlot.findUnique({ where: { id: "slot-b" } }))?.quantity).toBe(1);
  });

  it("ignore un emplacement préféré qui appartient à un autre millésime", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });
    const otherWine = await createWine({ name: "Autre" });
    const otherVintage = await createVintage(otherWine.id, { quantity: 2 });
    await prisma.wineVintageSlot.create({
      data: { id: "slot-autre", vintageId: otherVintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });

    const result = await removeBottlesFromStock({
      vintageId: vintage.id,
      quantity: 1,
      reason: "regul",
      slotId: "slot-autre",
    });

    expect(result).toEqual({ ok: true, removed: 1, remaining: 2 });
    expect((await prisma.wineVintageSlot.findUnique({ where: { id: "slot-autre" } }))?.quantity).toBe(2);
  });
});
