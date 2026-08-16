"use client";

import type { RackData, WineRef } from "./types";

type Slot = { wine: WineRef | null; slotIndex: number };
const SHELF_STEP = 60;
const RACK_GAP = 360;
const RACK_HORIZONTAL_OFFSET = 26;
const BACK_DEPTH_OFFSET = { x: 220, y: -205 };
const BACK_IMAGE_SCALE = 1.38;

function slotsForRack(rack: RackData) {
  const total = rack.config.levels.reduce((sum, level) => sum + level.front + level.back, 0);
  const slotMap: (WineRef | null)[] = new Array(total).fill(null);

  for (const wine of rack.wines) {
    if (wine.rackRow == null || wine.rackCol == null) continue;
    const index = wine.rackRow * rack.numCols + wine.rackCol;
    if (index < total) slotMap[index] = wine;
  }

  let offset = 0;
  const take = (count: number): Slot[] => {
    const slots = Array.from({ length: count }, (_, index) => ({ wine: slotMap[offset + index] ?? null, slotIndex: offset + index }));
    offset += count;
    return slots;
  };
  return rack.config.levels.map(({ front, back }) => ({ front: take(front), back: take(back) }));
}

function IsometricBottle({ wine, x, y, dim, selected, onSelect, onEmptyClick }: {
  wine: WineRef | null;
  x: number;
  y: number;
  dim: boolean;
  selected: boolean;
  onSelect: (wine: WineRef) => void;
  onEmptyClick: (() => void) | null;
}) {
  const imageWidth = dim ? 210 * BACK_IMAGE_SCALE : 210;
  const imageHeight = dim ? 150 * BACK_IMAGE_SCALE : 150;
  const imageX = dim ? x - 88 : x - 48;
  const imageY = dim ? y - 100 : y - 72;

  if (!wine) {
    return (
      <g
        role={onEmptyClick ? "button" : undefined}
        tabIndex={onEmptyClick ? 0 : undefined}
        aria-label={onEmptyClick ? "Placer une bouteille ici" : "Emplacement vide"}
        onClick={onEmptyClick ?? undefined}
        onKeyDown={(event) => { if (onEmptyClick && (event.key === "Enter" || event.key === " ")) onEmptyClick(); }}
        style={{ cursor: onEmptyClick ? "pointer" : "default" }}
      >
        <image
          href={dim ? "/cave/bottle-back.png" : "/cave/bottle-front.png"}
          x={imageX}
          y={imageY}
          width={imageWidth}
          height={imageHeight}
          opacity="0.16"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    );
  }

  const label = `${wine.name}${wine.vintage ? ` · ${wine.vintage}` : ""}`;
  const activate = () => onSelect(wine);

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Voir ${label}`}
      onClick={activate}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") activate(); }}
      style={{ cursor: "pointer" }}
    >
      <title>{label}</title>
      {selected && <rect x={imageX + 18} y={imageY + 18} width={imageWidth - 36} height={imageHeight - 36} rx="18" fill="none" stroke="var(--wine-red)" strokeWidth="3" />}
      <image
        href={dim ? "/cave/bottle-back.png" : "/cave/bottle-front.png"}
        x={imageX}
        y={imageY}
        width={imageWidth}
        height={imageHeight}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function Shelf({ level, index, totalLevels, rack, offsetY, selectedId, showFront, showBack, onSelect, onEmptyClick }: {
  level: { front: Slot[]; back: Slot[] };
  index: number;
  totalLevels: number;
  rack: RackData;
  offsetY: number;
  selectedId: string | null;
  showFront: boolean;
  showBack: boolean;
  onSelect: (wine: WineRef) => void;
  onEmptyClick: ((rack: RackData, slotIndex: number) => void) | null;
}) {
  const shelfX = 152;
  const shelfY = offsetY + 160 + index * SHELF_STEP;
  const rowOffsetX = (totalLevels - 1 - index) % 2 === 0 ? 0 : -35;
  const slotX = (position: number) => shelfX + rowOffsetX + 54 + position * 72;

  return (
    <g>
      {showBack && level.back.map(({ wine, slotIndex }, position) => (
        <IsometricBottle key={slotIndex} wine={wine} x={slotX(position) + BACK_DEPTH_OFFSET.x} y={shelfY + BACK_DEPTH_OFFSET.y} dim selected={wine?.id === selectedId} onSelect={onSelect} onEmptyClick={onEmptyClick ? () => onEmptyClick(rack, slotIndex) : null} />
      ))}
      {showFront && level.front.map(({ wine, slotIndex }, position) => (
        <IsometricBottle key={slotIndex} wine={wine} x={slotX(position)} y={shelfY - 4} dim={false} selected={wine?.id === selectedId} onSelect={onSelect} onEmptyClick={onEmptyClick ? () => onEmptyClick(rack, slotIndex) : null} />
      ))}
    </g>
  );
}

export function Cave3D({ racks, selectedId, showFront, showBack, onSelect, onEmptyClick }: {
  racks: RackData[];
  selectedId: string | null;
  showFront: boolean;
  showBack: boolean;
  onSelect: (wine: WineRef) => void;
  onEmptyClick: ((rack: RackData, slotIndex: number) => void) | null;
}) {
  const scenes = racks.reduce<{ rack: RackData; levels: ReturnType<typeof slotsForRack>; offsetX: number; offsetY: number }[]>((items, rack) => {
    const previous = items.at(-1);
    const offsetY = previous ? previous.offsetY + previous.levels.length * SHELF_STEP + RACK_GAP : 0;
    items.push({ rack, levels: slotsForRack(rack), offsetX: items.length * RACK_HORIZONTAL_OFFSET, offsetY });
    return items;
  }, []);
  const widestLevel = Math.max(...scenes.flatMap(({ levels }) => levels.map((level) => Math.max(level.front.length, level.back.length))), 1);
  const width = Math.max(620, widestLevel * 104 + 300 + Math.max(0, racks.length - 1) * RACK_HORIZONTAL_OFFSET);
  const height = (scenes.at(-1)?.offsetY ?? 0) + (scenes.at(-1)?.levels.length ?? 0) * SHELF_STEP + 105;

  return (
    <div className="overflow-x-auto rounded-2xl p-3 sm:p-5" aria-label="Vue isométrique de la cave" style={{ background: "linear-gradient(145deg, #fffaf2, #f3e7d7)", border: "1px solid var(--border)" }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto" style={{ minWidth: 520, width: "100%", maxWidth: 900, overflow: "visible" }}>
        {scenes.map(({ rack, levels, offsetX, offsetY }) => (
          <g key={rack.id} transform={`translate(${offsetX} 0)`}>
            <rect x="28" y={offsetY + 105} width="58" height="38" rx="11" fill="#a05828" />
            <text x="57" y={offsetY + 130} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="700" fontFamily="var(--font-inter)">{rack.name}</text>
            {[...levels].reverse().map((level, reverseIndex) => {
              const index = levels.length - 1 - reverseIndex;
              return <Shelf key={index} level={level} index={index} totalLevels={levels.length} rack={rack} offsetY={offsetY} selectedId={selectedId} showFront={showFront} showBack={showBack} onSelect={onSelect} onEmptyClick={onEmptyClick} />;
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
