import { beforeEach, describe, expect, it } from "vitest";

import { DELETE as DELETE_RACK, PATCH as PATCH_RACK } from "@/app/api/racks/[id]/route";
import { GET as GET_RACKS, POST as POST_RACK } from "@/app/api/racks/route";
import { prisma } from "@/lib/db";

import { createRack, createVintage, createWine, jsonRequest, rawRequest, request } from "../factories";
import { resetDatabase } from "../reset-db";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/racks", () => {
  beforeEach(resetDatabase);

  it("renvoie les étagères triées avec les emplacements", async () => {
    const rack = await createRack({
      name: "6B",
      levels: {
        create: [
          { position: 1, front: 4, back: 4 },
          { position: 0, front: 4, back: 0 },
        ],
      },
    });

    const body = await (await GET_RACKS()).json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(rack.id);
    expect(body[0].levels.map((level: { position: number }) => level.position)).toEqual([0, 1]);
  });
});

describe("POST /api/racks", () => {
  beforeEach(resetDatabase);

  it("crée un casier et ses étagères", async () => {
    const res = await POST_RACK(jsonRequest("http://test", "POST", {
      name: " 6B ",
      levels: 3,
      cols: 5,
      depth: 2,
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("6B");
    expect(body.rows).toBe(3);
    expect(body.cols).toBe(5);
    expect(body.levels).toHaveLength(3);
    expect(body.levels.every((level: { front: number; back: number }) => level.front === 5 && level.back === 5)).toBe(true);

    expect(await prisma.rackLevel.count({ where: { rackId: body.id } })).toBe(3);
  });

  it("crée un casier irrégulier étagère par étagère", async () => {
    const res = await POST_RACK(jsonRequest("http://test", "POST", {
      name: "1A",
      layout: [
        { front: 4, back: 0 },
        { front: 4, back: 4 },
      ],
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("1A");
    expect(body.rows).toBe(2);
    expect(body.cols).toBe(4);
    expect(body.levels).toHaveLength(2);
    expect(body.levels[0]).toMatchObject({ position: 0, front: 4, back: 0 });
    expect(body.levels[1]).toMatchObject({ position: 1, front: 4, back: 4 });
  });

  it("refuse un JSON invalide", async () => {
    const res = await POST_RACK(rawRequest("http://test", "POST", "{"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "JSON invalide" });
  });

  it("refuse des dimensions invalides", async () => {
    const res = await POST_RACK(jsonRequest("http://test", "POST", { name: "6B", levels: 0, cols: 4, depth: 2 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("hauteur");
  });

  it("refuse une disposition invalide", async () => {
    const res = await POST_RACK(jsonRequest("http://test", "POST", {
      name: "6B",
      layout: [{ front: 0, back: 4 }],
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("largeur avant");
  });
});

describe("PATCH /api/racks/[id]", () => {
  beforeEach(resetDatabase);

  it("renomme et redimensionne un casier", async () => {
    const rack = await createRack({
      name: "6B",
      levels: { create: [{ position: 0, front: 4, back: 4 }, { position: 1, front: 4, back: 4 }] },
    });

    const res = await PATCH_RACK(
      jsonRequest("http://test", "PATCH", { name: "6C", levels: 3, cols: 6, depth: 1 }),
      params(rack.id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("6C");
    expect(body.levels).toHaveLength(3);
    expect(body.levels[0]).toMatchObject({ position: 0, front: 6, back: 0 });

    const stored = await prisma.rack.findUnique({ where: { id: rack.id }, include: { levels: true } });
    expect(stored?.rows).toBe(3);
    expect(stored?.cols).toBe(6);
    expect(stored?.levels).toHaveLength(3);
  });

  it("renomme un casier irrégulier sans écraser sa disposition", async () => {
    const rack = await createRack({
      name: "1A",
      levels: {
        create: [
          { position: 0, front: 4, back: 0 },
          { position: 1, front: 4, back: 4 },
        ],
      },
    });

    const res = await PATCH_RACK(
      jsonRequest("http://test", "PATCH", {
        name: "1B",
        layout: [
          { front: 4, back: 0 },
          { front: 4, back: 4 },
        ],
      }),
      params(rack.id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("1B");
    expect(body.levels[0]).toMatchObject({ position: 0, front: 4, back: 0 });
    expect(body.levels[1]).toMatchObject({ position: 1, front: 4, back: 4 });
    expect(body.rows).toBe(2);
    expect(body.cols).toBe(4);
  });

  it("remappe les bouteilles quand une étagère du haut est retirée", async () => {
    const rack = await createRack({
      name: "1A",
      levels: {
        create: [
          { position: 0, front: 4, back: 0 },
          { position: 1, front: 4, back: 4 },
        ],
      },
    });
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 1, rackCol: 0, quantity: 2 },
    });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 2, rackCol: 0, quantity: 1 },
    });

    const res = await PATCH_RACK(
      jsonRequest("http://test", "PATCH", { name: "1A", layout: [{ front: 4, back: 4 }] }),
      params(rack.id),
    );

    expect(res.status).toBe(200);
    const stored = await prisma.wineVintageSlot.findMany({
      where: { rackId: rack.id },
      orderBy: { rackRow: "asc" },
    });
    expect(stored.map((slot) => [slot.rackRow, slot.rackCol, slot.quantity])).toEqual([
      [0, 0, 2],
      [1, 0, 1],
    ]);
  });

  it("libère les bouteilles de l'étagère supprimée après confirmation", async () => {
    const rack = await createRack({
      name: "1A",
      levels: {
        create: [
          { position: 0, front: 4, back: 0 },
          { position: 1, front: 4, back: 4 },
        ],
      },
    });
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 2 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 1 },
    });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 1, rackCol: 0, quantity: 1 },
    });

    const payload = { name: "1A", layout: [{ front: 4, back: 4 }] };
    const refused = await PATCH_RACK(jsonRequest("http://test", "PATCH", payload), params(rack.id));
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ overflow: 1 });
    expect(await prisma.wineVintageSlot.count({ where: { rackId: rack.id } })).toBe(2);

    const accepted = await PATCH_RACK(
      jsonRequest("http://test", "PATCH", { ...payload, unrackOverflow: true }),
      params(rack.id),
    );
    expect(accepted.status).toBe(200);
    const stored = await prisma.wineVintageSlot.findMany({ where: { rackId: rack.id } });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ rackRow: 0, rackCol: 0, quantity: 1 });
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(2);
  });

  it("renvoie 404 pour un casier inconnu", async () => {
    const res = await PATCH_RACK(
      jsonRequest("http://test", "PATCH", { name: "6C", levels: 2, cols: 4, depth: 2 }),
      params("inconnu"),
    );
    expect(res.status).toBe(404);
  });

  it("refuse un JSON invalide", async () => {
    const rack = await createRack();
    const res = await PATCH_RACK(rawRequest("http://test", "PATCH", "{"), params(rack.id));
    expect(res.status).toBe(400);
  });

  it("refuse une réduction qui orphelinerait des bouteilles, puis les remet à ranger", async () => {
    const rack = await createRack({
      name: "6B",
      levels: { create: [{ position: 0, front: 4, back: 4 }, { position: 1, front: 4, back: 4 }] },
    });
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 3 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 3, rackCol: 3, quantity: 2 },
    });

    const payload = { name: "6B", levels: 2, cols: 4, depth: 1 };
    const refused = await PATCH_RACK(jsonRequest("http://test", "PATCH", payload), params(rack.id));
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ overflow: 2 });

    expect(await prisma.wineVintageSlot.count({ where: { rackId: rack.id } })).toBe(1);

    const accepted = await PATCH_RACK(
      jsonRequest("http://test", "PATCH", { ...payload, unrackOverflow: true }),
      params(rack.id),
    );
    expect(accepted.status).toBe(200);
    expect(await prisma.wineVintageSlot.count({ where: { rackId: rack.id } })).toBe(0);
    // Le stock du millésime n'est pas touché : la bouteille redevient « à ranger ».
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(3);
  });
});

describe("DELETE /api/racks/[id]", () => {
  beforeEach(resetDatabase);

  it("supprime le casier et remet ses bouteilles à ranger", async () => {
    const rack = await createRack();
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 4 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 3 },
    });

    const res = await DELETE_RACK(request("http://test", "DELETE"), params(rack.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, unracked: 3 });

    expect(await prisma.rack.count()).toBe(0);
    expect(await prisma.rackLevel.count()).toBe(0);
    expect(await prisma.wineVintageSlot.count()).toBe(0);
    expect((await prisma.wineVintage.findUnique({ where: { id: vintage.id } }))?.quantity).toBe(4);
  });

  it("renvoie 404 pour un casier inconnu", async () => {
    const res = await DELETE_RACK(request("http://test", "DELETE"), params("inconnu"));
    expect(res.status).toBe(404);
  });
});
