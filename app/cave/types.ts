export type WineRef = {
  id: string;           // WineVintageSlot.id (racked) OR WineVintage.id (unracked)
  vintageId: string;    // WineVintage.id (always)
  wineId: string;       // Wine.id (for navigation)
  name: string;
  producer: string | null;
  color: string | null;
  vintage: number | null;
  quantity: number;     // slot.quantity (racked) OR unracked bottle count (unracked)
  totalInCellar: number; // vintage.quantity
  appellation: string | null;
  region: string | null;
  imageUrl: string | null;
  rackId: string | null;
  rackRow: number | null;
  rackCol: number | null;
};

export type LevelConfig = { front: number; back: number };
export type RackConfig  = { levels: LevelConfig[] };
export type RackData    = {
  id: string;
  name: string;
  wines: WineRef[];
  config: RackConfig;
  numCols: number;
};
