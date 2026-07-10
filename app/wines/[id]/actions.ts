"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

function revalidateWineSurfaces(wineId: string) {
  revalidatePath("/");
  revalidatePath("/cave");
  revalidatePath("/history");
  revalidatePath("/wines");
  revalidatePath(`/wines/${wineId}`);
}

export async function removeStockAction(vintageId: string) {
  await requireSession();

  const vintage = await prisma.wineVintage.findUnique({
    where: { id: vintageId },
    include: { wine: true },
  });

  if (!vintage) {
    throw new Error("Vintage not found");
  }

  const newQuantity = Math.max(0, vintage.quantity - 1);

  await prisma.$transaction([
    prisma.wineVintage.update({ where: { id: vintageId }, data: { quantity: newQuantity } }),
    prisma.wineHistory.create({
      data: {
        action: "retiré",
        wineName: vintage.wine.name,
        producer: vintage.wine.producer,
        vintage: vintage.vintage,
        color: vintage.wine.color,
        appellation: vintage.wine.appellation,
        region: vintage.wine.region,
        quantity: 1,
        imageUrl: vintage.wine.imageUrl,
      },
    }),
  ]);

  revalidateWineSurfaces(vintage.wineId);
}

export async function deleteWineAction(wineId: string) {
  await requireSession();

  const wine = await prisma.wine.findUnique({
    where: { id: wineId },
    include: { vintages: true },
  });

  if (!wine) {
    throw new Error("Wine not found");
  }

  const historyRecords = wine.vintages
    .filter((v) => v.quantity > 0)
    .map((v) =>
      prisma.wineHistory.create({
        data: {
          action: "retiré",
          wineName: wine.name,
          producer: wine.producer,
          vintage: v.vintage,
          color: wine.color,
          appellation: wine.appellation,
          region: wine.region,
          country: wine.country,
          volume: v.volume,
          quantity: v.quantity,
          imageUrl: wine.imageUrl,
        },
      })
    );

  await prisma.$transaction([...historyRecords, prisma.wine.delete({ where: { id: wineId } })]);

  revalidatePath("/");
  revalidatePath("/cave");
  revalidatePath("/history");
  revalidatePath("/wines");
  redirect("/wines");
}
