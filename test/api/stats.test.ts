import { beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/stats/route";
import { prisma } from "@/lib/db";

import { resetDatabase } from "../reset-db";

describe("GET /api/stats", () => {
  beforeEach(resetDatabase);

  it("agrège bouteilles, valeur, couleurs et régions des millésimes actifs", async () => {
    const w1 = await prisma.wine.create({ data: { name: "A", color: "rouge", region: "Bordeaux" } });
    await prisma.wineVintage.create({ data: { wineId: w1.id, vintage: 2010, quantity: 3, marketPrice: 20 } });
    // Millésime épuisé : doit être ignoré dans les agrégats.
    await prisma.wineVintage.create({ data: { wineId: w1.id, vintage: 2015, quantity: 0, marketPrice: 100 } });

    const w2 = await prisma.wine.create({ data: { name: "B", color: "blanc", region: "Loire" } });
    await prisma.wineVintage.create({ data: { wineId: w2.id, vintage: 2018, quantity: 2, marketPrice: 10 } });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      totalBottles: 5,
      totalWines: 2,
      totalMarketValue: 80,
      byColor: { rouge: 3, blanc: 2 },
      byRegion: { Bordeaux: 3, Loire: 2 },
      oldestVintage: 2010,
      newestVintage: 2018,
    });
  });

  it("renvoie des agrégats vides sur une cave vide", async () => {
    const res = await GET();
    expect(await res.json()).toMatchObject({
      totalBottles: 0,
      totalWines: 0,
      totalMarketValue: 0,
      oldestVintage: null,
      newestVintage: null,
    });
  });
});
