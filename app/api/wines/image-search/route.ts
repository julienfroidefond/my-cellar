import { NextRequest, NextResponse } from "next/server";

export type VivinoResult = {
  id: number;
  name: string;
  image: string; // URL de l'image de la bouteille
  winery: string;
  vintage?: number | null;
};

// Sous-ensemble non documenté de la réponse de l'API Vivino que l'on consomme.
// Tous les champs sont optionnels : l'API peut les omettre selon le résultat.
type VivinoMatch = {
  vintage?: {
    year?: number;
    wine?: {
      id?: number;
      name?: string;
      image?: { variations?: { bottle_medium_url?: string } };
      winery?: { name?: string } | null;
    };
  };
};

// GET /api/wines/image-search?q=Château+Margaux
// Interroge l'API Vivino (non officielle) et renvoie jusqu'à 6 résultats avec images
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = `https://www.vivino.com/api/wines/search?q=${encodeURIComponent(q)}&language=fr&country_codes[]=fr`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Referer": "https://www.vivino.com/",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return NextResponse.json({ results: [] });

    const data: { matches?: VivinoMatch[] } = await res.json();
    const matches = data.matches ?? [];

    const results: VivinoResult[] = matches
      .flatMap((m): VivinoResult[] => {
        const wine = m.vintage?.wine;
        const image = wine?.image?.variations?.bottle_medium_url;
        if (!image || wine?.id == null || !wine.name) return [];
        return [{
          id: wine.id,
          name: wine.name,
          image,
          winery: wine.winery?.name ?? "",
          vintage: m.vintage?.year ?? null,
        }];
      })
      .slice(0, 6);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
