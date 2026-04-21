
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

// ✅ Safe fix for Leaflet marker icons
export function fixLeafletIcons() {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export function LeafletMiniMap({
  lat,
  lng,
  className,
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg ring-1 ring-border", className)}>
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false} // Non-interactive zoom
        className="h-40 w-full"
        aria-label="Shop location map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>Shop location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// Full-size map for details page
function ShopMap({
  lat,
  lng,
  className,
  heightClass = "h-64", // Default height
}: {
  lat: number;
  lng: number;
  className?: string;
  heightClass?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-md ring-1 ring-border", className)}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={true} // Interactive zoom
        className={cn("w-full", heightClass)}
        aria-label="Shop location map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>We are here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default ShopMap;
