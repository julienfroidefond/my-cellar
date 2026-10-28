import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/wines/image-search/route";

const request = (query = "") => new NextRequest(`http://test/api/wines/image-search${query}`);

const match = (overrides: {
  id?: number | null;
  name?: string | null;
  image?: string | null;
  winery?: string | null;
  year?: number | null;
} = {}) => {
  const {
    id = 42,
    name = "Château Margaux",
    image = "https://images.vivino.test/margaux.png",
    winery = "Château Margaux",
    year = 2015,
  } = overrides;

  return {
    vintage: {
      year,
      wine: {
        id,
        name,
        image: image === null ? {} : { variations: { bottle_medium_url: image } },
        winery: winery === null ? null : { name: winery },
      },
    },
  };
};

const stubVivino = (body: unknown, init: ResponseInit = {}) => {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("GET /api/wines/image-search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renvoie une liste vide sans terme de recherche", async () => {
    const fetchMock = stubVivino({ matches: [match()] });

    const body = await (await GET(request())).json();

    expect(body).toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("interroge Vivino en français pour la France", async () => {
    const fetchMock = stubVivino({ matches: [] });

    await GET(request("?q=Château Margaux"));

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("q=Ch%C3%A2teau%20Margaux");
    expect(url).toContain("language=fr");
    expect(url).toContain("country_codes[]=fr");
  });

  it("projette les résultats exploitables", async () => {
    stubVivino({ matches: [match()] });

    const body = await (await GET(request("?q=margaux"))).json();

    expect(body.results).toEqual([
      {
        id: 42,
        name: "Château Margaux",
        image: "https://images.vivino.test/margaux.png",
        winery: "Château Margaux",
        vintage: 2015,
      },
    ]);
  });

  it("écarte les résultats sans image, sans nom ou sans identifiant", async () => {
    stubVivino({
      matches: [
        match(),
        match({ image: null }),
        match({ name: null }),
        match({ id: null }),
        { vintage: {} },
      ],
    });

    const body = await (await GET(request("?q=vin"))).json();

    expect(body.results).toHaveLength(1);
  });

  it("tolère un domaine et un millésime absents", async () => {
    stubVivino({ matches: [match({ winery: null, year: null })] });

    const body = await (await GET(request("?q=vin"))).json();

    expect(body.results[0]).toMatchObject({ winery: "", vintage: null });
  });

  it("ne renvoie pas plus de six propositions", async () => {
    stubVivino({
      matches: Array.from({ length: 9 }, (_, index) =>
        match({ id: index, name: `Vin ${index}` }),
      ),
    });

    const body = await (await GET(request("?q=vin"))).json();

    expect(body.results).toHaveLength(6);
  });

  it("renvoie une liste vide quand Vivino répond en erreur", async () => {
    stubVivino({}, { status: 503 });

    expect(await (await GET(request("?q=vin"))).json()).toEqual({ results: [] });
  });

  it("renvoie une liste vide quand l'appel réseau échoue", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("réseau indisponible");
    }));

    expect(await (await GET(request("?q=vin"))).json()).toEqual({ results: [] });
  });
});
