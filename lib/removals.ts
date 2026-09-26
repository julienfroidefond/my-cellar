import { prisma } from "@/lib/db";
import { buildRemovalHistory, isRemovalReason, type RemovalReason } from "@/lib/history";

const MAX_NOTE_LENGTH = 500;

export type RemovalInput = {
  vintageId: string;
  quantity: number;
  reason: unknown;
  note?: unknown;
  slotId?: string | null;
};

export type RemovalResult =
  | { ok: true; removed: number; remaining: number }
  | { ok: false; status: number; error: string };

function sanitizeNote(note: unknown): string | null {
  if (typeof note !== "string") return null;
  const trimmed = note.trim();
  return trimmed ? trimmed.slice(0, MAX_NOTE_LENGTH) : null;
}

/**
 * Retire `quantity` bouteilles d'un millésime :
 * - décrémente WineVintage.quantity,
 * - retire les bouteilles du/des emplacement(s) de casier pour garder
 *   racked <= stock (en commençant par `slotId` s'il est fourni),
 * - journalise une entrée WineHistory avec la raison et la note.
 */
export async function removeBottlesFromStock(input: RemovalInput): Promise<RemovalResult> {
  if (!isRemovalReason(input.reason)) {
    return { ok: false, status: 400, error: "Raison invalide" };
  }
  const reason: RemovalReason = input.reason;

  const vintage = await prisma.wineVintage.findUnique({
    where: { id: input.vintageId },
    include: { wine: true },
  });
  if (!vintage) return { ok: false, status: 404, error: "Millésime introuvable" };

  const requested = Math.floor(Number(input.quantity) || 0);
  const removed = Math.min(Math.max(requested, 0), vintage.quantity);
  if (removed <= 0) return { ok: false, status: 400, error: "Aucune bouteille à retirer" };

  const remaining = vintage.quantity - removed;
  const note = sanitizeNote(input.note);
  const preferredSlotId = typeof input.slotId === "string" && input.slotId ? input.slotId : null;

  await prisma.$transaction(async (tx) => {
    await tx.wineVintage.update({ where: { id: vintage.id }, data: { quantity: remaining } });

    const setSlotQuantity = async (id: string, quantity: number) => {
      if (quantity <= 0) {
        await tx.wineVintageSlot.delete({ where: { id } });
      } else {
        await tx.wineVintageSlot.update({ where: { id }, data: { quantity } });
      }
    };

    let toRemove = removed;
    if (preferredSlotId) {
      const slot = await tx.wineVintageSlot.findUnique({ where: { id: preferredSlotId } });
      if (slot && slot.vintageId === vintage.id) {
        const take = Math.min(toRemove, slot.quantity);
        toRemove -= take;
        await setSlotQuantity(slot.id, slot.quantity - take);
      }
    }

    if (toRemove > 0) {
      const slots = await tx.wineVintageSlot.findMany({
        where: { vintageId: vintage.id },
        orderBy: { id: "asc" },
      });
      for (const slot of slots) {
        if (toRemove <= 0) break;
        if (slot.id === preferredSlotId) continue;
        const take = Math.min(toRemove, slot.quantity);
        toRemove -= take;
        await setSlotQuantity(slot.id, slot.quantity - take);
      }
    }

    await tx.wineHistory.create({
      data: buildRemovalHistory(vintage, removed, reason, note),
    });
  });

  return { ok: true, removed, remaining };
}
