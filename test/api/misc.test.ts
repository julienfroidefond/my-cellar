import { beforeEach, describe, expect, it } from "vitest";

import { GET as EXPORT } from "@/app/api/export/route";
import { PATCH as RATE } from "@/app/api/history/[id]/route";
import { GET as HISTORY } from "@/app/api/history/route";
import { POST as IMPORT } from "@/app/api/import/route";
import { GET as RACKS } from "@/app/api/racks/route";
import { DELETE as TOKEN_DELETE, GET as TOKEN_GET, POST as TOKEN_POST } from "@/app/api/settings/api-token/route";
import { DELETE as VINTAGE_DELETE, PUT as VINTAGE_PUT } from "@/app/api/vintages/[vintageId]/route";
import { hashApiToken } from "@/lib/api-token";
import { prisma } from "@/lib/db";

import { createRack, createVintage, createWine, jsonRequest, rawRequest, request } from "../factories";
import { resetDatabase } from "../reset-db";

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const vintageParams = (vintageId: string) => ({ params: Promise.resolve({ vintageId }) });

describe("GET /api/racks", () => {
  beforeEach(resetDatabase);

  it("renvoie les casiers avec leurs emplacements triés", async () => {
    const rack = await createRack({ name: "1A" });
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { quantity: 2 });
    await prisma.wineVintageSlot.create({ data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 1, quantity: 1 } });
    await prisma.wineVintageSlot.create({ data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 1 } });

    const body = await (await RACKS()).json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("1A");
    expect(body[0].slots.map((s: { rackCol: number }) => s.rackCol)).toEqual([0, 1]);
  });
});

describe("GET /api/history", () => {
  beforeEach(resetDatabase);

  it("ne renvoie que les dégustations, les plus récentes d'abord", async () => {
    await prisma.wineHistory.create({
      data: { action: "bu", wineName: "Vieux", consumedAt: new Date("2020-01-01") },
    });
    await prisma.wineHistory.create({
      data: { action: "bu", wineName: "Récent", consumedAt: new Date("2024-01-01") },
    });
    await prisma.wineHistory.create({ data: { action: "retiré", wineName: "Offert", reason: "offert" } });

    const body = await (await HISTORY()).json();
    expect(body.map((h: { wineName: string }) => h.wineName)).toEqual(["Récent", "Vieux"]);
  });
});

describe("PATCH /api/history/[id]", () => {
  beforeEach(resetDatabase);

  it("note une bouteille rétroactivement", async () => {
    const entry = await prisma.wineHistory.create({ data: { action: "bu", wineName: "Vin" } });
    const res = await RATE(jsonRequest("http://test", "PATCH", { rating: 3.5 }), params(entry.id));
    expect(res.status).toBe(200);
    expect((await prisma.wineHistory.findUnique({ where: { id: entry.id } }))?.rating).toBe(3.5);
  });

  it("efface la note quand elle est absente", async () => {
    const entry = await prisma.wineHistory.create({ data: { action: "bu", wineName: "Vin", rating: 4 } });
    await RATE(jsonRequest("http://test", "PATCH", {}), params(entry.id));
    expect((await prisma.wineHistory.findUnique({ where: { id: entry.id } }))?.rating).toBeNull();
  });
});

describe("PUT /api/vintages/[vintageId]", () => {
  beforeEach(resetDatabase);

  it("ne met à jour que les champs autorisés", async () => {
    const wine = await createWine();
    const vintage = await createVintage(wine.id, { vintage: 2015, quantity: 3 });

    const res = await VINTAGE_PUT(
      jsonRequest("http://test", "PUT", { quantity: 10, wineId: "pirate", champInterdit: true }),
      vintageParams(vintage.id),
    );

    expect(res.status).toBe(200);
    const updated = await prisma.wineVintage.findUnique({ where: { id: vintage.id } });
    expect(updated?.quantity).toBe(10);
    expect(updated?.wineId).toBe(wine.id);
  });

  it("renvoie 404 pour un millésime inconnu", async () => {
    const res = await VINTAGE_PUT(jsonRequest("http://test", "PUT", {}), vintageParams("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/vintages/[vintageId]", () => {
  beforeEach(resetDatabase);

  it("archive le millésime en suppression puis le supprime", async () => {
    const wine = await createWine({ name: "Vin" });
    const vintage = await createVintage(wine.id, { vintage: 2015, quantity: 4 });

    const res = await VINTAGE_DELETE(request("http://test", "DELETE"), vintageParams(vintage.id));
    expect(res.status).toBe(200);
    expect(await prisma.wineVintage.findUnique({ where: { id: vintage.id } })).toBeNull();

    const history = await prisma.wineHistory.findMany();
    expect(history[0]).toMatchObject({ action: "retiré", reason: "suppression", vintage: 2015, quantity: 4 });
  });

  it("renvoie 404 pour un millésime inconnu", async () => {
    const res = await VINTAGE_DELETE(request("http://test", "DELETE"), vintageParams("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("/api/settings/api-token", () => {
  beforeEach(resetDatabase);

  it("indique l'absence de jeton au départ", async () => {
    expect(await (await TOKEN_GET()).json()).toEqual({ exists: false, createdAt: null, lastUsedAt: null });
  });

  it("génère un jeton, n'en stocke que le hash et invalide l'ancien", async () => {
    const first = await (await TOKEN_POST()).json();
    expect(first.token).toMatch(/^[0-9a-f]{64}$/);
    expect(await prisma.apiToken.count()).toBe(1);
    expect((await prisma.apiToken.findFirst())?.tokenHash).toBe(hashApiToken(first.token));

    const second = await (await TOKEN_POST()).json();
    expect(await prisma.apiToken.count()).toBe(1);
    expect((await prisma.apiToken.findFirst())?.tokenHash).not.toBe(hashApiToken(first.token));
    expect((await prisma.apiToken.findFirst())?.tokenHash).toBe(hashApiToken(second.token));

    const status = await (await TOKEN_GET()).json();
    expect(status.exists).toBe(true);
  });

  it("supprime le jeton", async () => {
    await TOKEN_POST();
    await TOKEN_DELETE();
    expect(await prisma.apiToken.count()).toBe(0);
  });
});

describe("export / import", () => {
  beforeEach(resetDatabase);

  it("accepte un export invalide", async () => {
    const malformed = await IMPORT(rawRequest("http://test", "POST", "{pas du json"));
    expect(malformed.status).toBe(400);

    const missing = await IMPORT(jsonRequest("http://test", "POST", { foo: 1 }));
    expect(missing.status).toBe(400);
  });

  it("fait un aller-retour export → import", async () => {
    const rack = await createRack({ name: "1A" });
    const wine = await createWine({ name: "Exportable", producer: "Domaine" });
    const vintage = await createVintage(wine.id, { vintage: 2015, quantity: 2 });
    await prisma.wineVintageSlot.create({
      data: { vintageId: vintage.id, rackId: rack.id, rackRow: 0, rackCol: 0, quantity: 2 },
    });
    await prisma.wineHistory.create({ data: { action: "bu", wineName: "Exportable", quantity: 1 } });

    const exportRes = await EXPORT();
    expect(exportRes.headers.get("content-type")).toBe("application/json");
    const dump = await exportRes.json();
    expect(dump).toMatchObject({ version: 1 });
    expect(dump.wines).toHaveLength(1);

    await resetDatabase();
    expect(await prisma.wine.count()).toBe(0);

    const importRes = await IMPORT(
      jsonRequest("http://test", "POST", { ...dump, images: {} }),
    );
    expect(importRes.status).toBe(200);
    expect(await importRes.json()).toMatchObject({
      ok: true,
      imported: { wines: 1, vintages: 1, slots: 1, racks: 1, history: 1 },
    });

    expect(await prisma.wine.count()).toBe(1);
    expect(await prisma.wineVintageSlot.count()).toBe(1);
  });

  it("ignore les emplacements en double à l'import", async () => {
    const res = await IMPORT(
      jsonRequest("http://test", "POST", {
        version: 1,
        racks: [{ id: "r1", name: "1A" }],
        wines: [{ id: "w1", name: "Vin", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        wineVintages: [
          { id: "v1", wineId: "w1", quantity: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
        wineVintageSlots: [
          { id: "s1", vintageId: "v1", rackId: "r1", rackRow: 0, rackCol: 0, quantity: 2, createdAt: new Date().toISOString() },
          { id: "s2", vintageId: "v1", rackId: "r1", rackRow: 0, rackCol: 0, quantity: 1, createdAt: new Date().toISOString() },
        ],
        wineHistory: [],
      }),
    );
    expect(res.status).toBe(200);
    expect(await prisma.wineVintageSlot.count()).toBe(1);
  });
});
