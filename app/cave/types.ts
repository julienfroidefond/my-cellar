export type WineRef = {
  id: string;
  name: string;
  color: string | null;
  vintage: number | null;
  quantity: number;
  totalInCellar: number;
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
