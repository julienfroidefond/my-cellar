"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// react-simple-maps v5 ships its own types, but its `Geography` *interface* is not
// reachable from the package root (the explicit `Geography` component export shadows
// the type-only re-export). Derive it from the component props instead.
type GeoFeature = ComponentProps<typeof Geography>["geography"];

const GEO_URL = "/france-regions.json";
const DEFAULT_CENTER: [number, number] = [2.5, 46.5];
const DEFAULT_SCALE = 2600;

export interface AppellationMarker {
  name: string;
  lat: number;
  lng: number;
  bottles: number;
  region: string | null;
  wines: { id: string; name: string; bottles: number }[];
}

export interface ForeignWine {
  appellation: string;
  country: string;
  bottles: number;
}

interface Tooltip {
  x: number;
  y: number;
  name: string;
  bottles: number;
}

interface RegionGeo {
  rsmKey: string;
  properties: { nom: string; code: string };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

// The GeoJSON we ship carries `nom`/`code` properties, which the generic
// GeoJSON types from react-simple-maps do not know about.
function asRegion(geo: GeoFeature): RegionGeo {
  return geo as unknown as RegionGeo;
}

interface Props {
  markers: AppellationMarker[];
  foreignWines: ForeignWine[];
}

function getRegionView(geo: RegionGeo): { center: [number, number]; zoom: number } {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

  function processRing(ring: number[][]) {
    for (const pt of ring) {
      if (pt[0] < minLon) minLon = pt[0];
      if (pt[0] > maxLon) maxLon = pt[0];
      if (pt[1] < minLat) minLat = pt[1];
      if (pt[1] > maxLat) maxLat = pt[1];
    }
  }

  if (geo.geometry.type === "Polygon") {
    processRing((geo.geometry.coordinates as number[][][])[0]);
  } else {
    for (const poly of geo.geometry.coordinates as number[][][][]) {
      processRing(poly[0]);
    }
  }

  const center: [number, number] = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  const maxSpan = Math.max(maxLon - minLon, maxLat - minLat);
  const zoom = Math.min(6, Math.max(2, 12 / maxSpan));
  return { center, zoom };
}

export default function FranceWineMap({ markers, foreignWines }: Props) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedAppellation, setSelectedAppellation] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const maxBottles = Math.max(...markers.map((m) => m.bottles), 1);

  function handleRegionClick(geo: RegionGeo) {
    const name = geo.properties.nom;
    if (selectedRegion === name) {
      setCenter(DEFAULT_CENTER);
      setScale(DEFAULT_SCALE);
      setSelectedRegion(null);
    } else {
      const view = getRegionView(geo);
      setCenter(view.center);
      setScale(DEFAULT_SCALE * view.zoom);
      setSelectedRegion(name);
    }
    setTooltip(null);
  }

  function handleReset() {
    setCenter(DEFAULT_CENTER);
    setScale(DEFAULT_SCALE);
    setSelectedRegion(null);
    setSelectedAppellation(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Map */}
      <div
        className="md:col-span-2 relative rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 12px rgba(26,10,14,0.06)",
        }}
      >
        {/* Reset button */}
        {selectedRegion && (
          <button
            onClick={handleReset}
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
              color: "var(--wine-red)",
              boxShadow: "0 2px 8px rgba(26,10,14,0.10)",
            }}
          >
            ← Toute la France
          </button>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale, center }}
          style={{ width: "100%", height: "auto" }}
          viewBox="0 0 800 600"
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const region = asRegion(geo);
                const isSelected = selectedRegion === region.properties.nom;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleRegionClick(region)}
                    className="map-region"
                    fill={isSelected ? "rgba(192,25,59,0.14)" : "rgba(192,25,59,0.04)"}
                    stroke="rgba(192,25,59,0.18)"
                    strokeWidth={0.5}
                  />
                );
              })
            }
          </Geographies>

          {markers.map((m) => {
            const r = Math.max(5, Math.sqrt(m.bottles) * 5);
            const isSelected = selectedAppellation === m.name;
            const dimmed = selectedAppellation !== null && !isSelected;
            const opacity = dimmed ? 0.2 : (0.45 + (m.bottles / maxBottles) * 0.5);
            return (
              <Marker key={`${m.name}-${m.lat}`} coordinates={[m.lng, m.lat]}>
                <circle
                  r={isSelected ? r + 2 : r}
                  fill="#c0193b"
                  fillOpacity={opacity}
                  stroke={isSelected ? "#c0193b" : "white"}
                  strokeWidth={isSelected ? 2 : 0.8}
                  strokeOpacity={isSelected ? 0.5 : 1}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppellation(selectedAppellation === m.name ? null : m.name);
                    setTooltip(null);
                  }}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, name: m.name, bottles: m.bottles })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* Legend */}
      <div
        className="rounded-2xl p-6 flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 12px rgba(26,10,14,0.06)",
        }}
      >
        <p
          className="text-xs tracking-[0.3em] uppercase mb-1"
          style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)", fontWeight: 600 }}
        >
          Géographie
        </p>
        <h3
          className="text-xl font-semibold mb-5"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
        >
          {selectedAppellation ?? selectedRegion ?? "Appellations"}
        </h3>

        <div className="space-y-4 flex-1 overflow-y-auto" style={{ maxHeight: 340 }}>
          {markers
            .filter((m) =>
              (selectedAppellation ? m.name === selectedAppellation : true) &&
              (!selectedRegion || m.region === selectedRegion || ADMIN_REGION_MAP[m.region ?? ""] === selectedRegion)
            )
            .map((m) => {
              const dotSize = Math.max(8, Math.sqrt(m.bottles) * 5);
              const opacity = 0.45 + (m.bottles / maxBottles) * 0.5;
              return (
                <div key={m.name}>
                  {/* Appellation header */}
                  <div className="flex items-center gap-3 mb-1.5">
                    <div
                      style={{
                        width: dotSize,
                        height: dotSize,
                        minWidth: dotSize,
                        borderRadius: "50%",
                        background: "#c0193b",
                        opacity,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                      >
                        {m.name}
                      </p>
                      {m.region && (
                        <p
                          className="text-xs truncate"
                          style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
                        >
                          {m.region}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums shrink-0"
                      style={{ fontFamily: "var(--font-playfair)", color: "var(--wine-red)" }}
                    >
                      {m.bottles}
                    </span>
                  </div>

                  {/* Individual wine links */}
                  <div className="space-y-1 pl-4" style={{ borderLeft: "2px solid rgba(192,25,59,0.15)" }}>
                    {m.wines.sort((a, b) => b.bottles - a.bottles).map((w) => (
                      <Link
                        key={w.id}
                        href={`/wines/${w.id}`}
                        className="flex items-center gap-2 group"
                      >
                        <span
                          className="text-xs flex-1 truncate transition-colors group-hover:text-[var(--wine-red)]"
                          style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                        >
                          {w.name}
                        </span>
                        <span
                          className="text-xs tabular-nums shrink-0 transition-colors group-hover:text-[var(--wine-red)]"
                          style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
                        >
                          {w.bottles} bt{w.bottles > 1 ? "s" : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {foreignWines.length > 0 && !selectedRegion && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p
              className="text-xs uppercase tracking-[0.2em] mb-3"
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
            >
              Hors France
            </p>
            <div className="space-y-2">
              {foreignWines.map((w) => (
                <div key={`${w.appellation}-${w.country}`} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "rgba(26,10,14,0.28)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm truncate"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                    >
                      {w.appellation}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}
                    >
                      {w.country}
                    </p>
                  </div>
                  <span
                    className="text-sm tabular-nums shrink-0"
                    style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                  >
                    {w.bottles}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "6px 12px",
            fontSize: 13,
            fontFamily: "var(--font-inter)",
            color: "var(--foreground)",
            boxShadow: "0 4px 16px rgba(26,10,14,0.12)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <span style={{ color: "#c0193b", fontWeight: 600 }}>{tooltip.name}</span>
          {" — "}
          {tooltip.bottles} bouteille{tooltip.bottles > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// Mapping wine region names → French administrative region names
// Used to filter the legend when a region is selected on the map.
const ADMIN_REGION_MAP: Record<string, string> = {
  "Bordeaux":            "Nouvelle-Aquitaine",
  "Bordeaux / Graves":   "Nouvelle-Aquitaine",
  "Bordeaux / Médoc":    "Nouvelle-Aquitaine",
  "Sud-Ouest":           "Nouvelle-Aquitaine",
  "Périgord":            "Nouvelle-Aquitaine",
  "Rhône":               "Auvergne-Rhône-Alpes",
  "Vallée du Rhône":     "Auvergne-Rhône-Alpes",
  "Beaujolais":          "Auvergne-Rhône-Alpes",
  "Savoie":              "Auvergne-Rhône-Alpes",
  "Languedoc":           "Occitanie",
  "Roussillon":          "Occitanie",
  "Languedoc-Roussillon":"Occitanie",
  "Provence":            "Provence-Alpes-Côte d'Azur",
  "Champagne":           "Grand Est",
  "Alsace":              "Grand Est",
  "Lorraine":            "Grand Est",
  "Bourgogne":           "Bourgogne-Franche-Comté",
  "Jura":                "Bourgogne-Franche-Comté",
  "Loire":               "Pays de la Loire",
  "Anjou":               "Pays de la Loire",
  "Val de Loire":        "Centre-Val de Loire",
  "Touraine":            "Centre-Val de Loire",
  "Corse":               "Corse",
};
