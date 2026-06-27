export type LevelConfig = { front: number; back: number };
export type RackConfig  = { levels: LevelConfig[] };

export const RACK_CONFIGS: Record<string, RackConfig> = {
  "1A": { levels: [{ front: 4, back: 0 }, { front: 4, back: 4 }] },
  "2A": { levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }, { front: 4, back: 4 }] },
  "3A": { levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }, { front: 4, back: 4 }] },
  "4A": { levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }, { front: 4, back: 4 }] },
  "5A": { levels: [{ front: 6, back: 0 }, { front: 6, back: 0 }, { front: 6, back: 0 }, { front: 6, back: 0 }] },
};

export function defaultRackConfig(): RackConfig {
  return { levels: [{ front: 4, back: 4 }, { front: 4, back: 4 }] };
}

export function numColsForConfig(config: RackConfig): number {
  return Math.max(...config.levels.map((l) => Math.max(l.front, l.back)));
}

export type SlotPosition = {
  levelIndex: number;   // 0 = top shelf
  totalLevels: number;
  side: "avant" | "arrière";
  col: number;          // 0-based
  colsInRow: number;
};

export function decodeSlot(
  rackName: string,
  rackRow: number,
  rackCol: number,
  quantity: number,
): { start: SlotPosition; end?: SlotPosition } | null {
  const config = RACK_CONFIGS[rackName] ?? defaultRackConfig();
  const numCols = numColsForConfig(config);
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

export function slotLabel(pos: SlotPosition): string {
  const shelf = pos.totalLevels - pos.levelIndex; // 1 = bas, totalLevels = haut
  return `Étagère ${shelf} · ${pos.side} · pos. ${pos.col + 1}`;
}
