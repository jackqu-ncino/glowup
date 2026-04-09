"use client";

import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getInitials } from "@/lib/utils";
import type { ProviderSearchResult } from "@/types";

interface MapViewProps {
  providers: ProviderSearchResult[];
  center: { lat: number; lng: number };
  zoom: number;
  highlightedId: string | null;
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
}

function createAvatarIcon(
  provider: ProviderSearchResult,
  isHighlighted: boolean
) {
  const size = isHighlighted ? 48 : 40;
  const borderColor = isHighlighted ? "#e11d84" : "#ffffff";
  const initials = getInitials(provider.full_name);

  const html = provider.avatar_url
    ? `<div style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${borderColor};overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:transform 0.2s;">
        <img src="${provider.avatar_url}" alt="${provider.full_name}" style="width:100%;height:100%;object-fit:cover;" />
       </div>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${borderColor};overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.3);background:#e11d84;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;font-family:sans-serif;">
        ${initials}
       </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Component to re-center the map when center/zoom changes
function MapUpdater({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);

  useEffect(() => {
    if (prevCenter.current.lat !== center.lat || prevCenter.current.lng !== center.lng || prevZoom.current !== zoom) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.5 });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

export default function MapView({
  providers,
  center,
  zoom,
  highlightedId,
  selectedId,
  onMarkerClick,
  onMarkerHover,
}: MapViewProps) {
  const selectedProvider = providers.find((p) => p.profile_id === selectedId);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />

      {providers.map((provider) => {
        const isHighlighted =
          highlightedId === provider.profile_id ||
          selectedId === provider.profile_id;

        return (
          <Marker
            key={provider.profile_id}
            position={[provider.latitude, provider.longitude]}
            icon={createAvatarIcon(provider, isHighlighted)}
            eventHandlers={{
              click: () => onMarkerClick(provider.profile_id),
              mouseover: () => onMarkerHover(provider.profile_id),
              mouseout: () => onMarkerHover(null),
            }}
          >
            {selectedId === provider.profile_id && selectedProvider && (
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold text-sm">
                    {selectedProvider.business_name || selectedProvider.full_name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-warning text-xs">★</span>
                    <span className="text-xs text-muted">
                      {selectedProvider.average_rating > 0
                        ? `${selectedProvider.average_rating.toFixed(1)} (${selectedProvider.review_count})`
                        : "New"}
                    </span>
                  </div>
                  <a
                    href={`/providers/${selectedProvider.profile_id}`}
                    className="mt-2 block text-xs text-primary hover:underline"
                  >
                    View Profile →
                  </a>
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
