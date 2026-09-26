"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

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
          reason: "suppression",
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
