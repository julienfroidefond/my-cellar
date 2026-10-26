"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ArrowLeft, X } from "lucide-react";

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

  const visibleMarkers = markers.filter((m) =>
    (selectedAppellation ? m.name === selectedAppellation : true) &&
    (!selectedRegion || m.region === selectedRegion || ADMIN_REGION_MAP[m.region ?? ""] === selectedRegion)
  );

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Carte */}
      <div className="card relative overflow-hidden lg:col-span-2">
        {selectedRegion && (
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary btn-sm absolute left-3 top-3 z-10 shadow-[var(--shadow-md)]"
          >
            <ArrowLeft />
            Toute la France
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
                    fill={isSelected ? "rgba(192,25,59,0.14)" : "#efe6d8"}
                    stroke="#fffcf7"
                    strokeWidth={1}
                  />
                );
              })
            }
          </Geographies>

          {markers.map((m) => {
            const r = Math.max(5, Math.sqrt(m.bottles) * 5);
            const isSelected = selectedAppellation === m.name;
            const dimmed = selectedAppellation !== null && !isSelected;
            const opacity = dimmed ? 0.2 : (0.55 + (m.bottles / maxBottles) * 0.4);
            return (
              <Marker key={`${m.name}-${m.lat}`} coordinates={[m.lng, m.lat]}>
                <circle
                  r={isSelected ? r + 2 : r}
                  fill="#c0193b"
                  fillOpacity={opacity}
                  stroke={isSelected ? "#2b0912" : "#fffcf7"}
                  strokeWidth={isSelected ? 2 : 1.2}
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

      {/* Légende */}
      <div className="card flex flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold">
              {selectedAppellation ?? selectedRegion ?? "Appellations"}
            </h3>
            <p className="text-sm text-muted">
              {visibleMarkers.length} appellation{visibleMarkers.length > 1 ? "s" : ""}
            </p>
          </div>
          {selectedAppellation && (
            <button
              type="button"
              onClick={() => setSelectedAppellation(null)}
              className="btn btn-ghost btn-icon btn-sm shrink-0"
              aria-label="Désélectionner l’appellation"
            >
              <X />
            </button>
          )}
        </div>

        <ul className="-mx-2 max-h-[360px] flex-1 space-y-1 overflow-y-auto px-2">
          {visibleMarkers.map((m) => (
            <li key={m.name} className="rounded-xl py-2">
              <button
                type="button"
                onClick={() => setSelectedAppellation(selectedAppellation === m.name ? null : m.name)}
                className="flex w-full items-center gap-3 text-left"
                aria-pressed={selectedAppellation === m.name}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-wine-red" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{m.name}</span>
                  {m.region && <span className="block truncate text-xs text-faint">{m.region}</span>}
                </span>
                <span className="badge badge-wine">{m.bottles}</span>
              </button>

              <ul className="ml-[4.5px] mt-1.5 space-y-0.5 border-l-2 border-[var(--wine-tint-strong)] pl-4">
                {[...m.wines].sort((a, b) => b.bottles - a.bottles).map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/wines/${w.id}`}
                      className="group flex items-center gap-2 rounded-md py-0.5 text-[0.8125rem] text-muted hover:text-wine-red"
                    >
                      <span className="flex-1 truncate">{w.name}</span>
                      <span className="shrink-0 tabular text-faint group-hover:text-wine-red">
                        {w.bottles}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        {foreignWines.length > 0 && !selectedRegion && !selectedAppellation && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="label mb-2">Hors France</p>
            <ul className="space-y-1.5">
              {foreignWines.map((w) => (
                <li key={`${w.appellation}-${w.country}`} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-faint" />
                  <span className="min-w-0 flex-1 truncate">
                    {w.appellation}
                    {w.appellation !== w.country && <span className="text-faint"> · {w.country}</span>}
                  </span>
                  <span className="tabular text-muted">{w.bottles}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Infobulle */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[var(--z-overlay)] rounded-lg bg-ink px-3 py-1.5 text-[0.8125rem] text-background shadow-[var(--shadow-md)]"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <span className="font-semibold">{tooltip.name}</span>
          {" · "}
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
