import { describe, expect, it } from "vitest";

import { APPELLATION_COORDS } from "./appellation-coords";

// Bounding box généreuse couvrant la France métropolitaine et la Corse.
const FRANCE = { minLat: 41, maxLat: 51.5, minLng: -5.5, maxLng: 10 };

describe("APPELLATION_COORDS", () => {
  const entries = Object.entries(APPELLATION_COORDS);

  it("contient des appellations", () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it("utilise des clés non vides sans espaces superflus", () => {
    for (const [name] of entries) {
      expect(name.length, name).toBeGreaterThan(0);
      expect(name, name).toBe(name.trim());
    }
  });

  it("a des coordonnées finies et situées en France", () => {
    for (const [name, coord] of entries) {
      expect(Number.isFinite(coord.lat), name).toBe(true);
      expect(Number.isFinite(coord.lng), name).toBe(true);
      expect(coord.lat, name).toBeGreaterThanOrEqual(FRANCE.minLat);
      expect(coord.lat, name).toBeLessThanOrEqual(FRANCE.maxLat);
      expect(coord.lng, name).toBeGreaterThanOrEqual(FRANCE.minLng);
      expect(coord.lng, name).toBeLessThanOrEqual(FRANCE.maxLng);
    }
  });

  it("place correctement quelques appellations connues", () => {
    expect(APPELLATION_COORDS["Margaux"]).toEqual({ lat: 45.04, lng: -0.67 });
    expect(APPELLATION_COORDS["Champagne"]).toEqual({ lat: 49.04, lng: 3.95 });
    expect(APPELLATION_COORDS["Châteauneuf-du-Pape"]).toEqual({ lat: 44.06, lng: 4.83 });
  });

  it("partage les coordonnées des alias (pas de doublon de clé possible)", () => {
    expect(APPELLATION_COORDS["Bordeaux"]).toEqual(APPELLATION_COORDS["Bordeaux Supérieur"]);
    expect(APPELLATION_COORDS["Provence"]).toEqual(APPELLATION_COORDS["Côtes de Provence"]);
  });
});
