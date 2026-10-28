import {
  MAX_RACK_COLS,
  MAX_RACK_LEVELS,
  decodeSlot,
  encodeSlot,
  numColsForConfig,
  uniformConfig,
  type LevelConfig,
  type RackConfig,
} from "./rack-configs";

export type RackInput = {
  name: string;
  levels: number; // hauteur : nombre d'étagères
  cols: number;   // largeur : plus grande rangée du casier
};

export type RackInputResult =
  | { ok: true; value: RackInput; config: RackConfig }
  | { ok: false; error: string };

const MAX_NAME_LENGTH = 30;

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function parseLayout(layout: unknown): { ok: true; config: RackConfig } | { ok: false; error: string } {
  if (!Array.isArray(layout)) {
    return { ok: false, error: "La disposition des étagères est invalide" };
  }
  if (layout.length < 1 || layout.length > MAX_RACK_LEVELS) {
    return { ok: false, error: `La hauteur doit être un entier entre 1 et ${MAX_RACK_LEVELS}` };
  }

  const levels: LevelConfig[] = [];
  for (let index = 0; index < layout.length; index++) {
    const raw = layout[index];
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: `L'étagère ${index + 1} est invalide` };
    }
    const { front, back } = raw as Record<string, unknown>;
    if (!isIntegerInRange(front, 1, MAX_RACK_COLS)) {
      return {
        ok: false,
        error: `La largeur avant de l'étagère ${index + 1} doit être un entier entre 1 et ${MAX_RACK_COLS}`,
      };
    }
    if (!isIntegerInRange(back, 0, MAX_RACK_COLS)) {
      return {
        ok: false,
        error: `La profondeur arrière de l'étagère ${index + 1} doit être un entier entre 0 et ${MAX_RACK_COLS}`,
      };
    }
    levels.push({ front, back });
  }

  return { ok: true, config: { levels } };
}

/**
 * Valide le corps JSON du designer de cave.
 *
 * Deux formes sont acceptées :
 * - `{ name, layout: [{ front, back }, …] }` : disposition étagère par étagère
 *   (permet les casiers irréguliers) ;
 * - `{ name, levels: number, cols: number, depth: 1 | 2 }` : ancienne forme
 *   régulière, conservée pour les clients existants et l'import.
 */
export function parseRackInput(body: unknown): RackInputResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Corps de requête invalide" };
  }

  const { name, layout, levels, cols, depth } = body as Record<string, unknown>;
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (trimmedName.length === 0) {
    return { ok: false, error: "Le nom du casier est requis" };
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères` };
  }

  const layoutCandidate = Array.isArray(layout) ? layout : Array.isArray(levels) ? levels : layout;
  if (layoutCandidate !== undefined) {
    const parsedLayout = parseLayout(layoutCandidate);
    if (!parsedLayout.ok) return parsedLayout;
    return {
      ok: true,
      value: {
        name: trimmedName,
        levels: parsedLayout.config.levels.length,
        cols: numColsForConfig(parsedLayout.config),
      },
      config: parsedLayout.config,
    };
  }

  if (!isIntegerInRange(levels, 1, MAX_RACK_LEVELS)) {
    return { ok: false, error: `La hauteur doit être un entier entre 1 et ${MAX_RACK_LEVELS}` };
  }
  if (!isIntegerInRange(cols, 1, MAX_RACK_COLS)) {
    return { ok: false, error: `La largeur doit être un entier entre 1 et ${MAX_RACK_COLS}` };
  }
  if (depth !== 1 && depth !== 2) {
    return { ok: false, error: "La profondeur doit valoir 1 ou 2 rangées" };
  }

  return {
    ok: true,
    value: { name: trimmedName, levels, cols },
    config: uniformConfig(levels, cols, depth),
  };
}

export type PositionedSlot = {
  id: string;
  rackRow: number;
  rackCol: number;
  quantity: number;
};

export type SlotMove = {
  id: string;
  rackRow: number;
  rackCol: number;
};

export type SlotPlan = {
  /** Emplacements qui n'existent plus dans la nouvelle disposition. */
  overflow: PositionedSlot[];
  /** Emplacements à déplacer vers leurs nouvelles coordonnées. */
  moves: SlotMove[];
};

/**
 * Calcule le remappage des bouteilles quand la disposition d'un casier change.
 *
 * Les étagères sont identifiées par leur position : une hauteur qui augmente
 * ajoute des étagères en haut, une hauteur qui diminue en retire en haut (c'est
 * la convention du designer). Ainsi une bouteille reste sur la même étagère
 * physique même si les étagères sont renumérotées.
 */
export function planRackSlotMoves(
  oldConfig: RackConfig,
  newConfig: RackConfig,
  slots: PositionedSlot[],
): SlotPlan {
  const oldCols = numColsForConfig(oldConfig);
  const newCols = numColsForConfig(newConfig);
  const levelOffset = newConfig.levels.length - oldConfig.levels.length;
  const overflow: PositionedSlot[] = [];
  const moves: SlotMove[] = [];
  const seen = new Set<number>();

  for (const slot of slots) {
    if (oldCols === 0 || slot.rackRow < 0 || slot.rackCol < 0 || slot.rackCol >= oldCols) {
      overflow.push(slot);
      continue;
    }

    const position = decodeSlot(oldConfig, slot.rackRow, slot.rackCol, 1)?.start;
    if (!position) {
      overflow.push(slot);
      continue;
    }

    const newLevelIndex = position.levelIndex + levelOffset;
    const newLevel = newConfig.levels[newLevelIndex];
    if (!newLevel) {
      overflow.push(slot);
      continue;
    }

    const rowLength = position.side === "avant" ? newLevel.front : newLevel.back;
    if (position.col >= rowLength) {
      overflow.push(slot);
      continue;
    }

    const newIndex = encodeSlot(newConfig, newLevelIndex, position.side, position.col);
    if (seen.has(newIndex)) {
      overflow.push(slot);
      continue;
    }
    seen.add(newIndex);

    const newRow = Math.floor(newIndex / newCols);
    const newCol = newIndex % newCols;
    if (newRow !== slot.rackRow || newCol !== slot.rackCol) {
      moves.push({ id: slot.id, rackRow: newRow, rackCol: newCol });
    }
  }

  return { overflow, moves };
}
