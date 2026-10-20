import { useEffect, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { GeoJSON as LeafletGeoJSON } from 'leaflet';

type RouteMapProps = {
  data: GeoJSON.FeatureCollection | null;
  loading: boolean;
  error: string;
};

function FitRoute({ layer }: { layer: LeafletGeoJSON | null }) {
  const map = useMap();

  useEffect(() => {
    if (!layer) return;
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [layer, map]);

  return null;
}

function RouteMap({ data, loading, error }: RouteMapProps) {
  const [layer, setLayer] = useState<LeafletGeoJSON | null>(null);

  return (
    <div className="map-canvas">
      <MapContainer center={[-10.9472, -37.0731]} zoom={12} scrollWheelZoom className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data ? (
          <>
            <GeoJSON
              key={JSON.stringify(data)}
              data={data}
              ref={(routeLayer) => setLayer(routeLayer)}
              style={() => ({ color: '#087c67', weight: 5, opacity: 0.88, lineCap: 'round', lineJoin: 'round' })}
            />
            <FitRoute layer={layer} />
          </>
        ) : null}
      </MapContainer>
      {loading ? <div className="map-message">Carregando geometria oficial...</div> : null}
      {!loading && error ? <div className="map-message map-error">{error}</div> : null}
    </div>
  );
}

export default RouteMap;