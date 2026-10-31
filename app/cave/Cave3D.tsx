"use client";

import { DEPTH_DEFAULT, DEPTH_MAX } from "./constants";
import type { RackData, WineRef } from "./types";

type Slot = { wine: WineRef | null; slotIndex: number };

const SHELF_STEP = 60;
const RACK_VERTICAL_GAP = 40;
const RACK_HORIZONTAL_OFFSET = 0;
const SHELF_X = 56;
const SLOT_START = 54;
const SLOT_STEP = 72;
const ROW_OFFSET = -35;
const EDGE_PADDING = 2;
const VERTICAL_PADDING = 12;

// Décalage isométrique de la rangée arrière (profondeur 2) par rapport à la
// rangée avant (profondeur 1), à l'échelle de référence 1.
const BACK_DEPTH = { x: 245, y: -205 };
const BACK_SCALE = 1.38;

const FRONT_IMAGE = { width: 210, height: 150, x: -48, y: -72 };
const BACK_IMAGE = {
  width: FRONT_IMAGE.width * BACK_SCALE,
  height: FRONT_IMAGE.height * BACK_SCALE,
  x: -88,
  y: -100,
};

// Les PNG contiennent beaucoup de transparence : ces boîtes correspondent à la
// bouteille réellement visible. Elles servent au cadrage et au contour de
// sélection, pas au placement de l'image.
const FRONT_ART = { x: 10, y: -51, width: 102, height: 110 };
const BACK_ART = { x: 7, y: -63, width: 104, height: 123 };

// Recul effectif des bouteilles arrière pour un réglage donné.
function backOffset(depth: number) {
  return { x: BACK_DEPTH.x * depth, y: BACK_DEPTH.y * depth };
}

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

function visualBounds(levels: ReturnType<typeof slotsForRack>, depth: number) {
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  const back = backOffset(depth);

  levels.forEach((level, index) => {
    const shelfY = 160 + index * SHELF_STEP;
    if (level.front.length > 0) {
      top = Math.min(top, shelfY - 4 + FRONT_ART.y);
      bottom = Math.max(bottom, shelfY - 4 + FRONT_ART.y + FRONT_ART.height);
    }
    if (level.back.length > 0) {
      const backY = shelfY + back.y;
      top = Math.min(top, backY + BACK_ART.y);
      bottom = Math.max(bottom, backY + BACK_ART.y + BACK_ART.height);
    }
  });

  return Number.isFinite(top) ? { top, bottom } : { top: 0, bottom: 0 };
}

// Encombrement horizontal réel d'un casier (rangées avant et arrière
// confondues), hors décalage de casier.
function contentExtents(levels: ReturnType<typeof slotsForRack>, depth: number) {
  let maxFront = 0;
  let maxBack = 0;
  for (const level of levels) {
    maxFront = Math.max(maxFront, level.front.length);
    maxBack = Math.max(maxBack, level.back.length);
  }

  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  const back = backOffset(depth);

  if (maxFront > 0) {
    left = Math.min(left, SHELF_X + ROW_OFFSET + SLOT_START + FRONT_ART.x);
    right = Math.max(right, SHELF_X + SLOT_START + (maxFront - 1) * SLOT_STEP + FRONT_ART.x + FRONT_ART.width);
  }
  if (maxBack > 0) {
    left = Math.min(left, SHELF_X + ROW_OFFSET + SLOT_START + back.x + BACK_ART.x);
    right = Math.max(right, SHELF_X + SLOT_START + (maxBack - 1) * SLOT_STEP + back.x + BACK_ART.x + BACK_ART.width);
  }

  return Number.isFinite(left) ? { left, right } : { left: 0, right: 0 };
}

// Encombrement horizontal de l'ensemble des casiers pour un écart donné.
// Chaque casier est décalé de RACK_HORIZONTAL_OFFSET : l'offset doit donc être
// appliqué avant de prendre le minimum / maximum, sinon le cadrage est faussé.
function contentSpan(scenes: { levels: ReturnType<typeof slotsForRack> }[], depth: number) {
  if (scenes.length === 0) return { left: 0, right: 0 };
  const extents = scenes.map(({ levels }, index) => {
    const extent = contentExtents(levels, depth);
    const offset = index * RACK_HORIZONTAL_OFFSET;
    return { left: extent.left + offset, right: extent.right + offset };
  });
  return {
    left: Math.min(...extents.map((extent) => extent.left)),
    right: Math.max(...extents.map((extent) => extent.right)),
  };
}

function bottleImage(wine: WineRef | null, dim: boolean) {
  if (wine?.color === "blanc") return dim ? "/cave/bottle-white-back.png" : "/cave/bottle-white-front.png";
  return dim ? "/cave/bottle-back.png" : "/cave/bottle-front.png";
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
  const image = dim ? BACK_IMAGE : FRONT_IMAGE;
  const art = dim ? BACK_ART : FRONT_ART;
  const imageX = x + image.x;
  const imageY = y + image.y;
  const imageSrc = bottleImage(wine, dim);
  const hitCx = imageX + image.width * 0.52;
  const hitCy = imageY + image.height * 0.52;
  // The PNGs include generous transparent padding. Keep the interactive area
  // narrowly inside the rendered bottle so neighbouring bottles remain
  // independently clickable.
  const hitRx = image.width * (dim ? 0.24 : 0.29);
  const hitRy = image.height * (dim ? 0.23 : 0.27);
  const hitTransform = `rotate(-42 ${hitCx} ${hitCy})`;

  if (!wine) {
    return (
      <g>
        <image href={imageSrc} x={imageX} y={imageY} width={image.width} height={image.height} opacity="0.16" preserveAspectRatio="xMidYMid meet" pointerEvents="none" />
        {onEmptyClick && (
          <ellipse
            cx={hitCx} cy={hitCy} rx={hitRx} ry={hitRy} transform={hitTransform}
            fill="rgba(0,0,0,0.001)" role="button" tabIndex={0} aria-label="Placer une bouteille ici"
            onClick={(event) => { event.stopPropagation(); onEmptyClick(); }}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onEmptyClick(); }}
            className="cursor-pointer"
          />
        )}
      </g>
    );
  }

  const label = `${wine.name}${wine.vintage ? ` · ${wine.vintage}` : ""}`;
  const activate = () => onSelect(wine);

  return (
    <g>
      {selected && <rect x={x + art.x - 5} y={y + art.y - 5} width={art.width + 10} height={art.height + 10} rx="14" fill="none" stroke="var(--wine-red)" strokeWidth="3" pointerEvents="none" />}
      <image href={imageSrc} x={imageX} y={imageY} width={image.width} height={image.height} preserveAspectRatio="xMidYMid meet" pointerEvents="none" />
      <ellipse
        cx={hitCx} cy={hitCy} rx={hitRx} ry={hitRy} transform={hitTransform}
        fill="rgba(0,0,0,0.001)" role="button" tabIndex={0} aria-label={`Voir ${label}`}
        onClick={(event) => { event.stopPropagation(); activate(); }}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") activate(); }}
        className="cursor-pointer"
      >
        <title>{label}</title>
      </ellipse>
    </g>
  );
}

function Shelf({ level, index, totalLevels, rack, offsetY, depth, selectedId, showFront, showBack, onSelect, onEmptyClick }: {
  level: { front: Slot[]; back: Slot[] };
  index: number;
  totalLevels: number;
  rack: RackData;
  offsetY: number;
  depth: number;
  selectedId: string | null;
  showFront: boolean;
  showBack: boolean;
  onSelect: (wine: WineRef) => void;
  onEmptyClick: ((rack: RackData, slotIndex: number) => void) | null;
}) {
  const shelfY = offsetY + 160 + index * SHELF_STEP;
  const rowOffsetX = (totalLevels - 1 - index) % 2 === 0 ? 0 : ROW_OFFSET;
  const slotX = (position: number) => SHELF_X + rowOffsetX + SLOT_START + position * SLOT_STEP;
  const back = backOffset(depth);

  return (
    <g>
      {showBack && level.back.map(({ wine, slotIndex }, position) => (
        <IsometricBottle key={slotIndex} wine={wine} x={slotX(position) + back.x} y={shelfY + back.y} dim selected={wine?.id === selectedId} onSelect={onSelect} onEmptyClick={onEmptyClick ? () => onEmptyClick(rack, slotIndex) : null} />
      ))}
      {showFront && level.front.map(({ wine, slotIndex }, position) => (
        <IsometricBottle key={slotIndex} wine={wine} x={slotX(position)} y={shelfY - 4} dim={false} selected={wine?.id === selectedId} onSelect={onSelect} onEmptyClick={onEmptyClick ? () => onEmptyClick(rack, slotIndex) : null} />
      ))}
    </g>
  );
}

export function Cave3D({ racks, selectedId, showFront, showBack, depth = DEPTH_DEFAULT, onSelect, onEmptyClick }: {
  racks: RackData[];
  selectedId: string | null;
  showFront: boolean;
  showBack: boolean;
  depth?: number;
  onSelect: (wine: WineRef) => void;
  onEmptyClick: ((rack: RackData, slotIndex: number) => void) | null;
}) {
  // L'écart vertical entre casiers est calculé pour la profondeur courante :
  // il reste donc constant visuellement quand on règle l'écart. Seule la
  // largeur est calée sur l'écart maximal, afin que les bouteilles ne
  // changent pas de taille pendant le réglage.
  const scenes = racks.reduce<{ rack: RackData; levels: ReturnType<typeof slotsForRack>; bounds: ReturnType<typeof visualBounds>; offsetX: number; offsetY: number }[]>((items, rack) => {
    const levels = slotsForRack(rack);
    const bounds = visualBounds(levels, depth);
    const previous = items.at(-1);
    const offsetY = previous
      ? previous.offsetY + previous.bounds.bottom + RACK_VERTICAL_GAP - bounds.top
      : VERTICAL_PADDING - bounds.top;
    items.push({ rack, levels, bounds, offsetX: items.length * RACK_HORIZONTAL_OFFSET, offsetY });
    return items;
  }, []);
  const layout = contentSpan(scenes, DEPTH_MAX);
  const width = Math.max(560, layout.right - layout.left + EDGE_PADDING * 2);
  const lastScene = scenes.at(-1);
  const height = lastScene ? lastScene.offsetY + lastScene.bounds.bottom + VERTICAL_PADDING : 0;

  // Recentre horizontalement le dessin pour l'écart courant.
  const drawn = contentSpan(scenes, depth);
  const translateX = (width - (drawn.right - drawn.left)) / 2 - drawn.left;

  return (
    <div
      className="card overflow-x-auto bg-[linear-gradient(160deg,var(--surface),var(--surface-2))] p-1 sm:p-3"
      aria-label="Vue isométrique de la cave"
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block w-full max-w-[900px] overflow-visible">
        <g transform={`translate(${translateX} 0)`}>
          {scenes.map(({ rack, levels, offsetX, offsetY }) => (
            <g key={rack.id} transform={`translate(${offsetX} 0)`} aria-label={`Casier ${rack.name}`}>
              {[...levels].reverse().map((level, reverseIndex) => {
                const index = levels.length - 1 - reverseIndex;
                return <Shelf key={index} level={level} index={index} totalLevels={levels.length} rack={rack} offsetY={offsetY} depth={depth} selectedId={selectedId} showFront={showFront} showBack={showBack} onSelect={onSelect} onEmptyClick={onEmptyClick} />;
              })}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
