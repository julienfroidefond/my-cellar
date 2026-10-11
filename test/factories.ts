import { NextRequest } from "next/server";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export function createWine(data: Prisma.WineCreateInput = { name: "Château Test" }) {
  return prisma.wine.create({ data });
}

export function createVintage(wineId: string, data: Omit<Prisma.WineVintageUncheckedCreateInput, "wineId"> = {}) {
  return prisma.wineVintage.create({
    data: { wineId, vintage: 2015, quantity: 6, ...data },
  });
}

export function createRack(data: Prisma.RackCreateInput = { name: "1A" }) {
  return prisma.rack.create({ data });
}

/** Construit une requête vide (ou JSON) pour un route handler. */
export function request(url: string, method = "GET") {
  return new NextRequest(url, { method });
}

/** Construit une requête JSON pour un route handler. */
export function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body), headers: { "content-type": "application/json" } }),
  });
}

/** Construit une requête avec un corps brut (ex. JSON invalide) pour tester les erreurs de parsing. */
export function rawRequest(url: string, method: string, body: string) {
  return new NextRequest(url, { method, body, headers: { "content-type": "application/json" } });
}

/** Construit un FormData à partir d'un objet (pour les server actions). */
export function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}
