import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/wines/premium/route";
import { prisma } from "@/lib/db";

import { createVintage, createWine } from "../factories";
import { resetDatabase } from "../reset-db";

const request = (query = "") => new NextRequest(`http://test/api/wines/premium${query}`);

describe("GET /api/wines/premium", () => {
  beforeEach(resetDatabase);

  it("ne renvoie que les millésimes en stock et valorisés, du plus cher au moins cher", async () => {
    const wine = await createWine({ name: "Château Test" });
    await createVintage(wine.id, { marketPrice: 40, quantity: 1 });
    await createVintage(wine.id, { marketPrice: 120, quantity: 2 });
    await createVintage(wine.id, { marketPrice: null, quantity: 3 });
    await createVintage(wine.id, { marketPrice: 90, quantity: 0 });

    const body = await (await GET(request())).json();

    expect(body.wines.map((w: { marketPrice: number }) => w.marketPrice)).toEqual([120, 40]);
    expect(body.total).toBe(2);
  });

  it("projette les champs attendus par le carrousel", async () => {
    const wine = await createWine({
      name: "Margaux",
      producer: "Château Margaux",
      color: "rouge",
      appellation: "Margaux",
      imageUrl: "/wine-images/margaux.png",
    });
    await createVintage(wine.id, { vintage: 2015, marketPrice: 250, quantity: 1 });

    const body = await (await GET(request())).json();

    expect(body.wines[0]).toEqual({
      id: wine.id,
      name: "Margaux",
      producer: "Château Margaux",
      vintage: 2015,
      color: "rouge",
      appellation: "Margaux",
      marketPrice: 250,
      imageUrl: "/wine-images/margaux.png",
    });
  });

  it("pagine avec skip et borne take à une page", async () => {
    const wine = await createWine();
    await createVintage(wine.id, { marketPrice: 100, quantity: 1 });
    await createVintage(wine.id, { marketPrice: 50, quantity: 1 });

    const page2 = await (await GET(request("?skip=1&take=99"))).json();
    expect(page2.wines).toHaveLength(1);
    expect(page2.wines[0].marketPrice).toBe(50);
    expect(page2.total).toBe(2);
  });

  it("ignore une pagination aberrante", async () => {
    const wine = await createWine();
    await createVintage(wine.id, { marketPrice: 10, quantity: 1 });

    const body = await (await GET(request("?skip=-5&take=abc"))).json();
    expect(body.wines).toHaveLength(1);
  });

  it("plafonne le total à trois pages", async () => {
    const wine = await createWine();
    for (let index = 0; index < 19; index++) {
      await createVintage(wine.id, { marketPrice: 10 + index, quantity: 1 });
    }

    const body = await (await GET(request())).json();
    expect(body.total).toBe(18);
    expect(await prisma.wineVintage.count()).toBe(19);
  });
});
