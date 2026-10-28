export type LevelConfig = { front: number; back: number };
export type RackConfig  = { levels: LevelConfig[] };

/** Bornes du designer de cave (voir `lib/racks.ts`). */
export const MAX_RACK_LEVELS = 12;
export const MAX_RACK_COLS = 20;

export function defaultRackConfig(): RackConfig {
  return { levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }] };
}

/** Largeur du casier : la plus grande rangée (avant ou arrière) toutes étagères confondues. */
export function numColsForConfig(config: RackConfig): number {
  return config.levels.reduce((max, level) => Math.max(max, level.front, level.back), 0);
}

/** Nombre total d'emplacements (bouteilles) d'un casier. */
export function capacityForConfig(config: RackConfig): number {
  return config.levels.reduce((total, level) => total + level.front + level.back, 0);
}

/** Hauteur du casier : nombre d'étagères. */
export function heightForConfig(config: RackConfig): number {
  return config.levels.length;
}

/** Profondeur du casier : 2 dès qu'au moins une étagère a une rangée arrière. */
export function depthForConfig(config: RackConfig): 1 | 2 {
  return config.levels.some((level) => level.back > 0) ? 2 : 1;
}

/** Vrai quand toutes les étagères ont exactement la même largeur et la même profondeur. */
export function isUniformConfig(config: RackConfig): boolean {
  if (config.levels.length === 0) return true;
  const cols = numColsForConfig(config);
  const depth = depthForConfig(config);
  return config.levels.every(
    (level) => level.front === cols && level.back === (depth === 2 ? cols : 0),
  );
}

const clampInt = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

/** Construit une configuration régulière : `levels` étagères de `cols` bouteilles, sur `depth` rangées. */
export function uniformConfig(levels: number, cols: number, depth: 1 | 2): RackConfig {
  const safeLevels = clampInt(levels, 1, MAX_RACK_LEVELS);
  const safeCols = clampInt(cols, 1, MAX_RACK_COLS);
  const safeDepth = depth === 2 ? 2 : 1;
  return {
    levels: Array.from({ length: safeLevels }, () => ({
      front: safeCols,
      back: safeDepth === 2 ? safeCols : 0,
    })),
  };
}

/** Convertit les lignes `RackLevel` (base) en configuration de rendu. */
export function configFromLevels(
  levels: { position: number; front: number; back: number }[],
): RackConfig {
  return {
    levels: [...levels]
      .sort((a, b) => a.position - b.position)
      .map(({ front, back }) => ({ front, back })),
  };
}

export type SlotPosition = {
  levelIndex: number;   // 0 = top shelf
  totalLevels: number;
  side: "avant" | "arrière";
  col: number;          // 0-based
  colsInRow: number;
};

export function decodeSlot(
  config: RackConfig,
  rackRow: number,
  rackCol: number,
  quantity: number,
): { start: SlotPosition; end?: SlotPosition } | null {
  const numCols = numColsForConfig(config);
  if (numCols === 0) return null;
  const startSlot = rackRow * numCols + rackCol;
  const endSlot = startSlot + quantity - 1;

  const decode = (slot: number): SlotPosition | null => {
    let offset = 0;
    for (let i = 0; i < config.levels.length; i++) {
      const { front, back } = config.levels[i];
      if (slot < offset + front) {
        return { levelIndex: i, totalLevels: config.levels.length, side: "avant", col: slot - offset, colsInRow: front };
      }
      offset += front;
      if (slot < offset + back) {
        return { levelIndex: i, totalLevels: config.levels.length, side: "arrière", col: slot - offset, colsInRow: back };
      }
      offset += back;
    }
    return null;
  };

  const start = decode(startSlot);
  if (!start) return null;
  if (quantity <= 1) return { start };
  const end = decode(endSlot);
  return { start, end: end ?? undefined };
}

/** Index linéaire d'un emplacement physique (étagère + rangée + colonne). */
export function encodeSlot(
  config: RackConfig,
  levelIndex: number,
  side: "avant" | "arrière",
  col: number,
): number {
  let offset = 0;
  for (let i = 0; i < levelIndex; i++) {
    offset += config.levels[i].front + config.levels[i].back;
  }
  if (side === "arrière") offset += config.levels[levelIndex].front;
  return offset + col;
}

export function slotLabel(pos: SlotPosition): string {
  const shelf = pos.totalLevels - pos.levelIndex; // 1 = bas, totalLevels = haut
  return `Étagère ${shelf} · ${pos.side} · pos. ${pos.col + 1}`;
}
