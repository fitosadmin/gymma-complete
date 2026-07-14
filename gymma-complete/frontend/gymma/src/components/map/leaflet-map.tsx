"use client";

import * as React from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GymSummary } from "@/types/gym";
import { formatINR } from "@/lib/utils";

// Custom price pin via divIcon.
function pinIcon(price: number, active: boolean) {
  const label = `₹${(price / 1000).toFixed(1)}k`;
  const cls = active ? "bg-primary-600 text-white" : "bg-white text-primary-600";
  return L.divIcon({
    className: "gymma-pin",
    html: `<span class="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold shadow-md ${cls}">${label}</span>`,
    iconSize: [46, 26],
    iconAnchor: [23, 26],
  });
}

function userLocationIcon() {
  return L.divIcon({
    className: "gymma-user-pin",
    html: `<span class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 shadow-lg border-2 border-white"><span class="h-2 w-2 rounded-full bg-white"></span></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/** Fit the viewport to all markers whenever the set of gyms changes. */
function FitBounds({ pts, boundsKey }: { pts: [number, number][]; boundsKey: string }) {
  const map = useMap();
  React.useEffect(() => {
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [48, 48] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, map]);
  return null;
}

/** Pan to user location when it changes */
function PanToUser({ userLoc }: { userLoc: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (userLoc) {
      map.setView(userLoc, 14, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoc]);
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll Wheel Zoom Controller
───────────────────────────────────────────────────────────────────────────── */
function ScrollWheelController() {
  const map = useMap();
  React.useEffect(() => {
    // Disable by default so scrolling the page doesn't zoom the map
    map.scrollWheelZoom.disable();
    
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    
    map.on("click", enable);
    map.on("mouseout", disable);
    return () => {
      map.off("click", enable);
      map.off("mouseout", disable);
    };
  }, [map]);
  return null;
}

export interface LeafletMapProps {
  gyms: GymSummary[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function LeafletMap({ gyms, selectedId, onSelect, userLocation }: LeafletMapProps) {
  const pts = gyms.map((g) => [g.lat, g.lng] as [number, number]);
  const boundsKey = gyms.map((g) => g.id).join(",");
  const center = pts[0] ?? ([12.95, 77.6] as [number, number]);
  const userPos: [number, number] | null = userLocation ? [userLocation.lat, userLocation.lng] : null;

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#e9edf0" }}
    >
      <ScrollWheelController />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds pts={pts} boundsKey={boundsKey} />
      <PanToUser userLoc={userPos} />

      {/* User current location */}
      {userPos && (
        <>
          <Circle
            center={userPos}
            radius={400}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 1 }}
          />
          <Marker position={userPos} icon={userLocationIcon()}>
            <Popup>
              <p className="text-body-sm font-semibold text-neutral-900">Your location</p>
            </Popup>
          </Marker>
        </>
      )}

      {gyms.map((g) => (
        <Marker
          key={g.id}
          position={[g.lat, g.lng]}
          icon={pinIcon(g.pricePerMonth, g.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(g.id) }}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="text-body-sm font-semibold text-neutral-900">{g.name}</p>
              <p className="mt-0.5 text-caption text-neutral-500">
                {g.area} · ★ {g.rating.toFixed(1)}
              </p>
              <p className="mt-1 text-body-sm font-semibold text-neutral-900">
                {formatINR(g.pricePerMonth)}
                <span className="font-normal text-neutral-500">/mo</span>
              </p>
              <Link
                href={`/gym/${g.slug}`}
                className="mt-1 inline-block text-caption font-semibold text-primary-600 hover:text-primary-700"
              >
                View details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
