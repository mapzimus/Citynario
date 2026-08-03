"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { GeoJsonObject } from "geojson";
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker, Polygon as LeafletPolygon } from "leaflet";

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
  [42.431, -71.012],
  [42.525, -70.875],
];

const LYNN_BOUNDARY_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query?where=STATE%3D%2725%27%20AND%20PLACE%3D%2737490%27&outFields=GEOID%2CNAME%2CBASENAME&returnGeometry=true&outSR=4326&f=geojson";

const siteHalfSizes: Record<string, [number, number]> = {
  downtown: [0.00058, 0.00038],
  waterfront: [0.00066, 0.00044],
  central: [0.00048, 0.00033],
};

function siteLatLngs(site: MapSite): [number, number][] {
  const [halfLng, halfLat] = siteHalfSizes[site.id] ?? [0.0005, 0.00035];
  const [lng, lat] = site.center;
  return [
    [lat - halfLat, lng - halfLng],
    [lat - halfLat, lng + halfLng],
    [lat + halfLat, lng + halfLng],
    [lat + halfLat, lng - halfLng],
  ];
}

const transitLine: [number, number][] = [
  [42.461, -70.985],
  [42.461, -70.969],
  [42.462, -70.953],
  [42.462953, -70.945421],
  [42.469, -70.929],
  [42.477, -70.91],
];

const schools: Array<{ name: string; position: [number, number] }> = [
  { name: "Lynn Classical", position: [42.4727, -70.9631] },
  { name: "Lynn English", position: [42.4768, -70.9348] },
  { name: "Fecteau-Leary", position: [42.4652, -70.949] },
  { name: "Brickett Elementary", position: [42.4567, -70.9257] },
];

const floodContext: [number, number][] = [
  [42.438, -70.976],
  [42.438, -70.905],
  [42.463, -70.905],
  [42.468, -70.921],
  [42.461, -70.939],
  [42.458, -70.954],
  [42.466, -70.976],
];

export function CityMap({ sites, selectedSiteId, onSelectSite }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const siteMarkersRef = useRef<Record<string, LeafletMarker>>({});
  const sitePolygonsRef = useRef<Record<string, LeafletPolygon>>({});
  const layerGroupsRef = useRef<Partial<Record<LayerKey, LayerGroup>>>({});
  const initialSelectedSiteRef = useRef(selectedSiteId);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ transit: true, schools: true, flood: false });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initialSites = sites;
    const initialSelectedSiteId = initialSelectedSiteRef.current;
    let disposed = false;
    let loadingTimer: number | undefined;

    const initialize = async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
        scrollWheelZoom: false,
      });
      mapRef.current = map;
      map.fitBounds(LYNN_BOUNDS, { padding: [34, 34] });
      map.zoomControl.setPosition("bottomright");
      L.control.scale({ imperial: true, metric: false, maxWidth: 100, position: "bottomleft" }).addTo(map);

      let mapSettled = false;
      const revealMap = () => {
        if (mapSettled || disposed) return;
        mapSettled = true;
        if (loadingTimer) window.clearTimeout(loadingTimer);
        setLoading(false);
      };

      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      });
      tiles.once("load", revealMap);
      tiles.once("tileerror", () => {
        revealMap();
        setMapError("Basemap tiles are unavailable right now. Site and context layers remain interactive.");
      });
      tiles.addTo(map);
      loadingTimer = window.setTimeout(() => {
        revealMap();
        setMapError("The basemap is taking longer than expected. You can still select sites and use the controls.");
      }, 4500);

      initialSites.forEach((site, index) => {
        const selected = site.id === initialSelectedSiteId;
        const polygon = L.polygon(siteLatLngs(site), {
          color: selected ? "#a63f2d" : "#174d43",
          weight: selected ? 3 : 2,
          fillColor: selected ? "#ee745b" : "#a8dbc7",
          fillOpacity: selected ? 0.58 : 0.34,
        }).addTo(map);
        polygon.on("click", () => onSelectSite(site.id));
        polygon.bindTooltip(`${site.name}<br><small>${site.detail}</small>`, { direction: "top", className: "city-map-tooltip" });
        sitePolygonsRef.current[site.id] = polygon;

        const icon = L.divIcon({
          className: `map-site-marker${selected ? " selected" : ""}`,
          html: `<span aria-hidden="true"></span><b>${site.short}</b>`,
          iconSize: [112, 34],
          iconAnchor: [15, 31],
        });
        const marker = L.marker([site.center[1], site.center[0]], {
          icon,
          keyboard: true,
          title: `Select ${site.name}`,
          alt: `Site ${String(index + 1).padStart(2, "0")}: ${site.name}`,
          riseOnHover: true,
        }).addTo(map);
        marker.on("click", () => onSelectSite(site.id));
        siteMarkersRef.current[site.id] = marker;
      });

      const transitGroup = L.layerGroup([
        L.polyline(transitLine, { color: "#ee745b", weight: 3, opacity: 0.9 }),
        L.circleMarker([42.462953, -70.945421], {
          radius: 7,
          color: "#ee745b",
          weight: 3,
          fillColor: "#faf8f1",
          fillOpacity: 1,
        }).bindTooltip("Lynn station", { direction: "top", className: "city-map-tooltip" }),
      ]).addTo(map);

      const schoolGroup = L.layerGroup(
        schools.map((school) =>
          L.circleMarker(school.position, {
            radius: 5,
            color: "#162d29",
            weight: 1.5,
            fillColor: "#efc35b",
            fillOpacity: 1,
          }).bindTooltip(school.name, { direction: "top", className: "city-map-tooltip" }),
        ),
      ).addTo(map);

      const floodGroup = L.layerGroup([
        L.polygon(floodContext, {
          color: "#3188a3",
          weight: 1.5,
          dashArray: "5 5",
          fillColor: "#64b5cf",
          fillOpacity: 0.23,
        }).bindTooltip("Illustrative coastal screening context", { direction: "top", className: "city-map-tooltip" }),
      ]);

      layerGroupsRef.current = { transit: transitGroup, schools: schoolGroup, flood: floodGroup };

      void fetch(LYNN_BOUNDARY_URL)
        .then((response) => {
          if (!response.ok) throw new Error("Boundary request failed");
          return response.json() as Promise<GeoJsonObject>;
        })
        .then((boundary) => {
          if (disposed) return;
          L.geoJSON(boundary, {
            style: { color: "#174d43", weight: 2.2, dashArray: "7 5", fillColor: "#a8dbc7", fillOpacity: 0.08 },
          }).addTo(map);
        })
        .catch(() => {
          if (!disposed) setMapError("The live city boundary is unavailable; the basemap and scenario sites still work.");
        });

      const resizeMap = () => window.setTimeout(() => map.invalidateSize(), 60);
      document.addEventListener("fullscreenchange", resizeMap);
      map.once("unload", () => document.removeEventListener("fullscreenchange", resizeMap));
    };

    void initialize().catch(() => {
      if (!disposed) {
        setLoading(false);
        setMapError("The interactive map could not start in this browser. Please reload the page.");
      }
    });

    return () => {
      disposed = true;
      if (loadingTimer) window.clearTimeout(loadingTimer);
      mapRef.current?.remove();
      mapRef.current = null;
      siteMarkersRef.current = {};
      sitePolygonsRef.current = {};
      layerGroupsRef.current = {};
    };
  }, [onSelectSite, sites]);

  useEffect(() => {
    const map = mapRef.current;
    const site = sites.find((item) => item.id === selectedSiteId);
    if (!map || !site) return;

    Object.entries(siteMarkersRef.current).forEach(([id, marker]) => {
      marker.getElement()?.classList.toggle("selected", id === selectedSiteId);
    });
    Object.entries(sitePolygonsRef.current).forEach(([id, polygon]) => {
      const selected = id === selectedSiteId;
      polygon.setStyle({
        color: selected ? "#a63f2d" : "#174d43",
        weight: selected ? 3 : 2,
        fillColor: selected ? "#ee745b" : "#a8dbc7",
        fillOpacity: selected ? 0.58 : 0.34,
      });
    });
    map.flyTo([site.center[1], site.center[0]], Math.max(map.getZoom(), 15), { duration: 0.85 });
  }, [selectedSiteId, sites]);

  const toggleLayer = (key: LayerKey) => {
    const map = mapRef.current;
    const group = layerGroupsRef.current[key];
    const next = !layers[key];
    setLayers((current) => ({ ...current, [key]: next }));
    if (!map || !group) return;
    if (next) group.addTo(map);
    else group.removeFrom(map);
  };

  const resetMap = () => mapRef.current?.fitBounds(LYNN_BOUNDS, { padding: [34, 34], animate: true, duration: 0.8 });

  const toggleFullscreen = async () => {
    if (!frameRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await frameRef.current.requestFullscreen();
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
    <div className="city-map-frame" ref={frameRef}>
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
      <div className="map-action-stack">
        <button type="button" onClick={toggleFullscreen}>Fullscreen</button>
        <button type="button" onClick={resetMap}>View all Lynn</button>
      </div>
      <div className="map-data-note">Boundary: U.S. Census TIGERweb · Context layers: demonstration</div>
      {loading && <div className="map-loading" aria-live="polite"><span /><b>Loading Lynn map</b></div>}
      {mapError && <button type="button" className="map-error" onClick={() => setMapError("")}><b>Map notice</b><span>{mapError}</span><i>×</i></button>}
    </div>
  );
}
