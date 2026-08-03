"use client";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import { useEffect, useRef } from "react";

export function MapPanel() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const instance = new MapLibreMap({
      container: container.current,
      center: [-70.9495, 42.4668],
      zoom: 12,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });
    map.current = instance;
    instance.addControl(new NavigationControl(), "top-right");
    new Marker({ color: "#d95d39" })
      .setLngLat([-70.9495, 42.4668])
      .setPopup(new Popup().setText("Demonstration location — not a selected parcel"))
      .addTo(instance);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <section className="map-shell" aria-label="Map centered on Lynn, Massachusetts">
      <div ref={container} className="map" />
      <div className="map-caption">
        Demonstration marker only · Parcel and site selection arrives after the Lynn data audit
      </div>
    </section>
  );
}
