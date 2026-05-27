"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useMemo, useState } from "react";
import MapaEmpresaPopup from "./mapa-empresa-popup";

// Corrige o ícone padrão do Leaflet que pode quebrar com bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type EmpresaPin = {
  id: number;
  razaoSocial: string;
  porte?: string;
  situacao?: string;
  bairro?: string;
  segmentoNome?: string | null;
  segmentoCor?: string | null;
  lat: number;
  lng: number;
  camposCustom?: Array<{ campo: { label: string }; valor: string }>;
};

export type AreaOverlay = { id: number; nome: string; tipo: string; cor?: string | null; geoJson: string | null };

type Props = {
  empresas: EmpresaPin[];
  areas: AreaOverlay[];
  center?: [number, number];
  zoom?: number;
};

function colorIcon(cor: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${cor}"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`
  );
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

export default function MapaInterativo({ empresas, areas, center, zoom = 13 }: Props) {
  const [markers, setMarkers] = useState<EmpresaPin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se empresas vierem como prop, usa-as; caso contrário, busca via API
    async function fetchMarkers() {
      setLoading(true);
      try {
        if (empresas && empresas.length > 0) {
          setMarkers(empresas.filter((e) => e.lat !== 0 && e.lng !== 0));
          return;
        }
        const res = await fetch(`/api/empresas`);
        if (!res.ok) throw new Error("Falha ao carregar empresas");
        const data = await res.json();
        const list: EmpresaPin[] = (data as any[])
          .map((e: any) => ({
            id: e.id,
            razaoSocial: e.razaoSocial,
            lat: e.lat ?? (e.endereco?.lat ?? null),
            lng: e.lng ?? (e.endereco?.lng ?? null),
            segmentoNome: e.segmento?.nome ?? null,
            segmentoCor: e.segmento?.cor ?? null,
            bairro: e.endereco?.bairro ?? undefined,
            porte: e.porte,
            situacao: e.situacao,
            camposCustom: e.camposCustom,
          }))
          .filter((x) => x.lat !== null && x.lng !== null) as EmpresaPin[];
        setMarkers(list);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchMarkers();
  }, [empresas]);

  // Centro calculado a partir das props (disponíveis no primeiro render),
  // não do estado markers — MapContainer ignora mudanças de center após montar.
  const centerResolved = useMemo<[number, number]>(() => {
    if (center) return center;
    const valida = empresas.find((e) => e.lat !== 0 && e.lng !== 0);
    if (valida) return [valida.lat, valida.lng];
    return [-11.0139, -37.2028]; // São Cristóvão, SE
  }, [center, empresas]);

  return (
    <div className="w-full h-full" aria-hidden={false}>
      <MapContainer center={centerResolved} zoom={zoom} style={{ height: "100%", width: "100%" }} className="rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Overlays de áreas (GeoJSON) */}
        {areas?.map((area) => {
          if (!area.geoJson) return null;
          try {
            const geojson = JSON.parse(area.geoJson);
            return (
              <GeoJSON
                key={area.id}
                data={geojson}
                style={{ color: area.cor ?? "#1b3383", weight: 2, fillOpacity: 0.12 }}
              />
            );
          } catch {
            return null;
          }
        })}

        {/* Marcadores com cluster */}
        <MarkerClusterGroup chunkedLoading>
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={colorIcon(m.segmentoCor ?? "#1b3383")}>
              <Popup>
                <MapaEmpresaPopup empresa={{ id: m.id, razaoSocial: m.razaoSocial, camposCustom: m.camposCustom }} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      {loading ? <p className="mt-2 text-sm text-slate-500">Carregando empresas...</p> : null}
    </div>
  );
}

//   __  ____ ____ _  _
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
