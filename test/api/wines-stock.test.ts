import { beforeEach, describe, expect, it } from "vitest";

import { POST as ADD } from "@/app/api/wines/[id]/add/route";
import { POST as DRINK } from "@/app/api/wines/[id]/drink/route";
import { POST as RACK } from "@/app/api/wines/[id]/rack/route";
import { POST as REMOVE } from "@/app/api/wines/[id]/remove/route";
import { POST as UNRACK } from "@/app/api/wines/[id]/unrack/route";
import { prisma } from "@/lib/db";

import { createRack, createVintage, createWine, jsonRequest, request } from "../factories";
import { resetDatabase } from "../reset-db";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("POST /api/wines/[id]/add", () => {
  beforeEach(resetDatabase);

  it("crée un nouveau millésime", async () => {
    const wine = await createWine();
    const res = await ADD(
      jsonRequest("http://test", "POST", { vintage: 2015, quantity: 3, purchasePrice: 12 }),
      params(wine.id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vintages).toHaveLength(1);
    expect(body.vintages[0]).toMatchObject({ vintage: 2015, quantity: 3, purchasePrice: 12 });
  });

  it("incrémente un millésime existant", async () => {
    const wine = await createWine();
    await createVintage(wine.id, { vintage: 2015, quantity: 2 });

    await ADD(jsonRequest("http://test", "POST", { vintage: 2015, quantity: 4 }), params(wine.id));

    const vintages = await prisma.wineVintage.findMany({ where: { wineId: wine.id } });
    expect(vintages).toHaveLength(1);
    expect(vintages[0].quantity).toBe(6);
  });

  it("renvoie 404 pour un vin inconnu", async () => {
    const res = await ADD(jsonRequest("http://test", "POST", { quantity: 1 }), params("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/wines/[id]/drink", () => {
  beforeEach(resetDatabase);

  it("décrémente le stock et journalise la dégustation", async () => {
    const wine = await createWine({ name: "Bon vin" });
    const vintage = await createVintage(wine.id, { quantity: 3 });

    const res = await DRINK(jsonRequest("http://test", "POST", { rating: 4.5 }), params(vintage.id));
    expect(res.status).toBe(200);

    const updated = await prisma.wineVintage.findUnique({ where: { id: vintage.id } });
    expect(updated?.quantity).toBe(2);

    const history = await prisma.wineHistory.findMany();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ action: "bu", wineName: "Bon vin", quantity: 1, rating: 4.5 });
  });

  it("décrémente aussi l'emplacement de casier fourni", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });
    const slot = await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });

    await DRINK(jsonRequest("http://test", "POST", { slotId: slot.id }), params(vintage.id));

    const updatedSlot = await prisma.wineVintageSlot.findUnique({ where: { id: slot.id } });
    expect(updatedSlot?.quantity).toBe(1);
  });

  it("supprime l'emplacement quand il ne reste qu'une bouteille", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 1 });
    const slot = await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 1 },
    });

    await DRINK(jsonRequest("http://test", "POST"), params(vintage.id));

    expect(await prisma.wineVintageSlot.findUnique({ where: { id: slot.id } })).toBeNull();
  });

  it("renvoie 404 pour un millésime inconnu", async () => {
    const res = await DRINK(jsonRequest("http://test", "POST"), params("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/wines/[id]/rack", () => {
  beforeEach(resetDatabase);

  it("place des bouteilles à un emplacement précis", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 6 });

    const res = await RACK(
      jsonRequest("http://test", "POST", { rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 }),
      params(vintage.id),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 });
  });

  it("plafonne au stock encore non rangé", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });

    const res = await RACK(
      jsonRequest("http://test", "POST", { rackId: rack.id, rackRow: 0, rackCol: 1, quantity: 5 }),
      params(vintage.id),
    );

    expect(res.status).toBe(200);
    expect((await res.json()).quantity).toBe(1);
  });

  it("renvoie 409 si l'emplacement est déjà occupé", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 2 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 1 },
    });

    const res = await RACK(
      jsonRequest("http://test", "POST", { rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 1 }),
      params(vintage.id),
    );
    expect(res.status).toBe(409);
  });

  it("renvoie 400 s'il n'y a plus de bouteille à ranger", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 2 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });

    const res = await RACK(
      jsonRequest("http://test", "POST", { rackId: rack.id, rackRow: 0, rackCol: 1, quantity: 1 }),
      params(vintage.id),
    );
    expect(res.status).toBe(400);
  });

  it("renvoie 404 pour un millésime inconnu", async () => {
    const res = await RACK(jsonRequest("http://test", "POST", {}), params("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/wines/[id]/unrack", () => {
  beforeEach(resetDatabase);

  it("décrémente l'emplacement sans toucher au stock", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });
    const slot = await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 3 },
    });

    const res = await UNRACK(request("http://test", "POST"), params(slot.id));
    expect(res.status).toBe(200);
    expect((await prisma.wineVintageSlot.findUnique({ where: { id: slot.id } }))?.quantity).toBe(2);
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(3);
  });

  it("supprime l'emplacement quand il devient vide", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 1 });
    const slot = await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 1 },
    });

    await UNRACK(request("http://test", "POST"), params(slot.id));
    expect(await prisma.wineVintageSlot.findUnique({ where: { id: slot.id } })).toBeNull();
  });

  it("renvoie 404 pour un emplacement inconnu", async () => {
    const res = await UNRACK(request("http://test", "POST"), params("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/wines/[id]/remove", () => {
  beforeEach(resetDatabase);

  it("retire des bouteilles avec la raison par défaut « regul »", async () => {
    const wine = await createWine({ name: "Vin" });
    const vintage = await createVintage(wine.id, { quantity: 5 });

    const res = await REMOVE(jsonRequest("http://test", "POST", { quantity: 2, note: "Inventaire" }), params(vintage.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, removed: 2, remaining: 3 });

    const history = await prisma.wineHistory.findMany();
    expect(history[0]).toMatchObject({ action: "retiré", reason: "regul", quantity: 2, note: "Inventaire" });
  });

  it("décrémente les emplacements en partant du slot fourni", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 5 });
    const slotA = await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });
    const slotB = await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 1, quantity: 3 },
    });

    const res = await REMOVE(
      jsonRequest("http://test", "POST", { quantity: 3, reason: "offert", slotId: slotA.id }),
      params(vintage.id),
    );
    expect(res.status).toBe(200);

    expect(await prisma.wineVintageSlot.findUnique({ where: { id: slotA.id } })).toBeNull();
    expect((await prisma.wineVintageSlot.findUnique({ where: { id: slotB.id } }))?.quantity).toBe(2);
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(2);
  });

  it("rejette une raison invalide", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 1 });

    const res = await REMOVE(
      jsonRequest("http://test", "POST", { quantity: 1, reason: "constructor" }),
      params(vintage.id),
    );
    expect(res.status).toBe(400);
  });

  it("rejette un retrait de zéro bouteille", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 1 });

    const res = await REMOVE(jsonRequest("http://test", "POST", { quantity: 0 }), params(vintage.id));
    expect(res.status).toBe(400);
  });

  it("renvoie 404 pour un millésime inconnu", async () => {
    const res = await REMOVE(jsonRequest("http://test", "POST", { quantity: 1 }), params("inconnu"));
    expect(res.status).toBe(404);
  });
});
