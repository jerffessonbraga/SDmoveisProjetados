import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
// Leaflet CSS loaded via CDN in index.html

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  recorded_at: string;
}

function FitBounds({ locations }: { locations: Location[] }) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (locations.length > 0 && !fittedRef.current) {
      const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      fittedRef.current = true;
    }
  }, [locations, map]);

  return null;
}

export default function FleetMap({ locations = [] }: { locations?: Location[] }) {
  // Group locations by trip_id
  const tripGroups = locations.reduce((acc, loc) => {
    if (!acc[loc.trip_id]) acc[loc.trip_id] = [];
    acc[loc.trip_id].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  const defaultCenter: [number, number] = locations.length > 0
    ? [locations[locations.length - 1].latitude, locations[locations.length - 1].longitude]
    : [-3.7172, -38.5433]; // Fortaleza

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds locations={locations} />

      {Object.entries(tripGroups).map(([tripId, locs], idx) => {
        const positions = locs.map(l => [l.latitude, l.longitude] as [number, number]);
        const lastLoc = locs[locs.length - 1];
        const color = colors[idx % colors.length];

        return (
          <React.Fragment key={tripId}>
            <Polyline positions={positions} color={color} weight={4} opacity={0.7} />
            <Marker position={[lastLoc.latitude, lastLoc.longitude]} icon={activeIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">📍 Última posição</p>
                  <p>{new Date(lastLoc.recorded_at).toLocaleString('pt-BR')}</p>
                  {lastLoc.speed !== null && <p>Vel: {(lastLoc.speed * 3.6).toFixed(0)} km/h</p>}
                  <p className="text-xs text-gray-500">Pontos: {locs.length}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {locations.length === 0 && (
        <Marker position={defaultCenter}>
          <Popup>Sede — Caucaia, CE</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
