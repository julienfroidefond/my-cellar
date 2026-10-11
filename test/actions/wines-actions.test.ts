import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

import { deleteWineAction } from "@/app/wines/[id]/actions";
import { createWineAction, updateWineAction } from "@/app/wines/actions";
import { prisma } from "@/lib/db";

import { createVintage, createWine, formData } from "../factories";
import { setSessionCookie } from "../mocks/cookies";
import { expectRedirect, expectRedirectTo } from "../redirect";
import { resetDatabase } from "../reset-db";

const redirectMock = vi.mocked(redirect);

describe("createWineAction", () => {
  beforeEach(resetDatabase);

  it("refuse un appel sans session", async () => {
    await expect(createWineAction(formData({ name: "Intrus" }))).rejects.toThrow("Unauthorized");
    expect(await prisma.wine.count()).toBe(0);
  });

  it("crée le vin et son millésime puis redirige", async () => {
    setSessionCookie();

    await expectRedirect(() =>
      createWineAction(
        formData({ name: "Nouveau", producer: "Domaine", vintage: "2016", quantity: "3", color: "rouge" }),
      ),
    );

    const wines = await prisma.wine.findMany({ include: { vintages: true } });
    expect(wines).toHaveLength(1);
    expect(wines[0]).toMatchObject({ name: "Nouveau", producer: "Domaine", color: "rouge" });
    expect(wines[0].vintages[0]).toMatchObject({ vintage: 2016, quantity: 3, volume: 75 });
    expect(redirectMock).toHaveBeenCalledWith(`/wines/${wines[0].id}`);
  });

  it("exige un nom", async () => {
    setSessionCookie();
    await expect(createWineAction(formData({ name: "   " }))).rejects.toThrow("Name is required");
  });
});

describe("updateWineAction", () => {
  beforeEach(resetDatabase);

  it("refuse un appel sans session", async () => {
    const wine = await createWine();
    await expect(updateWineAction(wine.id, formData({ name: "X" }))).rejects.toThrow("Unauthorized");
  });

  it("met à jour le vin et les fenêtres de garde par millésime", async () => {
    setSessionCookie();
    const wine = await createWine({ name: "Avant" });
    const vintage = await createVintage(wine.id, { vintage: 2015 });

    await expectRedirectTo(
      () =>
        updateWineAction(
          wine.id,
          formData({
            name: "Après",
            region: "Loire",
            [`drinkFrom:${vintage.id}`]: "2024",
            [`drinkUntil:${vintage.id}`]: "2040",
          }),
        ),
      `/wines/${wine.id}`,
    );

    const updated = await prisma.wine.findUnique({ where: { id: wine.id } });
    expect(updated).toMatchObject({ name: "Après", region: "Loire" });

    const updatedVintage = await prisma.wineVintage.findUnique({ where: { id: vintage.id } });
    expect(updatedVintage).toMatchObject({ drinkFrom: 2024, drinkUntil: 2040 });
  });

  it("n'applique pas une fenêtre de garde à un millésime d'un autre vin", async () => {
    setSessionCookie();
    const wine = await createWine({ name: "Cible" });
    const otherWine = await createWine({ name: "Autre" });
    const otherVintage = await createVintage(otherWine.id, { vintage: 2015 });

    await expectRedirect(() =>
      updateWineAction(wine.id, formData({ name: "Cible", [`drinkFrom:${otherVintage.id}`]: "2000" })),
    );

    expect((await prisma.wineVintage.findUnique({ where: { id: otherVintage.id } }))?.drinkFrom).toBeNull();
  });
});

describe("deleteWineAction", () => {
  beforeEach(resetDatabase);

  it("refuse un appel sans session", async () => {
    const wine = await createWine();
    await expect(deleteWineAction(wine.id)).rejects.toThrow("Unauthorized");
  });

  it("archive le stock puis supprime le vin", async () => {
    setSessionCookie();
    const wine = await createWine({ name: "À supprimer" });
    await createVintage(wine.id, { vintage: 2015, quantity: 3 });

    await expectRedirectTo(() => deleteWineAction(wine.id), "/wines");

    expect(await prisma.wine.findUnique({ where: { id: wine.id } })).toBeNull();
    expect(await prisma.wineHistory.findMany()).toHaveLength(1);
  });

  it("échoue si le vin n'existe pas", async () => {
    setSessionCookie();
    await expect(deleteWineAction("inconnu")).rejects.toThrow("Wine not found");
  });
});
