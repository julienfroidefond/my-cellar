"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { downloadExternalImage } from "@/lib/images";
import { requireSession } from "@/lib/auth";
import { normalizeWineImageUrl } from "@/lib/wine-images";
import { parseCreateWineForm, parseUpdateWineForm } from "@/lib/wine-form";

function revalidateWinePages(wineId?: string) {
  revalidatePath("/");
  revalidatePath("/wines");
  revalidatePath("/history");
  revalidatePath("/cave");
  if (wineId) {
    revalidatePath(`/wines/${wineId}`);
    revalidatePath(`/wines/${wineId}/edit`);
  }
}

export async function createWineAction(formData: FormData) {
  await requireSession();

  const payload = parseCreateWineForm(formData);
  if (!payload.name) {
    throw new Error("Name is required");
  }

  const wine = await prisma.wine.create({
    data: {
      name: payload.name,
      producer: payload.producer,
      color: payload.color,
      region: payload.region,
      appellation: payload.appellation,
      grapeVarieties: payload.grapeVarieties,
      country: payload.country,
      description: payload.description,
      notes: payload.notes,
      foodPairing: payload.foodPairing,
      imageUrl: null,
      vintages: {
        create: {
          vintage: payload.vintage,
          quantity: payload.quantity,
          volume: payload.volume,
          purchasePrice: payload.purchasePrice,
          marketPrice: payload.marketPrice,
          drinkFrom: payload.drinkFrom,
          drinkUntil: payload.drinkUntil,
        },
      },
    },
  });

  if (payload.imageUrl) {
    const localUrl = await downloadExternalImage(payload.imageUrl, wine.id);
    const normalizedImageUrl = normalizeWineImageUrl(localUrl === payload.imageUrl ? payload.imageUrl : localUrl);
    await prisma.wine.update({
      where: { id: wine.id },
      data: { imageUrl: normalizedImageUrl },
    });
  }

  revalidateWinePages(wine.id);
  redirect(`/wines/${wine.id}`);
}

export async function updateWineAction(wineId: string, formData: FormData) {
  await requireSession();

  const payload = parseUpdateWineForm(formData);
  if (!payload.name) {
    throw new Error("Name is required");
  }

  const resolvedImageUrl = payload.imageUrl ? await downloadExternalImage(payload.imageUrl, wineId) : payload.imageUrl;
  const normalizedImageUrl = normalizeWineImageUrl(resolvedImageUrl);

  const maturityUpdates = Array.from(formData.keys())
    .filter((key) => key.startsWith("drinkFrom:") || key.startsWith("drinkUntil:"))
    .reduce<Map<string, { drinkFrom?: number | null; drinkUntil?: number | null }>>((updates, key) => {
      const [field, vintageId] = key.split(":");
      if (!vintageId) return updates;
      const value = formData.get(key);
      const parsed = typeof value === "string" && value.trim() ? Number.parseInt(value, 10) : null;
      const update = updates.get(vintageId) ?? {};
      update[field as "drinkFrom" | "drinkUntil"] = Number.isFinite(parsed) ? parsed : null;
      updates.set(vintageId, update);
      return updates;
    }, new Map());

  await prisma.$transaction([
    prisma.wine.update({
      where: { id: wineId },
      data: {
        name: payload.name,
        producer: payload.producer,
        color: payload.color,
        region: payload.region,
        appellation: payload.appellation,
        country: payload.country,
        grapeVarieties: payload.grapeVarieties,
        description: payload.description,
        notes: payload.notes,
        foodPairing: payload.foodPairing,
        imageUrl: normalizedImageUrl,
      },
    }),
    ...Array.from(maturityUpdates, ([vintageId, data]) =>
      prisma.wineVintage.updateMany({ where: { id: vintageId, wineId }, data }),
    ),
  ]);

  revalidateWinePages(wineId);
  redirect(`/wines/${wineId}`);
}
