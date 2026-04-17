import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { COLORS, STOP_STATUSES } from '../../../utils/constants';
import { formatTime12h } from '../../../utils/helpers';

export const CEBU_CENTER = [10.3157, 123.8854];

const ROLE_COLOR = {
  start: '#22C55E',
  end: '#EF4444',
  stop: COLORS.primary,
};

function pinIcon({ label, color }) {
  const size = 30;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
    ">
      <span style="
        transform:rotate(45deg);color:#fff;font-weight:700;font-size:12px;
        font-family:system-ui,-apple-system,sans-serif;
      ">${label ?? ''}</span>
    </div>`;
  return L.divIcon({
    html,
    className: 'route-map-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function editableIcon() {
  const size = 34;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${COLORS.secondary};border:3px solid #fff;
      box-shadow:0 4px 10px rgba(37,99,235,0.45);
      transform:rotate(-45deg);
    "></div>`;
  return L.divIcon({
    html,
    className: 'route-map-editable',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ latlng }) {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (!latlng) return;
    const key = `${latlng[0].toFixed(5)},${latlng[1].toFixed(5)}`;
    if (last.current === key) return;
    last.current = key;
    map.panTo(latlng, { animate: true });
  }, [latlng, map]);
  return null;
}

// Leaflet caches container size on init; fire invalidateSize at several settling
// points and on every container resize so tiles stay aligned when parents shift.
function InvalidateOnResize({ initialCenter, initialZoom }) {
  const map = useMap();
  const viewRef = useRef({ center: initialCenter, zoom: initialZoom });
  viewRef.current = { center: initialCenter, zoom: initialZoom };

  useEffect(() => {
    const tids = [0, 120, 400, 1000].map((d, i) => setTimeout(() => {
      map.invalidateSize();
      if (i === 2 && viewRef.current.center) {
        map.setView(viewRef.current.center, viewRef.current.zoom, { animate: false });
      }
    }, d));

    const container = map.getContainer();
    let rafId = 0;
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => map.invalidateSize());
      });
      ro.observe(container);
    }

    return () => {
      tids.forEach(clearTimeout);
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [map]);
  return null;
}

// When `center` or `zoom` props change after mount (e.g. admin picks a new
// hauler → new barangay coords), re-center the map.
function RecenterOnChange({ center, zoom }) {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = `${center[0].toFixed(5)},${center[1].toFixed(5)},${zoom}`;
    if (last.current === key) return;
    last.current = key;
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function RouteMap({
  stops = [],
  onStopClick,
  editableMarker = null,
  onMapClick,
  onMarkerDragEnd,
  center = CEBU_CENTER,
  zoom = 12,
  height = 500,
  draggableStops = false,
  onStopDragEnd,
  cursorMode = null,
}) {
  const cursorClass = cursorMode ? `route-map-cursor-${cursorMode}` : '';

  const renderStops = useMemo(() => {
    return stops
      .filter((s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)))
      .sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
  }, [stops]);

  // Role resolution prefers explicit point_type; falls back to min/max stop_order
  // so legacy stops still render a distinct Start/End.
  const { startSysId, endSysId } = useMemo(() => {
    if (renderStops.length === 0) return { startSysId: null, endSysId: null };
    let start = null;
    let end = null;
    for (const s of renderStops) {
      const pt = String(s.point_type || '').toLowerCase();
      if (pt === 'start') start = s.sys_id;
      if (pt === 'end') end = s.sys_id;
    }
    if (start || end) return { startSysId: start, endSysId: end };
    const first = renderStops[0];
    const last = renderStops.length >= 2 ? renderStops[renderStops.length - 1] : null;
    return { startSysId: first?.sys_id ?? null, endSysId: last?.sys_id ?? null };
  }, [renderStops]);

  const polyline = useMemo(
    () => renderStops.map((s) => [Number(s.latitude), Number(s.longitude)]),
    [renderStops],
  );

  const editableLatLng = editableMarker
    && Number.isFinite(Number(editableMarker.latitude))
    && Number.isFinite(Number(editableMarker.longitude))
    ? [Number(editableMarker.latitude), Number(editableMarker.longitude)]
    : null;

  return (
    <div className={cursorClass} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
      <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InvalidateOnResize initialCenter={center} initialZoom={zoom} />
        <RecenterOnChange center={center} zoom={zoom} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {editableLatLng && <FlyTo latlng={editableLatLng} />}

        {renderStops.map((s) => {
          const lat = Number(s.latitude);
          const lng = Number(s.longitude);
          const isStart = s.sys_id === startSysId;
          const isEnd = s.sys_id === endSysId && startSysId !== endSysId;
          const role = isStart ? 'start' : isEnd ? 'end' : 'stop';
          const color = ROLE_COLOR[role];
          const label = isStart ? 'S' : isEnd ? 'E' : String(s.stop_order ?? '');
          return (
            <Marker
              key={s.sys_id}
              position={[lat, lng]}
              icon={pinIcon({ label, color })}
              draggable={draggableStops}
              eventHandlers={{
                click: () => onStopClick && onStopClick(s),
                dragend: (e) => {
                  if (!draggableStops || !onStopDragEnd) return;
                  const { lat: nlat, lng: nlng } = e.target.getLatLng();
                  onStopDragEnd(s, { latitude: nlat, longitude: nlng });
                },
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {isStart ? 'Start' : isEnd ? 'End' : `Stop #${s.stop_order ?? ''}`}
                  </div>
                  {s.label && <div style={{ color: COLORS.text.muted, fontSize: 12 }}>{s.label}</div>}
                  <div style={{ marginTop: 6 }}>ETA: {formatTime12h(s.estimated_arrival) || '—'}</div>
                  <div>Status: {s.stop_status || STOP_STATUSES[0]}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {polyline.length >= 2 && (
          <Polyline
            positions={polyline}
            pathOptions={{ color: COLORS.primary, weight: 3, dashArray: '6 8', opacity: 0.85 }}
          />
        )}

        {editableLatLng && (
          <Marker
            position={editableLatLng}
            draggable
            icon={editableIcon()}
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                if (onMarkerDragEnd) onMarkerDragEnd({ latitude: lat, longitude: lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
