import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "cellar.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const history: Array<{
  wineName: string;
  producer: string;
  vintage: number | null;
  color: string;
  appellation: string;
  region: string;
  country: string;
  volume: number;
  rating?: number;
  consumedAt: string;
}> = [
  // ── 2026-06-28 ──────────────────────────────────────────────────────────────
  { wineName: "Terres de Berne Blanc", producer: "Château de Berne", vintage: 2023, color: "blanc", appellation: "Côtes de Provence", region: "Provence", country: "France", volume: 75, consumedAt: "2026-06-28" },

  // ── 2026-06-27 ──────────────────────────────────────────────────────────────
  { wineName: "Chapelle De La Solitude", producer: "Domaine de Chevalier", vintage: 2024, color: "blanc", appellation: "Graves", region: "Bordeaux", country: "France", volume: 75, rating: 2.9, consumedAt: "2026-06-27" },
  { wineName: "Les Hauts Du Tertre", producer: "Tertre", vintage: 2019, color: "rouge", appellation: "Margaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Hauts Du Tertre", producer: "Tertre", vintage: 2019, color: "rouge", appellation: "Margaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Château Larrivet Haut-brion", vintage: null, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Château Larrivet Haut-brion", vintage: null, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Château Larrivet Haut-brion", vintage: null, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Château Larrivet Haut-brion", vintage: null, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Château Larrivet Haut-brion", vintage: null, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Château Olivier", producer: "Chateau Olivier", vintage: 2011, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Lions de Batailley", producer: "Château Batailley", vintage: 2020, color: "rouge", appellation: "Pauillac", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Lions de Batailley", producer: "Château Batailley", vintage: 2020, color: "rouge", appellation: "Pauillac", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Lions de Batailley", producer: "Château Batailley", vintage: 2020, color: "rouge", appellation: "Pauillac", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Château Olivier", producer: "Chateau Olivier", vintage: 2011, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2019, color: "rouge", appellation: "Haut-Médoc", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Lions de Batailley", producer: "Château Batailley", vintage: 2020, color: "rouge", appellation: "Pauillac", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Lions de Batailley", producer: "Château Batailley", vintage: 2020, color: "rouge", appellation: "Pauillac", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Larrivet Haut-Brion", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Larrivet Haut-Brion", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Larrivet Haut-Brion", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Larrivet Haut-Brion", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2026-06-27" },
  { wineName: "L'instant Rouge", producer: "Famille Fabre", vintage: 2023, color: "rouge", appellation: "Languedoc", region: "Languedoc", country: "France", volume: 75, consumedAt: "2026-06-27" },

  // ── 2025-11-28 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-11-28" },

  // ── 2025-11-15 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-11-15" },

  // ── 2025-11-05 ──────────────────────────────────────────────────────────────
  { wineName: "Chateau Barbe Blanche", producer: "Chateau Barbe Blanche", vintage: 2019, color: "rouge", appellation: "Lussac-Saint-Émilion", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-11-05" },

  // ── 2025-11-02 ──────────────────────────────────────────────────────────────
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Larrivet Haut-Brion", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-11-02" },
  { wineName: "Bordeaux Rouge", producer: "N°1 de Dourthe", vintage: 2021, color: "rouge", appellation: "Bordeaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-11-02" },
  { wineName: "Bordeaux Rouge", producer: "N°1 de Dourthe", vintage: 2021, color: "rouge", appellation: "Bordeaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-11-02" },

  // ── 2025-10-26 ──────────────────────────────────────────────────────────────
  { wineName: "Les Jumelles Rouge", producer: "Château de Luc", vintage: 2022, color: "rouge", appellation: "Corbières", region: "Languedoc", country: "France", volume: 75, consumedAt: "2025-10-26" },

  // ── 2025-10-24 ──────────────────────────────────────────────────────────────
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Château Larrivet Haut-brion", vintage: null, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-10-24" },
  { wineName: "Bordeaux Rouge", producer: "N°1 de Dourthe", vintage: 2021, color: "rouge", appellation: "Bordeaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-10-24" },

  // ── 2025-10-17 ──────────────────────────────────────────────────────────────
  { wineName: "Les Demoiselles De Larrivet Haut-brion", producer: "Larrivet Haut-Brion", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, rating: 3.5, consumedAt: "2025-10-17" },
  { wineName: "Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", vintage: 2024, color: "blanc", appellation: "Entre-deux-Mers", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-10-17" },

  // ── 2025-10-15 ──────────────────────────────────────────────────────────────
  { wineName: "Bordeaux Rouge", producer: "N°1 de Dourthe", vintage: 2021, color: "rouge", appellation: "Bordeaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-10-15" },
  { wineName: "Bordeaux Rouge", producer: "N°1 de Dourthe", vintage: 2021, color: "rouge", appellation: "Bordeaux", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-10-15" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-10-15" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-10-15" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-10-15" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-10-15" },

  // ── 2025-09-26 ──────────────────────────────────────────────────────────────
  { wineName: "Les Jumelles Rouge", producer: "Château de Luc", vintage: 2022, color: "rouge", appellation: "Corbières", region: "Languedoc", country: "France", volume: 75, rating: 2.6, consumedAt: "2025-09-26" },
  { wineName: "Bordeaux Rouge", producer: "N°1 de Dourthe", vintage: 2021, color: "rouge", appellation: "Bordeaux", region: "Bordeaux", country: "France", volume: 75, rating: 2.7, consumedAt: "2025-09-26" },

  // ── 2025-09-20 ──────────────────────────────────────────────────────────────
  { wineName: "Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", vintage: 2024, color: "blanc", appellation: "Entre-deux-Mers", region: "Bordeaux", country: "France", volume: 75, rating: 2.7, consumedAt: "2025-09-20" },
  { wineName: "Les Jumelles Rouge", producer: "Château de Luc", vintage: 2022, color: "rouge", appellation: "Corbières", region: "Languedoc", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-09-20" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, rating: 3.5, consumedAt: "2025-09-20" },

  // ── 2025-09-12 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2023, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, rating: 3.7, consumedAt: "2025-09-12" },

  // ── 2025-09-05 ──────────────────────────────────────────────────────────────
  { wineName: "Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", vintage: 2024, color: "blanc", appellation: "Entre-deux-Mers", region: "Bordeaux", country: "France", volume: 75, rating: 2.7, consumedAt: "2025-09-05" },

  // ── 2025-08-31 ──────────────────────────────────────────────────────────────
  { wineName: "Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2019, color: "rouge", appellation: "Haut-Médoc", region: "Bordeaux", country: "France", volume: 75, rating: 3.4, consumedAt: "2025-08-31" },

  // ── 2025-08-22 ──────────────────────────────────────────────────────────────
  { wineName: "Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", vintage: 2024, color: "blanc", appellation: "Entre-deux-Mers", region: "Bordeaux", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-08-22" },

  // ── 2025-08-21 ──────────────────────────────────────────────────────────────
  { wineName: "Les Jumelles Rouge", producer: "Château de Luc", vintage: 2022, color: "rouge", appellation: "Corbières", region: "Languedoc", country: "France", volume: 75, rating: 2.5, consumedAt: "2025-08-21" },

  // ── 2025-08-16 ──────────────────────────────────────────────────────────────
  { wineName: "Pessac-Léognan Blanc", producer: "Château de Rochemorin", vintage: 2020, color: "blanc", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-08-16" },

  // ── 2025-08-10 ──────────────────────────────────────────────────────────────
  { wineName: "Saint-Julien", producer: "Château Gloria", vintage: 2012, color: "rouge", appellation: "Saint-Julien", region: "Bordeaux", country: "France", volume: 75, rating: 4.6, consumedAt: "2025-08-10" },

  // ── 2025-08-02 ──────────────────────────────────────────────────────────────
  { wineName: "Haghtanak", producer: "Tushpa", vintage: 2021, color: "rouge", appellation: "Ararat", region: "Arménie", country: "Arménie", volume: 75, rating: 2.9, consumedAt: "2025-08-02" },
  { wineName: "Puisseguin-Saint-Émilion", producer: "Château Soleil", vintage: 2015, color: "rouge", appellation: "Puisseguin-Saint-Émilion", region: "Bordeaux", country: "France", volume: 75, rating: 4.3, consumedAt: "2025-08-02" },

  // ── 2025-07-19 ──────────────────────────────────────────────────────────────
  { wineName: "Château Olivier", producer: "Chateau Olivier", vintage: 2014, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, rating: 3.7, consumedAt: "2025-07-19" },

  // ── 2025-06-08 ──────────────────────────────────────────────────────────────
  { wineName: "Fleur De Pédesclaux", producer: "Château Pédesclaux", vintage: 2014, color: "rouge", appellation: "Pauillac", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-06-08" },

  // ── 2025-05-30 ──────────────────────────────────────────────────────────────
  { wineName: "Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", vintage: 2023, color: "blanc", appellation: "Entre-deux-Mers", region: "Bordeaux", country: "France", volume: 75, rating: 2.5, consumedAt: "2025-05-30" },

  // ── 2025-05-29 ──────────────────────────────────────────────────────────────
  { wineName: "Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2020, color: "rouge", appellation: "Haut-Médoc", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-05-29" },
  { wineName: "Frank Phélan", producer: "Château Phélan Ségur", vintage: 2017, color: "rouge", appellation: "Saint-Estèphe", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-05-29" },

  // ── 2025-05-11 ──────────────────────────────────────────────────────────────
  { wineName: "Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2020, color: "rouge", appellation: "Haut-Médoc", region: "Bordeaux", country: "France", volume: 75, rating: 3.5, consumedAt: "2025-05-11" },

  // ── 2025-04-27 ──────────────────────────────────────────────────────────────
  { wineName: "Le Dauphin d'Olivier Pessac-Léognan", producer: "Château Olivier", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, rating: 2.9, consumedAt: "2025-04-27" },

  // ── 2025-04-23 ──────────────────────────────────────────────────────────────
  { wineName: "La Gravette Pessac-Léognan", producer: "Château Couhins", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, rating: 3.0, consumedAt: "2025-04-23" },

  // ── 2025-04-14 ──────────────────────────────────────────────────────────────
  { wineName: "Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2020, color: "rouge", appellation: "Haut-Médoc", region: "Bordeaux", country: "France", volume: 75, rating: 4.0, consumedAt: "2025-04-14" },

  // ── 2025-04-05 ──────────────────────────────────────────────────────────────
  { wineName: "Frank Phélan", producer: "Château Phélan Ségur", vintage: 2017, color: "rouge", appellation: "Saint-Estèphe", region: "Bordeaux", country: "France", volume: 75, consumedAt: "2025-04-05" },

  // ── 2025-04-04 ──────────────────────────────────────────────────────────────
  { wineName: "Pulsation", producer: "Les Éclaireurs", vintage: 2023, color: "rouge", appellation: "Saint-Nicolas-de-Bourgueil", region: "Loire", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-04-04" },

  // ── 2025-03-28 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2022, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, rating: 3.4, consumedAt: "2025-03-28" },

  // ── 2025-03-21 ──────────────────────────────────────────────────────────────
  { wineName: "Pulsation", producer: "Les Éclaireurs", vintage: 2023, color: "rouge", appellation: "Saint-Nicolas-de-Bourgueil", region: "Loire", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-03-21" },

  // ── 2025-03-19 ──────────────────────────────────────────────────────────────
  { wineName: "Vin De Pétanque", producer: "Famille Thibon", vintage: 2023, color: "rouge", appellation: "", region: "Languedoc", country: "France", volume: 75, rating: 3.0, consumedAt: "2025-03-19" },

  // ── 2025-03-16 ──────────────────────────────────────────────────────────────
  { wineName: "Saint-Julien", producer: "Château Gloria", vintage: 2012, color: "rouge", appellation: "Saint-Julien", region: "Bordeaux", country: "France", volume: 75, rating: 4.6, consumedAt: "2025-03-16" },

  // ── 2025-03-12 ──────────────────────────────────────────────────────────────
  { wineName: "Pulsation", producer: "Les Éclaireurs", vintage: 2023, color: "rouge", appellation: "Saint-Nicolas-de-Bourgueil", region: "Loire", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-03-12" },

  // ── 2025-03-07 ──────────────────────────────────────────────────────────────
  { wineName: "Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2020, color: "rouge", appellation: "Haut-Médoc", region: "Bordeaux", country: "France", volume: 75, rating: 4.5, consumedAt: "2025-03-07" },

  // ── 2025-03-05 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2022, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, rating: 3.6, consumedAt: "2025-03-05" },

  // ── 2025-02-28 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2022, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, rating: 3.7, consumedAt: "2025-02-28" },

  // ── 2025-02-26 ──────────────────────────────────────────────────────────────
  { wineName: "Pulsation", producer: "Les Éclaireurs", vintage: 2023, color: "rouge", appellation: "Saint-Nicolas-de-Bourgueil", region: "Loire", country: "France", volume: 75, rating: 3.7, consumedAt: "2025-02-26" },
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2022, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, rating: 3.7, consumedAt: "2025-02-26" },

  // ── 2025-02-21 ──────────────────────────────────────────────────────────────
  { wineName: "Pulsation", producer: "Les Éclaireurs", vintage: 2023, color: "rouge", appellation: "Saint-Nicolas-de-Bourgueil", region: "Loire", country: "France", volume: 75, consumedAt: "2025-02-21" },

  // ── 2025-02-18 ──────────────────────────────────────────────────────────────
  { wineName: "Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2022, color: "rouge", appellation: "Côtes du Rhône", region: "Rhône", country: "France", volume: 75, consumedAt: "2025-02-18" },

  // ── 2025-02-14 ──────────────────────────────────────────────────────────────
  { wineName: "Le Dauphin d'Olivier Pessac-Léognan", producer: "Château Olivier", vintage: 2019, color: "rouge", appellation: "Pessac-Léognan", region: "Bordeaux", country: "France", volume: 75, rating: 4.0, consumedAt: "2025-02-14" },
];

async function main() {
  await prisma.wineHistory.deleteMany({ where: { action: "bu" } });

  for (const entry of history) {
    await prisma.wineHistory.create({
      data: {
        action: "bu",
        wineName: entry.wineName,
        producer: entry.producer,
        vintage: entry.vintage,
        color: entry.color,
        appellation: entry.appellation || null,
        region: entry.region,
        country: entry.country,
        volume: entry.volume,
        rating: entry.rating ?? null,
        quantity: 1,
        consumedAt: new Date(entry.consumedAt + "T12:00:00Z"),
      },
    });
  }

  console.log(`Seeded ${history.length} history entries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
