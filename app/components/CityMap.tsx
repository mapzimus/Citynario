"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FullscreenControl, Map as MapLibreMap, Marker, NavigationControl, ScaleControl } from "maplibre-gl";
import type { FeatureCollection, LineString, Point, Polygon } from "geojson";

type MapSite = {
  id: string;
  name: string;
  short: string;
  detail: string;
  center: [number, number];
};

type LayerKey = "transit" | "schools" | "flood";

type Props = {
  sites: MapSite[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
};

const LYNN_BOUNDS: [[number, number], [number, number]] = [
  [-71.012, 42.431],
  [-70.875, 42.525],
];

const LYNN_BOUNDARY_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query?where=STATE%3D%2725%27%20AND%20PLACE%3D%2737490%27&outFields=GEOID%2CNAME%2CBASENAME&returnGeometry=true&outSR=4326&f=geojson";

const siteHalfSizes: Record<string, [number, number]> = {
  downtown: [0.00058, 0.00038],
  waterfront: [0.00066, 0.00044],
  central: [0.00048, 0.00033],
};

function siteFeatures(sites: MapSite[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: sites.map((site) => {
      const [halfLng, halfLat] = siteHalfSizes[site.id] ?? [0.0005, 0.00035];
      const [lng, lat] = site.center;
      return {
        type: "Feature",
        properties: { id: site.id, name: site.name, short: site.short, detail: site.detail },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [lng - halfLng, lat - halfLat],
            [lng + halfLng, lat - halfLat],
            [lng + halfLng, lat + halfLat],
            [lng - halfLng, lat + halfLat],
            [lng - halfLng, lat - halfLat],
          ]],
        },
      };
    }),
  };
}

const transitFeatures: FeatureCollection<LineString | Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { kind: "rail", name: "Newburyport / Rockport Line" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-70.985, 42.461],
          [-70.969, 42.461],
          [-70.953, 42.462],
          [-70.945421, 42.462953],
          [-70.929, 42.469],
          [-70.91, 42.477],
        ],
      },
    },
    {
      type: "Feature",
      properties: { kind: "station", name: "Lynn station" },
      geometry: { type: "Point", coordinates: [-70.945421, 42.462953] },
    },
  ],
};

const schoolFeatures: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    ["Lynn Classical", -70.9631, 42.4727],
    ["Lynn English", -70.9348, 42.4768],
    ["Fecteau-Leary", -70.949, 42.4652],
    ["Brickett Elementary", -70.9257, 42.4567],
  ].map(([name, lng, lat]) => ({
    type: "Feature",
    properties: { name },
    geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
  })),
};

const floodFeatures: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Illustrative coastal screening context" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-70.976, 42.438],
          [-70.905, 42.438],
          [-70.905, 42.463],
          [-70.921, 42.468],
          [-70.939, 42.461],
          [-70.954, 42.458],
          [-70.976, 42.466],
          [-70.976, 42.438],
        ]],
      },
    },
  ],
};

const layersByKey: Record<LayerKey, string[]> = {
  transit: ["transit-line", "transit-station", "transit-label"],
  schools: ["school-points", "school-labels"],
  flood: ["flood-fill", "flood-line"],
};

export function CityMap({ sites, selectedSiteId, onSelectSite }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Record<string, { marker: Marker; element: HTMLButtonElement }>>({});
  const initialSelectedSiteRef = useRef(selectedSiteId);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ transit: true, schools: true, flood: false });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initialSites = sites;
    const initialSelectedSiteId = initialSelectedSiteRef.current;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        bounds: LYNN_BOUNDS,
        fitBoundsOptions: { padding: { top: 70, right: 45, bottom: 55, left: 45 } },
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
    } catch {
      window.setTimeout(() => {
        setMapError("The interactive map could not start in this browser.");
        setLoading(false);
      }, 0);
      return;
    }

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");
    map.addControl(new FullscreenControl(), "bottom-right");
    map.addControl(new ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-left");

    map.on("load", () => {
      map.addSource("lynn-boundary", {
        type: "geojson",
        data: LYNN_BOUNDARY_URL,
        attribution: "U.S. Census Bureau TIGERweb",
      });
      map.addLayer({
        id: "lynn-boundary-fill",
        type: "fill",
        source: "lynn-boundary",
        paint: { "fill-color": "#a8dbc7", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "lynn-boundary-line",
        type: "line",
        source: "lynn-boundary",
        paint: { "line-color": "#174d43", "line-width": 2.2, "line-dasharray": [2, 1.2] },
      });

      map.addSource("flood-context", { type: "geojson", data: floodFeatures });
      map.addLayer({
        id: "flood-fill",
        type: "fill",
        source: "flood-context",
        layout: { visibility: "none" },
        paint: { "fill-color": "#64b5cf", "fill-opacity": 0.23 },
      });
      map.addLayer({
        id: "flood-line",
        type: "line",
        source: "flood-context",
        layout: { visibility: "none" },
        paint: { "line-color": "#3188a3", "line-width": 1.5, "line-dasharray": [2, 2] },
      });

      map.addSource("transit-context", { type: "geojson", data: transitFeatures });
      map.addLayer({
        id: "transit-line",
        type: "line",
        source: "transit-context",
        filter: ["==", ["get", "kind"], "rail"],
        paint: { "line-color": "#ee745b", "line-width": 3, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "transit-station",
        type: "circle",
        source: "transit-context",
        filter: ["==", ["get", "kind"], "station"],
        paint: {
          "circle-radius": 7,
          "circle-color": "#f3f0e7",
          "circle-stroke-color": "#ee745b",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: "transit-label",
        type: "symbol",
        source: "transit-context",
        filter: ["==", ["get", "kind"], "station"],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
        },
        paint: { "text-color": "#162d29", "text-halo-color": "#faf8f1", "text-halo-width": 1.5 },
      });

      map.addSource("schools", { type: "geojson", data: schoolFeatures });
      map.addLayer({
        id: "school-points",
        type: "circle",
        source: "schools",
        paint: {
          "circle-radius": 5,
          "circle-color": "#efc35b",
          "circle-stroke-color": "#162d29",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "school-labels",
        type: "symbol",
        source: "schools",
        minzoom: 12.5,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: { "text-color": "#162d29", "text-halo-color": "#faf8f1", "text-halo-width": 1.5 },
      });

      map.addSource("development-sites", { type: "geojson", data: siteFeatures(initialSites) });
      map.addLayer({
        id: "site-fill",
        type: "fill",
        source: "development-sites",
        paint: {
          "fill-color": ["case", ["==", ["get", "id"], initialSelectedSiteId], "#ee745b", "#a8dbc7"],
          "fill-opacity": ["case", ["==", ["get", "id"], initialSelectedSiteId], 0.58, 0.34],
        },
      });
      map.addLayer({
        id: "site-outline",
        type: "line",
        source: "development-sites",
        paint: {
          "line-color": ["case", ["==", ["get", "id"], initialSelectedSiteId], "#a63f2d", "#174d43"],
          "line-width": ["case", ["==", ["get", "id"], initialSelectedSiteId], 3, 2],
        },
      });

      initialSites.forEach((site, index) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = `map-site-marker${site.id === initialSelectedSiteId ? " selected" : ""}`;
        element.setAttribute("aria-label", `Select ${site.name}`);
        const number = document.createElement("span");
        number.textContent = String(index + 1).padStart(2, "0");
        const label = document.createElement("b");
        label.textContent = site.short;
        element.append(number, label);
        element.addEventListener("click", () => onSelectSite(site.id));
        const marker = new Marker({ element, anchor: "bottom-left" }).setLngLat(site.center).addTo(map);
        markersRef.current[site.id] = { marker, element };
      });

      map.on("click", "site-fill", (event) => {
        const siteId = event.features?.[0]?.properties?.id;
        if (typeof siteId === "string") onSelectSite(siteId);
      });
      map.on("mouseenter", "site-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "site-fill", () => { map.getCanvas().style.cursor = ""; });
      setLoading(false);
    });

    map.once("error", () => {
      if (!map.loaded()) setMapError("Some map data could not load. Check your connection and try again.");
    });

    return () => {
      Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectSite, sites]);

  useEffect(() => {
    const map = mapRef.current;
    const site = sites.find((item) => item.id === selectedSiteId);
    if (!map || !site) return;
    Object.entries(markersRef.current).forEach(([id, { element }]) => element.classList.toggle("selected", id === selectedSiteId));
    if (map.getLayer("site-fill")) {
      map.setPaintProperty("site-fill", "fill-color", ["case", ["==", ["get", "id"], selectedSiteId], "#ee745b", "#a8dbc7"]);
      map.setPaintProperty("site-fill", "fill-opacity", ["case", ["==", ["get", "id"], selectedSiteId], 0.58, 0.34]);
      map.setPaintProperty("site-outline", "line-color", ["case", ["==", ["get", "id"], selectedSiteId], "#a63f2d", "#174d43"]);
      map.setPaintProperty("site-outline", "line-width", ["case", ["==", ["get", "id"], selectedSiteId], 3, 2]);
      map.flyTo({ center: site.center, zoom: Math.max(map.getZoom(), 14.7), duration: 850, essential: true });
    }
  }, [selectedSiteId, sites]);

  const toggleLayer = (key: LayerKey) => {
    const next = !layers[key];
    setLayers((current) => ({ ...current, [key]: next }));
    const map = mapRef.current;
    if (!map) return;
    layersByKey[key].forEach((layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", next ? "visible" : "none");
    });
  };

  const resetMap = () => {
    mapRef.current?.fitBounds(LYNN_BOUNDS, { padding: { top: 70, right: 45, bottom: 55, left: 45 }, duration: 900 });
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const match = sites.find((site) => `${site.name} ${site.short}`.toLowerCase().includes(query.trim().toLowerCase()));
    if (match) {
      onSelectSite(match.id);
      setQuery(match.name);
    }
  };

  return (
    <div className="city-map-frame">
      <div ref={containerRef} className="city-map" role="application" aria-label="Interactive map of Lynn, Massachusetts" />
      <form className="map-search" onSubmit={submitSearch}>
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a demonstration site"
          aria-label="Find a demonstration site"
          list="citynario-sites"
        />
        <datalist id="citynario-sites">{sites.map((site) => <option key={site.id} value={site.name} />)}</datalist>
        <button type="submit">Find</button>
      </form>
      <div className="map-layer-control" aria-label="Map layers">
        <span>Map layers</span>
        {(Object.keys(layers) as LayerKey[]).map((key) => (
          <button key={key} type="button" aria-pressed={layers[key]} className={layers[key] ? "active" : ""} onClick={() => toggleLayer(key)}>
            <i data-layer={key} /> {key === "flood" ? "Flood context" : key}
          </button>
        ))}
      </div>
      <div className="map-legend" aria-label="Map legend">
        <span><i className="legend-site" /> Scenario site</span>
        <span><i className="legend-boundary" /> Lynn boundary</span>
        <span><i className="legend-source" /> Live basemap</span>
      </div>
      <button type="button" className="map-reset" onClick={resetMap}>View all Lynn</button>
      <div className="map-data-note">Boundary: U.S. Census TIGERweb · Context layers: demonstration</div>
      {loading && <div className="map-loading" aria-live="polite"><span /><b>Loading Lynn map</b></div>}
      {mapError && <div className="map-error" role="status"><b>Map notice</b><span>{mapError}</span></div>}
    </div>
  );
}
