import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

const center = [14.5204, 75.7224];

function SelectionMarker({ selected, onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat.toFixed(4), lon: event.latlng.lng.toFixed(4) });
    },
  });

  return (
    <Marker position={[selected.lat, selected.lon]}>
      <Popup>
        Selected field
        <br />
        {selected.lat}, {selected.lon}
      </Popup>
    </Marker>
  );
}

export default function KarnatakaMap({ selected, onSelect }) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
        <h2 className="text-base font-semibold text-stone-900">Karnataka Field Map</h2>
        <p className="text-sm text-stone-500">{selected.lat}, {selected.lon}</p>
      </div>
      <div className="h-[420px]">
        <MapContainer center={center} zoom={7} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <SelectionMarker selected={selected} onSelect={onSelect} />
        </MapContainer>
      </div>
    </section>
  );
}
