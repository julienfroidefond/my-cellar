import { beforeEach, describe, expect, it } from "vitest";

import { DELETE, GET as GET_ONE, PUT } from "@/app/api/wines/[id]/route";
import { GET as LIST, POST } from "@/app/api/wines/route";
import { prisma } from "@/lib/db";

import { createVintage, createWine, jsonRequest, request } from "../factories";
import { resetDatabase } from "../reset-db";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/wines", () => {
  beforeEach(resetDatabase);

  it("liste les vins triés par nom avec leurs millésimes", async () => {
    const bravo = await createWine({ name: "Bravo" });
    await createVintage(bravo.id, { vintage: 2018 });
    await createWine({ name: "Alpha" });

    const res = await LIST(request("http://test/api/wines"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.map((w: { name: string }) => w.name)).toEqual(["Alpha", "Bravo"]);
    expect(body[1].vintages).toHaveLength(1);
  });

  it("filtre par couleur, région et recherche plein texte", async () => {
    await createWine({ name: "Margaux", color: "rouge", region: "Bordeaux", producer: "Domaine Test" });
    await createWine({ name: "Sancerre", color: "blanc", region: "Loire" });

    const byColor = await (await LIST(request("http://test/api/wines?color=blanc"))).json();
    expect(byColor.map((w: { name: string }) => w.name)).toEqual(["Sancerre"]);

    const byRegion = await (await LIST(request("http://test/api/wines?region=Bordeaux"))).json();
    expect(byRegion.map((w: { name: string }) => w.name)).toEqual(["Margaux"]);

    const bySearch = await (await LIST(request("http://test/api/wines?search=Domaine"))).json();
    expect(bySearch.map((w: { name: string }) => w.name)).toEqual(["Margaux"]);
  });
});

describe("POST /api/wines", () => {
  beforeEach(resetDatabase);

  it("crée un vin et son millésime avec les valeurs par défaut", async () => {
    const res = await POST(
      jsonRequest("http://test/api/wines", "POST", { name: "Nouveau vin" }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("Nouveau vin");
    expect(body.imageUrl).toBeNull();
    expect(body.vintages).toHaveLength(1);
    expect(body.vintages[0]).toMatchObject({ quantity: 1, volume: 75, vintage: null });
  });

  it("normalise une URL d'image locale (sans téléchargement)", async () => {
    const res = await POST(
      jsonRequest("http://test/api/wines", "POST", {
        name: "Avec image",
        imageUrl: "/wines/abc.jpg",
      }),
    );
    const body = await res.json();
    expect(body.imageUrl).toBe("/wine-images/abc.jpg");
  });
});

describe("GET /api/wines/[id]", () => {
  beforeEach(resetDatabase);

  it("renvoie le vin demandé", async () => {
    const wine = await createWine({ name: "Trouvable" });
    const res = await GET_ONE(request("http://test"), params(wine.id));
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("Trouvable");
  });

  it("renvoie 404 pour un identifiant inconnu", async () => {
    const res = await GET_ONE(request("http://test"), params("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/wines/[id]", () => {
  beforeEach(resetDatabase);

  it("met à jour les champs éditables", async () => {
    const wine = await createWine({ name: "Avant" });
    const res = await PUT(
      jsonRequest("http://test/api/wines/x", "PUT", { name: "Après", region: "Loire" }),
      params(wine.id),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: "Après", region: "Loire" });
  });

  it("renvoie 404 si le vin n'existe pas", async () => {
    const res = await PUT(jsonRequest("http://test/api/wines/x", "PUT", { name: "X" }), params("inconnu"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/wines/[id]", () => {
  beforeEach(resetDatabase);

  it("archive les millésimes en stock puis supprime le vin", async () => {
    const wine = await createWine({ name: "À supprimer" });
    await createVintage(wine.id, { vintage: 2015, quantity: 3 });
    await createVintage(wine.id, { vintage: 2016, quantity: 0 });

    const res = await DELETE(request("http://test"), params(wine.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(await prisma.wine.findUnique({ where: { id: wine.id } })).toBeNull();

    const history = await prisma.wineHistory.findMany();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      action: "retiré",
      reason: "suppression",
      wineName: "À supprimer",
      vintage: 2015,
      quantity: 3,
    });
  });

  it("renvoie 404 pour un identifiant inconnu", async () => {
    const res = await DELETE(request("http://test"), params("inconnu"));
    expect(res.status).toBe(404);
  });
});
